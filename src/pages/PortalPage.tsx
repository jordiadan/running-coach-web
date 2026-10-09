import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, User, Link2, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Brand from "@/components/Brand";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import ConnectScreen from "@/components/portal/ConnectScreen";
import OnboardingScreen from "@/components/portal/OnboardingScreen";
import ProfileScreen from "@/components/portal/ProfileScreen";
import WeeklyPlanScreen from "@/components/portal/WeeklyPlanScreen";
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
  const [activeTab, setActiveTab] = useState<Tab>("plan");
  const [profileFocusTarget, setProfileFocusTarget] =
    useState<ProfileFocusTarget>(null);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [showReadyTransition, setShowReadyTransition] = useState(false);
  const previousNextStepRef = useRef<string | null>(null);

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

  useEffect(() => {
    if (!bootstrapQuery.data) return;

    const previousNextStep = previousNextStepRef.current;
    previousNextStepRef.current = bootstrapQuery.data.nextStep;

    if (
      previousNextStep !== null &&
      previousNextStep !== "view_weekly_plan" &&
      bootstrapQuery.data.nextStep === "view_weekly_plan"
    ) {
      setShowReadyTransition(true);
    }

    switch (bootstrapQuery.data.nextStep) {
      case "connect_training_source":
        setActiveTab("connect");
        break;
      case "complete_profile":
        setActiveTab("profile");
        break;
      case "prepare_weekly_plan":
      case "view_weekly_plan":
      default:
        setActiveTab("plan");
        break;
    }
  }, [bootstrapQuery.data]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const handleSetNextGoal = useCallback(() => {
    setActiveTab("profile");
    setProfileFocusTarget("race-goal");
  }, []);

  const handleProfileFocusTargetHandled = useCallback(() => {
    setProfileFocusTarget(null);
  }, []);

  if (hasSession === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="rounded-2xl border border-divider bg-card px-6 py-5 shadow-card">
          <p className="text-sm text-muted-foreground">
            Checking your session…
          </p>
        </div>
      </div>
    );
  }

  if (hasSession === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-divider bg-card p-6 shadow-card">
          <h1 className="font-display text-2xl text-foreground">
            You need to sign in first
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Continue with Google and we'll reopen the portal from there.
          </p>
          <Button
            className="mt-6"
            variant="hero"
            onClick={() => navigate("/login", { replace: true })}
          >
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
          <h1 className="font-display text-2xl text-foreground">
            We couldn't open your portal
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Your account could not be loaded. Try again, or sign in again if the
            problem continues.
          </p>
          <Button
            className="mt-6 mr-3"
            onClick={() => bootstrapQuery.refetch()}
          >
            Try again
          </Button>
          <Button className="mt-6" variant="outline" onClick={handleLogout}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  const isReady =
    bootstrapQuery.data.nextStep === "view_weekly_plan" && !showReadyTransition;
  const navItems = (mobile = false) =>
    tabs.map((tab) => (
      <button
        key={tab.id}
        type="button"
        aria-current={activeTab === tab.id ? "page" : undefined}
        onClick={() => {
          setActiveTab(tab.id);
          window.scrollTo({ top: 0, behavior: "instant" });
        }}
        className={
          mobile
            ? `flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold ${activeTab === tab.id ? "text-primary bg-primary/5" : "text-muted-foreground"}`
            : `portal-nav-item w-full ${activeTab === tab.id ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"}`
        }
      >
        <tab.icon className="h-5 w-5" aria-hidden="true" />
        {tab.label}
      </button>
    ));

  return (
    <div className={isReady ? "portal-layout" : "min-h-screen bg-background"}>
      <a href="#portal-main" className="skip-link">
        Skip to content
      </a>
      {isReady && (
        <aside className="portal-rail">
          <Brand inverse />
          <nav aria-label="Main navigation" className="mt-14 space-y-2">
            {navItems()}
          </nav>
          <div className="mt-auto space-y-5 border-t border-sidebar-border pt-6">
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent text-sm font-semibold"
                aria-hidden="true"
              >
                {bootstrapQuery.data.user.displayName?.slice(0, 1) || "R"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {bootstrapQuery.data.user.displayName || "Runner"}
                </p>
                <p className="mt-1 text-xs text-sidebar-foreground/75">
                  Your training space
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={handleLogout}
                className="flex min-h-11 items-center gap-2 text-sm hover:underline"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Log out
              </button>
              <ThemeSwitcher />
            </div>
            <Link
              to="/privacy"
              className="inline-flex min-h-11 items-center text-xs text-sidebar-foreground/75 hover:underline"
            >
              Privacy
            </Link>
          </div>
        </aside>
      )}
      <header
        className={`border-b border-border bg-card ${isReady ? "lg:hidden" : ""}`}
      >
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-8">
          <Brand />
          <div className="flex items-center gap-1">
            <ThemeSwitcher />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main
        id="portal-main"
        tabIndex={-1}
        className={
          isReady
            ? "portal-content"
            : "mx-auto max-w-4xl px-4 py-10 sm:px-8 sm:py-16"
        }
      >
        {isReady ? (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.7 }}
              transition={{ duration: 0.12 }}
            >
              {activeTab === "plan" && (
                <WeeklyPlanScreen
                  athleteId={athleteId}
                  targetWeekStartDate={
                    bootstrapQuery.data.weeklyPlan.targetWeekStartDate
                  }
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
                />
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          <OnboardingScreen
            bootstrap={bootstrapQuery.data}
            onRefresh={async () => (await bootstrapQuery.refetch()).data}
            onEnterPortal={() => setShowReadyTransition(false)}
          />
        )}
      </main>
      {isReady && (
        <nav aria-label="Mobile navigation" className="portal-mobile-nav">
          {navItems(true)}
        </nav>
      )}
    </div>
  );
}
