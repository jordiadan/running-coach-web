import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { RefreshCcw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getWeeklyCoachPlan, type WeeklyCoachSession } from "@/lib/portal-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type WeeklyPlanScreenProps = {
  athleteId: string;
  targetWeekStartDate: string;
  isPreparing: boolean;
  onRefresh: () => void | Promise<unknown>;
};

const weekDayLabels: Record<string, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

const modalityLabels: Record<string, string> = {
  RUN: "Run",
  STRENGTH: "Strength",
  REST: "Rest",
  MOBILITY: "Mobility",
};

const intensityStyles: Record<string, string> = {
  LOW: "bg-secondary text-foreground border-border",
  MODERATE: "bg-primary/10 text-primary border-primary/20",
  HIGH: "bg-accent/15 text-accent border-accent/20",
  REST: "bg-muted text-muted-foreground border-border",
};

function totalPlannedMinutes(sessions: WeeklyCoachSession[]) {
  return sessions.reduce((total, session) => total + session.durationMinutes, 0);
}

function plannedSessionsCount(sessions: WeeklyCoachSession[]) {
  return sessions.filter((session) => session.modality !== "REST").length;
}

export default function WeeklyPlanScreen({
  athleteId,
  targetWeekStartDate,
  isPreparing,
  onRefresh,
}: WeeklyPlanScreenProps) {
  const planQuery = useQuery({
    queryKey: ["portal", "weekly-plan", athleteId, targetWeekStartDate],
    queryFn: () => getWeeklyCoachPlan(athleteId, targetWeekStartDate),
    enabled: Boolean(athleteId && targetWeekStartDate) && !isPreparing,
    retry: false,
  });

  const plan = planQuery.data;
  const weekRangeLabel = useMemo(() => {
    if (!targetWeekStartDate) return undefined;

    const start = parseISO(targetWeekStartDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  }, [targetWeekStartDate]);

  if (isPreparing) {
    return (
      <div className="max-w-3xl rounded-2xl border border-divider bg-card p-6 shadow-card">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-secondary p-2 text-muted-foreground">
            <RefreshCcw className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Weekly plan</p>
            <h2 className="mt-1 font-serif text-2xl text-foreground">Preparing your weekly plan</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              We&apos;re preparing your plan for {weekRangeLabel}. First plans are generated automatically once
              onboarding is complete, and future plans are refreshed on Sunday night.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-5"
          onClick={() => onRefresh()}
          disabled={planQuery.isFetching}
        >
          {planQuery.isFetching ? (
            <>
              <RefreshCcw className="mr-2 h-3.5 w-3.5 animate-spin" />
              Refreshing
            </>
          ) : (
            "Refresh"
          )}
        </Button>
      </div>
    );
  }

  if (planQuery.isLoading) {
    return (
      <div className="max-w-3xl rounded-2xl border border-divider bg-card p-6 shadow-card">
        <p className="text-sm text-muted-foreground">Loading your weekly plan…</p>
      </div>
    );
  }

  if (planQuery.isError) {
    return (
      <div className="max-w-3xl rounded-2xl border border-divider bg-card p-6 shadow-card">
        <h2 className="font-serif text-2xl text-foreground">We couldn't load your weekly plan</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Refresh the portal in a moment. Your weekly plan is served from the coach backend and may still be syncing.
        </p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="max-w-3xl rounded-2xl border border-divider bg-card p-6 shadow-card">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-secondary p-2 text-muted-foreground">
            <RefreshCcw className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <h2 className="font-serif text-2xl text-foreground">We&apos;re syncing your weekly plan</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              The portal knows which week to show, but the plan is not readable yet. Refresh in a moment and we&apos;ll
              check again.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-5"
          onClick={() => onRefresh()}
          disabled={planQuery.isFetching}
        >
          {planQuery.isFetching ? (
            <>
              <RefreshCcw className="mr-2 h-3.5 w-3.5 animate-spin" />
              Refreshing
            </>
          ) : (
            "Refresh"
          )}
        </Button>
      </div>
    );
  }

  const sessions = plan.plan.sessions;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl text-foreground">Weekly plan</h2>
          <p className="mt-1 text-sm text-muted-foreground">{weekRangeLabel}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => planQuery.refetch()}
          disabled={planQuery.isFetching}
        >
          {planQuery.isFetching ? (
            <>
              <RefreshCcw className="mr-2 h-3.5 w-3.5 animate-spin" />
              Refreshing
            </>
          ) : (
            "Refresh"
          )}
        </Button>
      </div>

      <div className="rounded-2xl border border-divider bg-card p-6 shadow-card">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Week objective</p>
          <p className="text-base font-medium text-foreground">{plan.plan.weekObjective}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{plan.plan.progressionNote}</p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 border-t border-divider pt-5 sm:grid-cols-3">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-secondary/50 px-3 py-2">
            <span className="text-sm text-muted-foreground">Week type</span>
            <span className="text-sm font-medium text-foreground">{plan.plan.weekType}</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg bg-secondary/50 px-3 py-2">
            <span className="text-sm text-muted-foreground">Planned sessions</span>
            <span className="text-sm font-medium text-foreground">{plannedSessionsCount(sessions)}</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg bg-secondary/50 px-3 py-2">
            <span className="text-sm text-muted-foreground">Total planned minutes</span>
            <span className="text-sm font-medium text-foreground">{totalPlannedMinutes(sessions)} min</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <div key={session.day} className="rounded-2xl border border-divider bg-card p-5 shadow-card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {weekDayLabels[session.day] ?? session.day}
                  </p>
                  <Badge variant="outline">{modalityLabels[session.modality] ?? session.modality}</Badge>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                      intensityStyles[session.intensityCategory] ?? "bg-secondary text-foreground border-border"
                    }`}
                  >
                    {session.intensityCategory}
                  </span>
                </div>
                <h3 className="mt-2 text-base font-semibold text-foreground">{session.title}</h3>
              </div>

              <div className="text-sm text-muted-foreground">{session.durationMinutes} min</div>
            </div>

            {session.notes ? (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{session.notes}</p>
            ) : null}

            {session.strengthFocus?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {session.strengthFocus.map((focus) => (
                  <span
                    key={focus}
                    className="rounded-full border border-divider bg-secondary/60 px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {focus}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
