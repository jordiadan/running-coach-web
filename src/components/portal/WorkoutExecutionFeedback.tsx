import {
  ArrowRightLeft,
  Check,
  ChevronDown,
  Minus,
  MoveDownRight,
  MoveUpRight,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { WeeklyCoachSession } from "@/lib/portal-api";
import {
  canShowExecutionFeedback,
  evaluatedExecutionFeedback,
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
    <tr className="border-t border-border">
      <th
        scope="row"
        className="py-3 pr-1 text-left align-top text-sm font-medium"
      >
        {name}
      </th>
      <td className="break-words py-3 pr-1 align-top text-sm text-foreground/70">
        {dimension.planned ?? <span aria-label="Not available">—</span>}
      </td>
      <td className="break-words py-3 align-top">
        <p className="text-sm font-semibold">
          {!unavailable && dimension.recorded ? (
            dimension.recorded
          ) : (
            <span aria-label="Not available">—</span>
          )}
        </p>
        <span className="mt-1 flex items-start gap-1.5 text-xs leading-relaxed text-foreground/70">
          <Icon
            aria-hidden="true"
            className={`mt-0.5 h-3 w-3 shrink-0 ${aligned ? "text-primary" : "text-foreground/70"}`}
          />
          {dimension.label}
        </span>
      </td>
    </tr>
  );
}

export default function WorkoutExecutionFeedback({
  session,
  feedback,
  onRetry,
  activitySource,
}: {
  session: WeeklyCoachSession;
  feedback?: ExecutionFeedback;
  onRetry?: () => void;
  activitySource?: ReactNode;
}) {
  if (!canShowExecutionFeedback(session)) return null;
  const result = evaluatedExecutionFeedback(feedback);

  return (
    <section
      aria-label="Workout feedback"
      className="selection:bg-primary/15 selection:text-foreground"
    >
      {result ? (
        <div className="space-y-1 text-sm leading-relaxed">
          <p className="text-foreground/80">{result.summary ?? result.label}</p>
          {result.insight ? <p>{result.insight}</p> : null}
        </div>
      ) : feedback?.status === "loading" ? (
        <div
          role="status"
          aria-label="Loading workout feedback"
          className="space-y-2 py-1"
        >
          <span className="sr-only">Loading workout feedback…</span>
          <div className="h-3 w-4/5 rounded bg-muted motion-safe:animate-pulse" />
          <div className="h-3 w-3/5 rounded bg-muted motion-safe:animate-pulse" />
        </div>
      ) : (
        <div className="text-sm leading-relaxed text-foreground/70">
          <p>
            {feedback?.status === "error"
              ? "Feedback couldn’t be loaded."
              : feedback?.status === "insufficient_evidence"
                ? "Your run is linked, but there isn’t enough recorded detail to give it a score."
                : !session.syncedActivity
                  ? "Feedback needs a synced run matched to this session."
                  : "Your run is linked, but no execution result is available."}
          </p>
          {feedback?.status === "error" && onRetry ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="mt-1 min-h-11 px-0 hover:bg-transparent hover:underline"
            >
              Try again
            </Button>
          ) : null}
        </div>
      )}
      {activitySource ? <div>{activitySource}</div> : null}
      {result || session.notes ? (
        <details className="group mt-1">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-sm text-xs font-medium text-foreground/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            {result
              ? "Compare with plan"
              : session.notes
                ? "Session notes"
                : "Recorded activity"}
            <ChevronDown
              aria-hidden="true"
              className="h-3.5 w-3.5 transition-transform group-open:rotate-180 motion-reduce:transition-none"
            />
          </summary>
          <div className="space-y-3 pb-1 text-sm leading-relaxed text-foreground/70">
            {result ? (
              <>
                <table
                  className="w-full table-fixed"
                  aria-label="Plan and recorded run comparison"
                >
                  <colgroup>
                    <col className="w-[28%]" />
                    <col className="w-[35%]" />
                    <col className="w-[37%]" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col" className="pb-2 text-left">
                        <span className="sr-only">Dimension</span>
                      </th>
                      <th
                        scope="col"
                        className="pb-2 pr-2 text-left text-xs font-normal text-foreground/70"
                      >
                        Plan
                      </th>
                      <th
                        scope="col"
                        className="pb-2 text-left text-xs font-medium"
                      >
                        Your run
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <DimensionRow name="Duration" dimension={result.duration} />
                    <DimensionRow
                      name="Intensity"
                      dimension={result.intensity}
                    />
                    <DimensionRow
                      name="Structure"
                      dimension={result.structure}
                    />
                  </tbody>
                </table>
                <p>
                  The score measures how closely you followed the plan. It
                  doesn’t measure fitness or race performance.
                </p>
              </>
            ) : null}
            {session.notes ? (
              <div>
                <h5 className="mb-1 font-medium text-foreground">
                  Session notes
                </h5>
                <p>{session.notes}</p>
              </div>
            ) : null}
          </div>
        </details>
      ) : null}
    </section>
  );
}
