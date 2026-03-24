import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles, Zap } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { retryCurrentUserWeeklyPlanGeneration, type PortalBootstrapResponse } from "@/lib/portal-api";
import { deriveOnboardingState } from "@/lib/portal-onboarding";
import ConnectScreen from "@/components/portal/ConnectScreen";
import ProfileScreen from "@/components/portal/ProfileScreen";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type OnboardingScreenProps = {
  bootstrap: PortalBootstrapResponse;
  onRefresh: () => Promise<PortalBootstrapResponse | undefined>;
};

function PreparingPlanStep({
  status,
  failureCode,
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
  if (status === "failed") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6 py-4 text-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shadow-[0_0_0_8px_rgba(220,38,38,0.08)]"
        >
          <Zap className="h-8 w-8" />
        </motion.div>
        <div className="space-y-2">
          <h3 className="font-serif text-xl text-foreground">We hit a problem preparing your plan</h3>
          <p className="text-sm text-muted-foreground">
            Your onboarding is complete, but the first weekly plan needs another try from the backend.
          </p>
          {failureCode ? (
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {failureCode.replaceAll("_", " ")}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={onRetry} className="gap-2" variant="hero" disabled={isRetrying}>
            {isRetrying ? "Retrying…" : "Retry plan generation"}
          </Button>
          <Button onClick={onRefresh} className="gap-2" variant="hero-outline" disabled={isRetrying}>
            Refresh
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    );
  }

  const progressItems = [
    "Syncing your latest training context",
    "Balancing fatigue and recovery",
    "Preparing your next week",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 py-4 text-center"
    >
      <motion.div className="space-y-6">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.04, 1] }}
          transition={{ rotate: { duration: 10, repeat: Infinity, ease: "linear" }, scale: { duration: 2.8, repeat: Infinity, ease: "easeInOut" } }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 shadow-[0_0_0_8px_rgba(122,162,116,0.08)]"
        >
          <Sparkles className="h-8 w-8 text-primary" />
        </motion.div>
        <div>
          <h3 className="mb-2 font-serif text-xl text-foreground">Preparing your weekly plan…</h3>
          <p className="text-sm text-muted-foreground">
            {status === "missing"
              ? "Your onboarding is complete. We're queuing your first weekly plan now."
              : "Your onboarding is complete. We're building the first weekly plan in the coach backend now."}
          </p>
        </div>
        <div className="mx-auto max-w-sm space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Plan preparation</span>
              <span className="font-medium text-foreground">In progress</span>
            </div>
            <div className="relative h-1.5 overflow-hidden rounded-full bg-secondary">
              <motion.div
                animate={{ x: ["-120%", "260%"] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-y-0 w-1/3 rounded-full bg-primary"
              />
            </div>
          </div>

          <div className="space-y-2 rounded-2xl border border-border/60 bg-secondary/30 p-3 text-left">
            {progressItems.map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.08 }}
                className="flex items-center gap-3 text-sm text-muted-foreground"
              >
                <motion.span
                  animate={{ opacity: index === 2 ? [0.45, 1, 0.45] : [0.55, 0.9, 0.55], scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.15 }}
                  className="block h-2 w-2 rounded-full bg-primary"
                />
                <span>{item}</span>
              </motion.div>
            ))}
          </div>

          <p className="text-[11px] text-muted-foreground">
            This page refreshes automatically while the backend prepares your plan.
          </p>
        </div>
      </motion.div>

      <Button onClick={onRefresh} className="gap-2" variant="hero-outline">
        Refresh
        <ArrowRight className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}

export default function OnboardingScreen({
  bootstrap,
  onRefresh,
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
    if (bootstrap.nextStep !== "connect_intervals" || bootstrap.intervals.connected) {
      setOptimisticConnected(false);
    }
  }, [bootstrap.nextStep, bootstrap.intervals.connected]);

  useEffect(() => {
    if (bootstrap.nextStep !== "complete_profile") {
      setOptimisticReady(false);
    }
  }, [bootstrap.nextStep]);

  const effectiveBootstrap = useMemo(() => {
    let nextBootstrap = bootstrap;

    if (optimisticConnected && bootstrap.nextStep === "connect_intervals") {
      nextBootstrap = {
        ...nextBootstrap,
        intervals: {
          ...nextBootstrap.intervals,
          connected: true,
          status: "connected",
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
  const currentStep = onboarding.steps.find((step) => step.current) ?? onboarding.steps[0];

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

    if (next?.nextStep === "connect_intervals" && next.intervals.connected !== true) {
      setOptimisticConnected(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", bounce: 0.4 }}
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
        >
          <Sparkles className="h-4 w-4" />
          Welcome aboard
        </motion.div>
        <h2 className="mb-2 font-serif text-2xl text-foreground sm:text-3xl">
          Let's get you set up
        </h2>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          Just a couple of quick steps and your personalized training plan will be ready.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <div className="relative mb-6">
          <Progress value={onboarding.progressPercent} className="h-1" />
        </div>

        <div className="flex items-center justify-between gap-2">
          {onboarding.steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + index * 0.1 }}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-200 ${
                step.current
                  ? "border-primary/20 bg-primary/10 text-primary"
                  : step.completed
                    ? "border-primary/10 bg-primary/5 text-primary/70"
                    : "border-transparent text-muted-foreground"
              }`}
            >
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] ${
                  step.completed
                    ? "bg-primary text-primary-foreground"
                    : step.current
                      ? "border border-primary/30 bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {step.completed ? <Check className="h-3 w-3" /> : index + 1}
              </div>
              <span className="hidden sm:inline">{step.title}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="rounded-2xl border border-border bg-card p-6 shadow-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="mb-5">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xl">{currentStep.emoji}</span>
            <h3 className="font-serif text-lg text-foreground">{currentStep.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{currentStep.subtitle}</p>
        </div>

        {effectiveBootstrap.nextStep === "connect_intervals" ? (
          <ConnectScreen
            athleteId={effectiveBootstrap.athleteId}
            variant="onboarding"
            onComplete={handleConnectComplete}
          />
        ) : null}
        {effectiveBootstrap.nextStep === "complete_profile" ? (
          <ProfileScreen
            athleteId={effectiveBootstrap.athleteId}
            variant="onboarding"
            onComplete={handleProfileComplete}
          />
        ) : null}
        {effectiveBootstrap.nextStep === "prepare_weekly_plan" ? (
          <PreparingPlanStep
            status={effectiveBootstrap.weeklyPlan.status}
            failureCode={effectiveBootstrap.weeklyPlan.failureCode}
            onRefresh={onRefresh}
            onRetry={() => retryMutation.mutateAsync()}
            isRetrying={retryMutation.isPending}
          />
        ) : null}
        {effectiveBootstrap.nextStep === "view_weekly_plan" ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 py-4 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 20 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 shadow-[0_0_0_10px_rgba(122,162,116,0.08)]"
            >
              <Zap className="h-8 w-8 text-primary" />
            </motion.div>
            <div className="space-y-3">
              <h3 className="mb-2 font-serif text-xl text-foreground">Your plan is ready</h3>
              <p className="text-sm text-muted-foreground">
                Your onboarding is complete and the weekly plan is available in the portal.
              </p>
              <div className="mx-auto max-w-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Ready to open</span>
                  <span className="font-medium text-foreground">100%</span>
                </div>
                <Progress value={100} className="h-1.5" />
              </div>
            </div>
          </motion.div>
        ) : null}
      </motion.div>
    </div>
  );
}
