import { useEffect, useMemo, useRef, useState } from "react";
import { differenceInCalendarWeeks, format, parseISO } from "date-fns";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  ExternalLink,
  Flag,
  CalendarOff,
  Check,
  ChevronDown,
  Clock,
  Dumbbell,
  Heart,
  MessageCircle,
  Moon,
  RefreshCcw,
  Sparkles,
  StretchHorizontal,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import {
  getCurrentUserWeeklyCoachScreen,
  setCurrentUserRaceGoalOutcome,
  setCurrentUserWeeklyCoachSessionCompletion,
  type CurrentUserWeeklyCoachScreen,
  type GoalOutcomeStatus,
  type GoalTimelineState,
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
  onSetNextGoal?: () => void;
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

type GoalTimelineDisplayState = GoalTimelineState | "LEGACY_PAST";

type GoalTimelineDisplay = {
  state: GoalTimelineDisplayState;
  sectionLabel: string;
  badgeLabel: string;
  badgeClassName: string;
  dayLabel?: {
    value: string;
    unit?: string;
  };
};

type GoalOutcomeAction = Exclude<GoalOutcomeStatus, "UNKNOWN">;

const screenShellClassName = "space-y-6";

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

function SyncedActivityBadge({ session }: { session: WeeklyCoachSession }) {
  const activity = session.syncedActivity;
  if (!activity) return null;
  const provider = activity.provider;
  if (provider !== "STRAVA" && provider !== "INTERVALS") {
    return (
      <span className="text-xs text-muted-foreground">
        Synced activity{provider ? ` · ${provider}` : ""}
      </span>
    );
  }
  const isStrava = provider === "STRAVA";
  const providerName = isStrava ? "Strava" : "Intervals";

  const content = (
    <>
      <span
        className={
          isStrava
            ? "flex h-4 w-4 items-center justify-center rounded-full bg-[#FC5200]"
            : "flex h-4 w-4 items-center justify-center rounded-full bg-sky-600 text-white"
        }
      >
        {isStrava ? (
          <img
            src="/strava-echelon-white.svg"
            alt=""
            className="h-2.5 w-auto"
          />
        ) : (
          <Activity className="h-2.5 w-2.5" aria-hidden="true" />
        )}
      </span>
      <span>View on {providerName}</span>
      {activity.activityUrl ? (
        <ExternalLink
          className="hidden h-2.5 w-2.5 sm:inline"
          aria-hidden="true"
        />
      ) : null}
    </>
  );

  const className = isStrava
    ? "inline-flex shrink-0 items-center gap-1 rounded-full border border-orange-500/25 bg-orange-500/10 px-2 py-1 text-xs font-medium text-orange-800 transition-colors hover:bg-orange-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 sm:pr-2 dark:text-orange-200"
    : "inline-flex shrink-0 items-center gap-1 rounded-full border border-sky-500/25 bg-sky-500/10 px-2 py-1 text-xs font-medium text-sky-800 transition-colors hover:bg-sky-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 sm:pr-2 dark:text-sky-200";

  if (!activity.activityUrl) {
    return (
      <span
        aria-label={`Synced from ${providerName}`}
        title={`Synced from ${providerName}`}
        className={className}
      >
        {content}
      </span>
    );
  }

  return (
    <a
      href={activity.activityUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`View on ${providerName} (opens in a new tab)`}
      className={className}
    >
      {content}
    </a>
  );
}

function SessionRightSummary({ session }: { session: WeeklyCoachSession }) {
  if (session.durationMinutes <= 0 && !session.syncedActivity) return null;

  return (
    <div className="inline-flex items-center gap-2 whitespace-nowrap">
      <SyncedActivityBadge session={session} />
      {session.durationMinutes > 0 ? (
        <span
          className="text-xs tabular-nums text-muted-foreground"
          title="Planned duration"
        >
          {session.durationMinutes} min
        </span>
      ) : null}
    </div>
  );
}

function formatWeekRangeLabel(start: Date, end: Date) {
  const sameMonth = format(start, "MMM yyyy") === format(end, "MMM yyyy");
  const sameYear = format(start, "yyyy") === format(end, "yyyy");

  if (sameMonth) {
    return `${format(start, "MMM d")} – ${format(end, "d, yyyy")}`;
  }

  if (sameYear) {
    return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  }

  return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
}

function boundedPercent(value: number, max: number) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.max(0, Math.min(100, (value / max) * 100));
}

