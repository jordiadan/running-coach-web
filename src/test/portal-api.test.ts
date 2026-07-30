import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "@/lib/api";
import {
  bootstrapPortal,
  getCurrentUserWeeklyCoachScreen,
  getAthleteProfile,
  getWeeklyCoachPlan,
  retryCurrentUserWeeklyPlanGeneration,
  setCurrentUserRaceGoalOutcome,
  setCurrentUserWeeklyCoachSessionCompletion,
  trainingGoalOptions,
  updateAthleteProfile,
} from "@/lib/portal-api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");

  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

const apiRequestMock = vi.mocked(apiRequest);

describe("portal-api weekly coach helpers", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("exposes only the two backend training goals", () => {
    expect(trainingGoalOptions).toEqual([
      { code: "prepare_for_race", label: "Prepare for a race" },
      { code: "improve_running", label: "Improve my running" },
    ]);
  });

  it("returns undefined only for the expected weekly plan not found code", async () => {
    apiRequestMock.mockRejectedValueOnce(
      new ApiError("plan missing", 404, { code: "WEEKLY_COACH_PLAN_NOT_FOUND" }),
    );

    await expect(getWeeklyCoachPlan("athlete-1", "2026-03-23")).resolves.toBeUndefined();
  });

  it("rethrows other 404 responses from the weekly plan endpoint", async () => {
    const error = new ApiError("athlete missing", 404, { code: "ATHLETE_NOT_FOUND" });
    apiRequestMock.mockRejectedValueOnce(error);

    await expect(getWeeklyCoachPlan("athlete-1", "2026-03-23")).rejects.toBe(error);
  });

  it("maps weekly plan metadata from portal bootstrap", async () => {
    apiRequestMock.mockResolvedValueOnce({
      athleteId: "athlete-1",
      user: {
        userId: "supabase-user-id",
        email: "runner@example.com",
        displayName: "Jordi",
      },
      profile: {
        isComplete: true,
      },
      trainingProvider: {
        activeProvider: "intervals",
        connected: true,
        activeProviderAccountRef: "i372001",
        readinessCapability: "full",
        lastProvider: null,
        lastStatus: null,
      },
      weeklyPlan: {
        targetWeekStartDate: "2026-03-23",
        hasPlan: false,
        status: "preparing",
        failureCode: null,
      },
      nextStep: "prepare_weekly_plan",
    });

    await expect(bootstrapPortal()).resolves.toEqual({
      athleteId: "athlete-1",
      user: {
        userId: "supabase-user-id",
        email: "runner@example.com",
        displayName: "Jordi",
      },
      profile: {
        isComplete: true,
      },
      trainingProvider: {
        activeProvider: "intervals",
        connected: true,
        activeProviderAccountRef: "i372001",
        readinessCapability: "full",
        lastProvider: undefined,
        lastStatus: undefined,
      },
      weeklyPlan: {
        targetWeekStartDate: "2026-03-23",
        hasPlan: false,
        status: "preparing",
        failureCode: undefined,
      },
      nextStep: "prepare_weekly_plan",
    });
  });

  it("maps weekly plan summary fields when reading a plan", async () => {
    apiRequestMock.mockResolvedValueOnce({
      athleteId: "athlete-1",
      weekStartDate: "2026-03-23",
      planId: "plan-1",
      createdAt: "2026-03-23T08:00:00Z",
      updatedAt: "2026-03-23T08:00:00Z",
      summary: {
        readinessScore: 42,
        fatigue: 6,
        sleepHours: 6.5,
        last7dDistanceKm: 39.4,
        completedWeekDistanceKm: 11.2,
        phase: "BUILD",
        daysToGoal: 321,
        goalTimelineState: "UPCOMING",
        daysUntilGoal: 321,
        daysSinceGoal: null,
        postGoalWindowDays: 14,
        postGoalRecoveryDay: null,
      },
      plan: {
        schemaVersion: "1.0",
        weekType: "DELOAD",
        weekObjective: "Reduce fatigue",
        progressionNote: "Keep consistency",
        sessions: [],
        justification: [],
      },
      llmMeta: {
        provider: "openai",
        model: "gpt-5",
        promptVersion: "v1",
      },
    });

    await expect(getWeeklyCoachPlan("athlete-1", "2026-03-23")).resolves.toMatchObject({
      athleteId: "athlete-1",
      weekStartDate: "2026-03-23",
      summary: {
        readinessScore: 42,
        fatigue: 6,
        sleepHours: 6.5,
        last7dDistanceKm: 39.4,
        completedWeekDistanceKm: 11.2,
        phase: "BUILD",
        daysToGoal: 321,
        goalTimelineState: "UPCOMING",
        daysUntilGoal: 321,
        daysSinceGoal: undefined,
        postGoalWindowDays: 14,
        postGoalRecoveryDay: undefined,
      },
      plan: {
        weekType: "DELOAD",
      },
    });
  });

  it("maps the navigable weekly coach screen read model", async () => {
    apiRequestMock.mockResolvedValueOnce({
      viewType: "PLAN",
      selectedWeekStartDate: "2026-03-23",
      todayWeekStartDate: "2026-03-23",
      latestGeneratedWeekStartDate: "2026-03-23",
      futurePreviewWeekStartDate: "2026-03-30",
      previousWeekStartDate: "2026-03-16",
      nextWeekStartDate: "2026-03-30",
      canGoPrevious: true,
      canGoNext: true,
      todaySessionDay: "SUN",
      upNextSessionDay: "SUNDAY",
      goal: {
        goalSummary: "Sub-1:40 half marathon",
        primaryGoal: {
          name: "Barcelona Half Marathon",
          eventDate: "2026-06-01",
          distanceKm: 21.1,
        },
        phase: "BUILD",
        daysToGoal: 67,
        goalTimelineState: "UPCOMING",
        daysUntilGoal: 67,
        daysSinceGoal: null,
        postGoalWindowDays: 14,
        postGoalRecoveryDay: null,
        goalOutcomeStatus: "UNKNOWN",
        nextSecondaryGoal: {
          role: "TUNE_UP",
          name: "10K tune-up",
          eventDate: "2026-05-01",
          distanceKm: 10,
          daysUntilEvent: 36,
        },
      },
      highlights: {
        longRun: {
          day: "SUNDAY",
          title: "Long run",
          durationMinutes: 95,
          intensityCategory: "LOW",
        },
      },
      plan: {
        weekStartDate: "2026-03-23",
        planId: "athlete-1:2026-03-23",
        createdAt: "2026-03-23T08:00:00Z",
        updatedAt: "2026-03-23T08:00:00Z",
        plan: {
          schemaVersion: "1.0",
          weekType: "BUILD",
          weekObjective: "Build aerobic capacity",
          progressionNote: "Hold one quality run",
          sessions: [
            {
              day: "SUNDAY",
              modality: "RUN",
              type: "LONG_RUN",
              title: "Long run",
              durationMinutes: 95,
              completed: true,
              role: "KEY",
              intensityCategory: "LOW",
              placementReason: "Anchor session",
            },
          ],
          justification: [],
        },
        summary: {
          readinessScore: 93,
          fatigue: 3,
          sleepHours: 7.9,
          last7dDistanceKm: 45,
          completedWeekDistanceKm: 10.5,
          phase: "BUILD",
          daysToGoal: 101,
          goalTimelineState: "UPCOMING",
          daysUntilGoal: 101,
          daysSinceGoal: null,
          postGoalWindowDays: 14,
          postGoalRecoveryDay: null,
        },
        llmMeta: {
          provider: "openai",
          model: "gpt-5",
          promptVersion: "v1",
        },
      },
    });

    await expect(getCurrentUserWeeklyCoachScreen("2026-03-23")).resolves.toMatchObject({
      viewType: "PLAN",
      selectedWeekStartDate: "2026-03-23",
      previousWeekStartDate: "2026-03-16",
      nextWeekStartDate: "2026-03-30",
      canGoPrevious: true,
      canGoNext: true,
      todaySessionDay: "SUN",
      upNextSessionDay: "SUN",
      goal: {
        goalSummary: "Sub-1:40 half marathon",
        primaryGoal: {
          name: "Barcelona Half Marathon",
        },
        phase: "BUILD",
        daysToGoal: 67,
        goalTimelineState: "UPCOMING",
        daysUntilGoal: 67,
        daysSinceGoal: undefined,
        postGoalWindowDays: 14,
        postGoalRecoveryDay: undefined,
        goalOutcomeStatus: "UNKNOWN",
      },
      highlights: {
        longRun: {
          day: "SUN",
          durationMinutes: 95,
        },
      },
      plan: {
        planId: "athlete-1:2026-03-23",
        summary: {
          readinessScore: 93,
          completedWeekDistanceKm: 10.5,
          phase: "BUILD",
          goalTimelineState: "UPCOMING",
          daysUntilGoal: 101,
        },
        plan: {
          weekType: "BUILD",
          sessions: [{ day: "SUN", completed: true, role: "KEY" }],
        },
      },
    });
  });

  it("does not invent completion state when the backend omits it", async () => {
    apiRequestMock.mockResolvedValueOnce({
      viewType: "PLAN",
      selectedWeekStartDate: "2026-03-23",
      todayWeekStartDate: "2026-03-23",
      latestGeneratedWeekStartDate: "2026-03-23",
      futurePreviewWeekStartDate: null,
      previousWeekStartDate: null,
      nextWeekStartDate: null,
      canGoPrevious: false,
      canGoNext: false,
      goal: null,
      highlights: {},
      plan: {
        weekStartDate: "2026-03-23",
        planId: "athlete-1:2026-03-23",
        createdAt: "2026-03-23T08:00:00Z",
        updatedAt: "2026-03-23T08:00:00Z",
        plan: {
          schemaVersion: "1.0",
          weekType: "BUILD",
          weekObjective: "Build aerobic capacity",
          progressionNote: "Hold one quality run",
          sessions: [
            {
              day: "MONDAY",
              modality: "RUN",
              type: "EASY_RUN",
              title: "Easy run",
              durationMinutes: 45,
              intensityCategory: "LOW",
              placementReason: "Start the week easy",
            },
          ],
          justification: [],
        },
        summary: {},
        llmMeta: {
          provider: "openai",
          model: "gpt-5",
          promptVersion: "v1",
        },
      },
    });

    await expect(getCurrentUserWeeklyCoachScreen("2026-03-23")).resolves.toMatchObject({
      plan: {
        plan: {
          sessions: [{ day: "MON", completed: undefined }],
        },
      },
    });
  });

  it("maps post-goal timeline fields and ignores unknown timeline states", async () => {
    apiRequestMock.mockResolvedValueOnce({
      viewType: "EMPTY",
      selectedWeekStartDate: "2026-04-27",
      todayWeekStartDate: "2026-04-27",
      canGoPrevious: false,
      canGoNext: false,
      goal: {
        goalSummary: "Mediterrani recovery",
        primaryGoal: {
          name: "Mediterrani Half",
          eventDate: "2026-04-26",
          distanceKm: 21.1,
        },
        phase: "POST_GOAL",
        daysToGoal: 0,
        goalTimelineState: "POST_GOAL",
        daysUntilGoal: null,
        daysSinceGoal: 1,
        postGoalWindowDays: 14,
        postGoalRecoveryDay: 1,
        goalOutcomeStatus: "COMPLETED",
      },
      highlights: {},
      plan: {
        weekStartDate: "2026-04-27",
        planId: "athlete-1:2026-04-27",
        createdAt: "2026-04-27T08:00:00Z",
        updatedAt: "2026-04-27T08:00:00Z",
        plan: {
          schemaVersion: "1.0",
          weekType: "DELOAD",
          weekObjective: "Recover from race day",
          progressionNote: "Keep everything easy",
          sessions: [],
          justification: [],
        },
        summary: {
          phase: "POST_GOAL",
          daysToGoal: 0,
          goalTimelineState: "SOMETHING_NEW",
          daysUntilGoal: null,
          daysSinceGoal: 1,
          postGoalWindowDays: 14,
          postGoalRecoveryDay: 1,
        },
        llmMeta: {
          provider: "openai",
          model: "gpt-5",
          promptVersion: "v1",
        },
      },
    });

    await expect(getCurrentUserWeeklyCoachScreen("2026-04-27")).resolves.toMatchObject({
      goal: {
        goalTimelineState: "POST_GOAL",
        daysUntilGoal: undefined,
        daysSinceGoal: 1,
        postGoalWindowDays: 14,
        postGoalRecoveryDay: 1,
        goalOutcomeStatus: "COMPLETED",
      },
      plan: {
        summary: {
          goalTimelineState: undefined,
          daysUntilGoal: undefined,
          daysSinceGoal: 1,
        },
      },
    });
  });

  it("maps the race target and both equivalent values from athlete profile GET", async () => {
    apiRequestMock.mockResolvedValueOnce({
      athleteId: "athlete-1",
      displayName: "Jordi",
      runningDays: ["TUE", "THU", "SAT", "SUN"],
      longRunPreferredDay: "SUN",
      trainingGoal: "Prepare for race",
      trainingGoalCode: "prepare_for_race",
      preparation: {
        primaryGoal: {
          name: "Valencia Half Marathon",
          eventDate: "2026-10-25",
          distanceKm: 21.1,
          raceTarget: {
            type: "TIME",
            targetTimeSeconds: 5400,
            targetPaceSecondsPerKm: 256,
          },
        },
      },
    });

    await expect(getAthleteProfile("athlete-1")).resolves.toMatchObject({
      athleteId: "athlete-1",
      trainingGoal: "prepare_for_race",
      runningDays: ["TUE", "THU", "SAT", "SUN"],
      longRunPreferredDay: "SUN",
      goalRaceEventName: "Valencia Half Marathon",
      raceTargetType: "TIME",
      targetTimeSeconds: 5400,
      targetPaceSecondsPerKm: 256,
    });
  });

  it("sends only the original target time in race profile updates", async () => {
    apiRequestMock.mockResolvedValueOnce({ athleteId: "athlete-1" });

    await updateAthleteProfile("athlete-1", {
      displayName: "Jordi",
      trainingGoal: "prepare_for_race",
      runningDays: ["TUE", "THU", "SAT", "SUN"],
      longRunPreferredDay: "SUN",
      goalRaceEventName: "Valencia Half Marathon",
      goalRaceEventDate: "2026-10-25",
      goalRaceEventDistanceKm: 21.1,
      raceTargetType: "TIME",
      targetTimeSeconds: 5400,
      targetPaceSecondsPerKm: 256,
    });

    expect(apiRequestMock).toHaveBeenCalledWith("/api/v1/athletes/athlete-1", {
      method: "PUT",
      body: {
        displayName: "Jordi",
        trainingGoal: "prepare_for_race",
        runningDays: ["TUE", "THU", "SAT", "SUN"],
        longRunPreferredDay: "SUN",
        preparation: {
          primaryGoal: {
            name: "Valencia Half Marathon",
            eventDate: "2026-10-25",
            distanceKm: 21.1,
            raceTarget: {
              type: "TIME",
              targetTimeSeconds: 5400,
            },
          },
          secondaryGoals: [],
        },
      },
    });
  });

  it("sends only the original target pace in race profile updates", async () => {
    apiRequestMock.mockResolvedValueOnce({ athleteId: "athlete-1" });

    await updateAthleteProfile("athlete-1", {
      displayName: "Jordi",
      trainingGoal: "prepare_for_race",
      runningDays: ["TUE", "THU", "SAT", "SUN"],
      longRunPreferredDay: "SUN",
      goalRaceEventName: "Valencia Half Marathon",
      goalRaceEventDate: "2026-10-25",
      goalRaceEventDistanceKm: 21.1,
      raceTargetType: "PACE",
      targetTimeSeconds: 6330,
      targetPaceSecondsPerKm: 300,
    });

    expect(apiRequestMock).toHaveBeenCalledWith("/api/v1/athletes/athlete-1", {
      method: "PUT",
      body: expect.objectContaining({
        preparation: expect.objectContaining({
          primaryGoal: expect.objectContaining({
            raceTarget: {
              type: "PACE",
              targetPaceSecondsPerKm: 300,
            },
          }),
        }),
      }),
    });
  });

  it("sends a finish-only race target without time or pace", async () => {
    apiRequestMock.mockResolvedValueOnce({ athleteId: "athlete-1" });

    await updateAthleteProfile("athlete-1", {
      displayName: "Jordi",
      trainingGoal: "prepare_for_race",
      runningDays: ["TUE", "THU", "SAT", "SUN"],
      longRunPreferredDay: "SUN",
      goalRaceEventName: "Valencia Half Marathon",
      goalRaceEventDate: "2026-10-25",
      goalRaceEventDistanceKm: 21.1,
      raceTargetType: "FINISH_ONLY",
      targetTimeSeconds: "",
      targetPaceSecondsPerKm: "",
    });

    expect(apiRequestMock).toHaveBeenCalledWith("/api/v1/athletes/athlete-1", {
      method: "PUT",
      body: expect.objectContaining({
        preparation: expect.objectContaining({
          primaryGoal: expect.objectContaining({
            raceTarget: {
              type: "FINISH_ONLY",
            },
          }),
        }),
      }),
    });
  });

  it("omits race preparation when the goal is improve running", async () => {
    apiRequestMock.mockResolvedValueOnce({ athleteId: "athlete-1" });

    await updateAthleteProfile("athlete-1", {
      displayName: "Jordi",
      trainingGoal: "improve_running",
      runningDays: ["TUE", "THU", "SAT", "SUN"],
      longRunPreferredDay: "SUN",
      goalRaceEventName: "Ignored race",
      goalRaceEventDate: "2026-10-25",
      goalRaceEventDistanceKm: 21.1,
      raceTargetType: "FINISH_ONLY",
      targetTimeSeconds: "",
      targetPaceSecondsPerKm: "",
    });

    expect(apiRequestMock).toHaveBeenCalledWith("/api/v1/athletes/athlete-1", {
      method: "PUT",
      body: {
        displayName: "Jordi",
        trainingGoal: "improve_running",
        runningDays: ["TUE", "THU", "SAT", "SUN"],
        longRunPreferredDay: "SUN",
      },
    });
  });

  it("calls the weekly plan retry endpoint", async () => {
    apiRequestMock.mockResolvedValueOnce(undefined);

    await retryCurrentUserWeeklyPlanGeneration();

    expect(apiRequestMock).toHaveBeenCalledWith("/api/v1/me/onboarding/weekly-plan:retry", {
      method: "POST",
    });
  });

  it("persists weekly coach session completion state", async () => {
    apiRequestMock.mockResolvedValueOnce(undefined);

    await setCurrentUserWeeklyCoachSessionCompletion("2026-03-23", "SUN", true);

    expect(apiRequestMock).toHaveBeenCalledWith(
      "/api/v1/me/weekly-coach/weeks/2026-03-23/sessions/SUN/completion",
      {
        method: "PUT",
        body: { completed: true },
      },
    );

    apiRequestMock.mockResolvedValueOnce(undefined);

    await setCurrentUserWeeklyCoachSessionCompletion("2026-03-23", "SUN", false);

    expect(apiRequestMock).toHaveBeenLastCalledWith(
      "/api/v1/me/weekly-coach/weeks/2026-03-23/sessions/SUN/completion",
      {
        method: "PUT",
        body: { completed: false },
      },
    );
  });

  it("sets the current race goal outcome", async () => {
    apiRequestMock.mockResolvedValueOnce(undefined);

    await setCurrentUserRaceGoalOutcome("COMPLETED");

    expect(apiRequestMock).toHaveBeenCalledWith("/api/v1/me/race-goals/current/outcome", {
      method: "PUT",
      body: { outcome: "COMPLETED" },
    });

    apiRequestMock.mockResolvedValueOnce(undefined);

    await setCurrentUserRaceGoalOutcome("SKIPPED");

    expect(apiRequestMock).toHaveBeenLastCalledWith("/api/v1/me/race-goals/current/outcome", {
      method: "PUT",
      body: { outcome: "SKIPPED" },
    });
  });
});
