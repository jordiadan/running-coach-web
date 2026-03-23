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
  nextStep: "connect_intervals" | "complete_profile" | "view_weekly_plan";
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

export async function bootstrapPortal() {
  const payload = await apiRequest<unknown>("/api/v1/me/bootstrap", {
    method: "POST",
  });
  const record = asRecord(payload);
  const user = asRecord(record.user);
  const profile = asRecord(record.profile);
  const intervals = asRecord(record.intervals);
  const athleteId = asString(record.athleteId);
  const userId = asString(user.userId);
  const nextStep = asString(record.nextStep);

  if (
    !athleteId ||
    !userId ||
    (nextStep !== "connect_intervals" &&
      nextStep !== "complete_profile" &&
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
