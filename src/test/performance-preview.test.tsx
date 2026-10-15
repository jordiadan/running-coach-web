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
  it("links chart and ledger selection to week details and switches metrics", () => {
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
    expect(screen.getByText("87% completion")).toBeInTheDocument();
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
    expect(screen.queryByText("0% completion")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Explore sample history" }),
    );
    fireEvent.change(screen.getByLabelText("Sample data"), {
      target: { value: "zero" },
    });
    expect(screen.getByText("0% completion")).toBeInTheDocument();
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
});
