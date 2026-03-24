import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Link2, Plus, RefreshCcw } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  connectIntervals,
  disconnectIntervals,
  getIntervalsIntegrationStatus,
  type IntervalsIntegrationStatus,
} from "@/lib/portal-api";

type ConnectScreenProps = {
  athleteId: string;
  variant?: "page" | "onboarding";
  onComplete?: () => void | Promise<unknown>;
};

const staticSources = [
  { id: "strava", name: "Strava", description: "Coming soon", disabled: true },
  { id: "garmin", name: "Garmin Connect", description: "Coming soon", disabled: true },
  { id: "apple", name: "Apple Health", description: "Coming soon", disabled: true },
];

function resolveIntervalsDescription(status: IntervalsIntegrationStatus | undefined) {
  if (!status) {
    return "Sync structured workouts, fitness, and fatigue data from Intervals.icu.";
  }

  switch (status.status) {
    case "connected":
      return status.providerAccountRef
        ? `Connected as ${status.providerAccountRef}.`
        : "Your Intervals.icu account is connected.";
    case "pending_authorization":
      return "Authorization is in progress. Finish the Intervals flow, then come back to the portal.";
    case "auth_failed":
      return "The last authorization attempt failed. Start the connection again to continue.";
    case "disconnected":
    case "absent":
    default:
      return "Sync structured workouts, fitness, and fatigue data from Intervals.icu.";
  }
}

function resolveIntervalsBadge(status: IntervalsIntegrationStatus | undefined) {
  switch (status?.status) {
    case "connected":
      return { label: "Connected", className: "bg-primary/10 text-primary" };
    case "pending_authorization":
      return { label: "Waiting", className: "bg-secondary text-foreground" };
    case "auth_failed":
      return { label: "Needs retry", className: "bg-destructive/10 text-destructive" };
    default:
      return null;
  }
}

export default function ConnectScreen({
  athleteId,
  variant = "page",
  onComplete,
}: ConnectScreenProps) {
  const queryClient = useQueryClient();
  const completionTriggeredRef = useRef(false);
  const [awaitingOAuthCompletion, setAwaitingOAuthCompletion] = useState(false);
  const [showConnectedTransition, setShowConnectedTransition] = useState(false);
  const intervalsQuery = useQuery({
    queryKey: ["portal", "intervals", athleteId],
    queryFn: () => getIntervalsIntegrationStatus(athleteId),
    enabled: Boolean(athleteId),
    refetchInterval: (query) =>
      awaitingOAuthCompletion || query.state.data?.status === "pending_authorization" ? 3000 : false,
  });

  const connectMutation = useMutation({
    mutationFn: () => connectIntervals(athleteId),
    onSuccess: async (result) => {
      if (result.redirectUrl) {
        if (isOnboarding) {
          setAwaitingOAuthCompletion(true);
          const popup = window.open(result.redirectUrl, "_blank", "noopener,noreferrer");

          if (!popup) {
            window.location.assign(result.redirectUrl);
            return;
          }

          await queryClient.invalidateQueries({ queryKey: ["portal", "bootstrap"] });
          await queryClient.invalidateQueries({ queryKey: ["portal", "intervals", athleteId] });
          return;
        }

        window.location.assign(result.redirectUrl);
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["portal", "bootstrap"] });
      await queryClient.invalidateQueries({ queryKey: ["portal", "intervals", athleteId] });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => disconnectIntervals(athleteId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["portal", "bootstrap"] });
      await queryClient.invalidateQueries({ queryKey: ["portal", "intervals", athleteId] });
    },
  });

  const intervalsSource = useMemo(
    () => ({
      id: "intervals",
      name: "Intervals.icu",
      description: resolveIntervalsDescription(intervalsQuery.data),
      connected: Boolean(intervalsQuery.data?.connected),
      disabled: false,
    }),
    [intervalsQuery.data],
  );
  const isOnboarding = variant === "onboarding";

  useEffect(() => {
    if (!isOnboarding || !intervalsQuery.data?.connected || completionTriggeredRef.current === true) {
      return;
    }

    completionTriggeredRef.current = true;
    setAwaitingOAuthCompletion(false);
    setShowConnectedTransition(true);

    const timeout = window.setTimeout(() => {
      void onComplete?.();
    }, 850);

    return () => window.clearTimeout(timeout);
  }, [intervalsQuery.data?.connected, isOnboarding, onComplete]);

  useEffect(() => {
    if (!awaitingOAuthCompletion || intervalsQuery.data?.connected !== false) {
      return;
    }

    if (intervalsQuery.data?.status === "auth_failed") {
      setAwaitingOAuthCompletion(false);
    }
  }, [awaitingOAuthCompletion, intervalsQuery.data]);

  return (
    <div className={isOnboarding ? "space-y-5" : "max-w-2xl"}>
      {!isOnboarding ? (
        <>
          <h2 className="mb-2 font-serif text-2xl">Connect your data</h2>
          <p className="mb-8 text-sm text-muted-foreground">
            Link Intervals first. The rest of the onboarding will use that training context to personalize your plan.
          </p>
        </>
      ) : null}

      <div className="space-y-3">
        {[intervalsSource, ...staticSources].map((source) => {
          const isIntervals = source.id === "intervals";
          const isBusy = connectMutation.isPending || disconnectMutation.isPending;
          const intervalsBadge = isIntervals ? resolveIntervalsBadge(intervalsQuery.data) : null;

          return (
            <div
              key={source.id}
              className={`flex items-center justify-between gap-4 rounded-xl border border-divider bg-card p-5 ${
                source.disabled ? "opacity-50" : ""
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{source.name}</p>
                  {intervalsBadge && (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${intervalsBadge.className}`}>
                      {intervalsBadge.label}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{source.description}</p>
                {isIntervals && intervalsQuery.isError && (
                  <p className="mt-2 text-sm text-destructive">We couldn't load the current Intervals status.</p>
                )}
              </div>

              {source.disabled ? (
                <Button variant="outline" size="sm" disabled className="min-w-[110px]">
                  Coming soon
                </Button>
              ) : intervalsQuery.data?.connected ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => disconnectMutation.mutate()}
                  className="min-w-[110px]"
                  disabled={isBusy}
                >
                  {disconnectMutation.isPending ? (
                    <><RefreshCcw className="mr-1 h-3.5 w-3.5 animate-spin" /> Disconnecting</>
                  ) : (
                    <><Check className="mr-1 h-3.5 w-3.5" /> Disconnect</>
                  )}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => connectMutation.mutate()}
                  className="min-w-[110px]"
                  disabled={isBusy || intervalsQuery.isLoading}
                >
                  {connectMutation.isPending ? (
                    <><RefreshCcw className="mr-1 h-3.5 w-3.5 animate-spin" /> Connecting</>
                  ) : (
                    <><Plus className="mr-1 h-3.5 w-3.5" /> {intervalsQuery.data?.status === "pending_authorization" ? "Try again" : "Connect"}</>
                  )}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {isOnboarding && showConnectedTransition ? (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <p className="font-medium">Connected to Intervals.icu</p>
            <p className="text-xs text-primary/80">Moving on to your profile…</p>
          </div>
        </motion.div>
      ) : null}

      {!isOnboarding ? (
        <div className="mt-6 rounded-xl border border-divider bg-card p-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <Link2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              The portal checks your Intervals status on load. If you finish the OAuth flow in another tab, reopen the portal and the connection state should refresh.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
