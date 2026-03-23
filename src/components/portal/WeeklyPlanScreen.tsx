import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  Battery,
  CalendarRange,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  Moon,
  RefreshCcw,
  StretchHorizontal,
  TimerReset,
  Trophy,
  Zap,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getWeeklyCoachPlan, type WeeklyCoachSession } from "@/lib/portal-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

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

const sessionTypeStyles: Record<string, string> = {
  RUN: "bg-primary text-primary-foreground border-primary/40",
  STRENGTH: "bg-accent text-accent-foreground border-accent/40",
  MOBILITY: "bg-secondary text-foreground border-border",
  REST: "bg-muted text-muted-foreground border-border",
};

const sessionCardStyles: Record<string, string> = {
  RUN: "border-primary/15 bg-card",
  STRENGTH: "border-accent/20 bg-card",
  MOBILITY: "border-border bg-card",
  REST: "border-border bg-muted/40",
};

const typeConfig: Record<
  string,
  {
    icon: typeof Zap;
    label: string;
    gradient: string;
    tileClass: string;
    badgeClass: string;
  }
> = {
  RUN: {
    icon: Zap,
    label: "Run",
    gradient: "from-primary/20 to-primary/5",
    tileClass: "border-primary/20 text-primary",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
  },
  STRENGTH: {
    icon: Dumbbell,
    label: "Strength",
    gradient: "from-accent/20 to-accent/5",
    tileClass: "border-accent/20 text-accent",
    badgeClass: "bg-accent/10 text-accent border-accent/20",
  },
  MOBILITY: {
    icon: StretchHorizontal,
    label: "Mobility",
    gradient: "from-secondary to-secondary/50",
    tileClass: "border-border text-muted-foreground",
    badgeClass: "bg-secondary text-foreground border-border",
  },
  REST: {
    icon: Moon,
    label: "Rest",
    gradient: "from-muted to-muted/50",
    tileClass: "border-border text-muted-foreground",
    badgeClass: "bg-muted text-muted-foreground border-border",
  },
};

