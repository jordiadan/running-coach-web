import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WorkoutExecutionScore from "@/components/portal/WorkoutExecutionScore";
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
  it.each([0, 48, 92, 100])(
    "shows score %s proportionally without assigning a quality category",
    (score) => {
      const feedback = {
        ...feedbackExamples.evaluated.feedback,
        score,
      } as ExecutionFeedback;
      const { container } = render(
        <WorkoutExecutionScore feedback={feedback} />,
      );
      expect(
        screen.getByLabelText(`Plan adherence: ${score} out of 100`),
      ).toBeVisible();
      expect(container.querySelector("[style]")).toHaveStyle({
        width: `${score}%`,
      });
      expect(container.querySelector("[style]")).toHaveClass(
        "motion-reduce:transition-none",
      );
    },
  );

  it("keeps the activity source outside the comparison disclosure", () => {
    render(
      <WorkoutExecutionFeedback
        session={session}
        feedback={feedbackExamples.evaluated.feedback}
        activitySource={
          <a href="https://intervals.icu/activities/demo-run">
            View on Intervals
          </a>
        }
      />,
    );
    const source = screen.getByRole("link", { name: "View on Intervals" });
    expect(source).toBeVisible();
    expect(source.closest("details")).toBeNull();
    expect(screen.getByRole("table")).not.toBeVisible();
  });
  it("explains supplied feedback without repeating the row score", () => {
    render(
      <WorkoutExecutionFeedback
        session={session}
        feedback={feedbackExamples.evaluated.feedback}
      />,
    );
    expect(screen.queryByLabelText(/Plan adherence:/)).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Duration and structure matched the plan. Your effort was higher than planned.",
      ),
    ).toBeVisible();
    expect(
      screen.getByText("Keep your next easy run at a conversational effort."),
    ).toBeVisible();
    expect(screen.getByRole("table")).not.toBeVisible();
    fireEvent.click(screen.getByText("Compare with plan"));
    // jsdom does not emulate native summary toggling.
    screen.getByText("Compare with plan").closest("details")!.open = true;
    expect(screen.getByText(/doesn’t measure fitness/)).toBeVisible();
    expect(
      screen.getByRole("table", { name: "Plan and recorded run comparison" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Plan" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Your run" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "45 min" })).toBeInTheDocument();
    expect(
      screen.getByRole("cell", { name: "47 min On target" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("cell", { name: "Moderate Higher effort" }),
    ).toBeInTheDocument();
    expect(screen.getByText("As planned")).toBeInTheDocument();
  });

  it.each(["insufficient", "unavailable", "manual", "loading", "error"])(
    "never fabricates a score for %s",
    (example) => {
      const item = workoutFeedbackScreen(example).plan!.plan.sessions[0];
      render(
        <>
          <WorkoutExecutionScore
            feedback={feedbackExamples[example].feedback}
          />
          <WorkoutExecutionFeedback
            session={item}
            feedback={feedbackExamples[example].feedback}
          />
        </>,
      );
      expect(
        screen.queryByLabelText(/Plan adherence:/),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("/ 100")).not.toBeInTheDocument();
      if (example === "manual")
        expect(
          screen.getByText(
            "Feedback needs a synced run matched to this session.",
          ),
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
    expect(
      screen.getByText(
        "Duration and intensity followed the plan. Structure couldn’t be assessed from the available data.",
      ),
    ).toBeVisible();
    expect(screen.getByText("Not assessed")).not.toBeVisible();
  });

  it.each([NaN, Infinity, -1, 101])(
    "does not render invalid score %s",
    (score) => {
      const feedback = {
        ...feedbackExamples.evaluated.feedback,
        score,
      } as ExecutionFeedback;
      render(<WorkoutExecutionScore feedback={feedback} />);
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
      screen.getByText(
        "Duration and structure matched the plan. Your effort was higher than planned.",
      ),
    ).toBeVisible();
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
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    Element.prototype.scrollIntoView = vi.fn();
  });

  function renderToday(manual: boolean, feedback?: ExecutionFeedback) {
    const data = {
      ...workoutFeedbackScreen(manual ? "manual" : "evaluated"),
      todaySessionDay: "MON",
    };
    data.selectedWeekStartDate = data.todayWeekStartDate;
    vi.mocked(getCurrentUserWeeklyCoachScreen).mockResolvedValue(
      data as Awaited<ReturnType<typeof getCurrentUserWeeklyCoachScreen>>,
    );
    return render(
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
          executionFeedbackByDay={{ MON: feedback }}
        />
      </QueryClientProvider>,
    );
  }

  describe.each([true, false])("Today completion manual=%s", (manual) => {
    it("opens feedback when a valid evaluation exists", async () => {
      renderToday(manual, feedbackExamples.evaluated.feedback);
      const action = await screen.findByRole("button", {
        name: "View workout feedback",
      });
      fireEvent.click(action);
      await waitFor(() =>
        expect(
          screen.getByRole("region", { name: "Workout feedback" }),
        ).toBeVisible(),
      );
      expect(
        screen.getByRole("button", {
          name: "View details for Easy aerobic run",
        }),
      ).toHaveAttribute("aria-expanded", "true");
    });

    it.each([
      undefined,
      ...["unavailable", "insufficient", "loading", "error"].map(
        (key) => feedbackExamples[key].feedback,
      ),
      ...[NaN, Infinity, -1, 101].map(
        (score) =>
          ({
            ...feedbackExamples.evaluated.feedback,
            score,
          }) as ExecutionFeedback,
      ),
    ])(
      "hides feedback action without a valid evaluation (%j)",
      async (feedback) => {
        renderToday(manual, feedback);
        await screen.findByText("Today done");
        expect(
          screen.queryByRole("button", { name: "View workout feedback" }),
        ).not.toBeInTheDocument();
      },
    );
  });

  it.each([
    ["MON", "Intervals", "Easy aerobic run"],
    ["WED", "Strava", "Controlled tempo"],
  ])(
    "exposes %s source after one workout disclosure",
    async (_day, provider, title) => {
      const data = workoutFeedbackScreen("evaluated");
      vi.mocked(getCurrentUserWeeklyCoachScreen).mockResolvedValue(
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
            executionFeedbackByDay={{
              MON: feedbackExamples.evaluated.feedback,
            }}
          />
        </QueryClientProvider>,
      );
      fireEvent.click(
        await screen.findByRole("button", {
          name: `View details for ${title}`,
        }),
      );
      const link = screen.getByRole("link", {
        name: `View on ${provider} (opens in a new tab)`,
      });
      await waitFor(() => expect(link).toBeVisible());
      expect(link.closest("details")).toBeNull();
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    },
  );

  it("exposes Today activity independently of evaluation availability", async () => {
    renderToday(false, { status: "unavailable" });
    const source = await screen.findByRole("link", {
      name: "View on Intervals (opens in a new tab)",
    });
    await waitFor(() => expect(source).toBeVisible());
    expect(
      screen.queryByRole("button", { name: "View workout feedback" }),
    ).not.toBeInTheDocument();
  });

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
    await waitFor(() =>
      expect(
        screen.getByLabelText("Plan adherence: 86 out of 100"),
      ).toBeVisible(),
    );
    expect(screen.getByText("Easy aerobic run")).toBeVisible();
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(
      document.getElementById(button.getAttribute("aria-controls")!),
    ).toBeInTheDocument();
    expect(
      screen.getAllByLabelText("Plan adherence: 86 out of 100"),
    ).toHaveLength(1);
    expect(
      within(
        screen.getByRole("region", { name: "Workout feedback" }),
      ).queryByLabelText(/Plan adherence:/),
    ).not.toBeInTheDocument();
    fireEvent.click(button);
    await waitFor(() =>
      expect(
        screen.queryByRole("region", { name: "Workout feedback" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("shows the score on Today done and opens the corresponding workout", async () => {
    const data = {
      ...workoutFeedbackScreen("evaluated"),
      todaySessionDay: "MON",
    };
    data.selectedWeekStartDate = data.todayWeekStartDate;
    vi.mocked(getCurrentUserWeeklyCoachScreen).mockResolvedValue(
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
    const open = await screen.findByRole("button", {
      name: "View workout feedback",
    });
    expect(
      screen.getAllByLabelText("Plan adherence: 86 out of 100"),
    ).toHaveLength(2);
    fireEvent.click(open);
    expect(
      screen.getByRole("region", { name: "Workout feedback" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "View details for Easy aerobic run" }),
    ).toHaveAttribute("aria-expanded", "true");
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
      screen.getAllByLabelText("Plan adherence: 86 out of 100"),
    ).toHaveLength(1);
    expect(
      within(
        screen.getByRole("region", { name: "Workout feedback" }),
      ).queryByLabelText(/Plan adherence:/),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Preview a feedback state"), {
      target: { value: "manual" },
    });
    expect(
      await screen.findByText(
        "Feedback needs a synced run matched to this session.",
      ),
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
