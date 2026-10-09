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
      className="inline-flex w-16 shrink-0 flex-col gap-1 whitespace-nowrap tabular-nums"
    >
      <span className="text-right">
        <span className="text-base font-semibold tracking-tight text-foreground">
          {result.score}
        </span>
        <span className="ml-0.5 text-xs text-foreground/70">/ 100</span>
      </span>
      <span
        aria-hidden="true"
        className="h-1 overflow-hidden rounded-full bg-foreground/10"
      >
        <span
          className="block h-full rounded-full bg-foreground/70 transition-[width] duration-300 ease-out motion-reduce:transition-none"
          style={{ width: `${result.score}%` }}
        />
      </span>
    </span>
  );
}
