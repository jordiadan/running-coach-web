import { ApiError, apiRequest } from "@/lib/api";

export type PortalBootstrapResponse = {
  athleteId: string;
  user: {
    userId: string;
    displayName: string;
    email?: string;
  };
  profile: {
    isComplete: boolean;
  };
  intervals: {
    status: string;
    connected: boolean;
    providerAccountRef?: string;
  };
  weeklyPlan: {
    targetWeekStartDate: string;
    hasPlan: boolean;
  };
  nextStep: "connect_intervals" | "complete_profile" | "prepare_weekly_plan" | "view_weekly_plan";
};

export type IntervalsIntegrationStatus = {
  connected: boolean;
  status: string;
  providerAccountRef?: string;
  authorizationStateExpiresAt?: string;
};

export type AthleteProfile = {
  athleteId: string;
  displayName: string;
  trainingGoal: string;
  preferredTrainingDays: string[];
  goalRaceEventName: string;
  goalRaceEventDate: string;
  goalRaceEventDistanceKm: number | "";
};

export type AthleteProfileUpdate = Omit<AthleteProfile, "athleteId">;

export type WeeklyCoachSession = {
  day: string;
  modality: string;
  type: string;
  title: string;
  durationMinutes: number;
  intensityCategory: string;
  placementReason: string;
  notes?: string;
  strengthFocus?: string[] | null;
};

export type WeeklyCoachPlan = {
  athleteId: string;
  weekStartDate: string;
  planId: string;
  createdAt: string;
  updatedAt: string;
  plan: {
    schemaVersion: string;
    weekType: string;
    weekObjective: string;
    progressionNote: string;
    sessions: WeeklyCoachSession[];
    justification: string[];
  };
  llmMeta: {
    provider: string;
    model: string;
    promptVersion: string;
  };
};

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return typeof value === "object" && value !== null ? (value as UnknownRecord) : {};
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumberOrBlank(value: unknown): number | "" {
  return typeof value === "number" && Number.isFinite(value) ? value : "";
}

function getApiErrorCode(error: unknown): string | undefined {
  if (!(error instanceof ApiError)) return undefined;

  const payload = asRecord(error.payload);
  return asString(payload.code) || asString(payload.errorCode) || undefined;
}

export function isWeeklyCoachPlanNotFoundError(error: unknown) {
  return (
    error instanceof ApiError &&
    error.status === 404 &&
    getApiErrorCode(error) === "WEEKLY_COACH_PLAN_NOT_FOUND"
  );
}

export async function bootstrapPortal() {
  const payload = await apiRequest<unknown>("/api/v1/me/bootstrap", {
    method: "POST",
  });
  const record = asRecord(payload);
  const user = asRecord(record.user);
  const profile = asRecord(record.profile);
  const intervals = asRecord(record.intervals);
  const weeklyPlan = asRecord(record.weeklyPlan);
  const athleteId = asString(record.athleteId);
  const userId = asString(user.userId);
  const nextStep = asString(record.nextStep);
  const targetWeekStartDate = asString(weeklyPlan.targetWeekStartDate);

  if (
    !athleteId ||
    !userId ||
    !targetWeekStartDate ||
    (nextStep !== "connect_intervals" &&
      nextStep !== "complete_profile" &&
      nextStep !== "prepare_weekly_plan" &&
      nextStep !== "view_weekly_plan")
  ) {
    throw new Error("Missing bootstrap metadata in /api/v1/me/bootstrap");
  }

  return {
    athleteId,
    user: {
      userId,
      displayName: asString(user.displayName),
      email: asString(user.email) || undefined,
    },
    profile: {
      isComplete: Boolean(profile.isComplete),
    },
    intervals: {
      status: asString(intervals.status),
      connected: Boolean(intervals.connected),
      providerAccountRef: asString(intervals.providerAccountRef) || undefined,
    },
    weeklyPlan: {
      targetWeekStartDate,
      hasPlan: Boolean(weeklyPlan.hasPlan),
    },
    nextStep,
  } satisfies PortalBootstrapResponse;
}

export async function getIntervalsIntegrationStatus(athleteId: string) {
  const payload = await apiRequest<unknown>(`/api/v1/integrations/intervals/${athleteId}`);
  const record = asRecord(payload);
  const status = asString(record.status);

  return {
    connected: status.toUpperCase() === "CONNECTED",
    status,
    providerAccountRef: asString(record.providerAccountRef) || undefined,
    authorizationStateExpiresAt: asString(record.authorizationStateExpiresAt) || undefined,
  } satisfies IntervalsIntegrationStatus;
}