function deriveGoalTimelineDisplay(
  goal: CurrentUserWeeklyCoachScreen["goal"],
): GoalTimelineDisplay | undefined {
  if (!goal) return undefined;

  const legacyDaysToGoal = Number.isFinite(goal.daysToGoal)
    ? goal.daysToGoal
    : undefined;
  const state: GoalTimelineDisplayState =
    goal.goalTimelineState ??
    (typeof legacyDaysToGoal === "number" && legacyDaysToGoal < 0
      ? "LEGACY_PAST"
      : "UPCOMING");

  const futureDays =
    goal.daysUntilGoal ??
    (typeof legacyDaysToGoal === "number"
      ? Math.max(0, legacyDaysToGoal)
      : undefined);
  const pastDays =
    goal.daysSinceGoal ??
    (typeof legacyDaysToGoal === "number" && legacyDaysToGoal < 0
      ? Math.abs(legacyDaysToGoal)
      : undefined);

  const badgeClassNames: Record<GoalTimelineDisplayState, string> = {
    UPCOMING: "border-border bg-muted/40 text-muted-foreground",
    RACE_WEEK: "border-accent/20 bg-accent/10 text-accent",
    RACE_DAY: "border-primary/20 bg-primary/10 text-primary",
    POST_GOAL: "border-primary/20 bg-primary/10 text-primary",
    EXPIRED: "border-muted-foreground/20 bg-muted/50 text-muted-foreground",
    LEGACY_PAST: "border-accent/20 bg-accent/10 text-accent",
  };

  const meta: Record<
    GoalTimelineDisplayState,
    Pick<GoalTimelineDisplay, "sectionLabel" | "badgeLabel">
  > = {
    UPCOMING: { sectionLabel: "Road to race", badgeLabel: "Upcoming" },
    RACE_WEEK: { sectionLabel: "Road to race", badgeLabel: "Race week" },
    RACE_DAY: { sectionLabel: "Today is the day", badgeLabel: "Race day" },
    POST_GOAL: { sectionLabel: "Post-race", badgeLabel: "Recovery window" },
    EXPIRED: { sectionLabel: "Past goal", badgeLabel: "Expired" },
    LEGACY_PAST: { sectionLabel: "Past goal", badgeLabel: "Result not logged" },
  };

  const dayLabel = (() => {
    if (state === "RACE_DAY") return { value: "Today" };
    if (
      state === "POST_GOAL" ||
      state === "EXPIRED" ||
      state === "LEGACY_PAST"
    ) {
      return typeof pastDays === "number"
        ? { value: `${pastDays}d`, unit: "ago" }
        : undefined;
    }

    return typeof futureDays === "number"
      ? { value: `${futureDays}`, unit: "d to go" }
      : undefined;
  })();

  return {
    state,
    sectionLabel: meta[state].sectionLabel,
    badgeLabel: meta[state].badgeLabel,
    badgeClassName: badgeClassNames[state],
    dayLabel,
  };
}

function canSetGoalOutcome(
  goal: CurrentUserWeeklyCoachScreen["goal"],
  timeline: GoalTimelineDisplay,
) {
  if (!goal) return false;

  const outcomeStatus = goal.goalOutcomeStatus ?? "UNKNOWN";
  return (
    outcomeStatus === "UNKNOWN" &&
    (timeline.state === "RACE_DAY" || timeline.state === "POST_GOAL")
  );
}

function nextGoalCtaLabel(
  goal: CurrentUserWeeklyCoachScreen["goal"],
  timeline: GoalTimelineDisplay,
) {
  if (!goal) return undefined;

  const outcomeStatus = goal.goalOutcomeStatus ?? "UNKNOWN";

  if (outcomeStatus === "COMPLETED") return "Plan next race";
  if (outcomeStatus === "SKIPPED") return "Set new goal";
  if (timeline.state === "EXPIRED") return "Set next goal";

  return undefined;
}

function goalOutcomeErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 409) {
    return "Race outcome can only be set on or after race day.";
  }

  return "Could not update race outcome. Try again.";
}

