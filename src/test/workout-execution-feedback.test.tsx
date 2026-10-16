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
import { getCurrentUserWeeklyCoachScreen } from "@/lib/portal-api";
import { apiRequest } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  apiRequest: vi.fn(),
  ApiError: class extends Error {},
}));
const request = vi.mocked(apiRequest);
const evaluation = {
  status: "EVALUATED",
  score: 38,
  durationExecution: "SHORTER",
  intensityExecution: "TOO_HIGH",
  structureExecution: "PARTIAL",
};

function weeklyScreen(evaluationValue: unknown, overrides = {}) {
  return {
    viewType: "PLAN",
    selectedWeekStartDate: "2026-03-23",
    todayWeekStartDate: "2026-10-12",
    canGoPrevious: false,
    canGoNext: false,
    highlights: {},
    plan: {
      weekStartDate: "2026-03-23",
      planId: "athlete-1:2026-03-23",
      summary: {},
      plan: {
        schemaVersion: "1.0",
        weekType: "BUILD",
        weekObjective: "Aerobic work",
        progressionNote: "Controlled load",
        sessions: [
          {
            day: "MON",
            modality: "RUN",
            type: "EASY",
            title: "Easy run",
            durationMinutes: 50,
            completed: true,
            completionSource: "SYNCED_ACTIVITY",
            intensityCategory: "LOW",
            placementReason: "Aerobic work",
            syncedActivity: {
              activityId: "activity",
              provider: "INTERVALS",
              activityUrl: "https://intervals.icu/activities/activity",
              durationMinutes: 35,
              distanceKm: 6,
            },
            executionEvaluation: evaluationValue,
            ...overrides,
          },
        ],
        justification: [],
      },
    },
  };
}

function renderWeek(
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  }),
  athleteId = "athlete-1",
) {
  const ui = (athlete: string, week = "2026-03-23") => (
    <QueryClientProvider client={queryClient}>
      <WeeklyPlanScreen
        athleteId={athlete}
        targetWeekStartDate={week}
        isPreparing={false}
        onRefresh={vi.fn()}
      />
    </QueryClientProvider>
  );
  return { ...render(ui(athleteId)), ui, queryClient };
}

beforeEach(() => request.mockReset());

describe("weekly execution feedback API", () => {
  it.each([0, 38, 100])(
    "keeps the persisted score %s and dimensions",
    async (score) => {
      request.mockResolvedValueOnce(weeklyScreen({ ...evaluation, score }));
      const result = await getCurrentUserWeeklyCoachScreen("2026-03-23");
      expect(result.plan?.plan.sessions[0].executionEvaluation).toEqual({
        ...evaluation,
        score,
      });
      expect(request).toHaveBeenCalledWith(
        "/api/v1/me/weekly-coach/screen?weekStartDate=2026-03-23",
      );
    },
  );

  it("keeps insufficient evidence without a score or invented dimensions", async () => {
    request.mockResolvedValueOnce(
      weeklyScreen({ status: "INSUFFICIENT_EVIDENCE", score: null }),
    );
    const result = await getCurrentUserWeeklyCoachScreen();
    expect(result.plan?.plan.sessions[0].executionEvaluation).toEqual({
      status: "INSUFFICIENT_EVIDENCE",
    });
  });

  it.each([
    undefined,
    null,
    {},
    { status: "FUTURE_STATUS" },
    { ...evaluation, score: -1 },
    { ...evaluation, score: 101 },
    { ...evaluation, score: 4.5 },
    { ...evaluation, score: "38" },
    { ...evaluation, score: NaN },
    { ...evaluation, score: Infinity },
    { ...evaluation, score: undefined },
    { ...evaluation, durationExecution: "NEW" },
    { ...evaluation, intensityExecution: null },
    { ...evaluation, structureExecution: "NEW" },
  ])(
    "does not fabricate a result from absent or invalid feedback %#",
    async (value) => {
      request.mockResolvedValueOnce(weeklyScreen(value));
      const result = await getCurrentUserWeeklyCoachScreen();
      expect(result.plan?.plan.sessions[0].executionEvaluation).toBeUndefined();
    },
  );
});

