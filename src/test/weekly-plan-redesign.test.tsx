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

  it("shows prescribed time separately from recorded activity and excludes rest from the total", async () => {
    open(
      payload([
        {
          ...run,
          durationMinutes: 45,
          syncedActivity: {
            activityId: "activity",
            provider: "INTERVALS",
            durationMinutes: 63,
            distanceKm: 8.2,
          },
        },
        {
          ...run,
          day: "TUE",
          title: "Strength",
          modality: "STRENGTH",
          durationMinutes: 30,
        },
        {
          ...run,
          day: "WED",
          title: "Rest",
          modality: "REST",
          durationMinutes: 999,
        },
      ]),
    );
    const schedule = await screen.findByRole("region", {
      name: "Your schedule",
    });
    expect(within(schedule).getByText("75 min")).toBeInTheDocument();
    expect(
      within(schedule).getByText("Bars compare planned minutes."),
    ).toBeInTheDocument();
    expect(
      within(schedule).getByRole("button", { name: "Details for Easy run" }),
    ).toHaveAccessibleDescription(/45 min planned/);
    expect(
      within(schedule).getByRole("button", { name: "Details for Strength" }),
    ).toHaveAccessibleDescription(/30 min planned/);
    fireEvent.click(
      within(schedule).getByRole("button", { name: "Details for Easy run" }),
    );
    expect(within(schedule).getByText(/8.2 km/)).toHaveTextContent(
      "8.2 km · 63 min",
    );
    expect(within(schedule).getByText("75 min")).toBeInTheDocument();
  });

  it("keeps a partial plan in chronological order without inventing the missing days", async () => {
    open(payload([{ ...run, day: "SUN", title: "Long run" }, run]));
    const schedule = await screen.findByRole("list", {
      name: "Weekly schedule",
    });
    const days = within(schedule).getAllByRole("listitem");
    expect(days).toHaveLength(2);
    expect(
      within(days[0]).getByRole("button", { name: "Details for Easy run" }),
    ).toBeInTheDocument();
    expect(
      within(days[1]).getByRole("button", { name: "Details for Long run" }),
    ).toBeInTheDocument();
    expect(within(schedule).queryByText("Rest day")).not.toBeInTheDocument();
  });

  it("describes an all-rest plan without a zero-of-zero completion target or prescribed training time", async () => {
    open(
      payload([
        {
          ...run,
          modality: "REST",
          title: "Rest day",
          completed: true,
          durationMinutes: 0,
        },
      ]),
    );
    const schedule = await screen.findByRole("region", {
      name: "Your schedule",
    });
    expect(within(schedule).getByText("1 rest day")).toBeInTheDocument();
    expect(within(schedule).queryByText(/complete$/)).not.toBeInTheDocument();
    expect(
      within(schedule).queryByText("Bars compare planned minutes."),
    ).not.toBeInTheDocument();
    expect(
      within(schedule).queryByRole("button", { name: /Mark/ }),
    ).not.toBeInTheDocument();
  });

  it("keeps zero-duration sessions inspectable without an invalid comparison scale", async () => {
    open(payload([{ ...run, durationMinutes: 0 }]));
    const schedule = await screen.findByRole("region", {
      name: "Your schedule",
    });
    const detail = within(schedule).getByRole("button", {
      name: "Details for Easy run",
    });
    expect(detail).toHaveAccessibleDescription(/0 min planned/);
    expect(
      within(schedule).queryByText("Bars compare planned minutes."),
    ).not.toBeInTheDocument();
    fireEvent.click(detail);
    expect(
      within(schedule).getByText("0 minutes planned at low intensity."),
    ).toBeInTheDocument();
    expect(schedule).not.toHaveTextContent(/NaN|Infinity/);
  });

  it("exposes only the selected day's detail to assistive technology during a change", async () => {
    open(
      payload([
        run,
        {
          ...run,
          day: "TUE",
          title: "Strength",
          modality: "STRENGTH",
          notes: "Work with control.",
        },
      ]),
    );
    const first = await screen.findByRole("button", {
      name: "Details for Easy run",
    });
    const second = screen.getByRole("button", { name: "Details for Strength" });
    fireEvent.click(first);
    expect(
      document.getElementById(first.getAttribute("aria-controls")!),
    ).toHaveAttribute("aria-hidden", "false");
    fireEvent.click(second);
    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(
      document.getElementById(first.getAttribute("aria-controls")!),
    ).toHaveAttribute("aria-hidden", "true");
    expect(
      document.getElementById(second.getAttribute("aria-controls")!),
    ).toHaveAttribute("aria-hidden", "false");
    fireEvent.click(second);
    expect(second).toHaveAttribute("aria-expanded", "false");
    expect(
      document.getElementById(second.getAttribute("aria-controls")!),
    ).toHaveAttribute("aria-hidden", "true");
  });

  it("updates the weekly time and resets details when navigating to a historical plan", async () => {
    const data = payload();
    data.previousWeekStartDate = "2026-10-05";
    data.canGoPrevious = true;
    const past = payload([{ ...run, durationMinutes: 25 }]);
    past.todayWeekStartDate = data.todayWeekStartDate;
    past.selectedWeekStartDate = "2026-10-05";
    past.plan!.weekStartDate = "2026-10-05";
    open(data);
    fireEvent.click(
      await screen.findByRole("button", { name: "Details for Easy run" }),
    );
    api.getScreen.mockResolvedValue(past);
    fireEvent.click(screen.getByRole("button", { name: "Previous week" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Details for Easy run" }),
      ).toHaveAccessibleDescription(/25 min planned/),
    );
    const schedule = screen.getByRole("region", { name: "Your schedule" });
    expect(
      within(schedule).getByRole("button", { name: "Details for Easy run" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      within(schedule).getByRole("button", {
        name: "Mark Easy run as complete",
      }),
    ).toBeDisabled();
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
