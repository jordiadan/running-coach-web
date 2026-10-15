import { useState } from "react";
import { format } from "date-fns";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  Minus,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  formatDuration,
  metricValue,
  summarizeHistory,
  weekDate,
  weekRange,
  type PerformanceWeek,
  type VolumeMetric,
} from "./performance-data";

type Props = { weeks: PerformanceWeek[]; onExplore: () => void };

const metrics: { id: VolumeMetric; label: string; unit: string }[] = [
  { id: "distanceKm", label: "Distance", unit: "km" },
  { id: "durationMinutes", label: "Duration", unit: "min" },
  { id: "runCount", label: "Runs", unit: "runs" },
];

function WeekDetailLink({ week }: { week: PerformanceWeek }) {
  return (
    <a
      className="mobile-detail-link"
      href="#detail-heading"
      onClick={() =>
        document
          .getElementById("detail-heading")
          ?.focus({ preventScroll: true })
      }
    >
      View {weekRange(week.weekStartDate)} details{" "}
      <ArrowRight size={15} aria-hidden="true" />
    </a>
  );
}

function CompletionSummary({ weeks }: { weeks: PerformanceWeek[] }) {
  const summary = summarizeHistory(weeks);
  return (
    <section
      className="completion-summary"
      aria-labelledby="consistency-heading"
    >
      <div className="section-heading">
        <h2 id="consistency-heading">Showing up adds up.</h2>
        <Activity size={19} aria-hidden="true" />
      </div>
      {summary.completionPercent === null ? (
        <div className="completion-empty">
          <p>No plans to compare yet.</p>
          <p>
            Your planned and completed runs will appear here when a weekly plan
            is available.
          </p>
        </div>
      ) : (
        <>
          <p className="completion-sentence">
            <strong>
              {summary.completed}
              <span> / {summary.planned}</span>
            </strong>
            <br />
            planned runs marked completed
          </p>
          <div
            className="completion-track"
            role="img"
            aria-label={`${summary.matched} activity-matched, ${summary.manualOnly} manual only, ${summary.planned - summary.completed} not completed out of ${summary.planned} planned runs`}
          >
            <span
              className="matched-fill"
              style={{ width: `${(summary.matched / summary.planned) * 100}%` }}
            />
            <span
              className="manual-fill"
              style={{
                width: `${(summary.manualOnly / summary.planned) * 100}%`,
              }}
            />
          </div>
          <dl className="completion-breakdown">
            <div>
              <dt>
                <span className="legend-dot matched-dot" />
                Activity-matched
              </dt>
              <dd>{summary.matched}</dd>
            </div>
            <div>
              <dt>
                <span className="legend-dot manual-dot" />
                Manual only
              </dt>
              <dd>{summary.manualOnly}</dd>
            </div>
            <div>
              <dt>
                <span className="legend-dot remaining-dot" />
                Not completed
              </dt>
              <dd>{summary.planned - summary.completed}</dd>
            </div>
          </dl>
          <p className="completion-footnote">
            <strong>{summary.completionPercent}% completion</strong> across{" "}
            {summary.plannedWeeks} weeks with a plan.{" "}
            {8 - summary.plannedWeeks > 0 &&
              `${8 - summary.plannedWeeks} week without a plan excluded.`}
          </p>
        </>
      )}
      <p className="evidence-note">
        <Info size={15} aria-hidden="true" />
        <span>
          A manual check-in records completion. It doesn’t add distance or
          create an activity.
        </span>
      </p>
    </section>
  );
}

