import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "@/lib/api";
import {
  bootstrapPortal,
  getCurrentUserWeeklyCoachScreen,
  getAthleteProfile,
  getWeeklyCoachPlan,
  retryCurrentUserWeeklyPlanGeneration,
  setCurrentUserWeeklyCoachSessionCompletion,
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
      intervals: {
        status: "connected",
        connected: true,
        providerAccountRef: "i372001",
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
      intervals: {
        status: "connected",
        connected: true,
        providerAccountRef: "i372001",
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
        phase: "BUILD",
        daysToGoal: 321,
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
        phase: "BUILD",
        daysToGoal: 321,
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
      upNextSessionDay: "SUN",
      goal: {
        goalSummary: "Sub-1:40 half marathon",
        primaryGoal: {
          name: "Barcelona Half Marathon",
          eventDate: "2026-06-01",
          distanceKm: 21.1,
        },
        phase: "BUILD",
        daysToGoal: 67,
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
          day: "SUN",
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
              day: "SUN",
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
          phase: "BUILD",
          daysToGoal: 101,
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
      },
      highlights: {
        longRun: {
          durationMinutes: 95,
        },
      },
      plan: {
        planId: "athlete-1:2026-03-23",
        summary: {
          readinessScore: 93,
          phase: "BUILD",
        },
        plan: {
          weekType: "BUILD",
          sessions: [{ day: "SUN", completed: true, role: "KEY" }],
        },
      },
    });
  });

  it("maps trainingGoalCode from athlete profile GET", async () => {
    apiRequestMock.mockResolvedValueOnce({
      athleteId: "athlete-1",
      displayName: "Jordi",
      runningDays: ["TUE", "THU", "SAT", "SUN"],
      longRunPreferredDay: "SUN",
      trainingGoal: "Build consistency",
      trainingGoalCode: "build_consistency",
      preparation: {
        primaryGoal: {
          name: "Valencia Half Marathon",
          eventDate: "2026-10-25",
          distanceKm: 21.1,
        },
      },
    });

    await expect(getAthleteProfile("athlete-1")).resolves.toMatchObject({
      athleteId: "athlete-1",
      trainingGoal: "build_consistency",
      runningDays: ["TUE", "THU", "SAT", "SUN"],
      longRunPreferredDay: "SUN",
      goalRaceEventName: "Valencia Half Marathon",
    });
  });

  it("sends the closed training goal code in profile updates", async () => {
    apiRequestMock.mockResolvedValueOnce({ athleteId: "athlete-1" });

    await updateAthleteProfile("athlete-1", {
      displayName: "Jordi",
      trainingGoal: "race_personal_best",
      runningDays: ["TUE", "THU", "SAT", "SUN"],
      longRunPreferredDay: "SUN",
      goalRaceEventName: "Valencia Half Marathon",
      goalRaceEventDate: "2026-10-25",
      goalRaceEventDistanceKm: 21.1,
    });

    expect(apiRequestMock).toHaveBeenCalledWith("/api/v1/athletes/athlete-1", {
      method: "PUT",
      body: expect.objectContaining({
        trainingGoal: "race_personal_best",
        runningDays: ["TUE", "THU", "SAT", "SUN"],
        longRunPreferredDay: "SUN",
      }),
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
});
