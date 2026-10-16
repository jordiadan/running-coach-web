import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
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
const stepDescriptions = {
  connect: "Bring your training history.",
  profile: "Find your weekly rhythm.",
  ready: "Start with a plan for you.",
};

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
  const statusLabel = ready ? "Ready to open" : failed ? "Needs another try" : status === "missing" ? "Waiting for your first plan" : "Preparing your weekly plan…";
  const provider = bootstrap.trainingProvider.activeProvider === "strava" ? "Strava" : bootstrap.trainingProvider.activeProvider === "intervals" ? "Intervals.icu" : "Connected";
  return (
    <div className={`onboarding-plan ${ready ? "is-ready" : ""}`}>
      <div className="onboarding-plan-summary">
        <div className="onboarding-plan-intro">
          {failed ? <CircleAlert aria-hidden="true" size={28} strokeWidth={1.5} /> : <svg className="onboarding-track" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <path d="M10 54V28a18 18 0 0 1 36 0v26M18 54V28a10 10 0 0 1 20 0v26M26 54V28a2 2 0 0 1 4 0v26M54 54V28A26 26 0 0 0 28 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>}
          <h2>{ready ? "Time to make it yours." : failed ? "Your setup is saved." : "Your training comes together here."}</h2>
          <p>{ready ? "See your sessions, explore the details, and know what’s next." : failed ? "Your first plan couldn’t be prepared. Try again to continue from here." : "A personalized week, shaped by your training history, goals and running schedule."}</p>
        </div>
        <dl className="onboarding-receipt">
          <div><dt>Training source</dt><dd>{bootstrap.trainingProvider.connected ? <><Check size={16} aria-hidden="true" />{provider}</> : "Not connected"}</dd></div>
          <div><dt>Athlete profile</dt><dd>{bootstrap.profile.isComplete ? <><Check size={16} aria-hidden="true" />Saved</> : "Incomplete"}</dd></div>
          <div><dt>Weekly plan</dt><dd>{ready ? <><Check size={16} aria-hidden="true" />Ready</> : failed ? "Not ready" : status === "missing" ? "Waiting" : "In preparation"}</dd></div>
        </dl>
      </div>
      <div className="onboarding-plan-status">
        <p role="status" aria-atomic="true" className={failed ? "onboarding-plan-failed" : ""}>
          {ready ? <Check size={18} aria-hidden="true" /> : failed ? <CircleAlert size={18} aria-hidden="true" /> : <RefreshCcw className="portal-spin" size={18} aria-hidden="true" />}
          {statusLabel}
        </p>
        {!ready && <p className="onboarding-plan-help">{failed ? "Your connection and profile don’t need to be set up again." : "This page checks automatically. You can leave and come back to pick up where you left off."}</p>}
        {failed && failureCode && <details className="onboarding-error-details"><summary>Error details</summary><p>{failureCode}</p></details>}
        {retry.isError && <p role="alert" className="portal-inline-error">We couldn’t restart your plan. Try again, or check its status.</p>}
        <div className="onboarding-plan-actions">
          {ready ? onEnterPortal && <Button variant="hero" onClick={onEnterPortal}>Open weekly plan <ArrowRight size={18} aria-hidden="true" /></Button> : <>
            {failed && <Button variant="hero" onClick={() => retry.mutate()} disabled={retry.isPending || isRefreshing}>{retry.isPending ? "Retrying…" : "Retry plan generation"}<RefreshCcw size={16} className={retry.isPending ? "portal-spin" : ""} aria-hidden="true" /></Button>}
            <Button variant="outline" onClick={() => void onRefresh()} disabled={isRefreshing || retry.isPending}>{isRefreshing ? "Checking…" : "Check status"}</Button>
          </>}
        </div>
      </div>
    </div>
  );
}

export default function OnboardingScreen({ bootstrap, onRefresh, onEnterPortal, refreshFailed, profileDraft, onProfileDraftChange, onProfileDirtyChange }: OnboardingScreenProps) {
  const onboarding = deriveOnboardingState(bootstrap);
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
  const description = onboarding.currentStepId === "connect" ? "Connect your training source. Your activity history gives your plan a starting point." : onboarding.currentStepId === "profile" ? "Tell us what you’re training for, and when running fits into your week." : ready ? "Your personalized weekly plan is ready to explore." : failed ? "Your connection and profile are in place. Your plan needs another try." : missing ? "Your setup is saved. Your first plan isn’t available yet. We’ll keep checking here." : "Your setup is complete. We’ll open your plan here as soon as it’s ready.";

  return (
    <div className="onboarding-layout">
      <aside className="onboarding-journey" aria-label="Your setup">
        <p className="onboarding-journey-title">Your training starts here.</p>
        <ol className="onboarding-steps" aria-label="Setup progress">
          {onboarding.steps.map((step, index) => <li key={step.id} aria-current={step.current ? "step" : undefined} className={step.completed ? "is-complete" : ""}>
            <span className="onboarding-step-number" aria-hidden="true">{step.completed ? <Check size={16} /> : index + 1}</span>
            <div><span className="onboarding-step-label">{stepLabels[step.id]}</span><span className="sr-only">{step.completed ? ", complete" : step.current ? ", current step" : ", upcoming"}</span><p>{stepDescriptions[step.id]}</p></div>
          </li>)}
        </ol>
        <p className="onboarding-journey-note">Your history. Your rhythm.<br />A week made for your running.</p>
      </aside>
      <section className="onboarding-task" aria-labelledby="onboarding-title">
        <div className="portal-page-heading">
          <h1 id="onboarding-title" ref={headingRef} tabIndex={-1}>{title}</h1>
          <p>{description}</p>
        </div>
        {(refreshFailed ?? refresh.isError) && <div className="onboarding-refresh-error" role="alert"><p>We couldn’t check your setup. Your last loaded step is still here.</p><button type="button" className="portal-text-action" disabled={refresh.isPending} onClick={() => void refreshSetup()}>{refresh.isPending ? "Checking…" : "Try again"}</button></div>}
        <motion.div key={bootstrap.nextStep} initial={reduceMotion ? false : { opacity: 0.6, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.18 }}>
          {bootstrap.nextStep === "connect_training_source" && <ConnectScreen athleteId={bootstrap.athleteId} trainingProvider={bootstrap.trainingProvider} variant="onboarding" onComplete={refreshSetup} />}
          {bootstrap.nextStep === "complete_profile" && <ProfileScreen athleteId={bootstrap.athleteId} variant="onboarding" onComplete={refreshSetup} onDirtyChange={onProfileDirtyChange} draft={profileDraft} onDraftChange={onProfileDraftChange} />}
          {(bootstrap.nextStep === "prepare_weekly_plan" || ready) && <PlanPreparation bootstrap={bootstrap} onRefresh={refreshSetup} isRefreshing={refresh.isPending} onEnterPortal={onEnterPortal} />}
        </motion.div>
      </section>
    </div>
  );
}
