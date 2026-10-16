import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, ArrowLeftRight, Check, Link2, RefreshCcw, ArrowUpRight, Unplug } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import "./portal.css";
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
  const reduceMotion = useReducedMotion();
  const completionTriggeredRef = useRef(false);
  const authorizationStatusVersionRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  const [selectedProvider, setSelectedProvider] = useState<TrainingProviderId | null>(null);
  const [awaitingOAuthCompletion, setAwaitingOAuthCompletion] = useState<TrainingProviderId | null>(null);
  const [disconnectCandidate, setDisconnectCandidate] = useState<TrainingProviderId | null>(null);
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
          // A cached failure belongs to the previous attempt. Only a newer
          // provider response can end polling for this authorization attempt.
          authorizationStatusVersionRef.current = variables.provider === "intervals"
            ? intervalsQuery.dataUpdatedAt
            : stravaQuery.dataUpdatedAt;
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
      setDisconnectCandidate(null);
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
      void onCompleteRef.current?.();
    }, reduceMotion ? 0 : 500);

    return () => window.clearTimeout(timeout);
  }, [connectedProviderFromStatus, isOnboarding, reduceMotion]);

  useEffect(() => {
    if (!awaitingOAuthCompletion) {
      return;
    }

    const status = statusByProvider[awaitingOAuthCompletion];
    const statusUpdatedAt = awaitingOAuthCompletion === "intervals" ? intervalsQuery.dataUpdatedAt : stravaQuery.dataUpdatedAt;

    if (statusUpdatedAt > authorizationStatusVersionRef.current && normalizeStatus(status?.status) === "auth_failed") {
      setAwaitingOAuthCompletion(null);
    }
  }, [awaitingOAuthCompletion, statusByProvider, intervalsQuery.dataUpdatedAt, stravaQuery.dataUpdatedAt]);

  const choice = connectedProviderFromStatus ?? selectedProvider;
  const choiceQuery = choice === "intervals" ? intervalsQuery : stravaQuery;
  const choiceStatus = normalizeStatus(choice ? statusByProvider[choice]?.status : undefined);
  const choiceNeedsReconnect = ["auth_failed", "disconnected"].includes(choiceStatus);
  const choosingSource = isOnboarding && !trainingProvider.connected;

  return (
    <div className={`portal-settings connect-screen ${isOnboarding ? "connect-onboarding" : ""}`}>
      {!isOnboarding && (
        <div className="portal-page-heading">
          <h1>Connect your data<span className="portal-title-dot" aria-hidden="true">.</span>
          </h1>
          <p>Your training starts with the activity you already record.</p>
        </div>
      )}
      <div className="connect-layout">
        <div className="connect-providers" role={choosingSource ? "group" : undefined} aria-label="Training sources">
          {[...trainingSources].sort((a, b) => Number(trainingProvider.connected && b.id === activeProvider) - Number(trainingProvider.connected && a.id === activeProvider)).map((source) => {
            const providerStatus = statusByProvider[source.id];
            const isActive = trainingProvider.connected && activeProvider === source.id;
            const isReplaceable = source.id !== activeProvider && trainingProvider.connected && Boolean(activeProvider);
            const isBusy =
              (connectMutation.isPending && connectMutation.variables?.provider === source.id) ||
              (disconnectMutation.isPending && disconnectMutation.variables === source.id);
            const isMutating = connectMutation.isPending || disconnectMutation.isPending;
            const query = source.id === "intervals" ? intervalsQuery : stravaQuery;
            const isLoadingStatus = query.isLoading;
            const isStatusError = query.isError;
            const accountRef = isActive
              ? trainingProvider.activeProviderAccountRef ?? providerStatus?.providerAccountRef
              : providerStatus?.providerAccountRef;
            const badge = resolveBadge(source, providerStatus, trainingProvider, isActive);
            const connectionErrorCode =
              connectMutation.variables?.provider === source.id ? getApiErrorCode(connectMutation.error) : undefined;
            const connectionFailed = connectMutation.isError && connectMutation.variables?.provider === source.id;
            const disconnectionFailed = disconnectMutation.isError && disconnectMutation.variables === source.id;
            const reconnect = ["auth_failed", "disconnected"].includes(normalizeStatus(providerStatus?.status));

            if (choosingSource) {
              const selected = choice === source.id;
              return <section key={source.id} className="onboarding-source" aria-labelledby={`provider-${source.id}`} aria-busy={isLoadingStatus || isBusy}>
                <label className={`onboarding-source-choice ${selected ? "is-selected" : ""}`}>
                  {selected && <motion.span className="onboarding-source-selection" layoutId="provider-selection" transition={{ type: "spring", stiffness: 420, damping: 38 }} />}
                  <input type="radio" name="training-source" value={source.id} checked={selected} onChange={() => setSelectedProvider(source.id)} disabled={isMutating || showConnectedTransition} aria-labelledby={`provider-${source.id}`} aria-describedby={`provider-${source.id}-capability`} />
                  <span className={`connect-provider-mark connect-provider-mark-${source.id}`} aria-hidden="true">
                    {source.id === "strava" ? <svg viewBox="0 0 24 24" fill="currentColor"><path d="m10 2 6 10h-4l-2-3.5L8 12H4L10 2Zm6 10 4 7h-3l-1-2-1 2h-3l4-7Z" /></svg> : <span>i<span>.</span></span>}
                  </span>
                  <span className="onboarding-source-copy">
                    <span id={`provider-${source.id}`} className="onboarding-source-name">{source.name}</span>
                    <span id={`provider-${source.id}-capability`} className="onboarding-source-capability">{source.readiness}</span>
                  </span>
                  <span className="onboarding-source-radio" aria-hidden="true">{selected && <motion.span initial={reduceMotion ? false : { scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 35 }} />}</span>
                </label>
                {(isLoadingStatus || isStatusError || badge) && <p className="onboarding-source-status" role="status">{isLoadingStatus ? "Checking status…" : isStatusError ? "Status unavailable" : badge?.label}</p>}
                {isStatusError && <div className="portal-inline-error" role="alert"><p>We couldn't load this source status.</p><button type="button" className="portal-text-action" onClick={() => void query.refetch()} disabled={query.isFetching}>Check again</button></div>}
                {connectionFailed && <div className="portal-inline-error" role="alert"><p>{connectionErrorCode === "PROVIDER_CONNECTION_CONFLICT" ? "Another source is already connected. Check your setup to continue." : "We couldn't connect this source. Try again."}</p>{connectionErrorCode === "PROVIDER_CONNECTION_CONFLICT" && <button type="button" className="portal-text-action" onClick={() => void onComplete?.()}>Check setup</button>}</div>}
                {selected && (awaitingOAuthCompletion === source.id || choiceStatus === "auth_failed") && <p className="onboarding-source-status">{resolveDescription(source, providerStatus, false, accountRef)}</p>}
              </section>;
            }

            return (
              <section key={source.id} className={`connect-provider ${isActive ? "is-connected" : ""}`} aria-labelledby={`provider-${source.id}`} aria-busy={isLoadingStatus || isBusy}>
                <div className="connect-provider-top">
                  <div className={`connect-provider-mark connect-provider-mark-${source.id}`} aria-hidden="true">
                    {source.id === "strava" ? (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="m10 2 6 10h-4l-2-3.5L8 12H4L10 2Zm6 10 4 7h-3l-1-2-1 2h-3l4-7Z" />
                      </svg>
                    ) : <span>i<span>.</span>
                    </span>}
                  </div>
                  <span className={`connect-status ${badge?.label.toLowerCase().includes("retry") ? "needs-attention" : ""}`} role="status">
                    {isLoadingStatus ? "Checking status…" : isActive ? <>
                      <Check size={14} aria-hidden="true" /> Active source</> : isStatusError ? "Status unavailable" : badge?.label || "Not connected"}
                  </span>
                </div>
                <h2 id={`provider-${source.id}`}>{source.name}</h2>
                <p className="connect-provider-description">{resolveDescription(source, providerStatus, isActive, accountRef)}</p>
                <div className="connect-capability">
                  <span aria-hidden="true" />
                  <p>{isActive
                    ? trainingProvider.readinessCapability === "full" ? "Full readiness context" : trainingProvider.readinessCapability === "limited" ? "Limited readiness context" : `Readiness capability: ${trainingProvider.readinessCapability}.`
                    : source.readiness}</p>
                </div>
                {isActive && <p className="connect-active-note">New activities for your plan come from this source.</p>}
                {isStatusError && <div className="portal-inline-error" role="alert">
                  <p>We couldn't load this source status.</p>
                  <button type="button" className="portal-text-action" onClick={() => void query.refetch()} disabled={query.isFetching}>Check again</button>
                </div>}
                {connectionFailed && <p className="portal-inline-error" role="alert">{connectionErrorCode === "PROVIDER_CONNECTION_CONFLICT" ? "Another source is already connected. Use replace to switch sources." : "We couldn't connect this source. Try again."}</p>}
                {disconnectionFailed && <p className="portal-inline-error" role="alert">We couldn't disconnect this source. Try again.</p>}
                <div className="connect-provider-action">
                  {isActive ? (
                    <Button type="button" variant="ghost" className="connect-disconnect" onClick={() => setDisconnectCandidate(source.id)} disabled={isMutating}>
                      {isBusy ? <>
                        <RefreshCcw className="portal-spin" size={16} aria-hidden="true" /> Disconnecting…</> : <>
                        <Unplug size={16} aria-hidden="true" /> Disconnect</>}
                    </Button>
                  ) : isReplaceable ? (
                    <Button type="button" variant="outline" onClick={() => openReplaceDialog(source.id)} disabled={isMutating || isLoadingStatus}>
                      <ArrowLeftRight size={16} aria-hidden="true" /> Replace source
                    </Button>
                  ) : (
                    <Button type="button" variant="default" onClick={() => connectMutation.mutate({ provider: source.id })} disabled={isMutating || isLoadingStatus}>
                      {isBusy ? <>
                        <RefreshCcw className="portal-spin" size={16} aria-hidden="true" /> Connecting…</> : <>{reconnect ? "Reconnect" : normalizeStatus(providerStatus?.status) === "pending_authorization" ? "Try again" : "Connect"}<ArrowUpRight size={16} aria-hidden="true" />
                      </>}
                    </Button>
                  )}
                </div>
              </section>
            );
          })}
        </div>
        {choosingSource ? <div className="onboarding-connect-footer">
          {showConnectedTransition ? <motion.p className="onboarding-connected" role="status" initial={reduceMotion ? false : { y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><motion.path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" initial={reduceMotion ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduceMotion ? 0 : 0.24 }} /></svg>
            Training source connected
          </motion.p> : <p className="onboarding-connection-note">One source at a time. You can switch later.</p>}
          <Button type="button" variant="hero" disabled={!choice || connectMutation.isPending || (!showConnectedTransition && choiceQuery.isLoading)} onClick={() => { if (showConnectedTransition) void onComplete?.(); else if (choice) connectMutation.mutate({ provider: choice }); }}>
            {showConnectedTransition ? <>Continue <ArrowUpRight size={16} aria-hidden="true" /></> : connectMutation.isPending ? <><RefreshCcw className="portal-spin" size={16} aria-hidden="true" /> Connecting…</> : <>{choice ? `${choiceNeedsReconnect ? "Reconnect" : choiceStatus === "pending_authorization" ? "Try again with" : "Connect"} ${providerNameById[choice]}` : "Connect a source"}<ArrowUpRight size={16} aria-hidden="true" /></>}
          </Button>
          {!showConnectedTransition && <p className="onboarding-authorization-help">You’ll authorize with your provider, then return here.</p>}
          <details className="onboarding-source-details"><summary>What’s shared?</summary><p>Strava shares runs and activity history, with limited readiness context. Intervals.icu also shares structured workouts, fitness, fatigue and readiness context.</p></details>
        </div> : <aside className="connect-guidance" aria-label="About your connection">
          <Link2 size={22} strokeWidth={1.5} aria-hidden="true" />
          <h2>One source.<br />Your full focus.</h2>
          <p>Only one activity source (Strava or Intervals.icu) can be active at a time.</p>
          <p>Switch sources whenever you need. Your existing data stays; new activities come from your new source.</p>
          <div className="connect-authorization-note">
            <ArrowUpRight size={16} aria-hidden="true" />
            <p>You'll authorize the connection with your provider. If you finish in another tab, reopen the portal to refresh its status.</p>
          </div>
        </aside>}
      </div>

      <AlertDialog open={disconnectCandidate !== null} onOpenChange={open => { if (!open && !disconnectMutation.isPending) setDisconnectCandidate(null); }}>
        <AlertDialogContent className="portal-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {disconnectCandidate ? providerNameById[disconnectCandidate] : "source"}?</AlertDialogTitle>
            <AlertDialogDescription>New activities will stop syncing from this source. Your existing data stays, and you can reconnect later.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnectMutation.isPending}>Keep connected</AlertDialogCancel>
            <AlertDialogAction className="portal-dialog-confirm" onClick={event => { event.preventDefault(); if (disconnectCandidate) disconnectMutation.mutate(disconnectCandidate); }} disabled={disconnectMutation.isPending}>{disconnectMutation.isPending ? "Disconnecting…" : "Disconnect source"}</AlertDialogAction>
          </AlertDialogFooter>
          {disconnectMutation.isError && <p className="text-sm text-destructive" role="alert">We couldn't disconnect this source. Try again.</p>}
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={isReplaceDialogOpen}
        onOpenChange={handleReplaceDialogOpenChange}
      >
        <AlertDialogContent className="portal-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle aria-hidden="true" className="h-4 w-4 text-foreground" />
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
            <AlertDialogAction className="portal-dialog-confirm" onClick={event => { event.preventDefault(); confirmReplace(); }} disabled={connectMutation.isPending}>
              {connectMutation.isPending ? "Replacing…" : `Replace with ${pendingSource?.name}`}
            </AlertDialogAction>
          </AlertDialogFooter>
          {connectMutation.isError && <p className="text-sm text-destructive" role="alert">We couldn't replace this source. Try again.</p>}
        </AlertDialogContent>
      </AlertDialog>

      {isOnboarding && !choosingSource && showConnectedTransition ? (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.16 }}
          className="connect-onboarding-success"
          role="status"
        >
          <div className="connect-onboarding-check">
            <Check aria-hidden="true" className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <p className="font-medium">Training source connected</p>
            <p>Checking your next step…</p>
          </div>
          <button type="button" className="portal-text-action" onClick={() => void onComplete?.()}>Continue</button>
        </motion.div>
      ) : null}

    </div>
  );
}
