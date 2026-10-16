import { useEffect, useId, useRef, type ReactNode } from "react";
import { LayoutGroup, MotionConfig, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, CircleAlert, RefreshCcw } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { retryCurrentUserWeeklyPlanGeneration, type PortalBootstrapResponse } from "@/lib/portal-api";
import { deriveOnboardingState } from "@/lib/portal-onboarding";
import ConnectScreen from "@/components/portal/ConnectScreen";
import ProfileScreen, { type ProfileDraft } from "@/components/portal/ProfileScreen";
import { Button } from "@/components/ui/button";
import "./onboarding.css";

type OnboardingScreenProps = {
  bootstrap: PortalBootstrapResponse;
  onRefresh: () => Promise<PortalBootstrapResponse | undefined>;
  onEnterPortal?: () => void;
  refreshFailed?: boolean;
  profileDraft?: ProfileDraft | null;
  onProfileDraftChange?: (draft: ProfileDraft | null) => void;
  onProfileDirtyChange?: (dirty: boolean) => void;
};

const stepLabels = { connect: "Connect", profile: "Your profile", ready: "First plan" };
const stepSpring = { type: "spring", stiffness: 380, damping: 36 } as const;

// Backend progression replaces controls immediately; motion never gates the next task.
function StepContent({ children }: { children: ReactNode; }) {
  const reduceMotion = useReducedMotion();
  return <motion.div
    style={{ opacity: 1 }}
    initial={reduceMotion ? false : { x: 20, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={{ ...stepSpring, opacity: { type: "tween", duration: reduceMotion ? 0 : 0.2 } }}
  >{children}</motion.div>;
}

function PlanMark({ ready, failed }: { ready: boolean; failed: boolean; }) {
  const reduceMotion = useReducedMotion();
  return <div className={`onboarding-plan-mark ${ready ? "is-ready" : ""}`} aria-hidden="true">
    <motion.svg viewBox="0 0 64 64" fill="none" animate={{ scale: ready ? 0.92 : 1 }} transition={stepSpring}>
      <motion.g initial={{ opacity: ready || failed ? 0 : 1 }} animate={{ opacity: ready || failed ? 0 : 1 }} transition={{ type: "tween", duration: reduceMotion ? 0 : 0.18 }}>
        <path d="M10 54V28a18 18 0 0 1 36 0v26M18 54V28a10 10 0 0 1 20 0v26M26 54V28a2 2 0 0 1 4 0v26M54 54V28A26 26 0 0 0 28 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </motion.g>
      {ready && <motion.path d="m17 33 10 10 22-24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" initial={reduceMotion ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduceMotion ? 0 : 0.32, delay: reduceMotion ? 0 : 0.08 }} />}
    </motion.svg>
    {failed && <CircleAlert size={36} strokeWidth={1.5} />}
  </div>;
}

function PlanPreparation({ bootstrap, onRefresh, isRefreshing, onEnterPortal }: {
  bootstrap: PortalBootstrapResponse;
  onRefresh: () => Promise<unknown>;
  isRefreshing: boolean;
  onEnterPortal?: () => void;
}) {
  const retry = useMutation({
    mutationFn: retryCurrentUserWeeklyPlanGeneration,
    onSuccess: async () => { await onRefresh(); },
  });
  const { status, failureCode } = bootstrap.weeklyPlan;
  const ready = bootstrap.nextStep === "view_weekly_plan";
  const failed = status === "failed" && !ready;
  const { reset: resetRetry } = retry;
  useEffect(() => { resetRetry(); }, [status, ready, resetRetry]);
  const statusLabel = ready ? "Ready to open" : failed ? "Needs another try" : status === "missing" ? "Waiting for your first plan" : "Preparing your weekly plan…";
  const provider = bootstrap.trainingProvider.activeProvider === "strava" ? "Strava" : bootstrap.trainingProvider.activeProvider === "intervals" ? "Intervals.icu" : "Connected";
  return (
    <div className={`onboarding-plan ${ready ? "is-ready" : ""}`}>
      <p role="status" aria-atomic="true" className="sr-only">{statusLabel}</p>
      <p className="onboarding-plan-help">{ready ? "See your sessions and find your next run." : failed ? "Your setup is saved. Try preparing your plan again." : status === "missing" ? "Your first plan isn’t available yet. We’ll keep checking automatically." : "We’ll check automatically. You can leave and come back anytime."}</p>
      {failed && failureCode && <details className="onboarding-error-details"><summary>Error details</summary><p>{failureCode}</p></details>}
      {retry.isError && <p role="alert" className="portal-inline-error">We couldn’t restart your plan. Try again, or check its status.</p>}
      <div className="onboarding-plan-actions">
        {ready ? onEnterPortal && <Button variant="hero" onClick={onEnterPortal}>Open weekly plan <ArrowRight size={18} aria-hidden="true" /></Button> : <>
          {failed && <Button variant="hero" onClick={() => retry.mutate()} disabled={retry.isPending || isRefreshing}>{retry.isPending ? "Retrying…" : "Retry plan generation"}<RefreshCcw size={16} className={retry.isPending ? "portal-spin" : ""} aria-hidden="true" /></Button>}
          <Button variant="ghost" onClick={() => void onRefresh()} disabled={isRefreshing || retry.isPending}><RefreshCcw size={16} className={isRefreshing ? "portal-spin" : ""} aria-hidden="true" />{isRefreshing ? "Checking…" : "Check status"}</Button>
        </>}
      </div>
      <details className="onboarding-setup-details">
        <summary>View your setup</summary>
        <dl className="onboarding-receipt">
          <div><dt>Training source</dt><dd>{bootstrap.trainingProvider.connected ? <><Check size={16} aria-hidden="true" />{provider}</> : "Not connected"}</dd></div>
          <div><dt>Athlete profile</dt><dd>{bootstrap.profile.isComplete ? <><Check size={16} aria-hidden="true" />Saved</> : "Incomplete"}</dd></div>
        </dl>
      </details>
    </div>
  );
}

export default function OnboardingScreen({ bootstrap, onRefresh, onEnterPortal, refreshFailed, profileDraft, onProfileDraftChange, onProfileDirtyChange }: OnboardingScreenProps) {
  const onboarding = deriveOnboardingState(bootstrap);
  const journeyId = useId();
  const reduceMotion = useReducedMotion();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(bootstrap.nextStep);
  const refresh = useMutation({ mutationFn: onRefresh });
  // Refresh errors belong to the journey, not the child component's save/connect operation.
  const refreshSetup = async () => {
    try { return await refresh.mutateAsync(); } catch { return undefined; }
  };
  useEffect(() => {
    if (previousStep.current !== bootstrap.nextStep) {
      previousStep.current = bootstrap.nextStep;
      headingRef.current?.focus();
      headingRef.current?.scrollIntoView?.({ block: "start", behavior: "instant" });
    }
  }, [bootstrap.nextStep]);
  const ready = bootstrap.nextStep === "view_weekly_plan";
  const failed = bootstrap.nextStep === "prepare_weekly_plan" && bootstrap.weeklyPlan.status === "failed";
  const missing = bootstrap.nextStep === "prepare_weekly_plan" && bootstrap.weeklyPlan.status === "missing";
  const title = onboarding.currentStepId === "connect" ? "Every plan starts with you." : onboarding.currentStepId === "profile" ? "Find your running rhythm." : ready ? "Your first week is ready." : failed ? "Let’s get your plan ready." : missing ? "Waiting for your first week." : "Preparing your first week.";
  const description = onboarding.currentStepId === "connect" ? "Choose where you record your runs." : onboarding.currentStepId === "profile" ? "Your goal and the days you can run." : undefined;

  return (
    <MotionConfig reducedMotion={reduceMotion ? "always" : "never"} transition={reduceMotion ? { duration: 0 } : stepSpring}>
      <LayoutGroup id={journeyId}>
        <div className={`onboarding-layout ${onboarding.currentStepId === "ready" ? "onboarding-plan-layout" : ""}`}>
          <nav className="onboarding-journey" aria-label="Your setup">
            <ol className="onboarding-steps" aria-label="Setup progress">
              {onboarding.steps.map((step, index) => <li key={step.id} aria-current={step.current ? "step" : undefined} className={step.completed ? "is-complete" : ""}>
                <span className="onboarding-step-number" aria-hidden="true">{step.completed ? <motion.span initial={reduceMotion ? false : { scale: 0.7 }} animate={{ scale: 1 }}><Check size={14} /></motion.span> : index + 1}</span>
                <span className="onboarding-step-label">{stepLabels[step.id]}</span>
                <span className="sr-only">{step.completed ? ", complete" : step.current ? ", current step" : ", upcoming"}</span>
                {step.current && <motion.span className="onboarding-step-position" layoutId="setup-position" transition={stepSpring} />}
              </li>)}
            </ol>
          </nav>
          <section className="onboarding-task" aria-labelledby="onboarding-title">
            <div className="portal-page-heading">
              {onboarding.currentStepId === "ready" && <PlanMark ready={ready} failed={failed} />}
              <motion.h1 layout={reduceMotion ? false : "position"} transition={stepSpring} id="onboarding-title" ref={headingRef} tabIndex={-1}>{title}</motion.h1>
              {description && <p>{description}</p>}
            </div>
            {(refreshFailed ?? refresh.isError) && <div className="onboarding-refresh-error" role="alert"><p>We couldn’t check your setup. Your last loaded step is still here.</p><button type="button" className="portal-text-action" disabled={refresh.isPending} onClick={() => void refreshSetup()}>{refresh.isPending ? "Checking…" : "Try again"}</button></div>}
            <StepContent key={onboarding.currentStepId}>
              {bootstrap.nextStep === "connect_training_source" && <ConnectScreen athleteId={bootstrap.athleteId} trainingProvider={bootstrap.trainingProvider} variant="onboarding" onComplete={refreshSetup} />}
              {bootstrap.nextStep === "complete_profile" && <ProfileScreen athleteId={bootstrap.athleteId} variant="onboarding" onComplete={refreshSetup} onDirtyChange={onProfileDirtyChange} draft={profileDraft} onDraftChange={onProfileDraftChange} />}
              {(bootstrap.nextStep === "prepare_weekly_plan" || ready) && <PlanPreparation bootstrap={bootstrap} onRefresh={refreshSetup} isRefreshing={refresh.isPending} onEnterPortal={onEnterPortal} />}
            </StepContent>
          </section>
        </div>
      </LayoutGroup>
    </MotionConfig>
  );
}
