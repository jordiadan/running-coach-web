import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/hooks/useTheme";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  signInWithOAuth: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth } }));
function Destination() {
  const navigate = useNavigate();
  return (
    <>
      <h1>Portal destination</h1>
      <button onClick={() => navigate(-1)}>Browser back</button>
    </>
  );
}
function mount(path = "/login", entries = [path]) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={entries}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/portal" element={<Destination />} />
          <Route path="/privacy" element={<h1>Privacy destination</h1>} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  auth.signInWithOAuth.mockResolvedValue({
    data: { url: "https://example.test/oauth" },
    error: null,
  });
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe("public navigation and example", () => {
  it("keeps native page transition navigation tied to the real login route", async () => {
    const start = vi.fn((update: () => Promise<void>) => ({
      finished: update(),
    }));
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: start,
    });
    mount("/");
    fireEvent.click(screen.getAllByRole("link", { name: "Build my week" })[0]);
    expect(
      await screen.findByRole("button", { name: "Continue with Google" }),
    ).toBeEnabled();
    expect(start).toHaveBeenCalledOnce();
    delete document.startViewTransition;
  });
  it("takes the primary landing action to Google-only sign-in", async () => {
    mount("/");
    fireEvent.click(screen.getAllByRole("link", { name: "Build my week" })[0]);
    expect(
      await screen.findByRole("button", { name: "Continue with Google" }),
    ).toBeEnabled();
    expect(screen.getByRole("heading", { level: 1 })).toHaveFocus();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
  it("explores a labelled illustrative week without creating or saving a plan", () => {
    mount("/");
    const saturday = screen.getByRole("button", { name: "Saturday: Long run" });
    fireEvent.click(saturday);
    expect(saturday).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "Tuesday: Easy run" }),
    ).toHaveAttribute("aria-pressed", "false");
    const detail = document.getElementById(
      saturday.getAttribute("aria-controls")!,
    );
    expect(
      within(detail!).getByRole("heading", { name: "Long run" }),
    ).toBeInTheDocument();
    expect(within(detail!).getByText("70 min")).toBeInTheDocument();
    expect(
      screen.getByText(/An illustration, not your personal plan/),
    ).toBeInTheDocument();
    expect(auth.signInWithOAuth).not.toHaveBeenCalled();
    expect(
      screen.queryByText(/avg weekly|avg pace|two minutes/),
    ).not.toBeInTheDocument();
  });
  it("keeps home and privacy destinations accessible from login", async () => {
    mount();
    await screen.findByRole("button", { name: "Continue with Google" });
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute(
      "href",
      "/",
    );
    fireEvent.click(screen.getByRole("link", { name: "Privacy Policy" }));
    expect(
      screen.getByRole("heading", { name: "Privacy destination" }),
    ).toBeInTheDocument();
  });
  it("returns from login to the public landing page", async () => {
    mount();
    await screen.findByRole("button", { name: "Continue with Google" });
    fireEvent.click(screen.getByRole("link", { name: "Back to home" }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "A weekworth running.",
    );
  });
});
describe("Google login", () => {
  it("waits for the session check before enabling sign-in", async () => {
    let resolve: (value: unknown) => void;
    auth.getSession.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    mount();
    const checking = screen.getByRole("button", {
      name: "Checking your session…",
    });
    expect(checking).toBeDisabled();
    fireEvent.click(checking);
    expect(auth.signInWithOAuth).not.toHaveBeenCalled();
    resolve!({ data: { session: null }, error: null });
    expect(
      await screen.findByRole("button", { name: "Continue with Google" }),
    ).toBeEnabled();
  });
  it("preserves Google OAuth and the same-origin portal callback; prevents duplicate attempts", async () => {
    auth.signInWithOAuth.mockReturnValue(new Promise(() => {}));
    mount();
    fireEvent.click(
      await screen.findByRole("button", { name: "Continue with Google" }),
    );
    const pending = screen.getByRole("button", { name: "Opening Google…" });
    expect(pending).toBeDisabled();
    fireEvent.click(pending);
    expect(auth.signInWithOAuth).toHaveBeenCalledExactlyOnceWith({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/portal` },
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Taking you to Google",
    );
  });
  it.each(["returned", "thrown"])(
    "recovers from a %s OAuth error with an actionable retry",
    async (kind) => {
      if (kind === "returned")
        auth.signInWithOAuth.mockResolvedValueOnce({
          error: new Error("Provider error"),
        });
      else auth.signInWithOAuth.mockRejectedValueOnce(new Error("Offline"));
      mount();
      fireEvent.click(
        await screen.findByRole("button", { name: "Continue with Google" }),
      );
      await waitFor(() =>
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Check your connection and try again",
        ),
      );
      const retry = screen.getByRole("button", {
        name: "Continue with Google",
      });
      expect(retry).toBeEnabled();
      fireEvent.click(retry);
      expect(screen.getByRole("alert")).toBeEmptyDOMElement();
      expect(
        screen.getByRole("button", { name: "Opening Google…" }),
      ).toBeDisabled();
      expect(auth.signInWithOAuth).toHaveBeenCalledTimes(2);
    },
  );
  it.each(["returned", "thrown"])(
    "allows Google sign-in after a %s session-check error",
    async (kind) => {
      if (kind === "returned")
        auth.getSession.mockResolvedValueOnce({
          data: { session: null },
          error: new Error("Check failed"),
        });
      else auth.getSession.mockRejectedValueOnce(new Error("Offline"));
      mount();
      expect(
        await screen.findByRole("button", { name: "Continue with Google" }),
      ).toBeEnabled();
      expect(screen.getByRole("alert")).toHaveTextContent(
        "We couldn’t check your session",
      );
    },
  );
  it("replaces login with the portal for an existing session", async () => {
    auth.getSession.mockResolvedValueOnce({
      data: { session: { access_token: "test-session" } },
      error: null,
    });
    mount("/login", ["/", "/login"]);
    expect(
      await screen.findByRole("heading", { name: "Portal destination" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Browser back" }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "A weekworth running.",
    );
    expect(auth.signInWithOAuth).not.toHaveBeenCalled();
  });
  it("ignores a late session response after leaving login", async () => {
    let resolve: (value: unknown) => void;
    auth.getSession.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    mount();
    fireEvent.click(screen.getByRole("link", { name: "Back to home" }));
    resolve!({
      data: { session: { access_token: "test-session" } },
      error: null,
    });
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "A weekworth running.",
      ),
    );
  });
});
