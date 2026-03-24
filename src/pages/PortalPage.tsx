import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, User, Link2, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import ConnectScreen from "@/components/portal/ConnectScreen";
import OnboardingScreen from "@/components/portal/OnboardingScreen";
import ProfileScreen from "@/components/portal/ProfileScreen";
import WeeklyPlanScreen from "@/components/portal/WeeklyPlanScreen";
import { Button } from "@/components/ui/button";
import { bootstrapPortal } from "@/lib/portal-api";
import { supabase } from "@/integrations/supabase/client";

type Tab = "plan" | "connect" | "profile";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "plan", label: "Weekly Plan", icon: Calendar },
  { id: "connect", label: "Connect", icon: Link2 },
  { id: "profile", label: "Profile", icon: User },
];

export default function PortalPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("plan");
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
    let timeout: number | undefined;

    if (
      previousNextStep !== null &&
      previousNextStep !== "view_weekly_plan" &&
      bootstrapQuery.data.nextStep === "view_weekly_plan"
    ) {
      setShowReadyTransition(true);
      timeout = window.setTimeout(() => {
        setShowReadyTransition(false);
      }, 1600);
    }

    switch (bootstrapQuery.data.nextStep) {
      case "connect_intervals":
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

    return () => {
      if (timeout) {
        window.clearTimeout(timeout);
      }
    };
  }, [bootstrapQuery.data]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

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
    <div className="min-h-screen bg-background">
      <nav className="border-b border-divider bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-16">
          <Link to="/" className="font-serif text-xl tracking-tight text-foreground">
            Running Coach
          </Link>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {bootstrapQuery.data.nextStep === "view_weekly_plan" && !showReadyTransition ? (
          <>
            <div className="flex gap-1 mb-10 bg-secondary/60 rounded-lg p-1 w-fit">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
                    activeTab === tab.id
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="active-tab"
                      className="absolute inset-0 bg-background rounded-md shadow-sm"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {activeTab === "plan" && (
                  <WeeklyPlanScreen
                    athleteId={athleteId}
                    targetWeekStartDate={bootstrapQuery.data.weeklyPlan.targetWeekStartDate}
                    isPreparing={false}
                    onRefresh={() => bootstrapQuery.refetch()}
                  />
                )}
                {activeTab === "connect" && <ConnectScreen athleteId={athleteId} />}
                {activeTab === "profile" && <ProfileScreen athleteId={athleteId} />}
              </motion.div>
            </AnimatePresence>
          </>
        ) : (
          <OnboardingScreen
            bootstrap={bootstrapQuery.data}
            onRefresh={async () => (await bootstrapQuery.refetch()).data}
          />
        )}
      </div>
    </div>
  );
}
