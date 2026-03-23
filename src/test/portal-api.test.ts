import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "@/lib/api";
import { bootstrapPortal, getWeeklyCoachPlan } from "@/lib/portal-api";

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
      },
      nextStep: "prepare_weekly_plan",
    });
  });
});