function WeekPulse({
  sessions,
  todayDay,
  isCurrentWeek,
  onSelectDay,
}: {
  sessions: WeeklyCoachSession[];
  todayDay: string | undefined;
  isCurrentWeek: boolean;
  isPastWeek: boolean;
  onSelectDay: (day: string) => void;
  reduceMotion: boolean;
}) {
  return (
    <nav
      aria-label="Days in your plan"
      className="surface grid grid-cols-7 gap-1 p-2"
    >
      {sessions.map((session) => {
        const today = isCurrentWeek && session.day === todayDay;
        const Icon = (typeConfig[session.modality] ?? typeConfig.RUN).icon;
        return (
          <button
            key={session.day}
            type="button"
            onClick={() => onSelectDay(session.day)}
            aria-label={`${shortDayLabel(session.day)}: ${session.title}${session.completed ? ", completed" : ""}`}
            aria-current={today ? "date" : undefined}
            className={`day-button ${today ? "bg-primary text-primary-foreground" : session.completed ? "bg-accent/10 text-accent hover:bg-accent/20" : "text-muted-foreground hover:bg-secondary"}`}
          >
            <span>{shortDayLabel(session.day)}</span>
            {session.completed ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Icon className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="hidden text-xs sm:block">
              {today
                ? "Today"
                : session.modality === "REST"
                  ? "Rest"
                  : `${session.durationMinutes} min`}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function SessionDetails({ session }: { session: WeeklyCoachSession }) {
  return (
    <div className="space-y-4">
      {session.notes && <p>{session.notes}</p>}
      {session.strengthFocus?.length ? (
        <div className="flex flex-wrap gap-2">
          {session.strengthFocus.map((focus) => (
            <Badge key={focus} variant="secondary">
              {focus}
            </Badge>
          ))}
        </div>
      ) : null}
      {session.placementReason && (
        <div>
          <h4 className="mb-1 text-sm font-semibold">Why this session</h4>
          <p className="text-muted-foreground">{session.placementReason}</p>
        </div>
      )}
      {session.syncedActivity && (
        <div className="border-t border-border pt-4">
          <h4 className="mb-2 text-sm font-semibold">Recorded activity</h4>
          <p className="mb-3 tabular-nums text-muted-foreground">
            {formatDecimal(session.syncedActivity.distanceKm)} km ·{" "}
            {formatDecimal(session.syncedActivity.durationMinutes)} min
            {typeof session.syncedActivity.elevationGainMeters === "number"
              ? ` · ${session.syncedActivity.elevationGainMeters} m elevation`
              : ""}
          </p>
          <SyncedActivityBadge session={session} />
        </div>
      )}
    </div>
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
  const isRest = session.modality === "REST";
  return (
    <section className="surface overflow-hidden" aria-label="Today's session">
      <div className="flex items-center justify-between bg-primary px-5 py-3 text-primary-foreground sm:px-7">
        <h2 className="font-sans text-sm font-semibold">
          {isRest ? "Today · Recovery" : "Today’s session"}
        </h2>
        <span className="text-xs">
          {shortDayLabel(session.day)}
          {session.role === "KEY" ? " · Key session" : ""}
        </span>
      </div>
      <div className="p-5 sm:p-7">
        <h3 className="font-display text-4xl leading-tight">{session.title}</h3>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {!isRest && (
            <span className="flex items-center gap-2 tabular-nums">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {session.durationMinutes} min planned
            </span>
          )}
          <span>
            {intensityLabels[session.intensityCategory] ??
              session.intensityCategory}
            {!isRest && " intensity"}
          </span>
        </div>
        {session.notes && (
          <p className="mt-5 max-w-prose text-sm leading-7 text-muted-foreground">
            {session.notes}
          </p>
        )}
        {session.syncedActivity && (
          <div className="mt-4">
            <SyncedActivityBadge session={session} />
          </div>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          {canComplete && !isRest && (
            <Button onClick={onComplete} disabled={isPending}>
              <Check className="h-4 w-4" />
              {isPending ? "Saving…" : "Mark as complete"}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onToggleExpanded}
            aria-expanded={expanded}
            aria-controls="today-details"
          >
            {expanded ? "Hide details" : "Workout details"}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </Button>
        </div>
        {expanded && (
          <div
            id="today-details"
            className="mt-5 border-t border-border pt-5 text-sm leading-relaxed"
          >
            <SessionDetails session={{ ...session, notes: undefined }} />
          </div>
        )}
      </div>
    </section>
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
    <section
      className="surface p-5 sm:p-7"
      aria-label="Today's completed session"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-accent">
            <Check className="h-5 w-5" />
            Today, complete
          </div>
          <h2 className="section-title">{session.title}</h2>
        </div>
        {canToggleCompletion && (
          <Button variant="ghost" onClick={onUndo}>
            Undo
          </Button>
        )}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        {session.completionSource === "SYNCED_ACTIVITY"
          ? "An activity is linked to this session."
          : "Marked complete. Recorded activities sync separately."}
      </p>
      <div className="mt-3">
        <SessionRightSummary session={session} />
      </div>
      {upNext ? (
        <button
          type="button"
          onClick={() => onJumpNext(upNext.day)}
          className="mt-5 flex min-h-16 w-full items-center justify-between gap-4 border-t border-border pt-5 text-left"
        >
          <span>
            <span className="text-xs text-muted-foreground">
              Up next · {shortDayLabel(upNext.day)}
            </span>
            <span className="mt-1 block text-sm font-semibold">
              {upNext.title}
            </span>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
        </button>
      ) : (
        <p className="mt-5 border-t border-border pt-5 text-sm text-muted-foreground">
          No later sessions are waiting this week. Check the schedule for any
          unfinished sessions.
        </p>
      )}
    </section>
  );
}

function WeekMetrics({
  completedWeekDistanceKm,
  last7dDistanceKm,
  longRunMinutes,
  sleepHours,
}: {
  completedWeekDistanceKm: number | undefined;
  last7dDistanceKm: number | undefined;
  longRunMinutes: number | undefined;
  sleepHours: number | undefined;
}) {
  const metrics = [
    {
      label:
        typeof completedWeekDistanceKm === "number"
          ? "Recorded distance"
          : "Last 7 days",
      value: formatDecimal(completedWeekDistanceKm ?? last7dDistanceKm),
      unit:
        typeof (completedWeekDistanceKm ?? last7dDistanceKm) === "number"
          ? "km"
          : "",
    },
    {
      label: "Planned long run",
      value: formatDecimal(longRunMinutes),
      unit: typeof longRunMinutes === "number" ? "min" : "",
    },
    {
      label: "Average sleep",
      value: formatDecimal(sleepHours),
      unit: typeof sleepHours === "number" ? "h" : "",
    },
  ];
  return (
    <section aria-label="This week metrics">
      <h2 className="section-title mb-4">Week in numbers</h2>
      <dl className="divide-y divide-border">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="flex items-baseline justify-between gap-3 py-3"
          >
            <dt className="text-sm text-muted-foreground">{metric.label}</dt>
            <dd className="text-xl font-semibold tabular-nums">
              {metric.value}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                {metric.unit}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function RaceGoalCard({
  goal,
  raceGoalDateLabel,
  outcomePending,
  outcomeError,
  outcomePendingAction,
  onSetOutcome,
  onSetNextGoal,
}: {
  goal: CurrentUserWeeklyCoachScreen["goal"];
  raceGoalDateLabel: string | undefined;
  outcomePending: boolean;
  outcomeError: string | undefined;
  outcomePendingAction: GoalOutcomeAction | null;
  onSetOutcome: (outcome: GoalOutcomeAction) => void;
  onSetNextGoal?: () => void;
}) {
  if (!goal) return null;

  const timeline = deriveGoalTimelineDisplay(goal);
  if (!timeline) return null;

  const activePhase = (goal.phase || "BASE").toUpperCase();
  const activePhaseIndex = raceProgressPhases.findIndex(
    (phase) => phase.name === activePhase,
  );
  const normalizedPhaseIndex = activePhaseIndex === -1 ? 0 : activePhaseIndex;
  const showPhaseTimeline =
    timeline.state === "UPCOMING" || timeline.state === "RACE_WEEK";
  const outcomeStatus = goal.goalOutcomeStatus ?? "UNKNOWN";
  const showRecoveryWindow =
    timeline.state === "POST_GOAL" &&
    outcomeStatus !== "SKIPPED" &&
    typeof goal.postGoalRecoveryDay === "number" &&
    typeof goal.postGoalWindowDays === "number" &&
    goal.postGoalWindowDays > 0;
  const recoveryPercent = showRecoveryWindow
    ? boundedPercent(
        goal.postGoalRecoveryDay ?? 0,
        goal.postGoalWindowDays ?? 0,
      )
    : 0;
  const isPostGoal = timeline.state === "POST_GOAL";
  const isRaceDay = timeline.state === "RACE_DAY";
  const isPastGoal =
    timeline.state === "EXPIRED" || timeline.state === "LEGACY_PAST";
  const GoalIcon = isPostGoal ? Heart : Flag;
  const canSetOutcome = canSetGoalOutcome(goal, timeline);
  const badgeLabel =
    outcomeStatus === "COMPLETED"
      ? "Completed"
      : outcomeStatus === "SKIPPED"
        ? "Skipped"
        : timeline.badgeLabel;
  const outcomeCopy =
    outcomeStatus === "COMPLETED"
      ? "Race completed. Recovery-first training can continue."
      : outcomeStatus === "SKIPPED"
        ? "Goal skipped. This race will not guide recovery or race preparation."
        : undefined;
  const ctaLabel = nextGoalCtaLabel(goal, timeline);

  return (
    <motion.section
      className="space-y-2"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28 }}
      aria-label={timeline.sectionLabel}
    >
      <div className="flex items-center justify-between px-1">
        <h2 className="section-title">{timeline.sectionLabel}</h2>
        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${timeline.badgeClassName}`}
        >
          {badgeLabel}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-start gap-2.5 px-4 pb-3 pt-3.5">
          <div
            className={`shrink-0 rounded-lg border p-1.5 ${
              isPostGoal || isRaceDay
                ? "border-primary/20 bg-primary/10"
                : isPastGoal
                  ? "border-border bg-muted/40"
                  : "border-accent/15 bg-accent/10"
            }`}
          >
            <GoalIcon
              className={`h-3.5 w-3.5 ${isPostGoal || isRaceDay ? "text-primary" : isPastGoal ? "text-muted-foreground" : "text-accent"}`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight text-foreground">
              {goal.primaryGoal.name}
            </p>
            {raceGoalDateLabel ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {raceGoalDateLabel}
              </p>
            ) : null}
          </div>
          {timeline.dayLabel ? (
            <div className="shrink-0 text-right">
              <p className="text-base font-bold leading-none tabular-nums text-foreground">
                {timeline.dayLabel.value}
              </p>
              {timeline.dayLabel.unit ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {timeline.dayLabel.unit}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {showPhaseTimeline ? (
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
                      isActive
                        ? "bg-primary"
                        : isPast
                          ? "bg-primary/30"
                          : "bg-border"
                    }`}
                  />
                );
              })}
            </div>
            <div className="grid grid-cols-4 gap-1">
              {raceProgressPhases.map((phase, index) => (
                <span
                  key={phase.name}
                  className={`text-xs font-medium tracking-wider ${
                    index === normalizedPhaseIndex
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {phase.name}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {showRecoveryWindow ? (
          <div className="px-4 pb-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Recovery window
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                day{" "}
                <span className="font-medium text-foreground">
                  {goal.postGoalRecoveryDay}
                </span>{" "}
                of {goal.postGoalWindowDays}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-border">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${recoveryPercent}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Easy efforts and short runs only while the coach rebuilds training
              around recovery.
            </p>
          </div>
        ) : null}

        <div className="flex items-center gap-2 border-t border-border bg-muted/20 px-4 py-2.5">
          {outcomeCopy ? (
            <>
              {outcomeStatus === "COMPLETED" ? (
                <Check className="h-3 w-3 shrink-0 text-primary" />
              ) : (
                <CalendarOff className="h-3 w-3 shrink-0 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">
                {outcomeCopy}
              </span>
            </>
          ) : timeline.state === "UPCOMING" ||
            timeline.state === "RACE_WEEK" ? (
            <>
              <TrendingUp className="h-3 w-3 shrink-0 text-primary" />
              <span className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {goal.phase}
                </span>{" "}
                phase
              </span>
              <span className="ml-auto truncate text-xs text-muted-foreground">
                {goal.goalSummary}
              </span>
            </>
          ) : isRaceDay ? (
            <>
              <Sparkles className="h-3 w-3 shrink-0 text-primary" />
              <span className="text-xs font-medium text-foreground">
                Trust your training. Run smart.
              </span>
            </>
          ) : isPostGoal ? (
            <>
              <Heart className="h-3 w-3 shrink-0 text-primary" />
              <span className="text-xs text-muted-foreground">
                Recovery-first training this week.
              </span>
            </>
          ) : (
            <>
              <CalendarOff className="h-3 w-3 shrink-0 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Recovery window closed
              </span>
            </>
          )}
          {ctaLabel && onSetNextGoal ? (
            <button
              type="button"
              onClick={onSetNextGoal}
              className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {ctaLabel}
              <ArrowRight className="h-3 w-3" />
            </button>
          ) : null}
        </div>

        {canSetOutcome ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-2.5">
            <Button
              type="button"
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={() => onSetOutcome("COMPLETED")}
              disabled={outcomePending}
            >
              {outcomePending && outcomePendingAction === "COMPLETED" ? (
                <RefreshCcw className="mr-1.5 h-3 w-3 animate-spin" />
              ) : null}
              Mark completed
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={() => onSetOutcome("SKIPPED")}
              disabled={outcomePending}
            >
              {outcomePending && outcomePendingAction === "SKIPPED" ? (
                <RefreshCcw className="mr-1.5 h-3 w-3 animate-spin" />
              ) : null}
              Skip goal
            </Button>
            {outcomeError ? (
              <p className="basis-full text-xs text-destructive">
                {outcomeError}
              </p>
            ) : null}
          </div>
        ) : outcomeError ? (
          <div className="border-t border-border px-4 py-2.5">
            <p className="text-xs text-destructive">{outcomeError}</p>
          </div>
        ) : null}
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
    <section aria-label="Weekly schedule">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="section-title">Your schedule</h2>
        <span className="text-xs text-muted-foreground">
          {sessions.filter((s) => s.completed && s.modality !== "REST").length}{" "}
          / {sessions.filter((s) => s.modality !== "REST").length} complete
        </span>
      </div>
      <div className="surface overflow-hidden">
        {sessions.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground">
            No sessions are included in this plan yet.
          </p>
        )}
        {sessions.map((session) => {
          const expanded = expandedDay === session.day;
          const isRest = session.modality === "REST";
          const today = isCurrentWeek && session.day === todayDay;
          const Icon = (typeConfig[session.modality] ?? typeConfig.RUN).icon;
          const canToggle =
            supportsCompletion &&
            typeof session.completed === "boolean" &&
            isCurrentWeek &&
            !isRest;
          return (
            <div
              key={session.day}
              ref={(element) => setSessionRef(session.day, element)}
              className={`workout-row ${today ? "bg-primary/5" : ""}`}
            >
              <div className="flex items-center gap-1 pl-4 pr-2 sm:pl-5 sm:pr-4">
                <button
                  type="button"
                  id={`session-trigger-${session.day}`}
                  aria-expanded={expanded}
                  aria-controls={`session-detail-${session.day}`}
                  onClick={() => onToggleExpanded(session.day)}
                  className="workout-disclosure"
                >
                  <span
                    className={`w-9 shrink-0 text-xs font-semibold ${today ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {shortDayLabel(session.day)}
                    {today && <span className="mt-1 block text-xs">Today</span>}
                  </span>
                  <Icon
                    className={`hidden h-5 w-5 shrink-0 sm:block ${isRest ? "text-muted-foreground" : "text-primary"}`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold leading-5">
                      {session.title}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {isRest
                        ? "Recovery"
                        : `${session.durationMinutes} min · ${intensityLabels[session.intensityCategory] ?? session.intensityCategory} intensity`}
                      {session.role === "KEY" ? " · Key session" : ""}
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>
                {canToggle && (
                  <button
                    type="button"
                    aria-pressed={session.completed === true}
                    aria-label={
                      session.completed
                        ? `Mark ${session.title} as incomplete`
                        : `Mark ${session.title} as complete`
                    }
                    disabled={completionPending}
                    onClick={() => onToggleComplete(session.day)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-secondary disabled:opacity-50"
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border ${session.completed ? "border-accent bg-accent text-accent-foreground" : "border-input"}`}
                    >
                      {session.completed && <Check className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                )}
              </div>
              {session.syncedActivity && !expanded && (
                <div className="px-5 pb-3">
                  <SyncedActivityBadge session={session} />
                </div>
              )}
              {expanded && (
                <div
                  id={`session-detail-${session.day}`}
                  role="region"
                  aria-labelledby={`session-trigger-${session.day}`}
                  className="workout-detail"
                >
                  <SessionDetails session={session} />
                  {!isRest && (
                    <p className="text-xs text-muted-foreground">
                      Planned duration: {session.durationMinutes} min.
                      Completion does not add recorded distance.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function WeeklyPlanScreen({
  athleteId: _athleteId,
  targetWeekStartDate,
  isPreparing,
  onRefresh,
  onSetNextGoal,
}: WeeklyPlanScreenProps) {
  const [selectedWeekStartDate, setSelectedWeekStartDate] =
    useState(targetWeekStartDate);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [justCompletedDay, setJustCompletedDay] = useState<string | null>(null);
  const [outcomePendingAction, setOutcomePendingAction] =
    useState<GoalOutcomeAction | null>(null);
  const [outcomeError, setOutcomeError] = useState<string | undefined>(
    undefined,
  );
  const sessionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const reduceMotion = useReducedMotion();
  const queryClient = useQueryClient();

  useEffect(() => {
    setSelectedWeekStartDate(targetWeekStartDate);
  }, [targetWeekStartDate]);

  const screenQuery = useQuery({
    queryKey: ["portal", "weekly-coach-screen", selectedWeekStartDate],
    queryFn: () => getCurrentUserWeeklyCoachScreen(selectedWeekStartDate),
    enabled:
      Boolean(selectedWeekStartDate) &&
      !(isPreparing && selectedWeekStartDate === targetWeekStartDate),
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
    }) =>
      setCurrentUserWeeklyCoachSessionCompletion(weekStartDate, day, completed),
    onMutate: async ({ day, completed }) => {
      await queryClient.cancelQueries({
        queryKey: ["portal", "weekly-coach-screen", selectedWeekStartDate],
      });

      const previousScreen =
        queryClient.getQueryData<CurrentUserWeeklyCoachScreen>([
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
                  session.day === day
                    ? {
                        ...session,
                        completed,
                        completionSource: completed
                          ? ("MANUAL" as const)
                          : undefined,
                      }
                    : session,
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

  const raceGoalOutcomeMutation = useMutation({
    mutationFn: (outcome: GoalOutcomeAction) =>
      setCurrentUserRaceGoalOutcome(outcome),
    onMutate: (outcome) => {
      setOutcomePendingAction(outcome);
      setOutcomeError(undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["portal", "weekly-coach-screen", selectedWeekStartDate],
      });
    },
    onError: (error) => {
      setOutcomeError(goalOutcomeErrorMessage(error));
    },
    onSettled: () => {
      setOutcomePendingAction(null);
    },
  });

  useEffect(() => {
    setExpandedDay(null);
    setOutcomeError(undefined);
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
    return formatWeekRangeLabel(start, end);
  }, [selectedWeekStartDate]);

  const toggleComplete = (day: string) => {
    if (!isCurrentWeek) return;
    const currentScreen = screenQuery.data;
    const session = currentScreen?.plan?.plan.sessions.find(
      (item) => item.day === day,
    );
    const weekStartDate =
      currentScreen?.plan?.weekStartDate ??
      currentScreen?.selectedWeekStartDate;
    if (
      !session ||
      !weekStartDate ||
      typeof session.completed !== "boolean" ||
      session.modality === "REST" ||
      completionMutation.isPending
    )
      return;

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
      document
        .getElementById(`session-trigger-${day}`)
        ?.focus({ preventScroll: true });
      sessionRefs.current[day]?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
      });
    });
  };

  const header = (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <motion.h1
            className="page-title"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            Your week
          </motion.h1>
          {plan ? (
            <motion.span
              className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.12 }}
            >
              <span>{formatWeekType(plan.plan.weekType)} week</span>
              <span>·</span>
              <span>
                {plan.summary.phase ?? screen?.goal?.phase ?? "Training"} phase
              </span>
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
          if (screen?.previousWeekStartDate)
            setSelectedWeekStartDate(screen.previousWeekStartDate);
        }}
        onNext={() => {
          if (screen?.nextWeekStartDate)
            setSelectedWeekStartDate(screen.nextWeekStartDate);
        }}
        onCurrent={() =>
          setSelectedWeekStartDate(
            screen?.todayWeekStartDate ?? targetWeekStartDate,
          )
        }
        weekLabel={weekRangeLabel ?? ""}
        canGoPrevious={screen?.canGoPrevious ?? false}
        canGoNext={screen?.canGoNext ?? false}
        showReturnToCurrent={
          selectedWeekStartDate !==
          (screen?.todayWeekStartDate ?? targetWeekStartDate)
        }
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
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Weekly plan
              </p>
              <h2 className="mt-1 font-display text-2xl text-foreground">
                Preparing your weekly plan
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                We&apos;re preparing your plan for {weekRangeLabel}. First plans
                are generated automatically once onboarding is complete, and
                future plans are refreshed on Sunday night.
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
          <p role="status" className="text-sm text-muted-foreground">
            Loading your weekly plan…
          </p>
        </div>
      </div>
    );
  }

  if (screenQuery.isError) {
    return (
      <div className={screenShellClassName}>
        {header}
        <div className="rounded-2xl border border-divider bg-card p-6 shadow-card">
          <h2 className="font-display text-2xl text-foreground">
            We couldn't load your weekly plan
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Your plan could not be loaded. Try again in a moment.
          </p>
          <Button
            className="mt-5"
            onClick={() => screenQuery.refetch()}
            disabled={screenQuery.isFetching}
          >
            Try again
          </Button>
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
            <p className="text-sm font-medium text-muted-foreground">
              No plan yet
            </p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
              Future plans are generated automatically at the end of each week
              based on your recent training context.
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
            <p className="text-sm font-medium text-muted-foreground">
              No data for this week
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
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
                <h2 className="font-display text-2xl text-foreground">
                  We&apos;re syncing your weekly plan
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  The portal knows which week to show, but the plan is not
                  readable yet. Refresh in a moment and we&apos;ll check again.
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

  const sessions = [...plan.plan.sessions].sort(
    (a, b) => dayOrderIndex(a.day) - dayOrderIndex(b.day),
  );
  const supportsCompletion = sessions.some(
    (session) => typeof session.completed === "boolean",
  );
  const derivedTodayDay = isCurrentWeek
    ? dayCodeForDate(new Date())
    : undefined;
  const todayDay = isCurrentWeek
    ? (screen?.todaySessionDay ?? derivedTodayDay)
    : undefined;
  const todayIndex = todayDay
    ? sessions.findIndex((session) => session.day === todayDay)
    : -1;
  const derivedUpNextDay =
    isCurrentWeek && todayIndex >= 0
      ? sessions
          .slice(todayIndex + 1)
          .find(
            (session) =>
              session.modality !== "REST" && session.completed !== true,
          )?.day
      : undefined;
  const upNextDay = isCurrentWeek
    ? (screen?.upNextSessionDay ?? derivedUpNextDay)
    : undefined;
  const todaySession = todayDay
    ? sessions.find((session) => session.day === todayDay)
    : undefined;
  const upNextSession = upNextDay
    ? sessions.find((session) => session.day === upNextDay)
    : undefined;
  const showTodayHero = Boolean(isCurrentWeek && todaySession);
  const goal = screen?.goal;
  const raceGoalDateLabel = goal?.primaryGoal.eventDate
    ? format(parseISO(goal.primaryGoal.eventDate), "MMM d, yyyy")
    : undefined;

  return (
    <div className="space-y-7">
      {header}
      <div className="space-y-7">
        <WeekPulse
          sessions={sessions}
          todayDay={todayDay}
          isCurrentWeek={isCurrentWeek}
          isPastWeek={isPastWeek}
          onSelectDay={scrollToDay}
          reduceMotion={Boolean(reduceMotion)}
        />

        <div className="week-layout">
          <div className="min-w-0 space-y-7">
            {showTodayHero && todaySession ? (
              <AnimatePresence mode="wait">
                {supportsCompletion && todaySession.completed === true ? (
                  <TodayDoneCard
                    key="today-done"
                    session={todaySession}
                    upNext={upNextSession}
                    canToggleCompletion={
                      typeof todaySession.completed === "boolean" &&
                      !completionMutation.isPending
                    }
                    onUndo={() => toggleComplete(todaySession.day)}
                    onJumpNext={scrollToDay}
                  />
                ) : (
                  <TodayPendingCard
                    key="today-pending"
                    session={todaySession}
                    expanded={expandedDay === todaySession.day}
                    canComplete={typeof todaySession.completed === "boolean"}
                    isPending={completionMutation.isPending}
                    onToggleExpanded={() =>
                      setExpandedDay(
                        expandedDay === todaySession.day
                          ? null
                          : todaySession.day,
                      )
                    }
                    onComplete={() => toggleComplete(todaySession.day)}
                  />
                )}
              </AnimatePresence>
            ) : null}

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
              onToggleExpanded={(day) =>
                setExpandedDay(expandedDay === day ? null : day)
              }
              setSessionRef={(day, element) => {
                sessionRefs.current[day] = element;
              }}
            />
            {completionMutation.isError && (
              <p role="alert" className="text-sm text-destructive">
                We couldn't update this session. Your previous completion state
                has been restored. Try again.
              </p>
            )}
          </div>
          <aside className="min-w-0 space-y-7" aria-label="Weekly context">
            <motion.div
              className="border-b border-border pb-6"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 }}
              key={`coach-${screen?.selectedWeekStartDate ?? selectedWeekStartDate}`}
            >
              <h2 className="section-title mb-3">The focus this week</h2>
              <div className="flex gap-2.5">
                <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <p className="text-sm leading-relaxed text-foreground/80">
                  {plan.plan.weekObjective}
                </p>
              </div>
            </motion.div>

            <WeekMetrics
              completedWeekDistanceKm={plan.summary.completedWeekDistanceKm}
              last7dDistanceKm={plan.summary.last7dDistanceKm}
              longRunMinutes={screen?.highlights.longRun?.durationMinutes}
              sleepHours={plan.summary.sleepHours}
            />

            <RaceGoalCard
              goal={goal}
              raceGoalDateLabel={raceGoalDateLabel}
              outcomePending={raceGoalOutcomeMutation.isPending}
              outcomeError={outcomeError}
              outcomePendingAction={outcomePendingAction}
              onSetOutcome={(outcome) =>
                raceGoalOutcomeMutation.mutate(outcome)
              }
              onSetNextGoal={onSetNextGoal}
            />

            {plan.plan.justification.length > 0 && (
              <details className="border-t border-border pt-5">
                <summary className="cursor-pointer py-2 text-sm font-semibold">
                  Why this plan
                </summary>
                <ul className="mt-3 list-disc space-y-3 pl-5 text-sm leading-relaxed text-muted-foreground">
                  {plan.plan.justification.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </details>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
