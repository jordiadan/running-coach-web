import {
  evaluatedExecutionFeedback,
  type ExecutionFeedback,
} from "@/lib/workout-feedback";

export default function WorkoutExecutionScore({
  feedback,
  compact = false,
}: {
  feedback?: ExecutionFeedback;
  compact?: boolean;
}) {
  const result = evaluatedExecutionFeedback(feedback);
  if (!result) return null;

  return (
    <span
      aria-label={`Plan adherence: ${result.score} out of 100`}
      className={`shrink-0 whitespace-nowrap tabular-nums ${compact ? "rounded-md bg-primary/10 px-2 py-1 text-sm" : "text-3xl tracking-tight"}`}
    >
      <span className="font-semibold text-primary">{result.score}</span>
      <span
        className={`text-foreground/70 ${compact ? "text-xs" : "ml-1 text-sm tracking-normal"}`}
      >
        / 100
      </span>
    </span>
  );
}
