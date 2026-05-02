import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PortalPage from "@/pages/PortalPage";
import { bootstrapPortal } from "@/lib/portal-api";

vi.mock("@/lib/portal-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/portal-api")>("@/lib/portal-api");

  return {
    ...actual,
    bootstrapPortal: vi.fn(),
  };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: "user-1" } } } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      }),
      signOut: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

vi.mock("@/components/portal/WeeklyPlanScreen", () => ({
  default: ({ onSetNextGoal }: { onSetNextGoal?: () => void }) => (
    <button type="button" onClick={onSetNextGoal}>
      Plan next race
    </button>
  ),
}));

vi.mock("@/components/portal/ProfileScreen", () => ({
  default: ({ focusTarget }: { focusTarget?: "race-goal" | null }) => (
    <div>
      Profile screen
      <span data-testid="profile-focus-target">{focusTarget ?? "none"}</span>
    </div>
  ),
}));

vi.mock("@/components/portal/ConnectScreen", () => ({
  default: () => <div>Connect screen</div>,
}));

vi.mock("@/components/portal/OnboardingScreen", () => ({
  default: () => <div>Onboarding screen</div>,
}));

vi.mock("@/components/ThemeSwitcher", () => ({
  default: () => <button type="button">Theme</button>,
}));

const bootstrapPortalMock = vi.mocked(bootstrapPortal);

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("PortalPage next goal navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bootstrapPortalMock.mockResolvedValue({
      athleteId: "athlete-1",
      user: {
        userId: "user-1",
        displayName: "Jordi",
      },
      profile: {
        isComplete: true,
      },
      trainingProvider: {
        connected: true,
        readinessCapability: "full",
      },
      weeklyPlan: {
        targetWeekStartDate: "2026-04-27",
        hasPlan: true,
        status: "ready",
      },
      nextStep: "view_weekly_plan",
    });
  });

  it("switches from Plan to Profile with the race goal focus target", async () => {
    renderWithProviders(<PortalPage />);

    fireEvent.click(await screen.findByRole("button", { name: /plan next race/i }));

    expect(await screen.findByText("Profile screen")).toBeInTheDocument();
    expect(screen.getByTestId("profile-focus-target")).toHaveTextContent("race-goal");
  });
});
