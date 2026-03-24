import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  Battery,
  BedDouble,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  Moon,
  RefreshCcw,
  Route,
  Shield,
  Star,
  StretchHorizontal,
  Target,
  TrendingDown,
  TrendingUp,
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
  REST: "bg-muted text-muted-foreground",
  LOW: "bg-primary/8 text-primary",
  MODERATE: "bg-accent/10 text-accent",
  HIGH: "bg-destructive/10 text-destructive",
};

const intensityLabels: Record<string, string> = {
  LOW: "Low",
  MODERATE: "Moderate",
  HIGH: "High",
  REST: "Rest",
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

const weekTypeConfig: Record<
  string,
  {
    icon: typeof TrendingUp;
    badgeClass: string;
    dashboardGlowClass: string;
  }
> = {
  BUILD: {
    icon: TrendingUp,
    badgeClass: "border-primary/30 bg-primary/5 text-primary",
    dashboardGlowClass: "from-primary/12 via-primary/4 to-transparent",
  },
  DELOAD: {
    icon: TrendingDown,
    badgeClass: "border-accent/30 bg-accent/5 text-accent",
    dashboardGlowClass: "from-accent/12 via-accent/4 to-transparent",
  },
  MAINTENANCE: {
    icon: Shield,
    badgeClass: "border-secondary-foreground/20 bg-secondary text-foreground",
    dashboardGlowClass: "from-secondary via-secondary/50 to-transparent",
  },
  SHARPEN: {
    icon: Target,
    badgeClass: "border-destructive/25 bg-destructive/5 text-destructive",
    dashboardGlowClass: "from-destructive/12 via-destructive/4 to-transparent",
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

function formatPhase(phase: string | undefined) {
  if (!phase) return "—";
  return phase
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDecimal(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return value % 1 === 0 ? String(value) : value.toFixed(1);
}

function deriveSleepStatus(sleepHours: number | undefined) {
  if (typeof sleepHours !== "number" || !Number.isFinite(sleepHours)) {
    return {
      label: "—",
      valueToneClass: "text-foreground",
      iconToneClass: "text-muted-foreground",
    };
  }

  if (sleepHours < 6) {
    return {
      label: "Poor",
      valueToneClass: "text-destructive",
      iconToneClass: "text-destructive",
    };
  }

  if (sleepHours < 7) {
    return {
      label: "Fair",
      valueToneClass: "text-accent",
      iconToneClass: "text-accent",
    };
  }

  if (sleepHours < 8) {
    return {
      label: "Good",
      valueToneClass: "text-primary",
      iconToneClass: "text-primary",
    };
  }

  return {
    label: "Great",
    valueToneClass: "text-emerald-600",
    iconToneClass: "text-emerald-600",
  };
}

function RadialGauge({
  value,
  max = 100,
  size = 78,
  strokeWidth = 7,
  label,
  color,
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  color: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = value / max;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-col items-center gap-1.5"
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress * circumference }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.08 }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.18 }}
            className="text-lg font-bold text-foreground"
          >
            {value}
          </motion.span>
        </div>
      </div>
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
    </motion.div>
  );
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
  const currentWeekType = plan.plan.weekType || "";
  const currentWeekTypeConfig = weekTypeConfig[currentWeekType] ?? {
    icon: Zap,
    badgeClass: "border-border bg-muted/40 text-foreground",
    dashboardGlowClass: "from-muted via-muted/50 to-transparent",
  };
  const WeekTypeIcon = currentWeekTypeConfig.icon;
  const readinessScore = plan.summary.readinessScore ?? 0;
  const fatigue = plan.summary.fatigue ?? 0;
  const sleepStatus = deriveSleepStatus(plan.summary.sleepHours);
  const dashboardStats = [
    {
      icon: BedDouble,
      label: "Sleep",
      value: sleepStatus.label,
      valueToneClass: sleepStatus.valueToneClass,
      iconToneClass: sleepStatus.iconToneClass,
    },
    {
      icon: Route,
      label: "Last 7 days",
      value:
        typeof plan.summary.last7dDistanceKm === "number"
          ? `${formatDecimal(plan.summary.last7dDistanceKm)} km`
          : "—",
      valueToneClass: "text-foreground",
      iconToneClass: "text-muted-foreground",
    },
    {
      icon: Target,
      label: "Phase",
      value: formatPhase(plan.summary.phase),
      valueToneClass: "text-foreground",
      iconToneClass: "text-muted-foreground",
    },
    {
      icon: CalendarDays,
      label: "To goal",
      value: typeof plan.summary.daysToGoal === "number" ? `${plan.summary.daysToGoal}d` : "—",
      valueToneClass: "text-foreground",
      iconToneClass: "text-muted-foreground",
    },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="flex items-start justify-between gap-4"
        >
          <div>
            <div className="mb-1 flex items-center gap-2">
              <h2 className="font-serif text-2xl text-foreground">Weekly Plan</h2>
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.08, duration: 0.22 }}
              >
                <Badge
                variant="outline"
                className={`h-5 px-2 py-0 text-[10px] font-medium ${currentWeekTypeConfig.badgeClass}`}
              >
                <WeekTypeIcon className="mr-1 h-3 w-3" />
                {formatWeekType(currentWeekType)}
              </Badge>
              </motion.div>
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-2xl border border-border bg-card"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45 }}
            className={`pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-r ${currentWeekTypeConfig.dashboardGlowClass}`}
          />
          <div className="flex flex-col gap-6 p-5 sm:flex-row">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="flex items-center gap-5 sm:gap-6"
            >
              <RadialGauge
                value={readinessScore}
                label="Readiness"
                color={
                  readinessScore >= 70
                    ? "hsl(var(--primary))"
                    : readinessScore >= 50
                      ? "hsl(var(--accent))"
                      : "hsl(var(--destructive))"
                }
              />
              <RadialGauge value={fatigue} max={10} label="Fatigue" color="hsl(var(--accent))" />
            </motion.div>

            <div className="hidden w-px bg-border sm:block" />
            <div className="h-px bg-border sm:hidden" />

            <div className="grid flex-1 grid-cols-2 gap-2.5">
              {dashboardStats.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * index, duration: 0.22 }}
                  className="flex items-center gap-2.5 rounded-xl bg-muted/50 p-2.5"
                >
                  <item.icon className={`h-4 w-4 shrink-0 ${item.iconToneClass}`} />
                  <div className="min-w-0">
                    <p className="text-[10px] leading-tight text-muted-foreground">{item.label}</p>
                    <p className={`truncate text-sm font-semibold leading-tight ${item.valueToneClass}`}>
                      {item.value}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="border-t border-border bg-muted/30 px-5 py-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Objective:</span> {plan.plan.weekObjective}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.28 }}
          className="flex items-center justify-between gap-2 px-2"
        >
          {sessions.map((session, index) => {
            const done = completed.has(session.day);
            const isKey = keySession?.day === session.day;
            return (
              <motion.div
                key={session.day}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.03 * index, duration: 0.2 }}
                className="flex min-w-0 flex-1 flex-col items-center gap-2"
              >
                <motion.div
                  layout
                  initial={{ scaleX: 0.6 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.04 * index, duration: 0.25 }}
                  className={`h-2 w-full rounded-full ${done ? "bg-primary" : modalityTone(session)} ${
                    session.modality === "REST" ? "opacity-35" : ""
                  }`}
                />
                <motion.div
                  animate={done ? { scale: [1, 1.08, 1] } : isKey ? { y: [0, -1.5, 0] } : {}}
                  transition={
                    done
                      ? { duration: 0.22 }
                      : isKey
                        ? { repeat: Infinity, duration: 1.8, ease: "easeInOut" }
                        : undefined
                  }
                  className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                    done
                      ? "border-primary bg-primary text-primary-foreground"
                      : isKey
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                </motion.div>
                <div className="flex items-center gap-1 text-[11px]">
                  <span
                    className={`font-medium ${
                      done ? "text-foreground" : isKey ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {shortDayLabel(session.day)}
                  </span>
                  {isKey ? <Star className="h-3 w-3 fill-current text-primary" /> : null}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.28 }}
          className="rounded-xl border border-border bg-card p-4"
        >
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
        </motion.div>
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
                whileHover={{ y: -2 }}
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
                    <motion.div
                      animate={!isDone ? { rotate: [0, -3, 3, 0] } : {}}
                      transition={!isDone ? { delay: index * 0.03, duration: 0.35 } : undefined}
                    >
                      <TypeIcon className="h-4 w-4" />
                    </motion.div>
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
                        className={`h-4 px-1.5 py-0 text-[10px] ${
                          intensityStyles[session.intensityCategory] ?? "bg-secondary text-foreground"
                        }`}
                      >
                        {intensityLabels[session.intensityCategory] ?? session.intensityCategory}
                      </Badge>
                      <Badge variant="outline" className={`h-4 px-1.5 py-0 text-[10px] ${config.badgeClass}`}>
                        {modalityLabels[session.modality] ?? config.label}
                      </Badge>
                      {isKey ? (
                        <Badge
                          variant="outline"
                          className="h-4 border-primary/30 bg-primary/5 px-1.5 py-0 text-[10px] text-primary"
                        >
                          ★ Key
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
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-muted-foreground/50"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </motion.div>
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
