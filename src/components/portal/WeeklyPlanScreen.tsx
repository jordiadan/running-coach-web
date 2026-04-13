import { useEffect, useMemo, useState } from "react";
import { differenceInCalendarWeeks, format, parseISO } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
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
  StretchHorizontal,
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

export default function WeeklyPlanScreen({
  athleteId: _athleteId,
  targetWeekStartDate,
  isPreparing,
  onRefresh,
}: WeeklyPlanScreenProps) {
  const [selectedWeekStartDate, setSelectedWeekStartDate] = useState(targetWeekStartDate);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
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
    if (!session || !weekStartDate) return;

    completionMutation.mutate({
      weekStartDate,
      day,
      completed: !session.completed,
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
  const todayDay = isCurrentWeek ? screen?.todaySessionDay : undefined;
  const upNextDay = isCurrentWeek ? screen?.upNextSessionDay : undefined;
  const todaySession = todayDay ? sessions.find((session) => session.day === todayDay) : undefined;
  const showTodayHero = Boolean(isCurrentWeek && todaySession && !todaySession.completed);
  const completedMinutes = sessions
    .filter((session) => session.completed)
    .reduce((total, session) => total + session.durationMinutes, 0);
  const completedCount = sessions.filter((session) => session.completed).length;
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

        {showTodayHero && todaySession ? (
          <motion.div
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-primary/12 bg-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.6, delay: 0.15 }}
            onClick={() => {
              if (todaySession.modality !== "REST") {
                setExpandedDay(expandedDay === todaySession.day ? null : todaySession.day);
              }
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent" />
            <div className="absolute bottom-0 left-0 top-0 w-1 rounded-r-full bg-primary" />

            <div className="relative p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <motion.div
                    className={`rounded-2xl border border-primary/10 bg-gradient-to-br p-3 ${
                      (typeConfig[todaySession.modality] ?? typeConfig.RUN).gradient
                    } ${(typeConfig[todaySession.modality] ?? typeConfig.RUN).tileClass}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {(() => {
                      const TodayIcon = (typeConfig[todaySession.modality] ?? typeConfig.RUN).icon;
                      return <TodayIcon className="h-5 w-5" />;
                    })()}
                  </motion.div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                      Today
                    </span>
                    <p className="mt-0.5 truncate text-base font-semibold text-foreground">
                      {todaySession.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {todaySession.durationMinutes} min
                      </span>
                      <div className="flex items-center gap-1">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            intensityDot[todaySession.intensityCategory] ?? "bg-muted-foreground/30"
                          }`}
                        />
                        <span className="text-[11px] text-muted-foreground">
                          {intensityLabels[todaySession.intensityCategory] ?? todaySession.intensityCategory}
                        </span>
                      </div>
                      {todaySession.role ? (
                        <Badge
                          variant="outline"
                          className={`h-4 px-1.5 py-0 text-[10px] ${
                            roleStyles[todaySession.role] ?? "border-border bg-secondary text-foreground"
                          }`}
                        >
                          {roleLabels[todaySession.role] ?? todaySession.role}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </div>

                <motion.button
                  type="button"
                  className="shrink-0 rounded-full bg-primary p-3 text-primary-foreground shadow-sm transition-shadow hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleComplete(todaySession.day);
                  }}
                  disabled={completionMutation.isPending}
                  aria-label={`Mark ${todaySession.title} as complete`}
                >
                  <Check className="h-4 w-4" />
                </motion.button>
              </div>

              <AnimatePresence initial={false}>
                {expandedDay === todaySession.day && (todaySession.notes || todaySession.strengthFocus?.length) ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 border-t border-primary/10 pt-3">
                      {todaySession.notes ? (
                        <p className="text-[13px] leading-relaxed text-foreground/80">{todaySession.notes}</p>
                      ) : null}
                      {todaySession.strengthFocus?.length ? (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {todaySession.strengthFocus.map((focus) => (
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
            </div>
          </motion.div>
        ) : null}

      </div>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Sessions</p>
        <div className="space-y-3">
          {sessions.map((session, index) => {
            const isDone = Boolean(session.completed);
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
