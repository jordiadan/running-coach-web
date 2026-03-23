import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, User, Link2, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import ConnectScreen from "@/components/portal/ConnectScreen";
import ProfileScreen from "@/components/portal/ProfileScreen";
import WeeklyPlanScreen from "@/components/portal/WeeklyPlanScreen";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { getAthleteProfile, getIntervalsIntegrationStatus, getMe, isProfileComplete } from "@/lib/portal-api";
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

  const meQuery = useQuery({
    queryKey: ["portal", "me"],
    queryFn: getMe,
    enabled: hasSession === true,
    retry: false,
  });
  const athleteId = meQuery.data?.athleteId;

  const intervalsQuery = useQuery({
    queryKey: ["portal", "intervals", athleteId],
    queryFn: () => getIntervalsIntegrationStatus(athleteId!),
    enabled: Boolean(athleteId),
    retry: false,
  });

  const profileQuery = useQuery({
    queryKey: ["portal", "athlete", athleteId],
    queryFn: () => getAthleteProfile(athleteId!),
    enabled: Boolean(athleteId),
    retry: false,
  });

  useEffect(() => {
    if (!athleteId || intervalsQuery.isLoading || profileQuery.isLoading) return;

    if (!intervalsQuery.data?.connected) {
      setActiveTab("connect");
      return;
    }

    if (!isProfileComplete(profileQuery.data)) {
      setActiveTab("profile");
      return;
    }

    setActiveTab("plan");
  }, [athleteId, intervalsQuery.data, intervalsQuery.isLoading, profileQuery.data, profileQuery.isLoading]);

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

  if (meQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="rounded-2xl border border-divider bg-card px-6 py-5 shadow-card">
          <p className="text-sm text-muted-foreground">Loading your portal…</p>
        </div>
      </div>
    );
  }

  if (meQuery.isError || !athleteId) {
    const error = meQuery.error;
    const athleteAccessNotConfigured =
      error instanceof ApiError &&
      error.status === 403 &&
      typeof error.payload === "object" &&
      error.payload !== null &&
      "code" in error.payload &&
      error.payload.code === "ATHLETE_ACCESS_NOT_CONFIGURED";

    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-divider bg-card p-6 shadow-card">
          <h1 className="font-serif text-2xl text-foreground">
            {athleteAccessNotConfigured ? "Your account is not linked yet" : "You need to sign in first"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {athleteAccessNotConfigured
              ? "Google sign-in worked, but this user is not linked to an athlete in the backend yet. Once athlete access is configured, the portal can continue."
              : "We couldn't load your athlete context. Sign in again and we'll reopen the portal from there."}
          </p>
          {athleteAccessNotConfigured ? (
            <Button className="mt-6" variant="hero" onClick={handleLogout}>
              Sign out
            </Button>
          ) : (
            <Button className="mt-6" variant="hero" onClick={() => navigate("/login")}>
              Back to login
            </Button>
          )}
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
            {activeTab === "plan" && <WeeklyPlanScreen />}
            {activeTab === "connect" && <ConnectScreen athleteId={athleteId} />}
            {activeTab === "profile" && <ProfileScreen athleteId={athleteId} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