function VolumeChart({
  weeks,
  metric,
  selectedIndex,
  onSelect,
}: {
  weeks: PerformanceWeek[];
  metric: VolumeMetric;
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const maximum = Math.max(
    ...weeks.map((week) =>
      week.recorded.availability === "available" ? week.recorded[metric] : 0,
    ),
  );
  const step =
    metric === "distanceKm" ? 15 : metric === "durationMinutes" ? 90 : 2;
  const ceiling = Math.max(step * 3, Math.ceil(maximum / step) * step);
  return (
    <div
      className="volume-chart"
      aria-label={`Weekly recorded ${metrics.find((item) => item.id === metric).label.toLowerCase()}; select a week for details`}
    >
      <div className="chart-grid" aria-hidden="true">
        {[3, 2, 1, 0].map((line) => (
          <div key={line} style={{ bottom: `${(line / 3) * 100}%` }}>
            <span>{Math.round((ceiling * line) / 3)}</span>
          </div>
        ))}
      </div>
      <div className="chart-columns">
        {weeks.map((week, index) => {
          const recorded = week.recorded;
          const available = recorded.availability === "available";
          const value = available ? recorded[metric] : null;
          const selected = selectedIndex === index;
          return (
            <Tooltip key={week.weekStartDate} delayDuration={100}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "chart-column",
                    selected && "is-selected",
                    !available && "is-unavailable",
                  )}
                  aria-pressed={selected}
                  aria-label={`${weekRange(week.weekStartDate)}: ${available ? metricValue(value, metric) : "recorded data unavailable"}. Show week details.`}
                  onClick={() => onSelect(index)}
                >
                  <span className="column-plot">
                    {available ? (
                      <span
                        className={cn("volume-bar", value === 0 && "zero-bar")}
                        style={{
                          height:
                            value === 0 ? "2px" : `${(value / ceiling) * 100}%`,
                        }}
                      >
                        <span className="bar-value">
                          {metric === "distanceKm"
                            ? value.toFixed(1)
                            : metric === "durationMinutes"
                              ? formatDuration(value)
                              : value}
                        </span>
                      </span>
                    ) : (
                      <span className="unavailable-bar">
                        <Minus size={16} />
                      </span>
                    )}
                  </span>
                  <span className="column-date">
                    <span>{format(weekDate(week.weekStartDate), "d")}</span>
                    <span>{format(weekDate(week.weekStartDate), "MMM")}</span>
                  </span>
                  <span className="column-selection" aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="performance-tooltip">
                <strong>{weekRange(week.weekStartDate)}</strong>
                <span>
                  {available
                    ? metricValue(value, metric)
                    : "Recorded data unavailable"}
                </span>
                <span>Select to explore this week</span>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

function WeekDetail({
  weeks,
  selectedIndex,
  onSelect,
}: {
  weeks: PerformanceWeek[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const week = weeks[selectedIndex];
  const previous = weeks[selectedIndex - 1];
  const recorded = week.recorded;
  const plan = week.plan;
  const previousRecorded = previous?.recorded;
  const change =
    recorded.availability === "available" &&
    previousRecorded?.availability === "available" &&
    previousRecorded.distanceKm > 0
      ? ((recorded.distanceKm - previousRecorded.distanceKm) /
          previousRecorded.distanceKm) *
        100
      : null;
  return (
    <section className="week-detail" aria-labelledby="detail-heading">
      <div className="section-heading">
        <h2 id="detail-heading" tabIndex={-1}>
          A closer look
        </h2>
        <div className="week-controls">
          <button
            type="button"
            aria-label="Previous week"
            disabled={selectedIndex === 0}
            onClick={() => onSelect(selectedIndex - 1)}
          >
            <ChevronLeft size={17} />
          </button>
          <button
            type="button"
            aria-label="Next week"
            disabled={selectedIndex === weeks.length - 1}
            onClick={() => onSelect(selectedIndex + 1)}
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
      <div
        className="week-detail-content"
        aria-live="polite"
        aria-atomic="true"
      >
        <p className="detail-date">
          {weekRange(week.weekStartDate)}
          <span>Completed week</span>
        </p>
        {recorded.availability === "available" ? (
          <>
            <div className="detail-distance">
              <strong>{recorded.distanceKm.toFixed(1)}</strong>
              <span>km recorded</span>
            </div>
            {change !== null && (
              <p className="volume-change">
                {change >= 0 ? (
                  <ArrowUpRight size={16} />
                ) : (
                  <ArrowDown size={16} />
                )}{" "}
                {Math.abs(change).toFixed(1)}% {change >= 0 ? "more" : "less"}{" "}
                distance than the previous week
              </p>
            )}
            <dl className="detail-recorded">
              <div>
                <dt>Running time</dt>
                <dd>{formatDuration(recorded.durationMinutes)}</dd>
              </div>
              <div>
                <dt>Recorded runs</dt>
                <dd>{recorded.runCount}</dd>
              </div>
            </dl>
            {recorded.runCount === 0 && (
              <p className="detail-note">
                Activity coverage is available. No runs were recorded this week.
              </p>
            )}
          </>
        ) : (
          <div className="detail-unavailable">
            <Minus size={22} />
            <h3>Recorded volume unavailable</h3>
            <p>{recorded.reason}</p>
          </div>
        )}
        <div className="detail-plan">
          {plan ? (
            <>
              <div className="detail-plan-heading">
                <h3>Planned runs</h3>
                <span>
                  {plan.completed} of {plan.planned} completed
                </span>
              </div>
              <div className="session-marks" aria-hidden="true">
                {Array.from({ length: plan.planned }, (_, index) => (
                  <span
                    key={index}
                    className={
                      index < plan.matched
                        ? "session-matched"
                        : index < plan.completed
                          ? "session-manual"
                          : "session-remaining"
                    }
                  >
                    {index < plan.matched ? (
                      <Activity size={16} />
                    ) : index < plan.completed ? (
                      <Check size={16} />
                    ) : (
                      <Minus size={16} />
                    )}
                  </span>
                ))}
              </div>
              <p className="session-caption">
                {plan.matched} activity-matched <span>·</span>{" "}
                {plan.completed - plan.matched} manual only
              </p>
            </>
          ) : (
            <>
              <h3>No plan for this week</h3>
              <p className="detail-note">
                Recorded runs still count toward volume. Plan completion isn’t
                calculated without a plan.
              </p>
            </>
          )}
        </div>
      </div>
      <p className="detail-source">
        <span className="source-mark" aria-hidden="true">
          i
        </span>
        {recorded.availability === "available"
          ? "Synthetic Intervals.icu sample"
          : "Synthetic sample · recorded totals unavailable"}
      </p>
    </section>
  );
}

function WeekLedger({
  weeks,
  selectedIndex,
  onSelect,
}: {
  weeks: PerformanceWeek[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <section className="week-ledger" aria-labelledby="ledger-heading">
      <div className="ledger-heading">
        <h2 id="ledger-heading">Week by week</h2>
        <span>
          Select a week to explore <ArrowRight size={14} aria-hidden="true" />
        </span>
      </div>
      <table>
        <caption className="sr-only">
          Eight completed weeks, oldest to newest. Completed includes
          activity-matched and manual-only sessions.
        </caption>
        <thead>
          <tr>
            <th scope="col">Week of</th>
            <th scope="col">Recorded km</th>
            <th scope="col" className="ledger-duration">
              Time
            </th>
            <th scope="col" className="ledger-runs">
              Runs
            </th>
            <th scope="col">Completed</th>
            <th scope="col" className="ledger-matched">
              Matched
            </th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, index) => (
            <tr
              key={week.weekStartDate}
              className={cn(selectedIndex === index && "selected-row")}
            >
              <th scope="row">
                <button
                  type="button"
                  aria-pressed={selectedIndex === index}
                  aria-label={`Explore week of ${format(weekDate(week.weekStartDate), "d MMM")}`}
                  onClick={() => onSelect(index)}
                >
                  <span>{format(weekDate(week.weekStartDate), "d MMM")}</span>
                  <ChevronRight size={13} aria-hidden="true" />
                </button>
              </th>
              <td>
                {week.recorded.availability === "available" ? (
                  week.recorded.distanceKm.toFixed(1)
                ) : (
                  <span
                    className="missing-value"
                    aria-label="Recorded distance unavailable"
                  >
                    —
                  </span>
                )}
              </td>
              <td className="ledger-duration">
                {week.recorded.availability === "available" ? (
                  formatDuration(week.recorded.durationMinutes)
                ) : (
                  <span aria-label="Recorded duration unavailable">—</span>
                )}
              </td>
              <td className="ledger-runs">
                {week.recorded.availability === "available" ? (
                  week.recorded.runCount
                ) : (
                  <span aria-label="Recorded run count unavailable">—</span>
                )}
              </td>
              <td>
                {week.plan ? (
                  <span className="table-completion">
                    {week.plan.completed}
                    <span> / {week.plan.planned}</span>
                  </span>
                ) : (
                  <span className="no-plan">No plan</span>
                )}
              </td>
              <td className="ledger-matched">
                {week.plan ? (
                  <span className="table-matched">
                    <Activity size={12} aria-hidden="true" />
                    {week.plan.matched}
                  </span>
                ) : (
                  <span aria-label="No plan">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="ledger-note">
        Completed includes manual check-ins. Matched means a recorded activity
        is linked to a completed planned run.
      </p>
      <WeekDetailLink week={weeks[selectedIndex]} />
    </section>
  );
}

export default function PerformanceDashboard({ weeks, onExplore }: Props) {
  const [metric, setMetric] = useState<VolumeMetric>("distanceKm");
  const [selectedIndex, setSelectedIndex] = useState(weeks.length - 1);
  const summary = summarizeHistory(weeks);
  const hasHistory = summary.coveredWeeks > 0 || summary.plannedWeeks > 0;

  return (
    <>
      <div className="performance-grid">
        <section className="volume-section" aria-labelledby="volume-heading">
          <div className="volume-heading">
            <div>
              <h2 id="volume-heading">Your running, over time.</h2>
              <p>Recorded activities. Every run counts.</p>
            </div>
            <div
              className="metric-switch"
              role="group"
              aria-label="Recorded volume metric"
            >
              {metrics.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  aria-pressed={metric === item.id}
                  onClick={() => setMetric(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          {summary.coveredWeeks > 0 ? (
            <>
              <div className="chart-context">
                <span>
                  {metrics.find((item) => item.id === metric).unit} per week
                </span>
                <span>
                  <span className="legend-dot matched-dot" />
                  Recorded <span className="legend-dot unavailable-dot" />
                  Unavailable
                </span>
              </div>
              <VolumeChart
                weeks={weeks}
                metric={metric}
                selectedIndex={selectedIndex}
                onSelect={setSelectedIndex}
              />
              <div className="volume-total">
                <p>
                  <strong>{summary.distanceKm.toFixed(1)} km</strong> across{" "}
                  {summary.coveredWeeks} available weeks
                </p>
                <span>
                  {summary.coveredWeeks < 8
                    ? `${8 - summary.coveredWeeks} week unavailable · excluded from total`
                    : "All 8 weeks available"}
                </span>
              </div>
              <WeekDetailLink week={weeks[selectedIndex]} />
            </>
          ) : (
            <div className="chart-empty">
              <Activity size={30} strokeWidth={1.25} aria-hidden="true" />
              <h3>
                {hasHistory
                  ? "Your plan tells part of the story."
                  : "Your history starts here."}
              </h3>
              <p>
                {hasHistory
                  ? "Recorded volume isn’t available for this sample source. You can still review your planned and completed sessions."
                  : "As completed weeks build up, your running volume and plan history will appear here. Missing history is never counted as zero."}
              </p>
              {!hasHistory && (
                <button
                  className="preview-action"
                  type="button"
                  onClick={onExplore}
                >
                  Explore sample history <ArrowRight size={16} />
                </button>
              )}
            </div>
          )}
        </section>
        <CompletionSummary weeks={weeks} />
        <WeekLedger
          weeks={weeks}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
        />
        <WeekDetail
          weeks={weeks}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
        />
      </div>
      <details className="performance-methodology">
        <summary>
          How to read this history <ChevronDown size={16} aria-hidden="true" />
        </summary>
        <div>
          <p>
            <strong>Two views of training.</strong> Recorded volume sums
            distinct running activities, including unplanned runs. Plan
            completion counts running sessions only; rest and strength are
            excluded. More distance alone doesn’t establish improved fitness.
          </p>
          <p>
            <strong>Evidence stays separate.</strong> Activity-matched sessions
            are a subset of completed planned runs. “Manual only” means marked
            completed without a linked activity; these check-ins never generate
            recorded kilometers or minutes.
          </p>
          <p>
            <strong>Gaps stay visible.</strong> A dash means unavailable
            evidence; 0 means coverage is available and no runs were recorded.
            Weeks without a plan are excluded from completion. The current
            partial week is excluded from this eight-week window.
          </p>
          <p>
            <strong>Preview only.</strong> All values are synthetic. No provider
            is connected on this screen. Strava-derived analytics remain
            unavailable pending source-policy validation.
          </p>
        </div>
      </details>
    </>
  );
}
