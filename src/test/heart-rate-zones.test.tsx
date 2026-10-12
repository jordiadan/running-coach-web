import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HeartRateZones from "@/components/portal/HeartRateZones";

describe("HeartRateZones", () => {
  it("shows exact inclusive ranges and threshold provenance", () => {
    render(
      <HeartRateZones
        zones={{
          status: "AVAILABLE",
          sourceThresholdBpm: 170,
          sourceThresholdMeasuredAt: "2026-10-01T23:30:00Z",
          zones: [
            { number: 1, minBpmInclusive: null, maxBpmInclusive: 144 },
            { number: 2, minBpmInclusive: 145, maxBpmInclusive: 152 },
            { number: 3, minBpmInclusive: 153, maxBpmInclusive: 161 },
            { number: 4, minBpmInclusive: 162, maxBpmInclusive: 169 },
            { number: 5, minBpmInclusive: 170, maxBpmInclusive: null },
          ],
        }}
      />,
    );

    const table = screen.getByRole("table", {
      name: "Running heart-rate zones",
    });
    expect(within(table).getByText("≤ 144")).toBeInTheDocument();
    expect(within(table).getByText("145–152")).toBeInTheDocument();
    expect(within(table).getByText("153–161")).toBeInTheDocument();
    expect(within(table).getByText("162–169")).toBeInTheDocument();
    expect(within(table).getByText("≥ 170")).toBeInTheDocument();
    expect(screen.getByText("170 bpm")).toBeInTheDocument();
    expect(screen.getByText("1 Oct 2026")).toHaveAttribute(
      "dateTime",
      "2026-10-01T23:30:00Z",
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it.each([
    [{ status: "CALIBRATION_REQUIRED" } as const, "Threshold test needed"],
    [{ status: "PENDING_CALCULATION" } as const, "Calculation pending"],
    [undefined, "Zones unavailable"],
  ])(
    "explains unavailable zones without inventing ranges",
    (zones, message) => {
      render(<HeartRateZones zones={zones} />);
      expect(screen.getByText(message)).toBeInTheDocument();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      expect(screen.queryByText(/bpm/)).not.toBeInTheDocument();
    },
  );
});
