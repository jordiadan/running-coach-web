import { render, screen, within } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import HeartRateZones from "@/components/portal/HeartRateZones";

describe("HeartRateZones", () => {
  beforeAll(() => {
    // JSDOM has no viewport; real visibility and motion are checked in Playwright.
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  afterAll(() => vi.unstubAllGlobals());

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

    const list = screen.getByRole("list", {
      name: "Running heart-rate zones",
    });
    const rows = within(list).getAllByRole("listitem");
    expect(rows).toHaveLength(5);
    ["≤ 144", "145–152", "153–161", "162–169", "≥ 170"].forEach(
      (range, index) => {
        expect(
          within(rows[index]).getByText(`Z${index + 1}`),
        ).toBeInTheDocument();
        expect(rows[index]).toHaveTextContent(`${range} bpm`);
      },
    );
    expect(screen.getAllByRole("definition")[0]).toHaveTextContent("170 bpm");
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
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
      expect(screen.queryByText(/bpm/)).not.toBeInTheDocument();
    },
  );
});
