import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WorkoutExecutionFeedback from "@/components/portal/WorkoutExecutionFeedback";
import WeeklyPlanScreen from "@/components/portal/WeeklyPlanScreen";
import WorkoutFeedbackPreview from "@/dev/WorkoutFeedbackPreview";
import {
  feedbackExamples,
  workoutFeedbackScreen,
} from "@/dev/workout-feedback-fixtures";
import { getCurrentUserWeeklyCoachScreen } from "@/lib/portal-api";
import type { ExecutionFeedback } from "@/lib/workout-feedback";

vi.mock("@/lib/portal-api", async () => ({
  ...(await vi.importActual<typeof import("@/lib/portal-api")>(
    "@/lib/portal-api",
  )),
  getCurrentUserWeeklyCoachScreen: vi.fn(),
}));

const session = workoutFeedbackScreen("evaluated").plan!.plan.sessions[0];

describe("Workout execution feedback", () => {
  it("explains adherence and shows supplied dimensions without computing a score", () => {
    render(
      <WorkoutExecutionFeedback
        session={session}
        feedback={feedbackExamples.evaluated.feedback}
      />,
    );
    expect(
      screen.getByLabelText("Plan adherence: 86 out of 100"),
    ).toBeInTheDocument();
    expect(screen.getByText(/doesn’t measure fitness/)).toBeInTheDocument();
    expect(
      screen.getByText("45 min planned · 47 min recorded"),
    ).toBeInTheDocument();
    expect(screen.getByText("Higher than planned")).toBeInTheDocument();
    expect(screen.getByText("As planned")).toBeInTheDocument();
  });

  it.each(["insufficient", "unavailable", "manual", "loading", "error"])(
    "never fabricates a score for %s",
    (example) => {
      const item = workoutFeedbackScreen(example).plan!.plan.sessions[0];
      render(
        <WorkoutExecutionFeedback
          session={item}
          feedback={feedbackExamples[example].feedback}
        />,
      );
      expect(
        screen.queryByLabelText(/Plan adherence:/),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("/ 100")).not.toBeInTheDocument();
      if (example === "manual")
        expect(
          screen.getByText("A recorded run is needed"),
        ).toBeInTheDocument();
      if (example === "loading")
        expect(screen.getByRole("status")).toHaveAccessibleName(
          "Loading workout feedback",
        );
    },
  );

  it("leaves a dimension unassessed instead of inventing evidence", () => {
    render(
      <WorkoutExecutionFeedback
        session={session}
        feedback={feedbackExamples.partial.feedback}
      />,
    );
    expect(screen.getByText("Not assessed")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Plan adherence: 92 out of 100"),
    ).toBeInTheDocument();
  });

  it.each([NaN, Infinity, -1, 101])(
    "does not render invalid score %s",
    (score) => {
      const feedback = {
        ...feedbackExamples.evaluated.feedback,
        score,
      } as ExecutionFeedback;
      render(
        <WorkoutExecutionFeedback session={session} feedback={feedback} />,
      );
      expect(
        screen.queryByLabelText(/Plan adherence:/),
      ).not.toBeInTheDocument();
    },
  );

  it("keeps durable feedback when manual completion is cleared but the activity stays linked", () => {
    render(
      <WorkoutExecutionFeedback
        session={{ ...session, completed: false }}
        feedback={feedbackExamples.evaluated.feedback}
      />,
    );
    expect(
      screen.getByLabelText("Plan adherence: 86 out of 100"),
    ).toBeInTheDocument();
  });

  it("does not show feedback for unmatched future runs or other modalities", () => {
    const { container, rerender } = render(
      <WorkoutExecutionFeedback
        session={{ ...session, completed: false, syncedActivity: undefined }}
        feedback={feedbackExamples.evaluated.feedback}
      />,
    );
    expect(container).toBeEmptyDOMElement();
    rerender(
      <WorkoutExecutionFeedback
        session={{ ...session, modality: "STRENGTH" }}
        feedback={feedbackExamples.evaluated.feedback}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("allows retry without modifying completion or the matched activity", () => {
    const retry = vi.fn();
    render(
      <WorkoutExecutionFeedback
        session={session}
        feedback={{ status: "error" }}
        onRetry={retry}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});

describe("Weekly Plan feedback disclosure", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps calendar rows compact and exposes feedback through an accessible disclosure", async () => {
    const data = workoutFeedbackScreen("evaluated");
    vi.mocked(getCurrentUserWeeklyCoachScreen).mockImplementation(
      async () =>
        data as Awaited<ReturnType<typeof getCurrentUserWeeklyCoachScreen>>,
    );
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <WeeklyPlanScreen
          athleteId="demo"
          targetWeekStartDate={data.selectedWeekStartDate}
          isPreparing={false}
          onRefresh={() => {}}
          executionFeedbackByDay={{ MON: feedbackExamples.evaluated.feedback }}
        />
      </QueryClientProvider>,
    );
    const button = await screen.findByRole("button", {
      name: "View details for Easy aerobic run",
    });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("region", { name: "Workout feedback" }),
    ).not.toBeInTheDocument();
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(
      document.getElementById(button.getAttribute("aria-controls")!),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Plan adherence: 86 out of 100"),
    ).toBeInTheDocument();
    fireEvent.click(button);
    await waitFor(() =>
      expect(
        screen.queryByRole("region", { name: "Workout feedback" }),
      ).not.toBeInTheDocument(),
    );
  });
});

describe("Mock preview isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  it("updates activity evidence when switching examples and keeps Today navigation off the API", async () => {
    render(<WorkoutFeedbackPreview />);
    fireEvent.click(
      await screen.findByRole("button", {
        name: "View details for Easy aerobic run",
      }),
    );
    expect(
      screen.getByLabelText("Plan adherence: 86 out of 100"),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Preview a feedback state"), {
      target: { value: "manual" },
    });
    expect(
      await screen.findByText("A recorded run is needed"),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/Plan adherence:/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Today" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("button", {
          name: "View details for Easy aerobic run",
        }),
      ).not.toBeInTheDocument(),
    );
    expect(getCurrentUserWeeklyCoachScreen).not.toHaveBeenCalled();
  });
});
