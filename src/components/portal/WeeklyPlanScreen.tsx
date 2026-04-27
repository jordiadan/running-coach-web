import { useEffect, useMemo, useRef, useState } from "react";
import { differenceInCalendarWeeks, format, parseISO } from "date-fns";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BedDouble,
  Flag,
  CalendarOff,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  Flame,
  MessageCircle,
  Moon,
  RefreshCcw,
  Route,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import WeekNavigator from "@/components/portal/WeekNavigator";

type WeeklyPlanScreenProps = {
  athleteId: string;
  targetWeekStartDate: string;
  isPreparing: boolean;
  onRefresh: () => void | Promise<unknown>;
};

const modalityLabels: Record<string, string> = {
  RUN: "Run",
  STRENGTH: "Strength",
  REST: "Rest",
  MOBILITY: "Mobility",
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

const intensityDot: Record<string, string> = {
  REST: "bg-muted-foreground/30",
  LOW: "bg-primary/60",
  MODERATE: "bg-accent",
  HIGH: "bg-destructive",
};

const roleLabels: Record<string, string> = {
  KEY: "Key",
  SUPPORTING: "Supporting",
  RECOVERY: "Recovery",
};

const roleStyles: Record<string, string> = {
  KEY: "border-primary/30 bg-primary/5 text-primary",
  SUPPORTING: "border-border bg-secondary/60 text-foreground",
  RECOVERY: "border-muted-foreground/20 bg-muted/60 text-muted-foreground",
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
    dashboardGlowClass: string;
  }
> = {
  BUILD: {
    dashboardGlowClass: "from-primary/12 via-primary/4 to-transparent",
  },
  DELOAD: {
    dashboardGlowClass: "from-accent/12 via-accent/4 to-transparent",
  },
  MAINTENANCE: {
    dashboardGlowClass: "from-secondary via-secondary/50 to-transparent",
  },
  SHARPEN: {
    dashboardGlowClass: "from-destructive/12 via-destructive/4 to-transparent",
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

function totalPlannedMinutes(sessions: WeeklyCoachSession[]) {
  return sessions.reduce((total, session) => total + session.durationMinutes, 0);
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
  const completedMinutes = sessions
    .filter((session) => session.completed === true)
    .reduce((total, session) => total + session.durationMinutes, 0);
  const completedCount = sessions.filter((session) => session.completed === true).length;
  const progressPercent = sessions.length > 0 ? Math.round((completedCount / sessions.length) * 100) : 0;
  const currentWeekType = plan.plan.weekType || "";
  const currentWeekTypeConfig = weekTypeConfig[currentWeekType] ?? {
    dashboardGlowClass: "from-muted via-muted/50 to-transparent",
  };
  const sleepStatus = deriveSleepStatus(plan.summary.sleepHours);
  const goal = screen?.goal;
  const raceGoalDateLabel = goal?.primaryGoal.eventDate
    ? format(parseISO(goal.primaryGoal.eventDate), "MMM d, yyyy")
    : undefined;
  const dashboardStats = [
    {
      icon: Route,
      label: "Volume",
      value:
        typeof plan.summary.last7dDistanceKm === "number"
          ? `${formatDecimal(plan.summary.last7dDistanceKm)} km`
          : "—",
      valueToneClass: "text-foreground",
      iconToneClass: "text-muted-foreground",
    },
    {
      icon: Flame,
      label: "Long run",
      value: screen?.highlights.longRun
        ? `${screen.highlights.longRun.durationMinutes} min`
        : "—",
      valueToneClass: "text-foreground",
      iconToneClass: "text-muted-foreground",
    },
    {
      icon: BedDouble,
      label: "Avg sleep",
      value:
        typeof plan.summary.sleepHours === "number"
          ? `${formatDecimal(plan.summary.sleepHours)}h`
          : "—",
      valueToneClass: sleepStatus.valueToneClass,
      iconToneClass: sleepStatus.iconToneClass,
    },
  ];

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

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-2xl border border-border bg-card"
        >
          {goal ? (
            <div className="border-b border-border bg-muted/20 px-5 py-3">
              <div className="mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flag className="h-3.5 w-3.5 text-accent" />
                  <span className="text-sm font-semibold text-foreground">{goal.primaryGoal.name}</span>
                  {raceGoalDateLabel ? (
                    <span className="text-xs text-muted-foreground">· {raceGoalDateLabel}</span>
                  ) : null}
                </div>
                <span className="text-xs font-medium text-accent">{goal.daysToGoal}d to go</span>
              </div>
              <div className="flex gap-1">
                {raceProgressPhases.map((phase) => {
                  const activePhase = (goal.phase || "BASE").toUpperCase();
                  const activeIndex = raceProgressPhases.findIndex((item) => item.name === activePhase);
                  const currentIndex = raceProgressPhases.findIndex((item) => item.name === phase.name);
                  const isActive = activePhase === phase.name;
                  const isPast = activeIndex > currentIndex;

                  return (
                    <div key={phase.name} className="flex flex-1 flex-col items-center gap-0.5">
                      <div
                        className={`h-1.5 w-full rounded-full transition-colors ${
                          isActive ? "bg-primary" : isPast ? "bg-primary/30" : "bg-border"
                        }`}
                      />
                      <span
                        className={`text-[9px] font-medium ${
                          isActive
                            ? "text-primary"
                            : isPast
                              ? "text-muted-foreground"
                              : "text-muted-foreground/50"
                        }`}
                      >
                        {phase.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45 }}
            className={`pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-r ${currentWeekTypeConfig.dashboardGlowClass}`}
          />
          <div className="p-5">
            <div className="grid grid-cols-3 divide-x divide-border rounded-xl bg-muted/50">
              {dashboardStats.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * index, duration: 0.22 }}
                  className="flex min-w-0 flex-col items-center px-2.5 py-3 text-center"
                >
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] leading-tight text-muted-foreground">
                    <item.icon className={`h-3.5 w-3.5 shrink-0 ${item.iconToneClass}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <div className="min-w-0 max-w-full">
                    <p className={`truncate text-sm font-semibold leading-tight tabular-nums ${item.valueToneClass}`}>
                      {item.value}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </motion.div>

        <motion.div
          className="relative rounded-xl border border-primary/10 bg-primary/4 px-4 py-3.5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          key={`coach-${screen?.selectedWeekStartDate ?? selectedWeekStartDate}`}
        >
          <div className="flex gap-3">
            <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-[13px] leading-relaxed text-foreground">{plan.plan.weekObjective}</p>
          </div>
        </motion.div>

        {supportsCompletion ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.28 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Progress</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>
                  {completedCount}/{sessions.length} sessions
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
        ) : null}

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

      </div>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Sessions</p>
        <div className="space-y-3">
          {sessions.map((session, index) => {
            const isDone = session.completed === true;
            const isRest = session.modality === "REST";
            const isKey = session.role === "KEY";
            const isToday = session.day === todayDay;
            const isUpNext = session.day === upNextDay;
            const isTodayHeroSession = showTodayHero && isToday;
            const isExpanded = expandedDay === session.day && !isTodayHeroSession;
            const config = typeConfig[session.modality] ?? typeConfig.RUN;
            const TypeIcon = config.icon;

            return (
              <motion.div
                key={session.day}
                ref={(element) => {
                  sessionRefs.current[session.day] = element;
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.25 }}
                whileHover={{ y: -2 }}
                className={`relative overflow-hidden rounded-xl border transition-all duration-200 ${
                  isDone
                    ? "border-primary/20 bg-primary/5"
                    : sessionCardStyles[session.modality] ?? "border-border bg-card"
                } ${isToday ? "ring-1 ring-primary/25" : isUpNext ? "ring-1 ring-accent/20" : ""} ${
                  isRest && !isDone ? "opacity-60" : ""
                }`}
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
                  {supportsCompletion ? (
                    <div
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                    >
                      <Checkbox
                        checked={isDone}
                        className="h-5 w-5 rounded-md"
                        disabled={!isCurrentWeek || completionMutation.isPending}
                        onCheckedChange={() => toggleComplete(session.day)}
                      />
                    </div>
                  ) : null}

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
                    <div className={`${supportsCompletion ? "ml-10" : ""} mt-1.5 flex flex-wrap items-center gap-2`}>
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
                      {isToday ? (
                        <Badge
                          variant="outline"
                          className="h-4 border-primary/30 bg-primary/5 px-1.5 py-0 text-[10px] text-primary"
                        >
                          Today
                        </Badge>
                      ) : null}
                      {isUpNext && !isToday ? (
                        <Badge
                          variant="outline"
                          className="h-4 border-accent/30 bg-accent/5 px-1.5 py-0 text-[10px] text-accent"
                        >
                          Up next
                        </Badge>
                      ) : null}
                      {session.role ? (
                        <Badge
                          variant="outline"
                          className={`h-4 px-1.5 py-0 text-[10px] ${
                            roleStyles[session.role] ?? "border-border bg-secondary text-foreground"
                          }`}
                        >
                          {roleLabels[session.role] ?? session.role}
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  {isDone ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="relative rounded-full bg-primary p-1 text-primary-foreground"
                    >
                      {justCompletedDay === session.day && !reduceMotion ? (
                        <motion.span
                          className="absolute inset-0 rounded-full bg-primary"
                          initial={{ opacity: 0.4, scale: 1 }}
                          animate={{ opacity: 0, scale: 2.2 }}
                          transition={{ duration: 0.7, ease: "easeOut" }}
                        />
                      ) : null}
                      <Check className="relative h-3 w-3" />
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
