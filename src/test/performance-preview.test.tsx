import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import PerformancePreviewPage from "@/pages/PerformancePreviewPage";

function renderPreview() {
  return render(
    <MemoryRouter>
      <TooltipProvider>
        <PerformancePreviewPage />
      </TooltipProvider>
    </MemoryRouter>,
  );
}

describe("performance preview", () => {
  it("links chart and weekly pattern selection to details and switches metrics", () => {
    renderPreview();
    const detail = screen.getByRole("region", { name: "A closer look" });
    expect(within(detail).getByText("42.1")).toBeInTheDocument();
    fireEvent.click(
      screen.getAllByRole("link", { name: /View .* details/ })[0],
    );
    expect(
      screen.getByRole("heading", { name: "A closer look" }),
    ).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Previous week" }));
    expect(within(detail).getByText("38.2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Duration" }));
    expect(screen.getByRole("button", { name: "Duration" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getAllByRole("button", { name: /4h 12m.*Show week details/ }),
    ).toHaveLength(1);
    expect(within(detail).getByText("3h 52m")).toBeInTheDocument();
    expect(screen.getByText("23h 13m")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Runs", exact: true }));
    expect(screen.getByText("26 runs")).toBeInTheDocument();
    fireEvent.click(
      screen.getAllByRole("button", { name: /Explore week of/ })[0],
    );
    expect(
      within(detail).getByText("No plan for this week"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Previous week" }),
    ).toBeDisabled();
  });

  it("shows unavailable evidence without hiding completion, and recovers from errors", () => {
    renderPreview();
    fireEvent.change(screen.getByLabelText("Sample data"), {
      target: { value: "unavailable" },
    });
    expect(screen.getByText("Recorded volume unavailable")).toBeInTheDocument();
    expect(
      screen.getByText(/Strava-derived analytics remain gated/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Consistency" }),
    ).toHaveTextContent("87% completion");
    fireEvent.change(screen.getByLabelText("Sample data"), {
      target: { value: "error" },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "History couldn’t load.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Reload sample" }));
    expect(
      screen.getByRole("heading", { name: "Your running, over time." }),
    ).toBeInTheDocument();
  });

  it("provides honest empty, zero and loading states", () => {
    renderPreview();
    fireEvent.change(screen.getByLabelText("Sample data"), {
      target: { value: "empty" },
    });
    expect(screen.getByText("Your history starts here.")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Consistency" }),
    ).not.toHaveTextContent("0% completion");
    fireEvent.click(
      screen.getByRole("button", { name: "Explore sample history" }),
    );
    fireEvent.change(screen.getByLabelText("Sample data"), {
      target: { value: "zero" },
    });
    expect(
      screen.getByRole("region", { name: "Consistency" }),
    ).toHaveTextContent("0% completion");
    expect(
      screen.getByText(
        "Activity coverage is available. No runs were recorded this week.",
      ),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Sample data"), {
      target: { value: "loading" },
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading performance history…",
    );
  });

  it("keeps matched, manual and missing evidence distinct across linked selections", () => {
    renderPreview();
    const detail = screen.getByRole("region", { name: "A closer look" });
    const pattern = screen.getByRole("group", {
      name: /Weekly plan completion/,
    });
    expect(within(detail).getByRole("img")).toHaveAccessibleName(
      "4 activity-matched, 1 manual only, 0 not completed",
    );

    const missingWeek = screen.getByRole("button", {
      name: /recorded data unavailable.*Show week details/,
    });
    fireEvent.click(missingWeek);
    expect(
      within(detail).getByText("Recorded volume unavailable"),
    ).toBeInTheDocument();
    expect(within(detail).getByRole("img")).toHaveAccessibleName(
      "2 activity-matched, 1 manual only, 1 not completed",
    );
    expect(
      within(pattern).getByRole("button", { pressed: true }),
    ).toHaveAccessibleName(
      /3 of 4 completed, 2 activity-matched, 1 manual only/,
    );

    fireEvent.click(within(pattern).getByRole("button", { name: /no plan/ }));
    expect(within(detail).getByText("24.6")).toBeInTheDocument();
    expect(
      within(detail).getByText("No plan for this week"),
    ).toBeInTheDocument();
    expect(screen.getByText("228.8 km")).toBeInTheDocument();
    expect(missingWeek).toHaveAttribute("aria-pressed", "false");
  });
});
