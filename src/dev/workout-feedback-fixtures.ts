import type { CurrentUserWeeklyCoachScreen } from "@/lib/portal-api";
import type { ExecutionFeedback } from "@/lib/workout-feedback";

export const feedbackExamples: Record<
  string,
  { label: string; feedback?: ExecutionFeedback; manual?: boolean }
> = {
  evaluated: {
    label: "Good adherence",
    feedback: {
      status: "evaluated",
      score: 86,
      insight: "Keep your next easy run at a conversational effort.",
      label: "Good execution",
      summary:
        "Duration and structure matched the plan. Your effort was higher than planned.",
      duration: {
        outcome: "on_target",
        label: "On target",
        planned: "45 min",
        recorded: "47 min",
      },
      intensity: {
        outcome: "above_target",
        label: "Higher effort",
        planned: "Easy",
        recorded: "Moderate",
      },
      structure: {
        outcome: "as_planned",
        label: "As planned",
        planned: "Continuous",
        recorded: "Continuous",
      },
    },
  },
  different: {
    label: "Different from plan",
    feedback: {
      status: "evaluated",
      score: 48,
      insight: "Aim for the planned easy duration next time.",
      label: "Different from plan",
      summary:
        "This run was shorter and harder than planned, with intervals instead of a continuous run.",
      duration: {
        outcome: "below_target",
        label: "Shorter",
        planned: "45 min",
        recorded: "28 min",
      },
      intensity: {
        outcome: "above_target",
        label: "Higher effort",
        planned: "Easy",
        recorded: "Hard",
      },
      structure: {
        outcome: "different",
        label: "Different",
        planned: "Continuous",
        recorded: "Intervals",
      },
    },
  },
  partial: {
    label: "Partial evaluation",
    feedback: {
      status: "evaluated",
      score: 92,
      insight: "Keep that easy rhythm next time.",
      label: "Close to the plan",
      summary:
        "Duration and intensity followed the plan. Structure couldn’t be assessed from the available data.",
      duration: {
        outcome: "on_target",
        label: "On target",
        planned: "45 min",
        recorded: "47 min",
      },
      intensity: {
        outcome: "on_target",
        label: "On target",
        planned: "Easy",
        recorded: "Easy",
      },
      structure: {
        outcome: "unavailable",
        label: "Not assessed",
        planned: "Continuous",
      },
    },
  },
  insufficient: {
    label: "Insufficient evidence",
    feedback: { status: "insufficient_evidence" },
  },
  unavailable: { label: "No evaluation", feedback: { status: "unavailable" } },
  manual: { label: "Manually completed", manual: true },
  loading: { label: "Loading", feedback: { status: "loading" } },
  error: { label: "Request error", feedback: { status: "error" } },
};

feedbackExamples.manual_evaluated = {
  label: "Manually completed with evaluation",
  manual: true,
  feedback: feedbackExamples.evaluated.feedback,
};

export function workoutFeedbackScreen(
  example: string,
): CurrentUserWeeklyCoachScreen {
  const manual = feedbackExamples[example]?.manual;
  const duration = example === "different" ? 28 : 47;
  return {
    viewType: "PLAN",
    selectedWeekStartDate: "2026-09-28",
    todayWeekStartDate: "2026-10-05",
    canGoPrevious: false,
    canGoNext: false,
    highlights: {
      longRun: {
        day: "SUN",
        title: "Long easy run",
        durationMinutes: 80,
        intensityCategory: "LOW",
      },
    },
    plan: {
      athleteId: "demo-athlete",
      weekStartDate: "2026-09-28",
      planId: "demo-week",
      createdAt: "2026-09-28T08:00:00Z",
      updatedAt: "2026-09-28T08:00:00Z",
      summary: { completedWeekDistanceKm: 26.4, phase: "BASE" },
      plan: {
        schemaVersion: "1.0",
        weekType: "BUILD",
        weekObjective:
          "Build a consistent aerobic rhythm. Keep the easy runs comfortable and leave room to recover between sessions.",
        progressionNote: "A steady week of aerobic work.",
        justification: [],
        sessions: [
          {
            day: "MON",
            modality: "RUN",
            type: "EASY",
            title: "Easy aerobic run",
            durationMinutes: 45,
            intensityCategory: "LOW",
            placementReason: "Aerobic base",
            notes:
              "Keep a conversational pace. Let the effort stay easy from start to finish.",
            completed: true,
            completionSource: manual ? "MANUAL" : "SYNCED_ACTIVITY",
            syncedActivity: manual
              ? undefined
              : {
                  activityId: "demo-run",
                  provider: "INTERVALS",
                  activityUrl: "https://intervals.icu/activities/demo-run",
                  durationMinutes: duration,
                  distanceKm: example === "different" ? 5.2 : 8.2,
                },
          },
          {
            day: "TUE",
            modality: "STRENGTH",
            type: "STRENGTH",
            title: "Runner’s strength",
            durationMinutes: 30,
            intensityCategory: "MODERATE",
            placementReason: "Strength",
            completed: true,
            notes: "Controlled movements, with time to recover between sets.",
            strengthFocus: ["Single-leg stability", "Core"],
          },
          {
            day: "WED",
            modality: "RUN",
            type: "TEMPO",
            title: "Controlled tempo",
            durationMinutes: 50,
            intensityCategory: "HIGH",
            placementReason: "Quality",
            role: "KEY",
            completed: true,
            notes: "Stay controlled through the harder efforts.",
            syncedActivity: {
              activityId: "demo-tempo",
              provider: "STRAVA",
              activityUrl: "https://www.strava.com/activities/demo-tempo",
              durationMinutes: 51,
              distanceKm: 10.1,
            },
          },
          {
            day: "THU",
            modality: "REST",
            type: "REST",
            title: "Rest day",
            durationMinutes: 0,
            intensityCategory: "REST",
            placementReason: "Recovery",
            completed: false,
          },
          {
            day: "FRI",
            modality: "RUN",
            type: "EASY",
            title: "Easy recovery run",
            durationMinutes: 40,
            intensityCategory: "LOW",
            placementReason: "Recovery",
            completed: true,
            notes: "Let your legs set the pace.",
            syncedActivity: {
              activityId: "demo-recovery",
              provider: "INTERVALS",
              activityUrl: "https://intervals.icu/activities/demo-recovery",
              durationMinutes: 39,
              distanceKm: 8.1,
            },
          },
          {
            day: "SAT",
            modality: "MOBILITY",
            type: "MOBILITY",
            title: "Mobility & recovery",
            durationMinutes: 20,
            intensityCategory: "LOW",
            placementReason: "Recovery",
            completed: true,
            notes: "Gentle mobility for ankles, hips and calves.",
          },
          {
            day: "SUN",
            modality: "RUN",
            type: "LONG",
            title: "Long easy run",
            durationMinutes: 80,
            intensityCategory: "LOW",
            placementReason: "Endurance",
            completed: false,
            notes: "Keep an easy, sustainable effort.",
          },
        ],
      },
      llmMeta: { provider: "demo", model: "demo", promptVersion: "demo" },
    },
  };
}
