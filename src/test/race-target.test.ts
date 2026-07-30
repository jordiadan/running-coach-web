import { describe, expect, it } from "vitest";
import {
  equivalentPaceSeconds,
  equivalentTimeSeconds,
  formatRacePace,
  formatRaceTime,
  parseRacePace,
  parseRaceTime,
} from "@/lib/race-target";

describe("race target conversions", () => {
  it("parses and formats race times", () => {
    expect(parseRaceTime("1:45:30")).toBe(6330);
    expect(parseRaceTime("25:00")).toBe(1500);
    expect(formatRaceTime(6330)).toBe("1:45:30");
  });

  it("parses and formats race pace", () => {
    expect(parseRacePace("5:00")).toBe(300);
    expect(formatRacePace(300)).toBe("5:00");
  });

  it("rejects incomplete and invalid clock values", () => {
    expect(parseRaceTime("1:75:00")).toBe("");
    expect(parseRaceTime("1:45")).toBe(105);
    expect(parseRacePace("5:75")).toBe("");
    expect(parseRacePace("")).toBe("");
  });

  it("uses backend-equivalent rounding for time and pace", () => {
    expect(equivalentPaceSeconds(5400, 21.1)).toBe(256);
    expect(equivalentTimeSeconds(300, 21.1)).toBe(6330);
  });
});
