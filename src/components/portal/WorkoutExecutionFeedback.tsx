import {
  ArrowRightLeft,
  Check,
  Info,
  Minus,
  MoveDownRight,
  MoveUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WeeklyCoachSession } from "@/lib/portal-api";
import {
  canShowExecutionFeedback,
  type ExecutionDimension,
  type ExecutionFeedback,
} from "@/lib/workout-feedback";

function DimensionRow({
  name,
  dimension,
}: {
  name: string;
  dimension: ExecutionDimension;
}) {
  const aligned =
    dimension.outcome === "on_target" || dimension.outcome === "as_planned";
  const unavailable = dimension.outcome === "unavailable";
  const Icon = aligned
    ? Check
    : unavailable
      ? Minus
      : dimension.outcome === "below_target"
        ? MoveDownRight
        : dimension.outcome === "different"
          ? ArrowRightLeft
          : MoveUpRight;

  return (
    <div className="grid gap-1 py-3 sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium">{name}</dt>
      <dd className="sm:col-span-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Icon
            aria-hidden="true"
            className={`h-4 w-4 shrink-0 ${aligned ? "text-primary" : "text-foreground/70"}`}
          />
          {dimension.label}
        </span>
        {dimension.comparison && !unavailable ? (
          <p className="mt-1 pl-6 text-sm leading-relaxed text-foreground/70">
            {dimension.comparison}
          </p>
        ) : null}
      </dd>
    </div>
  );
}

export default function WorkoutExecutionFeedback({
  session,
  feedback,
  onRetry,
}: {
  session: WeeklyCoachSession;
  feedback?: ExecutionFeedback;
  onRetry?: () => void;
}) {
  if (!canShowExecutionFeedback(session)) return null;

  const evaluated =
    feedback?.status === "evaluated" &&
    Number.isFinite(feedback.score) &&
    feedback.score >= 0 &&
    feedback.score <= 100;

  return (
    <section
      aria-label="Workout feedback"
      className="selection:bg-primary/15 selection:text-foreground"
    >
      <h4 className="text-base font-semibold">Workout feedback</h4>
      <p className="mt-1 text-sm leading-relaxed text-foreground/70">
        How closely this run followed your plan.
      </p>

      {evaluated ? (
        <>
          <div className="mt-5 flex items-center gap-4">
            <p
              className="shrink-0 tabular-nums"
              aria-label={`Plan adherence: ${feedback.score} out of 100`}
            >
              <span className="text-4xl font-semibold tracking-tight">
                {feedback.score}
              </span>
              <span className="ml-1 text-sm text-foreground/70">/ 100</span>
            </p>
            <div className="border-l border-border pl-4">
              <p className="text-sm font-semibold">{feedback.label}</p>
              <p className="mt-0.5 text-sm text-foreground/70">
                Plan adherence
              </p>
            </div>
          </div>
          {feedback.summary ? (
            <p className="mt-4 text-sm leading-relaxed">{feedback.summary}</p>
          ) : null}
          <dl className="mt-4 divide-y divide-border border-y border-border">
            <DimensionRow name="Duration" dimension={feedback.duration} />
            <DimensionRow name="Intensity" dimension={feedback.intensity} />
            <DimensionRow name="Structure" dimension={feedback.structure} />
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-foreground/70">
            This compares your run with the prescription. It doesn’t measure
            fitness or race performance.
          </p>
        </>
      ) : feedback?.status === "loading" ? (
        <div
          role="status"
          className="mt-4 space-y-3"
          aria-label="Loading workout feedback"
        >
          <span className="sr-only">Loading workout feedback…</span>
          <div className="h-10 w-36 rounded-md bg-muted motion-safe:animate-pulse" />
          <div className="h-20 rounded-md bg-muted motion-safe:animate-pulse" />
        </div>
      ) : (
        <div className="mt-4 flex items-start gap-2.5 border-t border-border pt-4">
          <Info
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-foreground/70"
          />
          <div>
            <p className="text-sm font-medium">
              {feedback?.status === "error"
                ? "Feedback couldn’t be loaded"
                : feedback?.status === "insufficient_evidence"
                  ? "Not enough data to evaluate this run"
                  : !session.syncedActivity
                    ? "A recorded run is needed"
                    : "No evaluation available"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/70">
              {feedback?.status === "error"
                ? "Your recorded activity is still linked to this session."
                : feedback?.status === "insufficient_evidence"
                  ? "Your activity is linked, but there isn’t enough recorded detail to compare it with the plan. No score has been assigned."
                  : !session.syncedActivity
                    ? "Marking a session complete doesn’t evaluate it. Feedback needs a synced activity matched to this session."
                    : "Your activity is linked to this session. There’s no execution result to show."}
            </p>
            {feedback?.status === "error" && onRetry ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="mt-3"
              >
                Try again
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