export async function connectIntervals(athleteId: string) {
  const payload = await apiRequest<unknown>(`/api/v1/integrations/intervals/${athleteId}/connect`, {
    method: "POST",
  });
  const record = asRecord(payload);

  return {
    redirectUrl:
      asString(record.redirectUrl) || asString(record.authorizationUrl) || asString(record.url) || undefined,
  };
}

export async function disconnectIntervals(athleteId: string) {
  await apiRequest<void>(`/api/v1/integrations/intervals/${athleteId}`, {
    method: "DELETE",
  });
}

export async function getAthleteProfile(athleteId: string) {
  let payload: unknown;

  try {
    payload = await apiRequest<unknown>(`/api/v1/athletes/${athleteId}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return undefined;
    }

    throw error;
  }

  const record = asRecord(payload);
  const preparation = asRecord(record.preparation);
  const primaryGoal = asRecord(preparation.primaryGoal);

  return {
    athleteId,
    displayName: asString(record.displayName),
    trainingGoal: asString(record.trainingGoal),
    preferredTrainingDays: asStringArray(record.preferredTrainingDays),
    goalRaceEventName: asString(primaryGoal.name),
    goalRaceEventDate: asString(primaryGoal.eventDate),
    goalRaceEventDistanceKm: asNumberOrBlank(primaryGoal.distanceKm),
  } satisfies AthleteProfile;
}

export async function updateAthleteProfile(athleteId: string, input: AthleteProfileUpdate) {
  return apiRequest<unknown>(`/api/v1/athletes/${athleteId}`, {
    method: "PUT",
    body: {
      displayName: input.displayName,
      trainingGoal: input.trainingGoal,
      preferredTrainingDays: input.preferredTrainingDays,
      preparation: {
        primaryGoal: {
          name: input.goalRaceEventName,
          eventDate: input.goalRaceEventDate,
          distanceKm: input.goalRaceEventDistanceKm === "" ? 0 : input.goalRaceEventDistanceKm,
        },
        secondaryGoals: [],
      },
    },
  });
}

export async function getWeeklyCoachPlan(athleteId: string, weekStartDate: string) {
  let payload: unknown;

  try {
    payload = await apiRequest<unknown>(`/api/v1/weekly-coach/plans/${athleteId}/${weekStartDate}`);
  } catch (error) {
    if (isWeeklyCoachPlanNotFoundError(error)) {
      return undefined;
    }

    throw error;
  }

  const record = asRecord(payload);
  const plan = asRecord(record.plan);
  const llmMeta = asRecord(record.llmMeta);
  const sessions = Array.isArray(plan.sessions) ? plan.sessions.map((item) => asRecord(item)) : [];
  const justification = Array.isArray(plan.justification)
    ? plan.justification.filter((item): item is string => typeof item === "string")
    : [];

  return {
    athleteId: asString(record.athleteId),
    weekStartDate: asString(record.weekStartDate),
    planId: asString(record.planId),
    createdAt: asString(record.createdAt),
    updatedAt: asString(record.updatedAt),
    plan: {
      schemaVersion: asString(plan.schemaVersion),
      weekType: asString(plan.weekType),
      weekObjective: asString(plan.weekObjective),
      progressionNote: asString(plan.progressionNote),
      sessions: sessions.map((session) => ({
        day: asString(session.day),
        modality: asString(session.modality),
        type: asString(session.type),
        title: asString(session.title),
        durationMinutes: typeof session.durationMinutes === "number" ? session.durationMinutes : 0,
        intensityCategory: asString(session.intensityCategory),
        placementReason: asString(session.placementReason),
        notes: asString(session.notes) || undefined,
        strengthFocus: Array.isArray(session.strengthFocus)
          ? session.strengthFocus.filter((item): item is string => typeof item === "string")
          : undefined,
      })),
      justification,
    },
    llmMeta: {
      provider: asString(llmMeta.provider),
      model: asString(llmMeta.model),
      promptVersion: asString(llmMeta.promptVersion),
    },
  } satisfies WeeklyCoachPlan;
}

export function isProfileComplete(profile: AthleteProfile | undefined) {
  if (!profile) return false;

  return Boolean(
    profile.displayName &&
      profile.trainingGoal &&
      profile.preferredTrainingDays.length >= 4 &&
      profile.goalRaceEventName &&
      profile.goalRaceEventDate &&
      profile.goalRaceEventDistanceKm !== "",
  );
}
