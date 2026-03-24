import { describe, expect, it } from "vitest";
import { deriveOnboardingState } from "@/lib/portal-onboarding";
import type { PortalBootstrapResponse } from "@/lib/portal-api";

function buildBootstrap(
  overrides: Partial<PortalBootstrapResponse> = {},
): PortalBootstrapResponse {
  return {
    athleteId: "athlete-1",
    user: {
      userId: "user-1",
      displayName: "Jordi",
      email: "runner@example.com",
    },
    profile: {
      isComplete: false,
    },
    intervals: {
      status: "absent",
      connected: false,
    },
    weeklyPlan: {
      targetWeekStartDate: "2026-03-23",
      hasPlan: false,
    },
    nextStep: "connect_intervals",
    ...overrides,
  };
}

describe("deriveOnboardingState", () => {
  it("keeps profile marked complete even when connect is the current step", () => {
    const state = deriveOnboardingState(
      buildBootstrap({
        profile: { isComplete: true },
        nextStep: "connect_intervals",
      }),
    );

    expect(state.currentStepId).toBe("connect");
    expect(state.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "connect", current: true, completed: false }),
        expect.objectContaining({ id: "profile", current: false, completed: true }),
        expect.objectContaining({ id: "ready", current: false, completed: false }),
      ]),
    );
  });

  it("marks connect complete and profile current when backend asks for profile completion", () => {
    const state = deriveOnboardingState(
      buildBootstrap({
        intervals: {
          status: "connected",
          connected: true,
          providerAccountRef: "i372001",
        },
        nextStep: "complete_profile",
      }),
    );

    expect(state.currentStepId).toBe("profile");
    expect(state.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "connect", completed: true }),
        expect.objectContaining({ id: "profile", current: true, completed: false }),
      ]),
    );
  });

  it("uses the ready step when the backend is preparing the weekly plan", () => {
    const state = deriveOnboardingState(
      buildBootstrap({
        intervals: {
          status: "connected",
          connected: true,
          providerAccountRef: "i372001",
        },
        profile: { isComplete: true },
        nextStep: "prepare_weekly_plan",
      }),
    );

    expect(state.currentStepId).toBe("ready");
    expect(state.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "connect", completed: true }),
        expect.objectContaining({ id: "profile", completed: true }),
        expect.objectContaining({
          id: "ready",
          current: true,
          completed: false,
          title: "Preparing your plan",
        }),
      ]),
    );
  });

  it("uses a success title when the weekly plan is ready to view", () => {
    const state = deriveOnboardingState(
      buildBootstrap({
        intervals: {
          status: "connected",
          connected: true,
          providerAccountRef: "i372001",
        },
        profile: { isComplete: true },
        weeklyPlan: {
          targetWeekStartDate: "2026-03-23",
          hasPlan: true,
        },
        nextStep: "view_weekly_plan",
      }),
    );

    expect(state.currentStepId).toBe("ready");
    expect(state.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "ready",
          current: true,
          completed: true,
          title: "Your plan is ready",
          subtitle: "Your personalized weekly plan is ready to open",
        }),
      ]),
    );
  });
});
