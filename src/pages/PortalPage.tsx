import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Calendar, User, Link2, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import ConnectScreen from "@/components/portal/ConnectScreen";
import OnboardingScreen from "@/components/portal/OnboardingScreen";
import ProfileScreen, { type ProfileDraft } from "@/components/portal/ProfileScreen";
import WeeklyPlanScreen from "@/components/portal/WeeklyPlanScreen";
import "@/components/portal/portal.css";
import { Button } from "@/components/ui/button";
import { bootstrapPortal } from "@/lib/portal-api";
import { supabase } from "@/integrations/supabase/client";

type Tab = "plan" | "connect" | "profile";
type ProfileFocusTarget = "race-goal" | null;

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "plan", label: "Weekly Plan", icon: Calendar },
  { id: "connect", label: "Connect", icon: Link2 },
  { id: "profile", label: "Profile", icon: User },
];

export default function PortalPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("view");
  const activeTab: Tab = requestedTab === "profile" || requestedTab === "connect" ? requestedTab : "plan";
  const setActiveTab = useCallback((tab: Tab) => {
    setSearchParams(previous => { const next = new URLSearchParams(previous); next.set("view", tab); return next; });
  }, [setSearchParams]);
  const [profileDirty, setProfileDirty] = useState(false);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft | null>(null);
  const hasUnsavedProfile = profileDirty || profileDraft !== null;
  const [pendingNavigation, setPendingNavigation] = useState<Tab | "home" | "logout" | null>(null);
  const [profileFocusTarget, setProfileFocusTarget] = useState<ProfileFocusTarget>(null);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [showReadyTransition, setShowReadyTransition] = useState(false);
  const previousNextStepRef = useRef<string | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setHasSession(Boolean(data.session));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(Boolean(session));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const bootstrapQuery = useQuery({
    queryKey: ["portal", "bootstrap"],
    queryFn: bootstrapPortal,
    enabled: hasSession === true,
    retry: false,
    refetchInterval: (query) =>
      query.state.data?.nextStep === "prepare_weekly_plan" ? 5000 : false,
  });
  const athleteId = bootstrapQuery.data?.athleteId;
  const nextStep = bootstrapQuery.data?.nextStep;
  const isPortalReady = nextStep === "view_weekly_plan" && !showReadyTransition;

  useEffect(() => {
    if (!nextStep) return;

    const previousNextStep = previousNextStepRef.current;
    previousNextStepRef.current = nextStep;

    if (
      previousNextStep !== null &&
      previousNextStep !== "view_weekly_plan" &&
      nextStep === "view_weekly_plan"
    ) {
      setShowReadyTransition(true);
    }

  }, [nextStep]);

  useEffect(() => {
    if (!hasUnsavedProfile) return;
    const preventDraftLoss = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", preventDraftLoss);
    return () => window.removeEventListener("beforeunload", preventDraftLoss);
  }, [hasUnsavedProfile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const confirmNavigation = () => {
    const destination = pendingNavigation;
    setPendingNavigation(null);
    setProfileDirty(false);
    setProfileDraft(null);
    if (destination === "home") navigate("/");
    else if (destination === "logout") void handleLogout();
    else if (destination) { setActiveTab(destination); window.scrollTo({ top: 0, behavior: "instant" }); }
  };

  const guardNavigation = (event: React.MouseEvent<HTMLAnchorElement>, destination: Tab | "home") => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (hasUnsavedProfile && (destination === "home" || (destination !== activeTab && destination !== "profile"))) {
      event.preventDefault();
      setPendingNavigation(destination);
      return;
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const handleSetNextGoal = useCallback(() => {
    setActiveTab("profile");
    setProfileFocusTarget("race-goal");
  }, [setActiveTab]);

  const handleProfileFocusTargetHandled = useCallback(() => {
    setProfileFocusTarget(null);
  }, []);

  if (hasSession === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="rounded-2xl border border-divider bg-card px-6 py-5 shadow-card">
          <p className="text-sm text-muted-foreground">Checking your session…</p>
        </div>
      </div>
    );
  }

  if (hasSession === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-divider bg-card p-6 shadow-card">
          <h1 className="font-serif text-2xl text-foreground">You need to sign in first</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Continue with Google and we'll reopen the portal from there.
          </p>
          <Button className="mt-6" variant="hero" onClick={() => navigate("/login", { replace: true })}>
            Back to login
          </Button>
        </div>
      </div>
    );
  }

  if (bootstrapQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="rounded-2xl border border-divider bg-card px-6 py-5 shadow-card">
          <p className="text-sm text-muted-foreground">Loading your portal…</p>
        </div>
      </div>
    );
  }

  if (bootstrapQuery.isError || !athleteId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-divider bg-card p-6 shadow-card">
          <h1 className="font-serif text-2xl text-foreground">We couldn't open your portal</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Sign in again and we'll retry your portal bootstrap. If the problem persists, the account may still be provisioning in the backend.
          </p>
          <Button className="mt-6" variant="hero" onClick={handleLogout}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-app min-h-screen bg-background">
      <a href="#portal-content" className="portal-skip">Skip to content</a>
      <header className="portal-header">
        <div className="portal-header-inner">
          <Link to="/" className="portal-brand" aria-label="Running Coach home" onClick={event => guardNavigation(event, "home")}>
            <svg className="portal-brand-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M7 25V14a7 7 0 0 1 14 0v11M12 25V14a2 2 0 0 1 4 0v11M26 25V14A12 12 0 0 0 14 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>Running Coach</span>
          </Link>
          {isPortalReady && (
            <nav className="portal-navigation" aria-label="Main navigation">
              {tabs.map((tab) => {
                const destination = new URLSearchParams(searchParams);
                destination.set("view", tab.id);
                return <Link
                  key={tab.id}
                  to={{ search: destination.toString() }}
                  onClick={event => guardNavigation(event, tab.id)}
                  aria-current={activeTab === tab.id ? "page" : undefined}
                  aria-controls="portal-content"
                  className="portal-nav-item"
                >
                  <tab.icon aria-hidden="true" strokeWidth={1.75} />
                  <span>{tab.label}</span>
                </Link>;
              })}
            </nav>
          )}
          <div className="portal-account-actions">
            <ThemeSwitcher />
            <button type="button" onClick={() => hasUnsavedProfile ? setPendingNavigation("logout") : void handleLogout()} className="portal-logout">
              <LogOut aria-hidden="true" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      <main id="portal-content" tabIndex={-1} className={`portal-content ${isPortalReady ? "" : "portal-content-onboarding"}`}>
        <AnimatePresence mode="wait">
          {nextStep === "view_weekly_plan" && !showReadyTransition ? (
            <motion.div
              key="portal-shell"
              initial={reduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: reduceMotion ? 0 : 0.16 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: reduceMotion ? 0 : 0.16 }}
                >
                  {activeTab === "plan" && (
                    <WeeklyPlanScreen
                      athleteId={athleteId}
                      targetWeekStartDate={bootstrapQuery.data.weeklyPlan.targetWeekStartDate}
                      isPreparing={false}
                      onRefresh={() => bootstrapQuery.refetch()}
                      onSetNextGoal={handleSetNextGoal}
                    />
                  )}
                  {activeTab === "connect" && (
                    <ConnectScreen
                      athleteId={athleteId}
                      trainingProvider={bootstrapQuery.data.trainingProvider}
                    />
                  )}
                  {activeTab === "profile" && (
                    <ProfileScreen
                      athleteId={athleteId}
                      focusTarget={profileFocusTarget}
                      onFocusTargetHandled={handleProfileFocusTargetHandled}
                      onDirtyChange={setProfileDirty}
                      draft={profileDraft}
                      onDraftChange={setProfileDraft}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="onboarding-shell"
              initial={reduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: reduceMotion ? 0 : 0.16 }}
            >
              <OnboardingScreen
                bootstrap={bootstrapQuery.data}
                onRefresh={async () => (await bootstrapQuery.refetch()).data}
                onEnterPortal={() => { setActiveTab("plan"); setShowReadyTransition(false); }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <AlertDialog open={pendingNavigation !== null} onOpenChange={open => { if (!open) setPendingNavigation(null); }}>
        <AlertDialogContent className="portal-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
            <AlertDialogDescription>Your profile has unsaved changes. Stay here to save them, or discard them and continue.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction className="portal-dialog-confirm" onClick={confirmNavigation}>Discard changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
