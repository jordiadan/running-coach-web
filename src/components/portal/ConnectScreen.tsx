import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeftRight, Check, Link2, Plus, RefreshCcw } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  connectTrainingProvider,
  disconnectTrainingProvider,
  getTrainingProviderIntegrationStatus,
  type PortalBootstrapResponse,
  type TrainingProviderId,
  type TrainingProviderIntegrationStatus,
} from "@/lib/portal-api";

type ConnectScreenProps = {
  athleteId: string;
  trainingProvider: PortalBootstrapResponse["trainingProvider"];
  variant?: "page" | "onboarding";
  onComplete?: () => void | Promise<unknown>;
};

type TrainingSource = {
  id: TrainingProviderId;
  name: string;
  description: string;
  readiness: string;
};

type ConnectRequest = {
  provider: TrainingProviderId;
  replaceExistingProvider?: boolean;
};

const trainingSources: TrainingSource[] = [
  {
    id: "strava",
    name: "Strava",
    description: "Sync your runs and core activity history from Strava.",
    readiness: "Limited readiness context",
  },
  {
    id: "intervals",
    name: "Intervals.icu",
    description: "Sync structured workouts, fitness, fatigue, and readiness context from Intervals.icu.",
    readiness: "Full readiness context",
  },
];

const providerNameById: Record<TrainingProviderId, string> = {
  intervals: "Intervals.icu",
  strava: "Strava",
};

function asProviderId(value: string | undefined): TrainingProviderId | undefined {
  return value === "intervals" || value === "strava" ? value : undefined;
}

function formatProviderName(provider: string | undefined) {
  const providerId = asProviderId(provider);

  return providerId ? providerNameById[providerId] : provider || "your current source";
}

function normalizeStatus(status: string | undefined) {
  return status?.trim().toLowerCase() ?? "";
}

function formatStatus(status: string | undefined) {
  const normalized = normalizeStatus(status);

  switch (normalized) {
    case "connected":
      return "Connected";
    case "pending_authorization":
      return "Waiting";
    case "auth_failed":
      return "Needs retry";
    case "disconnected":
      return "Disconnected";
    case "absent":
    default:
      return "";
  }
}

function getApiErrorCode(error: unknown) {
  if (!(error instanceof ApiError)) return undefined;
  const payload = typeof error.payload === "object" && error.payload !== null
    ? (error.payload as Record<string, unknown>)
    : {};

  return typeof payload.code === "string" ? payload.code : undefined;
}

function resolveDescription(
  source: TrainingSource,
  status: TrainingProviderIntegrationStatus | undefined,
  isActive: boolean,
  accountRef: string | undefined,
) {
  if (isActive) {
    return accountRef ? `Connected as ${accountRef}.` : `${source.name} is connected.`;
  }

  switch (normalizeStatus(status?.status)) {
    case "pending_authorization":
      return `Authorization is in progress. Finish the ${source.name} flow, then come back to the portal.`;
    case "auth_failed":
      return "The last authorization attempt failed. Start the connection again to continue.";
    default:
      return source.description;
  }
}

function resolveBadge(
  source: TrainingSource,
  status: TrainingProviderIntegrationStatus | undefined,
  trainingProvider: PortalBootstrapResponse["trainingProvider"],
  isActive: boolean,
) {
  if (isActive) {
    return null;
  }

  if (!trainingProvider.connected && trainingProvider.lastProvider === source.id) {
    const label = formatStatus(trainingProvider.lastStatus);

    return label ? { label: `Last ${label.toLowerCase()}`, className: "bg-secondary text-foreground" } : null;
  }

  switch (normalizeStatus(status?.status)) {
    case "pending_authorization":
      return { label: "Waiting", className: "bg-secondary text-foreground" };
    case "auth_failed":
      return { label: "Needs retry", className: "bg-destructive/10 text-destructive" };
    default:
      return null;
  }
}

function shouldPollStatus(
  awaitingOAuthCompletion: TrainingProviderId | null,
  queryData: TrainingProviderIntegrationStatus | undefined,
) {
  return awaitingOAuthCompletion !== null || normalizeStatus(queryData?.status) === "pending_authorization";
}

