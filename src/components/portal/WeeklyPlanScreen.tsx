import { useEffect, useMemo, useRef, useState } from "react";
import { addDays, differenceInCalendarWeeks, format, parseISO } from "date-fns";
import { useReducedMotion } from "framer-motion";
import {
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
  Star,
  StretchHorizontal,
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
  type WorkoutExecutionEvaluation,
} from "@/lib/portal-api";
import { Button } from "@/components/ui/button";
import WeekNavigator from "@/components/portal/WeekNavigator";
import "./weekly-plan.css";

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

const typeConfig: Record<string, { icon: typeof Zap; label: string }> = {
  RUN: { icon: Zap, label: "Run" },
  STRENGTH: { icon: Dumbbell, label: "Strength" },
  MOBILITY: { icon: StretchHorizontal, label: "Mobility" },
  REST: { icon: Moon, label: "Rest" },
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

const screenShellClassName = "weekly-plan weekly-plan--state";

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
  if (activity.provider !== "STRAVA" && activity.provider !== "INTERVALS") {
    return (
      <span className="weekly-provider">
        Synced activity{activity.provider ? ` · ${activity.provider}` : ""}
      </span>
    );
  }
  const providerName =
    activity.provider === "STRAVA"
      ? "Strava"
      : activity.provider === "INTERVALS"
        ? "Intervals"
        : activity.provider;
  if (!activity.activityUrl) {
    return (
      <span
        className="weekly-provider"
        aria-label={`Synced from ${providerName ?? "activity source"}`}
      >
        Synced{providerName ? ` from ${providerName}` : " activity"}
      </span>
    );
  }
  return (
    <a
      href={activity.activityUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="weekly-provider"
      aria-label={`View on ${providerName ?? "activity source"} (opens in a new tab)`}
    >
      {activity.provider === "STRAVA" ? (
        <span className="weekly-provider-logo">
          <img src="/strava-echelon-white.svg" alt="" width={10} height={12} />
        </span>
      ) : null}
      View on {providerName}
      <ExternalLink size={13} aria-hidden="true" />
    </a>
  );
}

function ExecutionFeedbackDetails({
  evaluation,
}: {
  evaluation?: WorkoutExecutionEvaluation;
}) {
  if (!evaluation || evaluation.status === "INSUFFICIENT_EVIDENCE") {
    return (
      <p className="mt-3 text-sm text-foreground/70">
        {evaluation
          ? "Not enough activity data to evaluate this workout."
          : "No execution evaluation available."}
      </p>
    );
  }
  const durationLabels: Record<
    Extract<
      WorkoutExecutionEvaluation,
      { status: "EVALUATED" }
    >["durationExecution"],
    string
  > = {
    ON_TARGET: "As planned",
    SHORTER: "Shorter than planned",
    LONGER: "Longer than planned",
    UNKNOWN: "Not enough data",
  };
  const intensityLabels: Record<
    Extract<
      WorkoutExecutionEvaluation,
      { status: "EVALUATED" }
    >["intensityExecution"],
    string
  > = {
    ON_TARGET: "As planned",
    TOO_HIGH: "Higher than planned",
    TOO_LOW: "Lower than planned",
    MIXED: "Mixed",
    UNKNOWN: "Not enough data",
  };
  const structureLabels: Record<
    Extract<
      WorkoutExecutionEvaluation,
      { status: "EVALUATED" }
    >["structureExecution"],
    string
  > = {
    AS_PLANNED: "As planned",
    PARTIAL: "Partly followed",
    OFF_PLAN: "Different from plan",
    NOT_APPLICABLE: "Not applicable",
    UNKNOWN: "Not enough data",
  };
  return (
    <section
      className="mt-3 border-t border-border pt-3"
      aria-label="Compared with plan"
    >
      <h3 className="text-sm font-medium text-foreground">
        Compared with plan
      </h3>
      <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-3 sm:gap-4">
        {[
          ["Duration", durationLabels[evaluation.durationExecution]],
          ["Intensity", intensityLabels[evaluation.intensityExecution]],
          ["Structure", structureLabels[evaluation.structureExecution]],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 sm:block">
            <dt className="text-foreground/70">{label}</dt>
            <dd className="text-right text-foreground sm:mt-1 sm:text-left">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function RecordedActivity({ session }: { session: WeeklyCoachSession }) {
  if (!session.syncedActivity) return null;
  return (
    <div className="weekly-recorded">
      <span>Recorded activity</span>
      <strong>
        {formatDecimal(session.syncedActivity.distanceKm)} km <span>·</span>{" "}
        {formatDecimal(session.syncedActivity.durationMinutes)} min
      </strong>
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
  selectedDay,
  weekStartDate,
  onSelectDay,
}: {
  sessions: WeeklyCoachSession[];
  todayDay: string | undefined;
  isCurrentWeek: boolean;
  selectedDay: string | null;
  weekStartDate: string;
  onSelectDay: (day: string) => void;
}) {
  return (
    <nav className="weekly-days" aria-label="Sessions by day">
      {weekDayOrder.map((day, index) => {
        const session = sessions.find((item) => item.day === day);
        const date = addDays(parseISO(weekStartDate), index);
        const isToday = isCurrentWeek && day === todayDay;
        const isSelected = day === (selectedDay ?? todayDay);
        const config = session
          ? (typeConfig[session.modality] ?? typeConfig.RUN)
          : undefined;
        const Icon = session?.completed ? Check : (config?.icon ?? CalendarOff);
        return (
          <button
            key={day}
            type="button"
            className="weekly-day"
            aria-pressed={isSelected}
            aria-current={isToday ? "date" : undefined}
            disabled={!session}
            aria-label={`${format(date, "EEEE, MMMM d")}${isToday ? ", today" : ""}: ${session?.title ?? "No session"}${session?.completed ? ", completed" : ""}`}
            onClick={() => onSelectDay(day)}
          >
            <span className="weekly-day-name">{shortDayLabel(day)}</span>
            <span className="weekly-day-date">{format(date, "d")}</span>
            <span className="weekly-day-kind">
              <Icon size={14} aria-hidden="true" />
              <span>
                {session?.completed ? "Done" : (config?.label ?? "No session")}
              </span>
            </span>
            {isToday ? (
              <span className="weekly-today-dot" aria-hidden="true" />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

function TodaySession({
  session,
  upNext,
  canComplete,
  isPending,
  onComplete,
  onJumpNext,
  onDetails,
}: {
  session: WeeklyCoachSession;
  upNext?: WeeklyCoachSession;
  canComplete: boolean;
  isPending: boolean;
  onComplete: () => void;
  onJumpNext: (day: string) => void;
  onDetails: () => void;
}) {
  const isDone = session.completed === true;
  const isRest = session.modality === "REST";
  const config = typeConfig[session.modality] ?? typeConfig.RUN;
  const Icon = isDone ? Check : config.icon;
  return (
    <section
      className={`weekly-today${isDone ? " is-done" : ""}`}
      aria-label="Today's session"
    >
      <div className="weekly-today-top">
        <span className="weekly-today-label">
          <Icon size={18} aria-hidden="true" />
          {isDone
            ? "Today, completed"
            : isRest
              ? "Today, take a breather"
              : "Today's session"}
        </span>
        {session.role === "KEY" ? (
          <span className="weekly-key">
            <Star size={12} aria-hidden="true" />
            Key session
          </span>
        ) : null}
      </div>
      <h2>{session.title}</h2>
      <div className="weekly-prescription">
        {session.durationMinutes > 0 ? (
          <span>
            <Clock size={15} aria-hidden="true" />
            <strong>{session.durationMinutes} min</strong> planned
          </span>
        ) : null}
        <span>
          {config.label}
          {!isRest
            ? ` · ${intensityLabels[session.intensityCategory] ?? session.intensityCategory} intensity`
            : ""}
        </span>
      </div>
      {session.syncedActivity ? (
        <div className="weekly-today-provenance">
          <SyncedActivityBadge session={session} />
        </div>
      ) : null}
      {session.notes ? (
        <p className="weekly-today-notes">{session.notes}</p>
      ) : null}
      <div className="weekly-today-actions">
        {canComplete ? (
          <button
            type="button"
            className="weekly-primary"
            disabled={isPending}
            onClick={onComplete}
          >
            {isDone ? (
              <RefreshCcw size={16} aria-hidden="true" />
            ) : (
              <Check size={17} aria-hidden="true" />
            )}
            {isPending
              ? "Saving…"
              : isDone
                ? "Undo completion"
                : "Mark as complete"}
          </button>
        ) : null}
        <button
          type="button"
          className="weekly-today-details"
          onClick={onDetails}
        >
          Details
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </div>
      {isDone && upNext ? (
        <button
          type="button"
          className="weekly-up-next"
          onClick={() => onJumpNext(upNext.day)}
        >
          <span>
            Up next · {shortDayLabel(upNext.day)}
            <strong>{upNext.title}</strong>
          </span>
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      ) : null}
      {isDone && !upNext ? (
        <p className="weekly-up-next">No upcoming sessions this week.</p>
      ) : null}
    </section>
  );
}

function WeekMetrics({
  completedWeekDistanceKm,
  distanceLabel,
  longRunMinutes,
  sleepHours,
}: {
  completedWeekDistanceKm?: number;
  distanceLabel: string;
  longRunMinutes?: number;
  sleepHours?: number;
}) {
  return (
    <section className="weekly-metrics" aria-label="This week metrics">
      <h2>Training snapshot</h2>
      <dl>
        <div>
          <dt>{distanceLabel}</dt>
          <dd>
            {formatDecimal(completedWeekDistanceKm)}
            {typeof completedWeekDistanceKm === "number" ? (
              <span> km</span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt>Long run planned</dt>
          <dd>
            {formatDecimal(longRunMinutes)}
            {typeof longRunMinutes === "number" ? <span> min</span> : null}
          </dd>
        </div>
        <div>
          <dt>Average sleep</dt>
          <dd>
            {formatDecimal(sleepHours)}
            {typeof sleepHours === "number" ? <span> h</span> : null}
          </dd>
        </div>
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
    <section className="weekly-goal" aria-label={timeline.sectionLabel}>
      <div className="weekly-section-heading">
        <h2>{timeline.sectionLabel}</h2>
        <span className="weekly-tag">{badgeLabel}</span>
      </div>
      <div className="weekly-goal-name">
        <GoalIcon size={19} aria-hidden="true" />
        <h3>{goal.primaryGoal.name}</h3>
      </div>
      <div className="weekly-goal-date">
        {raceGoalDateLabel ? <span>{raceGoalDateLabel}</span> : null}
        {timeline.dayLabel ? (
          <strong>
            {timeline.dayLabel.value} <span>{timeline.dayLabel.unit}</span>
          </strong>
        ) : null}
      </div>
      {showPhaseTimeline ? (
        <ol className="weekly-phases" aria-label="Training phases">
          {raceProgressPhases.map((phase, index) => (
            <li
              key={phase.name}
              aria-current={index === normalizedPhaseIndex ? "step" : undefined}
              className={index < normalizedPhaseIndex ? "is-past" : ""}
            >
              <span aria-hidden="true" />
              <span>{formatWeekType(phase.name)}</span>
            </li>
          ))}
        </ol>
      ) : null}
      {showRecoveryWindow ? (
        <div className="weekly-recovery">
          <p>
            Recovery window{" "}
            <strong>
              day {goal.postGoalRecoveryDay} of {goal.postGoalWindowDays}
            </strong>
          </p>
          <progress
            max={100}
            value={recoveryPercent}
            aria-label="Recovery window"
          />
          <p>
            Easy efforts and short runs only while the coach rebuilds training
            around recovery.
          </p>
        </div>
      ) : null}
      <p className="weekly-goal-context">
        {outcomeCopy ??
          (isRaceDay
            ? "Trust your training. Run smart."
            : isPostGoal
              ? "Recovery-first training this week."
              : isPastGoal
                ? "Recovery window closed"
                : goal.goalSummary)}
      </p>
      {canSetOutcome ? (
        <div className="weekly-goal-actions">
          <Button
            type="button"
            size="sm"
            onClick={() => onSetOutcome("COMPLETED")}
            disabled={outcomePending}
          >
            {outcomePending && outcomePendingAction === "COMPLETED"
              ? "Saving…"
              : "Mark completed"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSetOutcome("SKIPPED")}
            disabled={outcomePending}
          >
            {outcomePending && outcomePendingAction === "SKIPPED"
              ? "Saving…"
              : "Skip goal"}
          </Button>
        </div>
      ) : null}
      {ctaLabel && onSetNextGoal ? (
        <Button
          type="button"
          className="weekly-next-goal"
          onClick={onSetNextGoal}
        >
          {ctaLabel}
          <ArrowRight size={15} aria-hidden="true" />
        </Button>
      ) : null}
      {outcomeError ? (
        <p className="weekly-error" role="alert">
          {outcomeError}
        </p>
      ) : null}
    </section>
  );
}

function ScheduleList({
  sessions,
  todayDay,
  weekStartDate,
  isCurrentWeek,
  completionPending,
  expandedDay,
  onToggleComplete,
  onToggleExpanded,
  setSessionRef,
}: {
  sessions: WeeklyCoachSession[];
  todayDay?: string;
  weekStartDate: string;
  isCurrentWeek: boolean;
  completionPending: boolean;
  expandedDay: string | null;
  onToggleComplete: (day: string) => void;
  onToggleExpanded: (day: string) => void;
  setSessionRef: (day: string, element: HTMLDivElement | null) => void;
}) {
  const completed = sessions.filter(
    (s) => s.modality !== "REST" && s.completed === true,
  ).length;
  const total = sessions.filter((s) => s.modality !== "REST").length;
  const hasCompletion = sessions.some((s) => typeof s.completed === "boolean");
  return (
    <section
      className="weekly-schedule"
      aria-labelledby="weekly-schedule-title"
    >
      <div className="weekly-section-heading">
        <h2 id="weekly-schedule-title" tabIndex={-1}>
          Your schedule
        </h2>
        {hasCompletion ? (
          <span className="weekly-schedule-count">
            {completed} of {total} complete
          </span>
        ) : (
          <span className="weekly-schedule-count">{total} sessions</span>
        )}
      </div>
      {sessions.length === 0 ? (
        <div className="weekly-empty">
          <CalendarOff size={24} aria-hidden="true" />
          <h3>No sessions in this plan</h3>
          <p>
            Your weekly plan has no sessions to display. Check another week or
            refresh the plan.
          </p>
        </div>
      ) : null}
      <div className="weekly-agenda">
        {sessions.map((session) => {
          const isDone = session.completed === true;
          const isRest = session.modality === "REST";
          const isToday = isCurrentWeek && session.day === todayDay;
          const expanded = expandedDay === session.day;
          const showExecutionFeedback =
            isDone &&
            session.modality === "RUN" &&
            ["EASY", "RECOVERY", "LONG_RUN", "TEMPO", "VO2"].includes(
              session.type,
            ) &&
            Boolean(session.syncedActivity);
          const evaluation = showExecutionFeedback
            ? session.executionEvaluation
            : undefined;
          const config = typeConfig[session.modality] ?? typeConfig.RUN;
          const Icon = config.icon;
          const date = addDays(
            parseISO(weekStartDate),
            Math.max(0, dayOrderIndex(session.day)),
          );
          const canToggle =
            typeof session.completed === "boolean" &&
            isCurrentWeek &&
            !completionPending &&
            !isRest;
          return (
            <div
              key={session.day}
              className={`weekly-session${isToday ? " is-today" : ""}${expanded ? " is-expanded" : ""}${isRest ? " is-rest" : ""}`}
              ref={(element) => setSessionRef(session.day, element)}
            >
              <div className="weekly-session-row">
                <div className="weekly-session-date">
                  <span>{shortDayLabel(session.day)}</span>
                  <time dateTime={format(date, "yyyy-MM-dd")}>
                    {format(date, "d")}
                  </time>
                </div>
                <button
                  type="button"
                  id={`session-${session.day}-trigger`}
                  onClick={() => onToggleExpanded(session.day)}
                  aria-label={`Details for ${session.title}`}
                  aria-expanded={expanded}
                  aria-controls={`session-${session.day}-details`}
                  aria-describedby={
                    evaluation?.status === "EVALUATED"
                      ? `session-${session.day}-score`
                      : undefined
                  }
                  className="weekly-session-trigger"
                >
                  <span className="weekly-session-title">
                    {session.title}
                    {isToday ? (
                      <span className="weekly-today-tag">Today</span>
                    ) : null}
                  </span>
                  <span className="weekly-session-meta">
                    <Icon size={14} aria-hidden="true" />
                    {config.label}
                    {!isRest ? (
                      <>
                        {" "}
                        ·{" "}
                        {intensityLabels[session.intensityCategory] ??
                          session.intensityCategory}{" "}
                        · <span>{session.durationMinutes} min</span> planned
                      </>
                    ) : null}
                  </span>
                  <span className="weekly-session-status">
                    {isDone ? "Completed" : isRest ? "Recovery" : "Planned"}
                    {session.role === "KEY" ? (
                      <span className="weekly-key-inline">
                        <Star size={11} aria-hidden="true" />
                        Key
                      </span>
                    ) : null}
                  </span>
                  <ChevronDown
                    className="weekly-session-chevron"
                    size={17}
                    aria-hidden="true"
                  />
                </button>
                {!isRest && typeof session.completed === "boolean" ? (
                  <button
                    type="button"
                    className={`weekly-complete${isDone ? " is-complete" : ""}`}
                    onClick={() => onToggleComplete(session.day)}
                    disabled={!canToggle}
                    aria-label={`Mark ${session.title} as ${isDone ? "incomplete" : "complete"}`}
                    aria-pressed={isDone}
                  >
                    {isDone ? (
                      <Check size={18} aria-hidden="true" />
                    ) : (
                      <span aria-hidden="true" />
                    )}
                  </button>
                ) : null}
              </div>
              {session.syncedActivity || evaluation?.status === "EVALUATED" ? (
                <div className="weekly-session-evidence">
                  <SyncedActivityBadge session={session} />
                  {evaluation?.status === "EVALUATED" ? (
                    <span
                      className="weekly-score"
                      id={`session-${session.day}-score`}
                      aria-label={`Execution score ${evaluation.score} out of 100`}
                    >
                      {evaluation.score}/100 <span>execution</span>
                    </span>
                  ) : null}
                </div>
              ) : null}
              <div
                id={`session-${session.day}-details`}
                className="weekly-session-details"
                hidden={!expanded}
              >
                {expanded ? (
                  <div className="weekly-session-detail-content">
                    {session.notes ? <p>{session.notes}</p> : null}
                    {session.strengthFocus?.length ? (
                      <ul
                        className="weekly-strength-focus"
                        aria-label="Strength focus"
                      >
                        {session.strengthFocus.map((focus) => (
                          <li key={focus}>{focus}</li>
                        ))}
                      </ul>
                    ) : null}
                    {!session.notes && !session.strengthFocus?.length ? (
                      <p>
                        {isRest
                          ? "No training session planned for this day."
                          : `${session.durationMinutes} minutes planned at ${(intensityLabels[session.intensityCategory] ?? session.intensityCategory).toLowerCase()} intensity.`}
                      </p>
                    ) : null}
                    <RecordedActivity session={session} />
                    {showExecutionFeedback ? (
                      <ExecutionFeedbackDetails evaluation={evaluation} />
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function WeeklyPlanScreen({
  athleteId,
  targetWeekStartDate,
  isPreparing,
  onRefresh,
  onSetNextGoal,
}: WeeklyPlanScreenProps) {
  const [selectedWeekStartDate, setSelectedWeekStartDate] =
    useState(targetWeekStartDate);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
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
    queryKey: [
      "portal",
      "weekly-coach-screen",
      athleteId,
      selectedWeekStartDate,
    ],
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
        queryKey: [
          "portal",
          "weekly-coach-screen",
          athleteId,
          selectedWeekStartDate,
        ],
      });

      const previousScreen =
        queryClient.getQueryData<CurrentUserWeeklyCoachScreen>([
          "portal",
          "weekly-coach-screen",
          athleteId,
          selectedWeekStartDate,
        ]);

      queryClient.setQueryData<CurrentUserWeeklyCoachScreen>(
        ["portal", "weekly-coach-screen", athleteId, selectedWeekStartDate],
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
        ["portal", "weekly-coach-screen", athleteId, selectedWeekStartDate],
        context.previousScreen,
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "portal",
          "weekly-coach-screen",
          athleteId,
          selectedWeekStartDate,
        ],
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
        queryKey: [
          "portal",
          "weekly-coach-screen",
          athleteId,
          selectedWeekStartDate,
        ],
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
    if (!session || !weekStartDate || typeof session.completed !== "boolean")
      return;

    completionMutation.mutate({
      weekStartDate,
      day,
      completed: !session.completed,
    });
  };

  const scrollToDay = (day: string) => {
    setExpandedDay(day);
    window.requestAnimationFrame(() => {
      const target = sessionRefs.current[day];
      const trigger = target?.querySelector<HTMLButtonElement>(
        ".weekly-session-trigger",
      );
      trigger?.focus({ preventScroll: true });
      trigger?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
      });
    });
  };

  const header = (
    <header className="weekly-header">
      <div>
        <h1>
          Your week<span className="weekly-heading-dot">.</span>
        </h1>
        {plan ? (
          <p>
            {formatWeekType(plan.plan.weekType)} week{" "}
            <span aria-hidden="true">/</span>{" "}
            {formatWeekType(
              plan.summary.phase ?? screen?.goal?.phase ?? "Training",
            )}{" "}
            phase
          </p>
        ) : (
          <p>Your training, one week at a time.</p>
        )}
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
        canGoPrevious={
          Boolean(screen?.canGoPrevious) &&
          !completionMutation.isPending &&
          !raceGoalOutcomeMutation.isPending
        }
        canGoNext={
          Boolean(screen?.canGoNext) &&
          !completionMutation.isPending &&
          !raceGoalOutcomeMutation.isPending
        }
        showReturnToCurrent={
          selectedWeekStartDate !==
          (screen?.todayWeekStartDate ?? targetWeekStartDate)
        }
      />
    </header>
  );

  if (
    (isPreparing && isCurrentWeek) ||
    screenQuery.isLoading ||
    screenQuery.isError ||
    !plan
  ) {
    const preparing = isPreparing && isCurrentWeek;
    const loading = screenQuery.isLoading && !preparing;
    const error = screenQuery.isError;
    const title = preparing
      ? "Preparing your weekly plan"
      : loading
        ? "Loading your weekly plan…"
        : error
          ? "We couldn't load your weekly plan"
          : isFutureWeek
            ? "No plan yet"
            : isPastWeek
              ? "No data for this week"
              : "We're syncing your weekly plan";
    const description = preparing
      ? `We're preparing your plan for ${weekRangeLabel}. First plans are generated automatically once onboarding is complete, and future plans are refreshed on Sunday night.`
      : error
        ? "Your plan may still be syncing. Try again in a moment."
        : isFutureWeek
          ? "Future plans are generated automatically at the end of each week based on your recent training context."
          : isPastWeek
            ? "Historical weekly plan data is not available here yet."
            : "Your plan is not readable yet. Refresh in a moment and we'll check again.";
    return (
      <main className={screenShellClassName} aria-label="Weekly training plan">
        {header}
        <section
          className="weekly-empty"
          aria-busy={loading || preparing}
          aria-live="polite"
        >
          {!loading ? (
            <CalendarOff size={28} aria-hidden="true" />
          ) : (
            <div className="weekly-skeleton" aria-hidden="true" />
          )}
          <h2>{title}</h2>
          {!loading ? <p>{description}</p> : null}
          {!loading && (error || (!isFutureWeek && !isPastWeek)) ? (
            <Button
              type="button"
              variant="outline"
              disabled={screenQuery.isFetching}
              onClick={() => {
                if (!preparing) void screenQuery.refetch();
                void onRefresh();
              }}
            >
              {screenQuery.isFetching
                ? "Refreshing…"
                : error
                  ? "Try again"
                  : "Refresh"}
            </Button>
          ) : null}
        </section>
      </main>
    );
  }

  const sessions = [...plan.plan.sessions].sort(
    (a, b) => dayOrderIndex(a.day) - dayOrderIndex(b.day),
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
    <main className="weekly-plan" aria-label="Weekly training plan">
      <a className="weekly-skip" href="#weekly-schedule-title">
        Skip to schedule
      </a>
      {header}
      {sessions.length ? (
        <WeekPulse
          sessions={sessions}
          todayDay={todayDay}
          isCurrentWeek={isCurrentWeek}
          selectedDay={expandedDay}
          weekStartDate={selectedWeekStartDate}
          onSelectDay={scrollToDay}
        />
      ) : null}
      <div className="weekly-workspace">
        <div className="weekly-training">
          {showTodayHero && todaySession ? (
            <TodaySession
              session={todaySession}
              upNext={upNextSession}
              canComplete={
                todaySession.modality !== "REST" &&
                typeof todaySession.completed === "boolean"
              }
              isPending={completionMutation.isPending}
              onComplete={() => toggleComplete(todaySession.day)}
              onJumpNext={scrollToDay}
              onDetails={() => scrollToDay(todaySession.day)}
            />
          ) : null}
          <div className="weekly-save-status" role="status" aria-live="polite">
            {completionMutation.isPending
              ? "Saving completion…"
              : completionMutation.isError
                ? "Could not save completion. Please try again."
                : completionMutation.isSuccess
                  ? "Completion saved."
                  : ""}
          </div>
          <ScheduleList
            sessions={sessions}
            todayDay={todayDay}
            weekStartDate={selectedWeekStartDate}
            isCurrentWeek={isCurrentWeek}
            completionPending={completionMutation.isPending}
            expandedDay={expandedDay}
            onToggleComplete={toggleComplete}
            onToggleExpanded={(day) =>
              setExpandedDay(expandedDay === day ? null : day)
            }
            setSessionRef={(day, element) => {
              sessionRefs.current[day] = element;
            }}
          />
        </div>
        <aside className="weekly-context" aria-label="Weekly training context">
          {plan.plan.weekObjective ? (
            <section className="weekly-coach">
              <div className="weekly-section-heading">
                <h2>The week's focus</h2>
                <MessageCircle size={18} aria-hidden="true" />
              </div>
              <p>{plan.plan.weekObjective}</p>
              {plan.plan.progressionNote ? (
                <p className="weekly-progression">
                  {plan.plan.progressionNote}
                </p>
              ) : null}
            </section>
          ) : null}
          <WeekMetrics
            completedWeekDistanceKm={
              plan.summary.completedWeekDistanceKm ??
              plan.summary.last7dDistanceKm
            }
            distanceLabel={
              typeof plan.summary.completedWeekDistanceKm === "number"
                ? "Distance completed"
                : "Last 7 days"
            }
            longRunMinutes={screen?.highlights.longRun?.durationMinutes}
            sleepHours={plan.summary.sleepHours}
          />
          <RaceGoalCard
            goal={goal}
            raceGoalDateLabel={raceGoalDateLabel}
            outcomePending={raceGoalOutcomeMutation.isPending}
            outcomeError={outcomeError}
            outcomePendingAction={outcomePendingAction}
            onSetOutcome={(outcome) => raceGoalOutcomeMutation.mutate(outcome)}
            onSetNextGoal={onSetNextGoal}
          />
        </aside>
      </div>
    </main>
  );
}
