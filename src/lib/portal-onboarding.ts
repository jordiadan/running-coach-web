import type { PortalBootstrapResponse } from "@/lib/portal-api";

export type OnboardingStepId = "connect" | "profile" | "ready";

export type OnboardingStep = {
  id: OnboardingStepId;
  title: string;
  subtitle: string;
  emoji: string;
  completed: boolean;
  current: boolean;
};

const onboardingCopy: Record<
  OnboardingStepId,
  { title: string; subtitle: string; emoji: string }
> = {
  connect: {
    title: "Connect your data",
    subtitle: "Link a training source so we can understand your fitness",
    emoji: "🔗",
  },
  profile: {
    title: "Set up your profile",
    subtitle: "Tell us about your goals and training preferences",
    emoji: "🏃",
  },
  ready: {
    title: "Preparing your plan",
    subtitle: "We're preparing your personalized weekly plan",
    emoji: "⚡",
  },
};

function currentStepFromNextStep(nextStep: PortalBootstrapResponse["nextStep"]): OnboardingStepId {
  switch (nextStep) {
    case "connect_intervals":
      return "connect";
    case "complete_profile":
      return "profile";
    case "prepare_weekly_plan":
    case "view_weekly_plan":
    default:
      return "ready";
  }
}

export function deriveOnboardingState(bootstrap: PortalBootstrapResponse) {
  const currentStepId = currentStepFromNextStep(bootstrap.nextStep);

  const completed = {
    connect: bootstrap.intervals.connected,
    profile: bootstrap.profile.isComplete,
    ready: bootstrap.weeklyPlan.hasPlan,
  } satisfies Record<OnboardingStepId, boolean>;

  const steps = (["connect", "profile", "ready"] as const).map((id) => {
    if (id !== "ready") {
      return {
        id,
        title: onboardingCopy[id].title,
        subtitle: onboardingCopy[id].subtitle,
        emoji: onboardingCopy[id].emoji,
        completed: completed[id],
        current: currentStepId === id,
      };
    }

    const isReady = bootstrap.nextStep === "view_weekly_plan";

    return {
      id,
      title: isReady ? "Your plan is ready" : onboardingCopy.ready.title,
      subtitle: isReady
        ? "Your personalized weekly plan is ready to open"
        : onboardingCopy.ready.subtitle,
      emoji: onboardingCopy.ready.emoji,
      completed: completed[id],
      current: currentStepId === id,
    };
  }) satisfies OnboardingStep[];

  const completedCount = steps.filter((step) => step.completed).length;

  return {
    currentStepId,
    steps,
    progressPercent: Math.round((completedCount / steps.length) * 100),
  };
}
