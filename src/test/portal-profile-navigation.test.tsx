import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PortalPage from "@/pages/PortalPage";
import type { AthleteProfile, CurrentUserWeeklyCoachScreen } from "@/lib/portal-api";

const api = vi.hoisted(() => ({
  bootstrap: vi.fn(),
  profile: vi.fn(),
  save: vi.fn(),
  provider: vi.fn(),
  plan: vi.fn(),
}));

vi.mock("@/lib/portal-api", async () => ({
  ...await vi.importActual<typeof import("@/lib/portal-api")>("@/lib/portal-api"),
  bootstrapPortal: api.bootstrap,
  getAthleteProfile: api.profile,
  updateAthleteProfile: api.save,
  getTrainingProviderIntegrationStatus: api.provider,
  getCurrentUserWeeklyCoachScreen: api.plan,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: "user-1" } } } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

vi.mock("@/components/ThemeSwitcher", () => ({
  default: () => <button type="button">Theme</button>,
}));

const profile: AthleteProfile = {
  athleteId: "athlete-1",
  displayName: "Test Runner",
  trainingGoal: "prepare_for_race",
  runningDays: ["TUE", "THU", "SAT", "SUN"],
  longRunPreferredDay: "SUN",
  goalRaceEventName: "Test Half Marathon",
  goalRaceEventDate: "2027-04-26",
  goalRaceEventDistanceKm: 21.1,
  raceTargetType: "TIME",
  targetTimeSeconds: 6300,
  targetPaceSecondsPerKm: "",
};

const weeklyPlan: CurrentUserWeeklyCoachScreen = {
  viewType: "PLAN",
  selectedWeekStartDate: "2026-10-12",
  todayWeekStartDate: "2026-10-12",
  canGoPrevious: false,
  canGoNext: false,
  highlights: {},
  plan: {
    athleteId: "athlete-1",
    weekStartDate: "2026-10-12",
    planId: "plan-1",
    createdAt: "",
    updatedAt: "",
    summary: {},
    llmMeta: { provider: "", model: "", promptVersion: "" },
    plan: {
      schemaVersion: "1.0",
      weekType: "BUILD",
      weekObjective: "Aerobic training",
      progressionNote: "",
      sessions: [],
      justification: [],
    },
  },
};

function HistoryControls() {
  const navigate = useNavigate();
  return <>
    <button type="button" onClick={() => navigate(-1)}>Browser Back</button>
    <button type="button" onClick={() => navigate(1)}>Browser Forward</button>
  </>;
}

function openPortal(entry = "/portal?view=profile") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[entry]}>
        <HistoryControls />
        <PortalPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return client;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(window, "scrollTo").mockImplementation(() => { });
  Element.prototype.scrollIntoView = vi.fn();
  api.bootstrap.mockResolvedValue({
    athleteId: "athlete-1",
    user: { userId: "user-1", displayName: "Test Runner" },
    profile: { isComplete: true },
    trainingProvider: { connected: true, activeProvider: "strava", readinessCapability: "limited" },
    weeklyPlan: { targetWeekStartDate: "2026-10-12", hasPlan: true, status: "ready" },
    nextStep: "view_weekly_plan",
  });
  api.profile.mockResolvedValue(profile);
  api.save.mockResolvedValue(undefined);
  api.provider.mockResolvedValue({ provider: "strava", status: "connected", connected: true });
  api.plan.mockResolvedValue(weeklyPlan);
});

describe("portal profile navigation", () => {
  it("clears draft guards after saving a reverted target with an unchanged server snapshot", async () => {
    openPortal();
    const target = await screen.findByRole("textbox", { name: "Target time" });
    await waitFor(() => expect(target).toHaveValue("1:45:00"));
    fireEvent.change(target, { target: { value: "1:45:01" } });
    fireEvent.change(target, { target: { value: "1:45:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Profile saved.")).toBeVisible();

    const unload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(false);
    fireEvent.click(screen.getByRole("link", { name: "Connect" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Connect your data" })).toBeVisible());
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("restores raw drafts across history and clears them only after explicit discard", async () => {
    openPortal("/portal?view=connect");
    fireEvent.click(await screen.findByRole("link", { name: "Profile" }));
    const name = await screen.findByLabelText("Display name");
    await waitFor(() => expect(name).toHaveValue("Test Runner"));
    fireEvent.change(name, { target: { value: "Draft Runner" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Target time" }), { target: { value: "1:" } });
    fireEvent.click(screen.getByRole("button", { name: "Browser Back" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Connect your data" })).toBeVisible());
    fireEvent.click(screen.getByRole("button", { name: "Browser Forward" }));
    await waitFor(() => expect(screen.getByLabelText("Display name")).toHaveValue("Draft Runner"));
    expect(screen.getByRole("textbox", { name: "Target time" })).toHaveValue("1:");

    fireEvent.click(screen.getByRole("link", { name: "Connect" }));
    fireEvent.click(await screen.findByRole("button", { name: "Keep editing" }));
    expect(screen.getByRole("textbox", { name: "Target time" })).toHaveValue("1:");
    fireEvent.click(screen.getByRole("link", { name: "Connect" }));
    fireEvent.click(await screen.findByRole("button", { name: "Discard changes" }));
    await screen.findByRole("heading", { name: "Connect your data" });
    fireEvent.click(screen.getByRole("link", { name: "Profile" }));
    await waitFor(() => expect(screen.getByLabelText("Display name")).toHaveValue("Test Runner"));
    expect(screen.getByRole("textbox", { name: "Target time" })).toHaveValue("1:45:00");
    expect(api.save).not.toHaveBeenCalled();
  });

  it("keeps a single main landmark for the plan and its error state", async () => {
    const client = openPortal("/portal?view=plan");
    await screen.findByRole("heading", { name: "Your schedule" });
    expect(screen.getAllByRole("main")).toHaveLength(1);
    api.plan.mockRejectedValueOnce(new Error("Unavailable"));
    await act(async () => {
      await client.invalidateQueries({ queryKey: ["portal", "weekly-coach-screen"] });
    });
    await screen.findByRole("heading", { name: "We couldn't load your weekly plan" });
    expect(screen.getAllByRole("main")).toHaveLength(1);
  });
});