export default function ConnectScreen({
  athleteId,
  trainingProvider,
  variant = "page",
  onComplete,
}: ConnectScreenProps) {
  const queryClient = useQueryClient();
  const completionTriggeredRef = useRef(false);
  const [awaitingOAuthCompletion, setAwaitingOAuthCompletion] = useState<TrainingProviderId | null>(null);
  const [replaceCandidate, setReplaceCandidate] = useState<TrainingProviderId | null>(null);
  const [isReplaceDialogOpen, setIsReplaceDialogOpen] = useState(false);
  const [showConnectedTransition, setShowConnectedTransition] = useState(false);
  const isOnboarding = variant === "onboarding";
  const activeProvider = asProviderId(trainingProvider.activeProvider);
  const activeSource = trainingSources.find((source) => source.id === activeProvider);
  const pendingSource = trainingSources.find((source) => source.id === replaceCandidate);

  const intervalsQuery = useQuery({
    queryKey: ["portal", "training-provider", "intervals", athleteId],
    queryFn: () => getTrainingProviderIntegrationStatus("intervals", athleteId),
    enabled: Boolean(athleteId),
    refetchInterval: (query) => shouldPollStatus(awaitingOAuthCompletion, query.state.data) ? 3000 : false,
  });
  const stravaQuery = useQuery({
    queryKey: ["portal", "training-provider", "strava", athleteId],
    queryFn: () => getTrainingProviderIntegrationStatus("strava", athleteId),
    enabled: Boolean(athleteId),
    refetchInterval: (query) => shouldPollStatus(awaitingOAuthCompletion, query.state.data) ? 3000 : false,
  });

  const statusByProvider = useMemo(
    () => ({
      intervals: intervalsQuery.data,
      strava: stravaQuery.data,
    }),
    [intervalsQuery.data, stravaQuery.data],
  );
  const connectedProviderFromStatus =
    (intervalsQuery.data?.connected ? "intervals" : undefined) ??
    (stravaQuery.data?.connected ? "strava" : undefined);

  const invalidateProviderState = async () => {
    await queryClient.invalidateQueries({ queryKey: ["portal", "bootstrap"] });
    await queryClient.invalidateQueries({ queryKey: ["portal", "training-provider"] });
  };

  const connectMutation = useMutation({
    mutationFn: ({ provider, replaceExistingProvider = false }: ConnectRequest) =>
      connectTrainingProvider(provider, athleteId, replaceExistingProvider),
    onSuccess: async (result, variables) => {
      setIsReplaceDialogOpen(false);
      setReplaceCandidate(null);

      if (result.redirectUrl) {
        if (isOnboarding) {
          setAwaitingOAuthCompletion(variables.provider);
          const popup = window.open(result.redirectUrl, "_blank", "noopener,noreferrer");

          if (!popup) {
            window.location.assign(result.redirectUrl);
            return;
          }

          await invalidateProviderState();
          return;
        }

        window.location.assign(result.redirectUrl);
        return;
      }

      await invalidateProviderState();
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (provider: TrainingProviderId) => disconnectTrainingProvider(provider, athleteId),
    onSuccess: async () => {
      await invalidateProviderState();
    },
  });

  const confirmReplace = () => {
    if (!replaceCandidate) {
      return;
    }

    connectMutation.mutate({ provider: replaceCandidate, replaceExistingProvider: true });
  };

  const openReplaceDialog = (provider: TrainingProviderId) => {
    setReplaceCandidate(provider);
    setIsReplaceDialogOpen(true);
  };

  const handleReplaceDialogOpenChange = (open: boolean) => {
    if (connectMutation.isPending && !open) {
      return;
    }

    setIsReplaceDialogOpen(open);
  };

  useEffect(() => {
    if (!isOnboarding || !connectedProviderFromStatus || completionTriggeredRef.current === true) {
      return;
    }

    completionTriggeredRef.current = true;
    setAwaitingOAuthCompletion(null);
    setShowConnectedTransition(true);

    const timeout = window.setTimeout(() => {
      void onComplete?.();
    }, 850);

    return () => window.clearTimeout(timeout);
  }, [connectedProviderFromStatus, isOnboarding, onComplete]);

  useEffect(() => {
    if (!awaitingOAuthCompletion) {
      return;
    }

    const status = statusByProvider[awaitingOAuthCompletion];

    if (normalizeStatus(status?.status) === "auth_failed") {
      setAwaitingOAuthCompletion(null);
    }
  }, [awaitingOAuthCompletion, statusByProvider]);

  return (
    <div className={isOnboarding ? "space-y-5" : "max-w-2xl"}>
      {!isOnboarding ? (
        <>
          <h2 className="mb-2 font-serif text-2xl">Connect your data</h2>
          <p className="mb-2 text-sm text-muted-foreground">
            Link your training sources so we can build a plan around your real activity.
          </p>
          <p className="mb-8 text-xs text-muted-foreground">
            Only one activity source (Strava or Intervals.icu) can be active at a time.
          </p>
        </>
      ) : null}

      {isOnboarding ? (
        <p className="text-xs text-muted-foreground">
          Only one activity source (Strava or Intervals.icu) can be active at a time.
        </p>
      ) : null}

      <div className="space-y-3">
        {trainingSources.map((source) => {
          const providerStatus = statusByProvider[source.id];
          const isActive = trainingProvider.connected && activeProvider === source.id;
          const isReplaceable = source.id !== activeProvider && trainingProvider.connected && Boolean(activeProvider);
          const isBusy =
            (connectMutation.isPending && connectMutation.variables?.provider === source.id) ||
            (disconnectMutation.isPending && disconnectMutation.variables === source.id);
          const isLoadingStatus = source.id === "intervals" ? intervalsQuery.isLoading : stravaQuery.isLoading;
          const isStatusError = source.id === "intervals" ? intervalsQuery.isError : stravaQuery.isError;
          const accountRef = isActive
            ? trainingProvider.activeProviderAccountRef ?? providerStatus?.providerAccountRef
            : providerStatus?.providerAccountRef;
          const badge = resolveBadge(source, providerStatus, trainingProvider, isActive);
          const connectionErrorCode =
            connectMutation.variables?.provider === source.id ? getApiErrorCode(connectMutation.error) : undefined;

          return (
            <div
              key={source.id}
              className="rounded-xl border border-divider bg-card p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{source.name}</p>
                    {badge && (
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {resolveDescription(source, providerStatus, isActive, accountRef)}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {isActive
                      ? `Readiness capability: ${trainingProvider.readinessCapability}.`
                      : source.readiness}
                  </p>
                  {isStatusError ? (
                    <p className="mt-2 text-sm text-destructive">We couldn't load this source status.</p>
                  ) : null}
                  {connectionErrorCode === "PROVIDER_CONNECTION_CONFLICT" ? (
                    <p className="mt-2 text-sm text-destructive">
                      Another source is already connected. Use replace to switch sources.
                    </p>
                  ) : null}
                </div>

                {isActive ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => disconnectMutation.mutate(source.id)}
                    className="min-w-[110px] self-start sm:self-center"
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <>
                        <RefreshCcw className="mr-1 h-3.5 w-3.5 animate-spin" /> Disconnecting
                      </>
                    ) : (
                      <>
                        <Check className="mr-1 h-3.5 w-3.5" /> Connected
                      </>
                    )}
                  </Button>
                ) : isReplaceable ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openReplaceDialog(source.id)}
                    className="min-w-[110px] self-start sm:self-center"
                    disabled={isBusy}
                  >
                    <ArrowLeftRight className="mr-1 h-3.5 w-3.5" /> Replace
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => connectMutation.mutate({ provider: source.id })}
                    className="min-w-[110px] self-start sm:self-center"
                    disabled={isBusy || isLoadingStatus}
                  >
                    {isBusy ? (
                      <>
                        <RefreshCcw className="mr-1 h-3.5 w-3.5 animate-spin" /> Connecting
                      </>
                    ) : (
                      <>
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        {normalizeStatus(providerStatus?.status) === "pending_authorization" ? "Try again" : "Connect"}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog
        open={isReplaceDialogOpen}
        onOpenChange={handleReplaceDialogOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-foreground" />
              Replace active source?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You can only have one activity source active at a time.{" "}
              <span className="font-medium text-foreground">
                {activeSource?.name ?? formatProviderName(trainingProvider.activeProvider)}
              </span>{" "}
              will be disconnected and replaced with{" "}
              <span className="font-medium text-foreground">{pendingSource?.name}</span>.
              Your existing data stays, but new activities will sync from {pendingSource?.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={connectMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReplace} disabled={connectMutation.isPending}>
              {connectMutation.isPending ? "Replacing..." : `Replace with ${pendingSource?.name}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <p className="font-medium">Training source connected</p>
            <p className="text-xs text-primary/80">Moving on to your profile...</p>
          </div>
        </motion.div>
      ) : null}

      {!isOnboarding ? (
        <div className="mt-6 rounded-xl border border-divider bg-card p-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <Link2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              The portal checks provider status on load. If you finish an OAuth flow in another tab, reopen the portal and the connection state should refresh.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
