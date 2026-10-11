import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import WeekRhythm from "@/components/WeekRhythm";

const sessions = [
  {
    day: "MON",
    title: "Easy run",
    modality: "RUN",
    durationMinutes: 40,
    completed: true,
  },
  { day: "TUE", title: "Recovery", modality: "REST", durationMinutes: 0 },
  { day: "SUN", title: "Long run", modality: "RUN", durationMinutes: 80 },
];

describe("weekly training rhythm", () => {
  it("keeps planned duration and completion distinct and exposes selection", () => {
    const onSelect = vi.fn();
    render(
      <WeekRhythm
        sessions={sessions}
        todayDay="MON"
        selectedDay="SUN"
        onSelectDay={onSelect}
      />,
    );
    const monday = screen.getByRole("button", {
      name: "Mon: Easy run, completed",
    });
    expect(monday).toHaveAttribute("aria-description", "40 minutes planned");
    expect(monday).toHaveAttribute("aria-current", "date");
    expect(monday).toHaveAttribute("aria-pressed", "false");
    const sunday = screen.getByRole("button", { name: "Sun: Long run" });
    expect(sunday).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(sunday);
    expect(onSelect).toHaveBeenCalledWith("SUN");
  });

  it("draws proportional planned durations and no activity bar for recovery", () => {
    render(<WeekRhythm sessions={sessions} onSelectDay={() => {}} />);
    const monday = screen.getByRole("button", {
      name: "Mon: Easy run, completed",
    });
    const sunday = screen.getByRole("button", { name: "Sun: Long run" });
    expect(monday.querySelector(".rhythm-bar")).toHaveStyle(
      "--bar-height: 50%",
    );
    expect(sunday.querySelector(".rhythm-bar")).toHaveStyle(
      "--bar-height: 100%",
    );
    expect(
      screen
        .getByRole("button", { name: "Tue: Recovery" })
        .querySelector(".rhythm-bar"),
    ).toBeNull();
  });

  it("keeps an all-rest week meaningful without an invalid scale", () => {
    render(<WeekRhythm sessions={[sessions[1]]} onSelectDay={() => {}} />);
    expect(
      screen.getByRole("button", { name: "Tue: Recovery" }),
    ).toHaveAttribute("aria-description", "Recovery day");
    expect(screen.getByText("Rest")).toBeVisible();
  });
});
