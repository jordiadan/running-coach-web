import {
  ArrowRightLeft,
  Check,
  ChevronDown,
  Info,
  Minus,
  MoveDownRight,
  MoveUpRight,
} from "lucide-react";
import WorkoutExecutionScore from "./WorkoutExecutionScore";
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
        className="py-3 pr-2 text-left align-top text-sm font-medium"
      >
        {name}
      </th>
      <td className="break-words py-3 pr-0 align-top text-sm text-foreground/70 sm:pr-2">
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
}: {
  session: WeeklyCoachSession;
  feedback?: ExecutionFeedback;
  onRetry?: () => void;
}) {
  if (!canShowExecutionFeedback(session)) return null;
  const result = evaluatedExecutionFeedback(feedback);
  const dimensions = result
    ? [
        { name: "Duration", dimension: result.duration },
        { name: "Intensity", dimension: result.intensity },
        { name: "Structure", dimension: result.structure },
      ]
    : [];
  const groups = [
    {
      title: "Matched your plan",
      Icon: Check,
      tone: "bg-primary/10 text-primary",
      items: dimensions.filter(
        ({ dimension }) =>
          dimension.outcome === "on_target" ||
          dimension.outcome === "as_planned",
      ),
      matched: true,
    },
    {
      title: "Worth adjusting",
      Icon: ArrowRightLeft,
      tone: "bg-accent/10 text-foreground",
      items: dimensions.filter(
        ({ dimension }) =>
          !["on_target", "as_planned", "unavailable"].includes(
            dimension.outcome,
          ),
      ),
      matched: false,
    },
    {
      title: "Not assessed",
      Icon: Minus,
      tone: "bg-secondary text-foreground/70",
      items: dimensions.filter(
        ({ dimension }) => dimension.outcome === "unavailable",
      ),
      matched: true,
    },
  ];

  return (
    <section
      aria-label="Workout feedback"
      className="selection:bg-primary/15 selection:text-foreground"
    >
      {result ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-semibold">{result.label}</h4>
              <p className="mt-1 text-xs text-foreground/70">
                Match to your plan
              </p>
            </div>
            <WorkoutExecutionScore feedback={result} />
          </div>
          <div className="my-4 space-y-3">
            {groups
              .filter((group) => group.items.length > 0)
              .map(({ title, Icon, tone, items, matched }) => (
                <div key={title} className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${tone}`}
                  >
                    <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <h5 className="text-xs leading-relaxed text-foreground/70">
                      {title}
                    </h5>
                    <ul
                      aria-label={title}
                      className="flex flex-wrap gap-x-3 gap-y-1 text-sm font-medium"
                    >
                      {items.map(({ name, dimension }) => (
                        <li key={name}>
                          {name}
                          {matched ? "" : ` · ${dimension.label}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
          </div>
          {result.insight ? (
            <div className="mb-3 border-t border-border pt-3">
              <p className="text-sm leading-relaxed">
                <span className="font-semibold">Next time: </span>
                {result.insight}
              </p>
            </div>
          ) : null}
        </>
      ) : feedback?.status === "loading" ? (
        <div
          role="status"
          className="space-y-3"
          aria-label="Loading workout feedback"
        >
          <h4 className="text-base font-semibold">Workout feedback</h4>
          <span className="sr-only">Loading workout feedback…</span>
          <div className="h-8 w-36 rounded-md bg-muted motion-safe:animate-pulse" />
          <div className="h-20 rounded-md bg-muted motion-safe:animate-pulse" />
        </div>
      ) : (
        <div className="flex items-start gap-2.5">
          <Info
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-foreground/70"
          />
          <div>
            <h4 className="text-sm font-semibold">
              {feedback?.status === "error"
                ? "Feedback couldn’t be loaded"
                : feedback?.status === "insufficient_evidence"
                  ? "Not enough data to evaluate this run"
                  : !session.syncedActivity
                    ? "A recorded run is needed"
                    : "No evaluation available"}
            </h4>
            <p className="mt-1 text-sm leading-relaxed text-foreground/70">
              {feedback?.status === "error"
                ? "Your run is still linked. Try loading the feedback again."
                : feedback?.status === "insufficient_evidence"
                  ? "Your run is linked, but there isn’t enough recorded detail to give it a score."
                  : !session.syncedActivity
                    ? "Feedback needs a synced run matched to this session."
                    : "Your run is linked, but no execution result is available."}
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
      {result || session.notes ? (
        <details className="group mt-1 border-t border-border">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-sm text-xs font-medium text-foreground/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            {result ? "Compare with plan" : "Session notes"}
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
                    <col className="w-1/3" />
                    <col className="w-1/3" />
                    <col className="w-1/3" />
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
                {result.summary ? (
                  <p className="text-foreground">{result.summary}</p>
                ) : null}
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
