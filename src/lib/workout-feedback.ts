import type { WeeklyCoachSession } from "@/lib/portal-api";

// Presentation model only. The API adapter is a separate, subsequent slice.
export type ExecutionDimension = {
  outcome:
    | "on_target"
    | "above_target"
    | "below_target"
    | "as_planned"
    | "different"
    | "unavailable";
  label: string;
  planned?: string;
  recorded?: string;
};

export type ExecutionFeedback =
  | {
      status: "evaluated";
      score: number;
      label: string;
      summary?: string;
      duration: ExecutionDimension;
      intensity: ExecutionDimension;
      structure: ExecutionDimension;
    }
  | { status: "insufficient_evidence" }
  | { status: "unavailable" }
  | { status: "loading" }
  | { status: "error" };

export function canShowExecutionFeedback(session: WeeklyCoachSession) {
  return (
    session.modality === "RUN" &&
    (session.completed === true || Boolean(session.syncedActivity))
  );
}
