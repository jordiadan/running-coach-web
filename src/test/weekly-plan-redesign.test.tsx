import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WeeklyPlanScreen from "@/components/portal/WeeklyPlanScreen";
import type {
  CurrentUserWeeklyCoachScreen,
  WeeklyCoachSession,
} from "@/lib/portal-api";

const api = vi.hoisted(() => ({
  getScreen: vi.fn(),
  complete: vi.fn(),
  outcome: vi.fn(),
}));
vi.mock("@/lib/portal-api", () => ({
  getCurrentUserWeeklyCoachScreen: api.getScreen,
  setCurrentUserWeeklyCoachSessionCompletion: api.complete,
  setCurrentUserRaceGoalOutcome: api.outcome,
}));

const run: WeeklyCoachSession = {
  day: "MON",
  modality: "RUN",
  type: "EASY",
  title: "Easy run",
  durationMinutes: 45,
  completed: false,
  intensityCategory: "LOW",
  placementReason: "Aerobic work",
};

function payload(sessions = [run]): CurrentUserWeeklyCoachScreen {
  return {
    viewType: "PLAN",
    selectedWeekStartDate: "2026-10-12",
    todayWeekStartDate: "2026-10-12",
    todaySessionDay: "MON",
    canGoPrevious: false,
    canGoNext: false,
    highlights: {},
    plan: {
      athleteId: "athlete",
      weekStartDate: "2026-10-12",
      planId: "plan",
      createdAt: "",
      updatedAt: "",
      summary: {},
      llmMeta: { provider: "", model: "", promptVersion: "" },
      plan: {
        schemaVersion: "1.0",
        weekType: "BUILD",
        weekObjective: "Aerobic training",
        progressionNote: "",
        sessions,
        justification: [],
      },
    },
  };
}

function open(
  data = payload(),
  targetWeekStartDate = data.selectedWeekStartDate,
) {
  api.getScreen.mockResolvedValue(data);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <WeeklyPlanScreen
        athleteId="athlete"
        targetWeekStartDate={targetWeekStartDate}
        isPreparing={false}
        onRefresh={vi.fn()}
      />
    </QueryClientProvider>,
  );
  return client;
}

beforeEach(() => {
  vi.resetAllMocks();
  api.complete.mockResolvedValue(undefined);
  Element.prototype.scrollIntoView = vi.fn();
});

describe("weekly training redesign regressions", () => {
  it("refreshes preparation through the parent without fetching an unready plan", async () => {
    const onRefresh = vi.fn();
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <WeeklyPlanScreen
          athleteId="athlete"
          targetWeekStartDate="2026-10-12"
          isPreparing
          onRefresh={onRefresh}
        />
      </QueryClientProvider>,
    );
    expect(screen.getByText("Preparing your weekly plan")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(onRefresh).toHaveBeenCalledOnce();
    expect(api.getScreen).not.toHaveBeenCalled();
  });

  it("never offers completion for today's rest day even when other sessions support it", async () => {
    const data = payload([
      { ...run, day: "TUE" },
      {
        ...run,
        modality: "REST",
        title: "Rest day",
        intensityCategory: "REST",
        durationMinutes: 0,
      },
    ]);
    open(data);
    const today = await screen.findByRole("region", {
      name: "Today's session",
    });
    expect(
      within(today).queryByRole("button", { name: /complete/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Mark Rest day/ }),
    ).not.toBeInTheDocument();
    expect(api.complete).not.toHaveBeenCalled();
  });

  it("does not borrow another session's completion capability", async () => {
    open(
      payload([
        { ...run, completed: undefined },
        { ...run, day: "TUE" },
      ]),
    );
    const today = await screen.findByRole("region", {
      name: "Today's session",
    });
    expect(
      within(today).queryByRole("button", { name: /complete/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Mark Easy run as complete" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Mark Easy run as complete" }),
    ).toHaveLength(1);
  });

  it("disables today's undo while a completion request is pending", async () => {
    api.complete.mockImplementation(() => new Promise(() => {}));
    const data = payload();
    data.canGoNext = true;
    data.nextWeekStartDate = "2026-10-19";
    open(data);
    fireEvent.click(
      await screen.findByRole("button", { name: "Mark as complete" }),
    );
    expect(
      await screen.findByRole("button", { name: "Saving…" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Mark Easy run as incomplete" }),
    ).toBeDisabled();
    expect(api.complete).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Next week" })).toBeDisabled();
  });

  it("rolls back failed completion and gives an inline recovery message", async () => {
    api.complete.mockRejectedValueOnce(new Error("Unavailable"));
    open();
    fireEvent.click(
      await screen.findByRole("button", { name: "Mark as complete" }),
    );
    expect(
      await screen.findByText("Could not save completion. Please try again."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mark as complete" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Mark Easy run as complete" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("opens a real detail panel for a prescription without notes", async () => {
    open();
    const trigger = await screen.findByRole("button", {
      name: "Details for Easy run",
    });
    fireEvent.click(trigger);
    const panel = document.getElementById(
      trigger.getAttribute("aria-controls")!,
    );
    expect(panel).toBeVisible();
    expect(
      within(panel!).getByText("45 minutes planned at low intensity."),
    ).toBeInTheDocument();
  });

  it("opens and focuses the matching session from the dated day strip", async () => {
    open(
      payload([
        run,
        {
          ...run,
          day: "TUE",
          title: "Strength",
          modality: "STRENGTH",
          strengthFocus: ["Core"],
        },
      ]),
    );
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Tuesday, October 13: Strength",
      }),
    );
    const trigger = screen.getByRole("button", {
      name: "Details for Strength",
    });
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Core")).toBeVisible();
  });

  it("keeps recorded metrics distinct from planned duration and manual completion", async () => {
    open(
      payload([
        {
          ...run,
          syncedActivity: {
            activityId: "activity",
            provider: "INTERVALS",
            activityUrl: "https://intervals.icu/activities/activity",
            durationMinutes: 47,
            distanceKm: 8.2,
          },
        },
      ]),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Details for Easy run" }),
    );
    expect(screen.getByText("Recorded activity")).toBeVisible();
    expect(screen.getByText(/8.2 km/)).toHaveTextContent("8.2 km · 47 min");
    expect(screen.getAllByText("45 min").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Mark Easy run as complete" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("explains an empty session array instead of rendering an empty agenda", async () => {
    open(payload([]));
    expect(await screen.findByText("No sessions in this plan")).toBeVisible();
    expect(
      screen.queryByRole("navigation", { name: "Sessions by day" }),
    ).not.toBeInTheDocument();
  });

  it("labels the last-seven-days fallback accurately", async () => {
    const data = payload();
    data.plan!.summary.last7dDistanceKm = 22;
    open(data);
    expect(await screen.findByText("Last 7 days")).toBeVisible();
    expect(screen.queryByText("Distance completed")).not.toBeInTheDocument();
  });

  it.each(["2026-10-05", "2026-10-19"])(
    "allows retry when week %s fails to load",
    async (week) => {
      const data = payload();
      api.getScreen.mockRejectedValueOnce(new Error("Unavailable"));
      open(data, week);
      fireEvent.click(await screen.findByRole("button", { name: "Try again" }));
      expect(
        await screen.findByRole("heading", { name: "Your schedule" }),
      ).toBeVisible();
      expect(api.getScreen).toHaveBeenLastCalledWith(week);
    },
  );
});
