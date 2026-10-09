import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Clock, AlertTriangle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import {
  retryCurrentUserWeeklyPlanGeneration,
  type PortalBootstrapResponse,
} from "@/lib/portal-api";
import { deriveOnboardingState } from "@/lib/portal-onboarding";
import ConnectScreen from "@/components/portal/ConnectScreen";
import ProfileScreen from "@/components/portal/ProfileScreen";
import { Button } from "@/components/ui/button";

type OnboardingScreenProps = {
  bootstrap: PortalBootstrapResponse;
  onRefresh: () => Promise<PortalBootstrapResponse | undefined>;
  onEnterPortal?: () => void;
};

function PreparingPlanStep({
  status,
  onRefresh,
  onRetry,
  isRetrying,
}: {
  status: PortalBootstrapResponse["weeklyPlan"]["status"];
  failureCode?: string;
  onRefresh: () => void | Promise<unknown>;
  onRetry: () => void | Promise<unknown>;
  isRetrying: boolean;
}) {
  const failed = status === "failed";
  return (
    <section className="py-3" aria-live="polite">
      <div
        className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${failed ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}
      >
        {failed ? (
          <AlertTriangle className="h-6 w-6" />
        ) : (
          <Clock className="h-6 w-6" />
        )}
      </div>
      <h2 className="section-title">
        {failed ? "Your plan needs another try" : "Putting your week together"}
      </h2>
      <p className="mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
        {failed
          ? "Your training source and profile are saved. We couldn't prepare your first plan. Try again to continue."
          : "Your setup is saved. We're using your training history, goals and schedule to prepare your first weekly plan. This page updates automatically."}
      </p>
      {!failed && (
        <div
          role="status"
          className="mt-6 flex items-center gap-3 border-y border-border py-5 text-sm"
        >
          <span className="h-2 w-2 rounded-full bg-primary" />
          Plan preparation in progress
        </div>
      )}
      <div className="mt-7 flex flex-wrap gap-3">
        {failed && (
          <Button onClick={onRetry} disabled={isRetrying}>
            {isRetrying ? "Retrying…" : "Retry plan generation"}
          </Button>
        )}
        <Button onClick={onRefresh} variant="outline" disabled={isRetrying}>
          Refresh status
        </Button>
      </div>
    </section>
  );
}

export default function OnboardingScreen({
  bootstrap,
  onRefresh,
  onEnterPortal,
}: OnboardingScreenProps) {
  const [optimisticConnected, setOptimisticConnected] = useState(false);
  const [optimisticReady, setOptimisticReady] = useState(false);
  const retryMutation = useMutation({
    mutationFn: retryCurrentUserWeeklyPlanGeneration,
    onSuccess: async () => {
      await onRefresh();
    },
  });

  useEffect(() => {
    if (
      bootstrap.nextStep !== "connect_training_source" ||
      bootstrap.trainingProvider.connected
    ) {
      setOptimisticConnected(false);
    }
  }, [bootstrap.nextStep, bootstrap.trainingProvider.connected]);

  useEffect(() => {
    if (bootstrap.nextStep !== "complete_profile") {
      setOptimisticReady(false);
    }
  }, [bootstrap.nextStep]);

  const effectiveBootstrap = useMemo(() => {
    let nextBootstrap = bootstrap;

    if (
      optimisticConnected &&
      bootstrap.nextStep === "connect_training_source"
    ) {
      nextBootstrap = {
        ...nextBootstrap,
        trainingProvider: {
          ...nextBootstrap.trainingProvider,
          connected: true,
        },
        nextStep: "complete_profile",
      } satisfies PortalBootstrapResponse;
    }

    if (!optimisticReady || nextBootstrap.nextStep !== "complete_profile") {
      return nextBootstrap;
    }

    return {
      ...nextBootstrap,
      profile: {
        ...nextBootstrap.profile,
        isComplete: true,
      },
      nextStep: "prepare_weekly_plan",
    } satisfies PortalBootstrapResponse;
  }, [bootstrap, optimisticConnected, optimisticReady]);

  const onboarding = deriveOnboardingState(effectiveBootstrap);
  const currentStep =
    onboarding.steps.find((step) => step.current) ?? onboarding.steps[0];

  const handleProfileComplete = async () => {
    setOptimisticReady(true);
    const next = await onRefresh();

    if (next?.nextStep === "complete_profile") {
      setOptimisticReady(false);
    }
  };

  const handleConnectComplete = async () => {
    setOptimisticConnected(true);
    const next = await onRefresh();

    if (
      next?.nextStep === "connect_training_source" &&
      next.trainingProvider.connected !== true
    ) {
      setOptimisticConnected(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="page-title">A plan that starts with you.</h1>
      <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground">
        Connect your training, tell us where you're heading, and we'll put your
        first week together.
      </p>
      <ol
        aria-label="Setup progress"
        className="my-8 grid grid-cols-3 gap-2 sm:gap-4"
      >
        {onboarding.steps.map((step, index) => (
          <li
            key={step.id}
            aria-current={step.current ? "step" : undefined}
            className={`flex items-center gap-2 border-b-2 pb-4 text-xs font-semibold sm:text-sm ${step.current || step.completed ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${step.completed ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
            >
              {step.completed ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            {step.id === "connect"
              ? "Connect"
              : step.id === "profile"
                ? "Profile"
                : "Your plan"}
          </li>
        ))}
      </ol>
      <section
        className={
          effectiveBootstrap.nextStep === "complete_profile" ||
          effectiveBootstrap.nextStep === "connect_training_source"
            ? ""
            : "surface p-5 sm:p-8"
        }
      >
        {effectiveBootstrap.nextStep !== "prepare_weekly_plan" && (
          <div className="mb-7">
            <h2 className="font-display text-3xl">{currentStep.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {currentStep.subtitle}
            </p>
          </div>
        )}
        {effectiveBootstrap.nextStep === "connect_training_source" && (
          <ConnectScreen
            athleteId={effectiveBootstrap.athleteId}
            trainingProvider={effectiveBootstrap.trainingProvider}
            variant="onboarding"
            onComplete={handleConnectComplete}
          />
        )}
        {effectiveBootstrap.nextStep === "complete_profile" && (
          <ProfileScreen
            athleteId={effectiveBootstrap.athleteId}
            variant="onboarding"
            onComplete={handleProfileComplete}
          />
        )}
        {effectiveBootstrap.nextStep === "prepare_weekly_plan" && (
          <PreparingPlanStep
            status={effectiveBootstrap.weeklyPlan.status}
            onRefresh={onRefresh}
            onRetry={() => retryMutation.mutate()}
            isRetrying={retryMutation.isPending}
          />
        )}
        {retryMutation.isError && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            We couldn't restart your plan. Please try again.
          </p>
        )}
        {effectiveBootstrap.nextStep === "view_weekly_plan" && (
          <div className="space-y-5 py-4">
            <Check className="h-10 w-10 text-accent" />
            <p className="text-sm leading-7 text-muted-foreground">
              Your training week is ready. Start with today's session or explore
              what's ahead.
            </p>
            {onEnterPortal && (
              <Button onClick={onEnterPortal}>
                Open weekly plan
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
