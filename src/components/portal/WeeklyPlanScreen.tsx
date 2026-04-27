import { useEffect, useMemo, useRef, useState } from "react";
import { differenceInCalendarWeeks, format, parseISO } from "date-fns";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Flag,
  CalendarOff,
  Check,
  ChevronDown,
  Clock,
  Dumbbell,
  MessageCircle,
  Moon,
  RefreshCcw,
  Sparkles,
  Star,
  StretchHorizontal,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCurrentUserWeeklyCoachScreen,
  setCurrentUserWeeklyCoachSessionCompletion,
  type CurrentUserWeeklyCoachScreen,
  type WeeklyCoachSession,
} from "@/lib/portal-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import WeekNavigator from "@/components/portal/WeekNavigator";

type WeeklyPlanScreenProps = {
  athleteId: string;
  targetWeekStartDate: string;
  isPreparing: boolean;
  onRefresh: () => void | Promise<unknown>;
};

const weekDayOrder = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

const shortDayLabels: Record<string, string> = {
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
  SUN: "Sun",
};

const intensityLabels: Record<string, string> = {
  LOW: "Low",
  MODERATE: "Moderate",
  HIGH: "High",
  REST: "Rest",
};

const intensityDot: Record<string, string> = {
  REST: "bg-muted-foreground/30",
  LOW: "bg-primary/60",
  MODERATE: "bg-accent",
  HIGH: "bg-destructive",
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

const raceProgressPhases = [
  { name: "BASE", weeks: [1, 8] },
  { name: "BUILD", weeks: [9, 16] },
  { name: "PEAK", weeks: [17, 20] },
  { name: "TAPER", weeks: [21, 22] },
] as const;

const screenShellClassName = "mx-auto max-w-2xl space-y-4";

function formatWeekType(weekType: string) {
  if (!weekType) return "Planned week";
  return weekType
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function shortDayLabel(day: string) {
  return shortDayLabels[day] ?? day;
}

function dayOrderIndex(day: string) {
  const index = weekDayOrder.findIndex((item) => item === day);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function dayCodeForDate(date: Date) {
  return weekDayOrder[(date.getDay() + 6) % 7];
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

function WeekPulse({
  sessions,
  todayDay,
  isCurrentWeek,
  isPastWeek,
  onSelectDay,
  reduceMotion,
}: {
  sessions: WeeklyCoachSession[];
  todayDay: string | undefined;
  isCurrentWeek: boolean;
  isPastWeek: boolean;
  onSelectDay: (day: string) => void;
  reduceMotion: boolean;
}) {
  const todayIndex = todayDay ? sessions.findIndex((session) => session.day === todayDay) : -1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.05 }}
      className="grid grid-cols-7 gap-1.5"
    >
      {sessions.map((session, index) => {
        const isDone = session.completed === true;
        const isToday = isCurrentWeek && session.day === todayDay;
        const isPastCell = isCurrentWeek ? todayIndex >= 0 && index < todayIndex : isPastWeek;
        const isRest = session.modality === "REST";
        const config = typeConfig[session.modality] ?? typeConfig.RUN;
        const TypeIcon = config.icon;

        return (
          <motion.button
            key={session.day}
            type="button"
            onClick={() => onSelectDay(session.day)}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + index * 0.03 }}
            whileHover={reduceMotion ? undefined : { y: -2 }}
            className="group flex min-w-0 flex-col items-center gap-1.5 rounded-lg p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title={`${shortDayLabel(session.day)} - ${session.title}`}
          >
            <span
              className={`text-[10px] font-medium uppercase tracking-wide transition-colors ${
                isToday ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              }`}
            >
              {shortDayLabel(session.day).slice(0, 1)}
            </span>
            <span
              className={`relative flex aspect-square w-full max-w-11 items-center justify-center rounded-lg transition-all ${
                isDone
                  ? "bg-primary text-primary-foreground"
                  : isToday
                    ? "bg-primary/10 text-primary ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
                    : isRest
                      ? "bg-muted/40 text-muted-foreground/50"
                      : isPastCell
                        ? "border border-destructive/15 bg-destructive/10 text-destructive/60"
                        : "bg-secondary/60 text-muted-foreground group-hover:bg-secondary group-hover:text-foreground"
              }`}
            >
              {isDone ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <TypeIcon className="h-3.5 w-3.5" />}
              {session.role === "KEY" && !isDone ? (
                <Star className="absolute -right-1 -top-1 h-2.5 w-2.5 fill-accent text-accent" />
              ) : null}
              {isToday && !reduceMotion ? (
                <motion.span
                  className="absolute inset-0 rounded-lg ring-2 ring-primary/40"
                  initial={{ opacity: 0.6, scale: 1 }}
                  animate={{ opacity: 0, scale: 1.25 }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                />
              ) : null}
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}

function TodayPendingCard({
  session,
  expanded,
  canComplete,
  isPending,
  onToggleExpanded,
  onComplete,
}: {
  session: WeeklyCoachSession;
  expanded: boolean;
  canComplete: boolean;
  isPending: boolean;
  onToggleExpanded: () => void;
  onComplete: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const config = typeConfig[session.modality] ?? typeConfig.RUN;
  const TypeIcon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ type: "spring", bounce: 0.22, duration: 0.55 }}
      className="group relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.07] via-card to-card shadow-card"
    >
      {!reduceMotion ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}

      <div className="relative p-5">
        <div className="mb-4 inline-flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {!reduceMotion ? (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            ) : null}
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Today</span>
          <span className="text-xs text-muted-foreground/40">-</span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {config.label}
          </span>
          {session.role === "KEY" ? (
            <span className="ml-1 inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-accent">
              <Star className="h-2.5 w-2.5 fill-accent" />
              Key
            </span>
          ) : null}
        </div>

        <div className="flex items-start gap-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.08, type: "spring", bounce: 0.4 }}
            className={`shrink-0 rounded-2xl border bg-gradient-to-br p-3.5 ${config.gradient} ${config.tileClass}`}
          >
            <TypeIcon className="h-6 w-6" strokeWidth={2} />
          </motion.div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="font-serif text-lg leading-tight tracking-tight text-foreground sm:text-xl">
              {session.title}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium tabular-nums text-foreground/70">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {session.durationMinutes} min
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-foreground/70">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    intensityDot[session.intensityCategory] ?? "bg-muted-foreground/30"
                  }`}
                />
                {intensityLabels[session.intensityCategory] ?? session.intensityCategory}
              </span>
            </div>
          </div>
        </div>

        {(session.notes || session.strengthFocus?.length) ? (
          <div className="mt-4 pl-16">
            {session.notes ? <p className="text-[13px] leading-relaxed text-foreground/75">{session.notes}</p> : null}
            <AnimatePresence initial={false}>
              {expanded && session.strengthFocus?.length ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {session.strengthFocus.map((focus) => (
                      <Badge
                        key={focus}
                        variant="outline"
                        className="h-5 bg-background/70 px-2 py-0 text-[10px] font-normal"
                      >
                        {focus}
                      </Badge>
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
            {session.strengthFocus?.length ? (
              <button
                type="button"
                onClick={onToggleExpanded}
                className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                aria-expanded={expanded}
              >
                {expanded ? "Show less" : "Show focus"}
                <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="h-3 w-3" />
                </motion.span>
              </button>
            ) : null}
          </div>
        ) : null}

        {canComplete ? (
          <motion.button
            type="button"
            whileHover={reduceMotion ? undefined : { scale: 1.005 }}
            whileTap={reduceMotion ? undefined : { scale: 0.985 }}
            onClick={onComplete}
            disabled={isPending}
            className="group/btn relative mt-5 inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary text-sm font-semibold tracking-wide text-primary-foreground shadow-sm transition-shadow hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            {!reduceMotion ? (
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover/btn:translate-x-full" />
            ) : null}
            <Check className="relative h-4 w-4" strokeWidth={2.75} />
            <span className="relative">{isPending ? "Saving" : "Mark as complete"}</span>
            <ArrowRight className="relative h-3.5 w-3.5 opacity-70 transition-transform group-hover/btn:translate-x-0.5" />
          </motion.button>
        ) : null}
      </div>
    </motion.div>
  );
}

function TodayDoneCard({
  session,
  upNext,
  canToggleCompletion,
  onUndo,
  onJumpNext,
}: {
  session: WeeklyCoachSession;
  upNext: WeeklyCoachSession | undefined;
  canToggleCompletion: boolean;
  onUndo: () => void;
  onJumpNext: (day: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-card"
    >
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
              <Check className="h-4 w-4" strokeWidth={3} />
            </motion.div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">Today done</span>
              </div>
              <p className="mt-0.5 truncate text-sm font-medium text-foreground/90 line-through decoration-muted-foreground/40">
                {session.title}
              </p>
            </div>
          </div>
          {canToggleCompletion ? (
            <button
              type="button"
              onClick={onUndo}
              className="rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              Undo
            </button>
          ) : null}
        </div>

        {upNext ? (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            onClick={() => onJumpNext(upNext.day)}
            whileHover={{ x: 2 }}
            className="group mt-4 flex w-full items-center gap-3 border-t border-border pt-3 text-left"
          >
            <div
              className={`shrink-0 rounded-lg border bg-gradient-to-br p-2 ${
                (typeConfig[upNext.modality] ?? typeConfig.RUN).gradient
              } ${(typeConfig[upNext.modality] ?? typeConfig.RUN).tileClass}`}
            >
              {(() => {
                const UpNextIcon = (typeConfig[upNext.modality] ?? typeConfig.RUN).icon;
                return <UpNextIcon className="h-3.5 w-3.5" />;
              })()}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Up next - {shortDayLabel(upNext.day)}
              </span>
              <p className="truncate text-[13px] text-foreground transition-colors group-hover:text-primary">
                {upNext.title}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 text-[11px] tabular-nums text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{upNext.durationMinutes} min</span>
              <ArrowRight className="ml-1 h-3.5 w-3.5 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-[12px] text-muted-foreground"
          >
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span>All planned sessions are complete for this week.</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function WeekMetrics({
  last7dDistanceKm,
  longRunMinutes,
  sleepHours,
}: {
  last7dDistanceKm: number | undefined;
  longRunMinutes: number | undefined;
  sleepHours: number | undefined;
}) {
  const sleepStatus = deriveSleepStatus(sleepHours);
  const metrics = [
    {
      label: "Volume",
      value: formatDecimal(last7dDistanceKm),
      unit: typeof last7dDistanceKm === "number" ? "km" : "",
      valueClassName: "text-foreground",
    },
    {
      label: "Long run",
      value: typeof longRunMinutes === "number" ? String(longRunMinutes) : "—",
      unit: typeof longRunMinutes === "number" ? "min" : "",
      valueClassName: "text-foreground",
    },
    {
      label: "Sleep avg",
      value: formatDecimal(sleepHours),
      unit: typeof sleepHours === "number" ? "h" : "",
      valueClassName: sleepStatus.valueToneClass,
    },
  ];

  return (
    <motion.section
      className="space-y-2"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      aria-label="This week metrics"
    >
      <div className="px-1">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">This week</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-3 divide-x divide-border">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              className="flex min-w-0 flex-col items-center justify-center px-2 py-3 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.22 + index * 0.04 }}
            >
              <div className="flex max-w-full items-baseline gap-0.5">
                <span className={`truncate text-lg font-bold leading-none tabular-nums ${metric.valueClassName}`}>
                  {metric.value}
                </span>
                {metric.unit ? <span className="text-[10px] text-muted-foreground">{metric.unit}</span> : null}
              </div>
              <span className="mt-1 text-[10px] text-muted-foreground">{metric.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function RoadToRace({
  goal,
  raceGoalDateLabel,
}: {
  goal: CurrentUserWeeklyCoachScreen["goal"];
  raceGoalDateLabel: string | undefined;
}) {
  if (!goal) return null;

  const activePhase = (goal.phase || "BASE").toUpperCase();
  const activePhaseIndex = raceProgressPhases.findIndex((phase) => phase.name === activePhase);
  const normalizedPhaseIndex = activePhaseIndex === -1 ? 0 : activePhaseIndex;

  return (
    <motion.section
      className="space-y-2"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28 }}
      aria-label="Road to race"
    >
      <div className="px-1">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Road to race</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-start gap-2.5 px-4 pb-3 pt-3.5">
          <div className="shrink-0 rounded-lg border border-accent/15 bg-accent/10 p-1.5">
            <Flag className="h-3.5 w-3.5 text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight text-foreground">{goal.primaryGoal.name}</p>
            {raceGoalDateLabel ? <p className="mt-0.5 text-[11px] text-muted-foreground">{raceGoalDateLabel}</p> : null}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-base font-bold leading-none tabular-nums text-foreground">
              {goal.daysToGoal}
              <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">d</span>
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">to go</p>
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="mb-1.5 flex gap-1">
            {raceProgressPhases.map((phase, index) => {
              const isActive = index === normalizedPhaseIndex;
              const isPast = index < normalizedPhaseIndex;
              return (
                <motion.div
                  key={phase.name}
                  initial={{ scaleX: 0.3, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ delay: 0.35 + index * 0.05, duration: 0.35 }}
                  style={{ transformOrigin: "left" }}
                  className={`h-1.5 flex-1 rounded-full ${
                    isActive ? "bg-primary" : isPast ? "bg-primary/30" : "bg-border"
                  }`}
                />
              );
            })}
          </div>
          <div className="grid grid-cols-4 gap-1">
            {raceProgressPhases.map((phase, index) => (
              <span
                key={phase.name}
                className={`text-[9px] font-medium tracking-wider ${
                  index === normalizedPhaseIndex ? "text-primary" : "text-muted-foreground/60"
                }`}
              >
                {phase.name}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-border bg-muted/20 px-4 py-2.5">
          <TrendingUp className="h-3 w-3 shrink-0 text-primary" />
          <span className="text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">{goal.phase}</span> phase
          </span>
          <span className="ml-auto truncate text-[11px] text-muted-foreground">{goal.goalSummary}</span>
        </div>
      </div>
    </motion.section>
  );
}

function ScheduleList({
  sessions,
  todayDay,
  isCurrentWeek,
  supportsCompletion,
  completionPending,
  expandedDay,
  justCompletedDay,
  reduceMotion,
  onToggleComplete,
  onToggleExpanded,
  setSessionRef,
}: {
  sessions: WeeklyCoachSession[];
  todayDay: string | undefined;
  isCurrentWeek: boolean;
  supportsCompletion: boolean;
  completionPending: boolean;
  expandedDay: string | null;
  justCompletedDay: string | null;
  reduceMotion: boolean;
  onToggleComplete: (day: string) => void;
  onToggleExpanded: (day: string) => void;
  setSessionRef: (day: string, element: HTMLDivElement | null) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="px-1">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Schedule</span>
      </div>

      <div className="relative">
        <div className="absolute bottom-2 left-[1.05rem] top-2 w-px bg-border" aria-hidden />

        <AnimatePresence mode="wait">
          <motion.div
            className="relative space-y-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {sessions.map((session, index) => {
              const isDone = session.completed === true;
              const isRest = session.modality === "REST";
              const isKey = session.role === "KEY";
              const isToday = isCurrentWeek && session.day === todayDay;
              const expanded = expandedDay === session.day;
              const config = typeConfig[session.modality] ?? typeConfig.RUN;
              const TypeIcon = config.icon;
              const canToggle = supportsCompletion && isCurrentWeek && !completionPending && !isRest;

              return (
                <motion.div
                  key={session.day}
                  ref={(element) => setSessionRef(session.day, element)}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.3 }}
                  className={`group relative ${isRest && !isDone ? "opacity-60" : ""}`}
                >
                  <div
                    className={`relative flex items-center gap-3 rounded-xl py-2.5 pl-2 pr-3 transition-all ${
                      !isRest ? "cursor-pointer select-none" : ""
                    } ${
                      isToday
                        ? "bg-primary/[0.06] ring-1 ring-primary/20"
                        : expanded
                          ? "bg-card shadow-sm ring-1 ring-border"
                          : isDone
                            ? "bg-primary/[0.03] hover:bg-primary/[0.06]"
                            : "hover:bg-card/80"
                    }`}
                    onClick={() => {
                      if (!isRest) onToggleExpanded(session.day);
                    }}
                  >
                    <motion.button
                      type="button"
                      className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                        isDone
                          ? "border-primary bg-primary text-primary-foreground"
                          : isToday
                            ? "border-primary/60 bg-background hover:bg-primary/10"
                            : isRest
                              ? "border-border bg-background"
                              : "border-border bg-background hover:border-primary/40"
                      }`}
                      whileTap={canToggle && !reduceMotion ? { scale: 0.85 } : undefined}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (canToggle) onToggleComplete(session.day);
                      }}
                      disabled={!canToggle}
                      aria-label={isDone ? `Mark ${session.title} as incomplete` : `Mark ${session.title} as complete`}
                    >
                      {isDone ? (
                        <>
                          {justCompletedDay === session.day && !reduceMotion ? (
                            <motion.span
                              className="absolute inset-0 rounded-full bg-primary"
                              initial={{ opacity: 0.4, scale: 1 }}
                              animate={{ opacity: 0, scale: 2.2 }}
                              transition={{ duration: 0.7, ease: "easeOut" }}
                            />
                          ) : null}
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </motion.div>
                        </>
                      ) : isRest ? (
                        <Moon className="h-2.5 w-2.5 text-muted-foreground/40" />
                      ) : null}
                    </motion.button>

                    <div className="w-8 shrink-0">
                      <span className={`text-[11px] font-medium tracking-wide ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                        {shortDayLabel(session.day)}
                      </span>
                    </div>

                    <div className={`shrink-0 rounded-lg p-1.5 ${config.badgeClass}`}>
                      <TypeIcon className="h-3.5 w-3.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className={`block truncate text-sm ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {session.title}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {isKey && !isDone ? (
                        <Badge
                          variant="outline"
                          className="h-4 gap-0.5 border-accent/40 px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider text-accent"
                        >
                          <Star className="h-2.5 w-2.5 fill-accent" />
                          Key
                        </Badge>
                      ) : null}
                      {session.durationMinutes > 0 ? (
                        <span className="text-[11px] tabular-nums text-muted-foreground">{session.durationMinutes} min</span>
                      ) : null}
                      {!isRest ? (
                        <motion.div
                          animate={{ rotate: expanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-muted-foreground/40 transition-colors group-hover:text-muted-foreground"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </motion.div>
                      ) : null}
                    </div>
                  </div>

                  <AnimatePresence>
                    {expanded && (session.notes || session.strengthFocus?.length) ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className="pb-3 pl-[4.5rem] pr-3 pt-1.5">
                          {session.notes ? (
                            <p className="text-[13px] leading-relaxed text-foreground/75">{session.notes}</p>
                          ) : null}
                          <div className="mt-2.5 flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1 rounded-md bg-secondary/60 px-1.5 py-0.5">
                              <div
                                className={`h-1.5 w-1.5 rounded-full ${
                                  intensityDot[session.intensityCategory] ?? "bg-muted-foreground/30"
                                }`}
                              />
                              <span className="text-[10px] text-muted-foreground">
                                {intensityLabels[session.intensityCategory] ?? session.intensityCategory}
                              </span>
                            </div>
                            {session.strengthFocus?.map((focus) => (
                              <span key={focus} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                                {focus}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function WeeklyPlanScreen({
  athleteId: _athleteId,
  targetWeekStartDate,
  isPreparing,
  onRefresh,
}: WeeklyPlanScreenProps) {
  const [selectedWeekStartDate, setSelectedWeekStartDate] = useState(targetWeekStartDate);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [justCompletedDay, setJustCompletedDay] = useState<string | null>(null);
  const sessionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const reduceMotion = useReducedMotion();
  const queryClient = useQueryClient();

  useEffect(() => {
    setSelectedWeekStartDate(targetWeekStartDate);
  }, [targetWeekStartDate]);

  const screenQuery = useQuery({
    queryKey: ["portal", "weekly-coach-screen", selectedWeekStartDate],
    queryFn: () => getCurrentUserWeeklyCoachScreen(selectedWeekStartDate),
    enabled: Boolean(selectedWeekStartDate) && !(isPreparing && selectedWeekStartDate === targetWeekStartDate),
    retry: false,
  });

  const completionMutation = useMutation({
    mutationFn: ({
      weekStartDate,
      day,
      completed,
    }: {
      weekStartDate: string;
      day: string;
      completed: boolean;
    }) => setCurrentUserWeeklyCoachSessionCompletion(weekStartDate, day, completed),
    onMutate: async ({ day, completed }) => {
      await queryClient.cancelQueries({
        queryKey: ["portal", "weekly-coach-screen", selectedWeekStartDate],
      });

      const previousScreen = queryClient.getQueryData<CurrentUserWeeklyCoachScreen>([
        "portal",
        "weekly-coach-screen",
        selectedWeekStartDate,
      ]);

      queryClient.setQueryData<CurrentUserWeeklyCoachScreen>(
        ["portal", "weekly-coach-screen", selectedWeekStartDate],
        (current) => {
          if (!current?.plan) return current;

          return {
            ...current,
            plan: {
              ...current.plan,
              plan: {
                ...current.plan.plan,
                sessions: current.plan.plan.sessions.map((session) =>
                  session.day === day ? { ...session, completed } : session,
                ),
              },
            },
          };
        },
      );

      return { previousScreen };
    },
    onError: (_error, _variables, context) => {
      if (!context?.previousScreen) return;

      queryClient.setQueryData(
        ["portal", "weekly-coach-screen", selectedWeekStartDate],
        context.previousScreen,
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["portal", "weekly-coach-screen", selectedWeekStartDate],
      });
    },
  });

  useEffect(() => {
    setExpandedDay(null);
  }, [selectedWeekStartDate]);

  const screen = screenQuery.data;
  const plan = screen?.plan;
  const isCurrentWeek = screen
    ? screen.selectedWeekStartDate === screen.todayWeekStartDate
    : selectedWeekStartDate === targetWeekStartDate;
  const isFutureWeek = screen
    ? differenceInCalendarWeeks(
        parseISO(screen.selectedWeekStartDate),
        parseISO(screen.todayWeekStartDate),
      ) > 0
    : selectedWeekStartDate > targetWeekStartDate;
  const isPastWeek = screen
    ? differenceInCalendarWeeks(
        parseISO(screen.selectedWeekStartDate),
        parseISO(screen.todayWeekStartDate),
      ) < 0
    : selectedWeekStartDate < targetWeekStartDate;
  const weekRangeLabel = useMemo(() => {
    if (!selectedWeekStartDate) return undefined;

    const start = parseISO(selectedWeekStartDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  }, [selectedWeekStartDate]);

  const toggleComplete = (day: string) => {
    if (!isCurrentWeek) return;
    const currentScreen = screenQuery.data;
    const session = currentScreen?.plan?.plan.sessions.find((item) => item.day === day);
    const weekStartDate = currentScreen?.plan?.weekStartDate ?? currentScreen?.selectedWeekStartDate;
    if (!session || !weekStartDate || typeof session.completed !== "boolean") return;

    if (!session.completed) {
      setJustCompletedDay(day);
      window.setTimeout(() => setJustCompletedDay(null), 900);
    }

    completionMutation.mutate({
      weekStartDate,
      day,
      completed: !session.completed,
    });
  };

  const scrollToDay = (day: string) => {
    setExpandedDay(day);
    window.requestAnimationFrame(() => {
      sessionRefs.current[day]?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    });
  };

  const header = (
    <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <motion.h2
            className="font-serif text-3xl text-foreground"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            Your Week
          </motion.h2>
          {plan ? (
            <motion.span
              className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.12 }}
            >
              <span>{formatWeekType(plan.plan.weekType)} week</span>
              <span>·</span>
              <span>{plan.summary.phase ?? screen?.goal?.phase ?? "Training"} phase</span>
            </motion.span>
          ) : null}
        </div>
      </div>
      <WeekNavigator
        currentWeekOffsetLabel={
          screen
            ? screen.selectedWeekStartDate === screen.todayWeekStartDate
              ? "This week"
              : isFutureWeek
                ? "Future"
                : `${Math.abs(
                    differenceInCalendarWeeks(
                      parseISO(screen.selectedWeekStartDate),
                      parseISO(screen.todayWeekStartDate),
                    ),
                  )}w ago`
            : "Current"
        }
        onPrevious={() => {
          if (screen?.previousWeekStartDate) setSelectedWeekStartDate(screen.previousWeekStartDate);
        }}
        onNext={() => {
          if (screen?.nextWeekStartDate) setSelectedWeekStartDate(screen.nextWeekStartDate);
        }}
        onCurrent={() => setSelectedWeekStartDate(screen?.todayWeekStartDate ?? targetWeekStartDate)}
        weekLabel={weekRangeLabel ?? ""}
        canGoPrevious={screen?.canGoPrevious ?? false}
        canGoNext={screen?.canGoNext ?? false}
        showReturnToCurrent={selectedWeekStartDate !== (screen?.todayWeekStartDate ?? targetWeekStartDate)}
      />
    </motion.div>
  );

  if (isPreparing && isCurrentWeek) {
    return (
      <div className={screenShellClassName}>
        {header}
        <div className="rounded-2xl border border-divider bg-card p-6 shadow-card">
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
            disabled={screenQuery.isFetching}
          >
            {screenQuery.isFetching ? (
              <>
                <RefreshCcw className="mr-2 h-3.5 w-3.5 animate-spin" />
                Refreshing
              </>
            ) : (
              "Refresh"
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (screenQuery.isLoading) {
    return (
      <div className={screenShellClassName}>
        {header}
        <div className="rounded-2xl border border-divider bg-card p-6 shadow-card">
          <p className="text-sm text-muted-foreground">Loading your weekly plan…</p>
        </div>
      </div>
    );
  }

  if (screenQuery.isError) {
    return (
      <div className={screenShellClassName}>
        {header}
        <div className="rounded-2xl border border-divider bg-card p-6 shadow-card">
          <h2 className="font-serif text-2xl text-foreground">We couldn't load your weekly plan</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Refresh the portal in a moment. Your weekly plan is served from the coach backend and may still be syncing.
          </p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className={screenShellClassName}>
        {header}
        {isFutureWeek ? (
          <motion.div
            className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <CalendarOff className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No plan yet</p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground/60">
              Future plans are generated automatically at the end of each week based on your recent training context.
            </p>
          </motion.div>
        ) : isPastWeek ? (
          <motion.div
            className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <CalendarOff className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No data for this week</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Historical weekly plan data is not available here yet.
            </p>
          </motion.div>
        ) : (
          <div className="rounded-2xl border border-divider bg-card p-6 shadow-card">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-secondary p-2 text-muted-foreground">
                <RefreshCcw className="h-4 w-4 animate-pulse" />
              </div>
              <div>
                <h2 className="font-serif text-2xl text-foreground">We&apos;re syncing your weekly plan</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  The portal knows which week to show, but the plan is not readable yet. Refresh in a moment and
                  we&apos;ll check again.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
            className="mt-5"
            onClick={() => onRefresh()}
            disabled={screenQuery.isFetching}
          >
              {screenQuery.isFetching ? (
                <>
                  <RefreshCcw className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Refreshing
                </>
              ) : (
                "Refresh"
              )}
            </Button>
          </div>
        )}
      </div>
    );
  }

  const sessions = [...plan.plan.sessions].sort((a, b) => dayOrderIndex(a.day) - dayOrderIndex(b.day));
  const supportsCompletion = sessions.some((session) => typeof session.completed === "boolean");
  const derivedTodayDay = isCurrentWeek ? dayCodeForDate(new Date()) : undefined;
  const todayDay = isCurrentWeek ? screen?.todaySessionDay ?? derivedTodayDay : undefined;
  const todayIndex = todayDay ? sessions.findIndex((session) => session.day === todayDay) : -1;
  const derivedUpNextDay =
    isCurrentWeek && todayIndex >= 0
      ? sessions
          .slice(todayIndex + 1)
          .find((session) => session.modality !== "REST" && session.completed !== true)?.day
      : undefined;
  const upNextDay = isCurrentWeek ? screen?.upNextSessionDay ?? derivedUpNextDay : undefined;
  const todaySession = todayDay ? sessions.find((session) => session.day === todayDay) : undefined;
  const upNextSession = upNextDay ? sessions.find((session) => session.day === upNextDay) : undefined;
  const showTodayHero = Boolean(isCurrentWeek && todaySession);
  const goal = screen?.goal;
  const raceGoalDateLabel = goal?.primaryGoal.eventDate
    ? format(parseISO(goal.primaryGoal.eventDate), "MMM d, yyyy")
    : undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {header}
      <div className="space-y-4">
        <WeekPulse
          sessions={sessions}
          todayDay={todayDay}
          isCurrentWeek={isCurrentWeek}
          isPastWeek={isPastWeek}
          onSelectDay={scrollToDay}
          reduceMotion={Boolean(reduceMotion)}
        />

        {showTodayHero && todaySession ? (
          <AnimatePresence mode="wait">
            {supportsCompletion && todaySession.completed === true ? (
              <TodayDoneCard
                key="today-done"
                session={todaySession}
                upNext={upNextSession}
                canToggleCompletion={supportsCompletion}
                onUndo={() => toggleComplete(todaySession.day)}
                onJumpNext={scrollToDay}
              />
            ) : (
              <TodayPendingCard
                key="today-pending"
                session={todaySession}
                expanded={expandedDay === todaySession.day}
                canComplete={supportsCompletion}
                isPending={completionMutation.isPending}
                onToggleExpanded={() => setExpandedDay(expandedDay === todaySession.day ? null : todaySession.day)}
                onComplete={() => toggleComplete(todaySession.day)}
              />
            )}
          </AnimatePresence>
        ) : null}

        <motion.div
          className="relative rounded-xl border border-primary/10 bg-primary/4 px-4 py-3.5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          key={`coach-${screen?.selectedWeekStartDate ?? selectedWeekStartDate}`}
        >
          <div className="flex gap-2.5">
            <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <p className="text-[12px] leading-relaxed text-foreground/80">{plan.plan.weekObjective}</p>
          </div>
        </motion.div>

        <WeekMetrics
          last7dDistanceKm={plan.summary.last7dDistanceKm}
          longRunMinutes={screen?.highlights.longRun?.durationMinutes}
          sleepHours={plan.summary.sleepHours}
        />

        <RoadToRace goal={goal} raceGoalDateLabel={raceGoalDateLabel} />

        <ScheduleList
          sessions={sessions}
          todayDay={todayDay}
          isCurrentWeek={isCurrentWeek}
          supportsCompletion={supportsCompletion}
          completionPending={completionMutation.isPending}
          expandedDay={expandedDay}
          justCompletedDay={justCompletedDay}
          reduceMotion={Boolean(reduceMotion)}
          onToggleComplete={toggleComplete}
          onToggleExpanded={(day) => setExpandedDay(expandedDay === day ? null : day)}
          setSessionRef={(day, element) => {
            sessionRefs.current[day] = element;
          }}
        />
      </div>
    </div>
  );
}