function formatWeekType(weekType: string) {
  if (!weekType) return "Planned week";
  return weekType
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function resolveKeySession(sessions: WeeklyCoachSession[]) {
  return (
    sessions.find((session) => session.intensityCategory === "HIGH" && session.modality !== "REST") ??
    sessions.find((session) => session.intensityCategory === "MODERATE" && session.modality !== "REST") ??
    sessions.find((session) => session.modality !== "REST")
  );
}

function shortDayLabel(day: string) {
  return weekDayLabels[day]?.slice(0, 3) ?? day;
}

function modalityTone(session: WeeklyCoachSession) {
  switch (session.modality) {
    case "RUN":
      return "bg-primary";
    case "STRENGTH":
      return "bg-accent";
    case "MOBILITY":
      return "bg-secondary-foreground/40";
    default:
      return "bg-muted-foreground/40";
  }
}

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
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
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

  const toggleComplete = (day: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

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
  const keySession = resolveKeySession(sessions);
  const completedMinutes = sessions
    .filter((session) => completed.has(session.day))
    .reduce((total, session) => total + session.durationMinutes, 0);
  const progressPercent =
    totalPlannedMinutes(sessions) > 0
      ? Math.round((completedMinutes / totalPlannedMinutes(sessions)) * 100)
      : 0;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <h2 className="font-serif text-2xl text-foreground">Weekly Plan</h2>
              <Badge
                variant="outline"
                className="h-5 border-accent/30 bg-accent/5 px-2 py-0 text-[10px] font-medium text-accent"
              >
                <Trophy className="mr-1 h-3 w-3" />
                {formatWeekType(plan.plan.weekType)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{weekRangeLabel}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => planQuery.refetch()} disabled={planQuery.isFetching}>
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

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-muted/40 p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Trophy className="h-4 w-4" />
                  <p className="text-[11px] uppercase tracking-[0.16em]">Week type</p>
                </div>
                <p className="mt-3 text-xl font-semibold text-foreground">{formatWeekType(plan.plan.weekType)}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarRange className="h-4 w-4" />
                  <p className="text-[11px] uppercase tracking-[0.16em]">Planned sessions</p>
                </div>
                <p className="mt-3 text-xl font-semibold text-foreground">{plannedSessionsCount(sessions)}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TimerReset className="h-4 w-4" />
                  <p className="text-[11px] uppercase tracking-[0.16em]">Total minutes</p>
                </div>
                <p className="mt-3 text-xl font-semibold text-foreground">{totalPlannedMinutes(sessions)} min</p>
              </div>
            </div>
          </div>

          <div className="border-t border-border bg-muted/30 px-5 py-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Objective:</span> {plan.plan.weekObjective}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-2">
          {sessions.map((session) => {
            const done = completed.has(session.day);
            const isKey = keySession?.day === session.day;
            return (
              <div key={session.day} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div
                  className={`h-2 w-full rounded-full ${done ? "bg-primary" : modalityTone(session)} ${
                    session.modality === "REST" ? "opacity-35" : ""
                  }`}
                />
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <span className={isKey ? "font-semibold text-foreground" : ""}>{shortDayLabel(session.day)}</span>
                  {isKey ? <span className="text-primary">•</span> : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Battery className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Progress</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>
                {completed.size}/{sessions.length} sessions
              </span>
              <span className="font-semibold text-foreground">{progressPercent}%</span>
            </div>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
            <span>{completedMinutes} min done</span>
            <span>{Math.max(totalPlannedMinutes(sessions) - completedMinutes, 0)} min remaining</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Sessions</p>
        <div className="space-y-3">
          {sessions.map((session, index) => {
            const isDone = completed.has(session.day);
            const isRest = session.modality === "REST";
            const isExpanded = expandedDay === session.day;
            const isKey = keySession?.day === session.day;
            const config = typeConfig[session.modality] ?? typeConfig.RUN;
            const TypeIcon = config.icon;

            return (
              <motion.div
                key={session.day}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.25 }}
                className={`relative overflow-hidden rounded-xl border transition-all duration-200 ${
                  isDone
                    ? "border-primary/20 bg-primary/5"
                    : sessionCardStyles[session.modality] ?? "border-border bg-card"
                } ${isRest && !isDone ? "opacity-60" : ""}`}
              >
                {isKey && !isDone ? (
                  <div className="h-0.5 bg-gradient-to-r from-primary/40 via-primary/20 to-transparent" />
                ) : null}

                <div
                  className={`flex items-center gap-3 p-4 ${!isRest ? "cursor-pointer select-none" : ""}`}
                  onClick={() => {
                    if (!isRest) setExpandedDay(isExpanded ? null : session.day);
                  }}
                >
                  <div
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    <Checkbox
                      checked={isDone}
                      className="h-5 w-5 rounded-md"
                      onCheckedChange={() => toggleComplete(session.day)}
                    />
                  </div>

                  <div
                    className={`rounded-lg border bg-gradient-to-br p-2 ${config.gradient} ${config.tileClass}`}
                  >
                    <TypeIcon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-8 text-xs font-medium text-muted-foreground">
                        {shortDayLabel(session.day)}
                      </span>
                      <p
                        className={`truncate text-sm font-medium ${
                          isDone ? "line-through text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {session.title}
                      </p>
                    </div>
                    <div className="ml-10 mt-1.5 flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {session.durationMinutes} min
                      </span>
                      <Badge
                        variant="secondary"
                        className={`h-4 border px-1.5 py-0 text-[10px] ${
                          intensityStyles[session.intensityCategory] ?? "bg-secondary text-foreground border-border"
                        }`}
                      >
                        {session.intensityCategory}
                      </Badge>
                      <Badge variant="outline" className={`h-4 px-1.5 py-0 text-[10px] ${config.badgeClass}`}>
                        {modalityLabels[session.modality] ?? config.label}
                      </Badge>
                      {isKey ? (
                        <Badge
                          variant="outline"
                          className="h-4 border-primary/30 bg-primary/5 px-1.5 py-0 text-[10px] text-primary"
                        >
                          Key
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  {isDone ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="rounded-full bg-primary p-1 text-primary-foreground"
                    >
                      <Check className="h-3 w-3" />
                    </motion.div>
                  ) : !isRest ? (
                    <div className="text-muted-foreground/50">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  ) : null}
                </div>

                <AnimatePresence initial={false}>
                  {isExpanded && (session.notes || session.strengthFocus?.length) ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border/40 px-4 pb-4 pt-3">
                        {session.notes ? (
                          <div className="rounded-lg border border-border/40 bg-muted/40 p-3">
                            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Coach note
                            </p>
                            <p className="text-sm leading-relaxed text-foreground">{session.notes}</p>
                          </div>
                        ) : null}

                        {session.strengthFocus?.length ? (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {session.strengthFocus.map((focus) => (
                              <Badge
                                key={focus}
                                variant="outline"
                                className="h-5 bg-secondary/50 px-2 py-0 text-[10px] font-normal"
                              >
                                {focus}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