describe("weekly execution feedback screen", () => {
  it("preserves a pending Today workout with notes and no execution score", async () => {
    const payload = weeklyScreen(evaluation, {
      completed: false,
      notes: "Keep a relaxed, conversational effort.",
    });
    request.mockResolvedValue({
      ...payload,
      todayWeekStartDate: payload.selectedWeekStartDate,
      todaySessionDay: "MON",
    });
    renderWeek();
    expect(
      await screen.findByText("Keep a relaxed, conversational effort."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/Execution score/)).not.toBeInTheDocument();
  });

  it.each(
    ["MANUAL", "SYNCED_ACTIVITY"].flatMap((source) =>
      ["EASY", "RECOVERY", "LONG_RUN", "TEMPO", "VO2"].map((type) => ({
        source,
        type,
      })),
    ),
  )(
    "shows one discreet score for $source/$type and opens three dimensions",
    async ({ source, type }) => {
      request.mockResolvedValue(
        weeklyScreen(evaluation, { completionSource: source, type }),
      );
      renderWeek();
      const disclosure = await screen.findByRole("button", {
        name: "Details for Easy run",
      });
      expect(
        screen.getAllByLabelText("Execution score 38 out of 100"),
      ).toHaveLength(1);
      expect(disclosure).toHaveAttribute("aria-expanded", "false");
      fireEvent.click(disclosure);
      expect(disclosure).toHaveAttribute("aria-expanded", "true");
      const details = screen.getByRole("region", {
        name: "Compared with plan",
      });
      expect(within(details).getByText("Duration")).toBeInTheDocument();
      expect(
        within(details).getByText("Shorter than planned"),
      ).toBeInTheDocument();
      expect(within(details).getByText("Intensity")).toBeInTheDocument();
      expect(
        within(details).getByText("Higher than planned"),
      ).toBeInTheDocument();
      expect(within(details).getByText("Structure")).toBeInTheDocument();
      expect(within(details).getByText("Partly followed")).toBeInTheDocument();
      expect(screen.getAllByText("38/100")).toHaveLength(1);
      expect(
        screen.getByRole("link", { name: /View on Intervals/ }),
      ).toHaveAttribute("href", "https://intervals.icu/activities/activity");
    },
  );

  it.each(["STRAVA", "INTERVALS"])(
    "keeps the %s link independently accessible",
    async (provider) => {
      request.mockResolvedValue(
        weeklyScreen(evaluation, {
          syncedActivity: {
            activityId: "activity",
            provider,
            activityUrl: "https://provider.test/activity",
            durationMinutes: 35,
            distanceKm: 6,
          },
        }),
      );
      renderWeek();
      const link = await screen.findByRole("link", { name: /View on/ });
      fireEvent.click(link);
      expect(
        screen.getByRole("button", { name: "Details for Easy run" }),
      ).toHaveAttribute("aria-expanded", "false");
      expect(link).toHaveAttribute("href", "https://provider.test/activity");
    },
  );

  it.each(
    [
      ["STRENGTH", "STRENGTH"],
      ["MOBILITY", "MOBILITY"],
      ["RUN", "THRESHOLD_TEST"],
      ["CYCLING", "EASY"],
    ].flatMap(([modality, type]) =>
      [null, { status: "INSUFFICIENT_EVIDENCE" }, evaluation].map((value) => ({
        modality,
        type,
        value,
      })),
    ),
  )(
    "hides execution feedback for unsupported $modality/$type sessions %#",
    async ({ modality, type, value }) => {
      request.mockResolvedValue(
        weeklyScreen(value, { modality, type, notes: "Session notes." }),
      );
      renderWeek();
      const disclosure = await screen.findByRole("button", {
        name: "Details for Easy run",
      });
      fireEvent.click(disclosure);
      expect(screen.getByText("Session notes.")).toBeInTheDocument();
      expect(disclosure).toHaveAccessibleDescription(/50 min planned/);
      expect(disclosure.getAttribute("aria-describedby")).not.toContain(
        "score",
      );
      expect(
        screen.queryByLabelText(/Execution score/),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/No execution evaluation/),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/Not enough activity data/),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("region", { name: "Compared with plan" }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /View on Intervals/ }),
      ).toHaveAttribute("href", "https://intervals.icu/activities/activity");
    },
  );

  it.each([null, { status: "INSUFFICIENT_EVIDENCE" }, evaluation])(
    "hides execution feedback for manual completion without a linked activity %#",
    async (value) => {
      request.mockResolvedValue(
        weeklyScreen(value, {
          completionSource: "MANUAL",
          syncedActivity: null,
          notes: "Keep a relaxed, conversational effort.",
        }),
      );
      renderWeek();
      const disclosure = await screen.findByRole("button", {
        name: "Details for Easy run",
      });
      fireEvent.click(disclosure);
      expect(
        screen.getByRole("button", { name: "Mark Easy run as incomplete" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Keep a relaxed, conversational effort."),
      ).toBeInTheDocument();
      expect(disclosure).toHaveAccessibleDescription(/50 min planned/);
      expect(disclosure.getAttribute("aria-describedby")).not.toContain(
        "score",
      );
      expect(
        screen.queryByLabelText(/Execution score/),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/No execution evaluation/),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/Not enough activity data/),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("region", { name: "Compared with plan" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /View on/ }),
      ).not.toBeInTheDocument();
    },
  );

  it.each(
    ["MANUAL", "SYNCED_ACTIVITY"].flatMap((source) =>
      [
        { value: null, message: "No execution evaluation available." },
        {
          value: { status: "INSUFFICIENT_EVIDENCE" },
          message: "Not enough activity data to evaluate this workout.",
        },
      ].map((feedback) => ({ source, ...feedback })),
    ),
  )(
    "distinguishes absent and insufficient feedback with a linked activity for $source %#",
    async ({ source, value, message }) => {
      request.mockResolvedValue(
        weeklyScreen(value, { completionSource: source }),
      );
      renderWeek();
      fireEvent.click(
        await screen.findByRole("button", { name: "Details for Easy run" }),
      );
      expect(screen.getByText(message)).toBeInTheDocument();
      expect(
        screen.queryByLabelText(/Execution score/),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("region", { name: "Compared with plan" }),
      ).not.toBeInTheDocument();
    },
  );

  it("keeps absent evaluation feedback for manual completion with a linked activity but no provider URL", async () => {
    request.mockResolvedValue(
      weeklyScreen(null, {
        completionSource: "MANUAL",
        syncedActivity: {
          activityId: "activity",
          provider: "STRAVA",
          durationMinutes: 35,
          distanceKm: 6,
        },
      }),
    );
    renderWeek();
    fireEvent.click(
      await screen.findByRole("button", { name: "Details for Easy run" }),
    );
    expect(
      screen.getByText("No execution evaluation available."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Synced from Strava")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Execution score/)).not.toBeInTheDocument();
  });

  it("does not turn unknown evidence or inapplicable structure into a conclusion", async () => {
    request.mockResolvedValue(
      weeklyScreen({
        ...evaluation,
        durationExecution: "UNKNOWN",
        intensityExecution: "UNKNOWN",
        structureExecution: "NOT_APPLICABLE",
      }),
    );
    renderWeek();
    fireEvent.click(
      await screen.findByRole("button", { name: "Details for Easy run" }),
    );
    expect(screen.getAllByText("Not enough data")).toHaveLength(2);
    expect(screen.getByText("Not applicable")).toBeInTheDocument();
  });

  it("does not show evaluation feedback for an incomplete session", async () => {
    request.mockResolvedValue(weeklyScreen(evaluation, { completed: false }));
    renderWeek();
    await screen.findByRole("button", { name: "Details for Easy run" });
    expect(screen.queryByLabelText(/Execution score/)).not.toBeInTheDocument();
  });

  it("does not display a previous athlete's cached feedback", async () => {
    request.mockResolvedValueOnce(weeklyScreen(evaluation));
    const { rerender, ui } = renderWeek();
    await screen.findByLabelText("Execution score 38 out of 100");
    request.mockResolvedValueOnce(weeklyScreen(null));
    rerender(ui("athlete-2"));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(screen.queryByLabelText(/Execution score/)).not.toBeInTheDocument();
  });

  it("does not display a previous week's cached feedback", async () => {
    const payload = weeklyScreen(evaluation);
    request.mockResolvedValueOnce({
      ...payload,
      canGoPrevious: true,
      previousWeekStartDate: "2026-03-16",
    });
    const { rerender, ui } = renderWeek();
    await screen.findByLabelText("Execution score 38 out of 100");
    const previous = weeklyScreen(null);
    request.mockResolvedValueOnce({
      ...previous,
      selectedWeekStartDate: "2026-03-16",
      plan: { ...previous.plan, weekStartDate: "2026-03-16" },
    });
    rerender(ui("athlete-1", "2026-03-16"));
    await waitFor(() =>
      expect(request).toHaveBeenLastCalledWith(
        "/api/v1/me/weekly-coach/screen?weekStartDate=2026-03-16",
      ),
    );
    expect(screen.queryByLabelText(/Execution score/)).not.toBeInTheDocument();
  });
});
