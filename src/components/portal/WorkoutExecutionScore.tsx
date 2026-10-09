import {
  evaluatedExecutionFeedback,
  type ExecutionFeedback,
} from "@/lib/workout-feedback";

export default function WorkoutExecutionScore({
  feedback,
}: {
  feedback?: ExecutionFeedback;
}) {
  const result = evaluatedExecutionFeedback(feedback);
  if (!result) return null;

  return (
    <span
      aria-label={`Plan adherence: ${result.score} out of 100`}
      title={`Plan match: ${result.label}`}
      className="inline-flex w-16 shrink-0 items-baseline justify-end whitespace-nowrap tabular-nums"
    >
      <span className="text-base font-semibold tracking-tight text-foreground">
        {result.score}
      </span>
      <span className="ml-0.5 text-xs text-foreground/70">/ 100</span>
    </span>
  );
}
