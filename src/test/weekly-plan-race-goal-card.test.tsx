import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WeeklyPlanScreen from "@/components/portal/WeeklyPlanScreen";
import {
  getCurrentUserWeeklyCoachScreen,
  setCurrentUserRaceGoalOutcome,
  setCurrentUserWeeklyCoachSessionCompletion,
  type CurrentUserWeeklyCoachScreen,
  type GoalOutcomeStatus,
  type GoalTimelineState,
} from "@/lib/portal-api";

vi.mock("@/lib/portal-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/portal-api")>("@/lib/portal-api");

  return {
    ...actual,
    getCurrentUserWeeklyCoachScreen: vi.fn(),
    setCurrentUserRaceGoalOutcome: vi.fn(),
    setCurrentUserWeeklyCoachSessionCompletion: vi.fn(),
  };
});

const getCurrentUserWeeklyCoachScreenMock = vi.mocked(getCurrentUserWeeklyCoachScreen);
const setCurrentUserRaceGoalOutcomeMock = vi.mocked(setCurrentUserRaceGoalOutcome);
const setCurrentUserWeeklyCoachSessionCompletionMock = vi.mocked(setCurrentUserWeeklyCoachSessionCompletion);

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>,
  );
}

function weeklyCoachScreen({
  goalTimelineState,
  goalOutcomeStatus,
}: {
  goalTimelineState: GoalTimelineState;
  goalOutcomeStatus?: GoalOutcomeStatus;
}): CurrentUserWeeklyCoachScreen {
  return {
    viewType: "PLAN",
    selectedWeekStartDate: "2026-04-27",
    todayWeekStartDate: "2026-04-27",
    latestGeneratedWeekStartDate: "2026-04-27",
    canGoPrevious: false,
    canGoNext: false,
    goal: {
      goalSummary: "Mediterrani recovery",
      primaryGoal: {
        name: "Mediterrani Half",
        eventDate: "2026-04-26",
        distanceKm: 21.1,
      },
      phase: goalTimelineState === "UPCOMING" || goalTimelineState === "RACE_WEEK" ? "BUILD" : "POST_GOAL",
      daysToGoal: goalTimelineState === "UPCOMING" || goalTimelineState === "RACE_WEEK" ? 7 : 0,
      goalTimelineState,
      daysUntilGoal: goalTimelineState === "UPCOMING" || goalTimelineState === "RACE_WEEK" ? 7 : undefined,
      daysSinceGoal: goalTimelineState === "POST_GOAL" || goalTimelineState === "EXPIRED" ? 1 : undefined,
      postGoalWindowDays: 14,
      postGoalRecoveryDay: goalTimelineState === "POST_GOAL" ? 1 : undefined,
      goalOutcomeStatus,
    },
    highlights: {},
    plan: {
      athleteId: "",
      weekStartDate: "2026-04-27",
      planId: "athlete-1:2026-04-27",
      createdAt: "2026-04-27T08:00:00Z",
      updatedAt: "2026-04-27T08:00:00Z",
      summary: {
        phase: "POST_GOAL",
      },
      plan: {
        schemaVersion: "1.0",
        weekType: "DELOAD",
        weekObjective: "Recover from race day",
        progressionNote: "Keep everything easy",
        sessions: [],
        justification: [],
      },
      llmMeta: {
        provider: "openai",
        model: "gpt-5",
        promptVersion: "v1",
      },
    },
  };
}

function renderWeeklyPlan(screenData: CurrentUserWeeklyCoachScreen) {
  getCurrentUserWeeklyCoachScreenMock.mockResolvedValue(screenData);

  renderWithQueryClient(
    <WeeklyPlanScreen
      athleteId="athlete-1"
      targetWeekStartDate={screenData.selectedWeekStartDate}
      isPreparing={false}
      onRefresh={vi.fn()}
    />,
  );
}

describe("WeeklyPlanScreen race goal outcome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setCurrentUserRaceGoalOutcomeMock.mockResolvedValue(undefined);
    setCurrentUserWeeklyCoachSessionCompletionMock.mockResolvedValue(undefined);
  });

  it("shows outcome actions for unknown post-goal races", async () => {
    renderWeeklyPlan(weeklyCoachScreen({ goalTimelineState: "POST_GOAL", goalOutcomeStatus: "UNKNOWN" }));

    expect(await screen.findByRole("button", { name: /mark completed/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /skip goal/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /mark completed/i }));

    await waitFor(() => {
      expect(setCurrentUserRaceGoalOutcomeMock).toHaveBeenCalledWith("COMPLETED");
    });
  });

  it("shows completed outcome copy and hides actions", async () => {
    renderWeeklyPlan(weeklyCoachScreen({ goalTimelineState: "POST_GOAL", goalOutcomeStatus: "COMPLETED" }));

    expect(await screen.findByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Race completed. Recovery-first training can continue.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mark completed/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /skip goal/i })).not.toBeInTheDocument();
  });

  it("shows skipped outcome copy and hides actions", async () => {
    renderWeeklyPlan(weeklyCoachScreen({ goalTimelineState: "POST_GOAL", goalOutcomeStatus: "SKIPPED" }));

    expect(await screen.findByText("Skipped")).toBeInTheDocument();
    expect(
      screen.getByText("Goal skipped. This race will not guide recovery or race preparation."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Race completed. Recovery-first training can continue.")).not.toBeInTheDocument();
    expect(screen.queryByText(/day 1 of 14/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mark completed/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /skip goal/i })).not.toBeInTheDocument();
  });

  it("does not show outcome actions before race day", async () => {
    renderWeeklyPlan(weeklyCoachScreen({ goalTimelineState: "UPCOMING", goalOutcomeStatus: "UNKNOWN" }));

    expect(await screen.findByText("Upcoming")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mark completed/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /skip goal/i })).not.toBeInTheDocument();

    vi.clearAllMocks();
    renderWeeklyPlan(weeklyCoachScreen({ goalTimelineState: "RACE_WEEK", goalOutcomeStatus: "UNKNOWN" }));

    expect(await screen.findByText("Race week")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mark completed/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /skip goal/i })).not.toBeInTheDocument();
  });
});
