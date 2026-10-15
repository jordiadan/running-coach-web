import { describe, expect, it } from "vitest";
import {
  applySampleScenario,
  createSampleHistory,
  summarizeHistory,
  weekRange,
} from "@/components/performance/performance-data";

describe("performance preview history", () => {
  it.each([new Date(2026, 9, 12), new Date(2026, 9, 18, 23, 59)])(
    "includes exactly eight completed Monday–Sunday weeks for %s",
    (today) => {
      const weeks = createSampleHistory(today);
      expect(weeks).toHaveLength(8);
      expect(weeks[0].weekStartDate).toBe("2026-08-17");
      expect(weeks[7].weekStartDate).toBe("2026-10-05");
      expect(weekRange(weeks[7].weekStartDate)).toBe("5–11 Oct");
    },
  );

  it("excludes missing plans from completion and missing activity coverage from volume", () => {
    const weeks = createSampleHistory(new Date(2026, 9, 15));
    const summary = summarizeHistory(weeks);
    expect(summary).toMatchObject({
      planned: 30,
      completed: 26,
      matched: 22,
      manualOnly: 4,
      plannedWeeks: 7,
      coveredWeeks: 7,
      completionPercent: 87,
    });
    expect(summary.distanceKm).toBeCloseTo(228.8);
    expect(weeks[0].plan).toBeNull();
    expect(weeks[0].recorded.availability).toBe("available");
    expect(weeks[3].recorded.availability).toBe("unavailable");
    expect(weeks[3].plan.completed).toBe(3);
  });

  it("keeps plan completion when recorded source analytics are unavailable", () => {
    const weeks = applySampleScenario(createSampleHistory(), "unavailable");
    expect(
      weeks.every((week) => week.recorded.availability === "unavailable"),
    ).toBe(true);
    expect(summarizeHistory(weeks)).toMatchObject({
      planned: 30,
      completed: 26,
      coveredWeeks: 0,
    });
  });

  it("distinguishes an empty history from confirmed zero activity", () => {
    const base = createSampleHistory();
    expect(summarizeHistory(applySampleScenario(base, "empty"))).toMatchObject({
      plannedWeeks: 0,
      coveredWeeks: 0,
      completionPercent: null,
    });
    expect(summarizeHistory(applySampleScenario(base, "zero"))).toMatchObject({
      plannedWeeks: 8,
      coveredWeeks: 8,
      completionPercent: 0,
      distanceKm: 0,
    });
    expect(base[0].plan).toBeNull();
  });
});
