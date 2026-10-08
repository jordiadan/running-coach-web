import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import WeeklyPlanScreen from "@/components/portal/WeeklyPlanScreen";
import {
  feedbackExamples,
  workoutFeedbackScreen,
} from "./workout-feedback-fixtures";

function seedPreview(client: QueryClient, example: string) {
  const screen = workoutFeedbackScreen(example);
  client.setQueryData(
    ["portal", "weekly-coach-screen", screen.selectedWeekStartDate],
    screen,
  );
  client.setQueryData(
    ["portal", "weekly-coach-screen", screen.todayWeekStartDate],
    {
      ...screen,
      selectedWeekStartDate: screen.todayWeekStartDate,
      viewType: "EMPTY",
      plan: undefined,
      highlights: {},
      canGoPrevious: true,
      previousWeekStartDate: screen.selectedWeekStartDate,
    },
  );
}

export default function WorkoutFeedbackPreview() {
  const [example, setExample] = useState("evaluated");
  const data = workoutFeedbackScreen(example);
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity } },
    });
    seedPreview(client, "evaluated");
    return client;
  });
  useEffect(() => {
    seedPreview(queryClient, example);
  }, [example, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <header className="border-b border-border">
        <div className="mx-auto flex min-h-16 max-w-2xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <span className="font-serif text-xl">Running Coach</span>
          <span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium">
            Design preview · Mock data
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <div className="mb-6 space-y-2 border-b border-border pb-5">
          <label
            htmlFor="feedback-example"
            className="block text-sm font-medium"
          >
            Preview a feedback state
          </label>
          <select
            id="feedback-example"
            value={example}
            onChange={(event) => setExample(event.target.value)}
            className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
          >
            {Object.entries(feedbackExamples).map(([key, item]) => (
              <option key={key} value={key}>
                {item.label}
              </option>
            ))}
          </select>
          <p className="text-sm text-foreground/70">
            Open Monday’s run to see the feedback. All activities and
            evaluations on this page are examples.
          </p>
        </div>
        <WeeklyPlanScreen
          athleteId="demo-athlete"
          targetWeekStartDate={data.selectedWeekStartDate}
          isPreparing={false}
          onRefresh={() => {}}
          onRetryExecutionFeedback={() => setExample("evaluated")}
          executionFeedbackByDay={{
            MON: feedbackExamples[example].feedback,
            WED: { status: "insufficient_evidence" },
            FRI: { status: "unavailable" },
          }}
        />
      </main>
    </QueryClientProvider>
  );
}
