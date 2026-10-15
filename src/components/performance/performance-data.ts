import { addDays, format, startOfWeek, subWeeks } from "date-fns";

// Preview-only view model. A future API adapter can supply the same facts without
// changing the dashboard. Null means missing evidence; zero means a known zero.
export type RecordedRunning =
  | {
      availability: "available";
      distanceKm: number;
      durationMinutes: number;
      runCount: number;
    }
  | { availability: "unavailable"; reason: string };

export type PerformanceWeek = {
  weekStartDate: string;
  plan: { planned: number; completed: number; matched: number } | null;
  recorded: RecordedRunning;
};

export type SampleScenario =
  "history" | "empty" | "unavailable" | "zero" | "loading" | "error";
export type VolumeMetric = "distanceKm" | "durationMinutes" | "runCount";

const sampleFacts = [
  { distance: 24.6, duration: 151, runs: 3, plan: null },
  {
    distance: 28.2,
    duration: 174,
    runs: 3,
    plan: { planned: 4, completed: 3, matched: 2 },
  },
  {
    distance: 31.5,
    duration: 192,
    runs: 4,
    plan: { planned: 4, completed: 4, matched: 4 },
  },
  {
    distance: null,
    duration: null,
    runs: null,
    plan: { planned: 4, completed: 3, matched: 2 },
  },
  {
    distance: 34.8,
    duration: 211,
    runs: 4,
    plan: { planned: 4, completed: 4, matched: 3 },
  },
  {
    distance: 29.4,
    duration: 181,
    runs: 3,
    plan: { planned: 4, completed: 3, matched: 3 },
  },
  {
    distance: 38.2,
    duration: 232,
    runs: 4,
    plan: { planned: 5, completed: 4, matched: 4 },
  },
  {
    distance: 42.1,
    duration: 252,
    runs: 5,
    plan: { planned: 5, completed: 5, matched: 4 },
  },
];

export function createSampleHistory(
  referenceDate = new Date(),
): PerformanceWeek[] {
  const currentMonday = startOfWeek(referenceDate, { weekStartsOn: 1 });
  return sampleFacts.map((fact, index) => ({
    weekStartDate: format(subWeeks(currentMonday, 8 - index), "yyyy-MM-dd"),
    plan: fact.plan,
    recorded:
      fact.distance === null
        ? {
            availability: "unavailable",
            reason:
              "Activity coverage is incomplete for this week. Recorded totals are unavailable.",
          }
        : {
            availability: "available",
            distanceKm: fact.distance,
            durationMinutes: fact.duration,
            runCount: fact.runs,
          },
  }));
}

export function applySampleScenario(
  weeks: PerformanceWeek[],
  scenario: SampleScenario,
): PerformanceWeek[] {
  return weeks.map((week) => {
    if (scenario === "empty") {
      return {
        ...week,
        plan: null,
        recorded: {
          availability: "unavailable",
          reason: "No recorded history is available yet.",
        },
      };
    }
    if (scenario === "unavailable") {
      return {
        ...week,
        recorded: {
          availability: "unavailable",
          reason:
            "Recorded analytics are unavailable for this source. Strava-derived analytics remain gated pending source-policy validation.",
        },
      };
    }
    if (scenario === "zero") {
      return {
        ...week,
        plan: { planned: 4, completed: 0, matched: 0 },
        recorded: {
          availability: "available",
          distanceKm: 0,
          durationMinutes: 0,
          runCount: 0,
        },
      };
    }
    return week;
  });
}

export function summarizeHistory(weeks: PerformanceWeek[]) {
  const plannedWeeks = weeks.filter((week) => week.plan !== null);
  const coveredWeeks = weeks.filter(
    (week) => week.recorded.availability === "available",
  );
  const planned = plannedWeeks.reduce(
    (sum, week) => sum + week.plan.planned,
    0,
  );
  const completed = plannedWeeks.reduce(
    (sum, week) => sum + week.plan.completed,
    0,
  );
  const matched = plannedWeeks.reduce(
    (sum, week) => sum + week.plan.matched,
    0,
  );
  return {
    planned,
    completed,
    matched,
    manualOnly: completed - matched,
    plannedWeeks: plannedWeeks.length,
    coveredWeeks: coveredWeeks.length,
    completionPercent:
      planned === 0 ? null : Math.round((completed / planned) * 100),
    distanceKm: coveredWeeks.reduce(
      (sum, week) =>
        sum +
        (week.recorded.availability === "available"
          ? week.recorded.distanceKm
          : 0),
      0,
    ),
  };
}

export function weekDate(date: string) {
  // Date-only values stay in the local calendar, without UTC date shifts.
  return new Date(`${date}T12:00:00`);
}

export function weekRange(date: string) {
  const start = weekDate(date);
  const end = addDays(start, 6);
  return format(start, "MMM") === format(end, "MMM")
    ? `${format(start, "d")}–${format(end, "d MMM")}`
    : `${format(start, "d MMM")} – ${format(end, "d MMM")}`;
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = Math.round(minutes % 60);
  return hours > 0
    ? `${hours}h ${String(remainder).padStart(2, "0")}m`
    : `${remainder}m`;
}

export function metricValue(value: number, metric: VolumeMetric) {
  if (metric === "durationMinutes") return formatDuration(value);
  if (metric === "distanceKm") return `${value.toFixed(1)} km`;
  return `${value} ${value === 1 ? "run" : "runs"}`;
}
