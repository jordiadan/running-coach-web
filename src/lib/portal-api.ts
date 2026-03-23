import { ApiError, apiRequest } from "@/lib/api";

export type MeResponse = {
  userId: string;
  athleteId: string;
  email?: string;
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

export async function getMe() {
  const payload = await apiRequest<unknown>("/api/v1/me");
  const record = asRecord(payload);
  const athleteId = asString(record.athleteId);
  const userId = asString(record.userId);

  if (!athleteId || !userId) {
    throw new Error("Missing user access metadata in /api/v1/me");
  }

  return {
    userId,
    athleteId,
    email: asString(record.email),
  } satisfies MeResponse;
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
