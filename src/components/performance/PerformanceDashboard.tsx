import { useId, useState } from "react";
import { format } from "date-fns";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
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
type WeekSelection = {
  weeks: PerformanceWeek[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

const metrics: { id: VolumeMetric; label: string; unit: string }[] = [
  { id: "distanceKm", label: "Distance", unit: "km" },
  { id: "durationMinutes", label: "Duration", unit: "min" },
  { id: "runCount", label: "Runs", unit: "runs" },
];
const ease = [0.16, 1, 0.3, 1] as const;

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
      View {weekRange(week.weekStartDate)} details
      <ArrowRight size={15} aria-hidden="true" />
    </a>
  );
}

function sessionState(
  plan: NonNullable<PerformanceWeek["plan"]>,
  index: number,
) {
  return index < plan.matched
    ? "matched"
    : index < plan.completed
      ? "manual"
      : "remaining";
}

function CompletionSummary({ weeks, selectedIndex, onSelect }: WeekSelection) {
  const summary = summarizeHistory(weeks);
  const maxSessions = Math.max(
    1,
    ...weeks.map((week) => week.plan?.planned ?? 0),
  );
  return (
    <section
      className="completion-summary"
      aria-labelledby="consistency-heading"
    >
      <div className="consistency-overview">
        <h2 id="consistency-heading">Consistency</h2>
        {summary.completionPercent === null ? (
          <p className="completion-empty">No plans to compare yet.</p>
        ) : (
          <>
            <p className="completion-percent">
              <strong>
                {summary.completionPercent}
                <span>%</span>
              </strong>{" "}
              <span>completion</span>
            </p>
            <p className="completion-count">
              <strong>
                {summary.completed} / {summary.planned}
              </strong>{" "}
              planned runs
            </p>
          </>
        )}
      </div>
      <div className="week-rhythm">
        <div className="rhythm-heading">
          <h3>Week by week</h3>
          <span>{summary.plannedWeeks} weeks with a plan</span>
        </div>
        <div
          className="rhythm-weeks"
          role="group"
          aria-label="Weekly plan completion; select a week for details"
        >
          {weeks.map((week, index) => {
            const plan = week.plan;
            return (
              <button
                key={week.weekStartDate}
                type="button"
                className={cn(
                  "rhythm-week",
                  selectedIndex === index && "is-selected",
                )}
                aria-pressed={selectedIndex === index}
                aria-controls="selected-week-detail"
                aria-label={`Explore week of ${format(weekDate(week.weekStartDate), "d MMM")}: ${plan ? `${plan.completed} of ${plan.planned} completed, ${plan.matched} activity-matched, ${plan.completed - plan.matched} manual only` : "no plan"}`}
                onClick={() => onSelect(index)}
              >
                <span
                  className={cn("rhythm-stack", !plan && "no-plan-stack")}
                  aria-hidden="true"
                >
                  {plan ? (
                    Array.from({ length: maxSessions }, (_, slot) => {
                      const sessionIndex = slot - (maxSessions - plan.planned);
                      return (
                        <span
                          key={slot}
                          className={
                            sessionIndex < 0
                              ? "rhythm-spacer"
                              : `rhythm-cell session-${sessionState(plan, sessionIndex)}`
                          }
                        >
                          {sessionIndex >= 0 &&
                            sessionState(plan, sessionIndex) === "manual" && (
                              <Check size={11} />
                            )}
                          {sessionIndex >= 0 &&
                            sessionState(plan, sessionIndex) ===
                              "remaining" && <Minus size={10} />}
                        </span>
                      );
                    })
                  ) : (
                    <Minus size={16} />
                  )}
                </span>
                <span className="rhythm-count" aria-hidden="true">
                  {plan ? (
                    <>
                      {plan.completed}
                      <span>/{plan.planned}</span>
                    </>
                  ) : (
                    "No plan"
                  )}
                </span>
                <span className="rhythm-date" aria-hidden="true">
                  {format(weekDate(week.weekStartDate), "d MMM")}
                </span>
                <span className="rhythm-selection" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>
      <div className="consistency-footer">
        <dl className="completion-legend">
          <div>
            <dt>
              <span className="legend-dot matched-dot" />
              Activity-matched
            </dt>
            <dd>{summary.matched}</dd>
          </div>
          <div>
            <dt>
              <span className="legend-dot manual-dot">
                <Check size={7} aria-hidden="true" />
              </span>
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
        {weeks.length > summary.plannedWeeks && (
          <p>
            {weeks.length - summary.plannedWeeks}{" "}
            {weeks.length - summary.plannedWeeks === 1 ? "week" : "weeks"}{" "}
            without a plan excluded
          </p>
        )}
      </div>
    </section>
  );
}

function VolumeChart({
  weeks,
  metric,
  selectedIndex,
  onSelect,
}: WeekSelection & { metric: VolumeMetric }) {
  const reducedMotion = useReducedMotion();
  const selectionId = useId();
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
          const available = week.recorded.availability === "available";
          const value =
            week.recorded.availability === "available"
              ? week.recorded[metric]
              : null;
          const selected = selectedIndex === index;
          const scale = value === 0 ? 0.007 : (value ?? 0) / ceiling;
          return (
            <Tooltip key={week.weekStartDate} delayDuration={180}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "chart-column",
                    selected && "is-selected",
                    !available && "is-unavailable",
                  )}
                  aria-pressed={selected}
                  aria-controls="selected-week-detail"
                  aria-label={`${weekRange(week.weekStartDate)}: ${available ? metricValue(value, metric) : "recorded data unavailable"}. Show week details.`}
                  onClick={() => onSelect(index)}
                >
                  {selected && (
                    <motion.span
                      className="column-highlight"
                      layoutId={reducedMotion ? undefined : selectionId}
                      transition={{ duration: reducedMotion ? 0 : 0.3, ease }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="column-plot" aria-hidden="true">
                    {available ? (
                      <>
                        <motion.span
                          className={cn(
                            "volume-bar",
                            value === 0 && "zero-bar",
                          )}
                          initial={false}
                          animate={{ scaleY: scale }}
                          transition={{
                            duration: reducedMotion ? 0 : 0.45,
                            ease,
                          }}
                        />
                        <motion.span
                          className="bar-value-position"
                          initial={false}
                          animate={{ y: `${(1 - scale) * 100}%` }}
                          transition={{
                            duration: reducedMotion ? 0 : 0.45,
                            ease,
                          }}
                        >
                          <span className="bar-value">
                            {metric === "distanceKm"
                              ? value.toFixed(1)
                              : metric === "durationMinutes"
                                ? formatDuration(value)
                                : value}
                          </span>
                        </motion.span>
                      </>
                    ) : (
                      <span className="unavailable-bar">
                        <Minus size={16} />
                      </span>
                    )}
                  </span>
                  <span className="column-date" aria-hidden="true">
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
  metric,
  selectedIndex,
  onSelect,
}: WeekSelection & { metric: VolumeMetric }) {
  const reducedMotion = useReducedMotion();
  const week = weeks[selectedIndex];
  const recorded = week.recorded;
  const plan = week.plan;
  const previousRecorded = weeks[selectedIndex - 1]?.recorded;
  const change =
    recorded.availability === "available" &&
    previousRecorded?.availability === "available" &&
    previousRecorded.distanceKm > 0
      ? ((recorded.distanceKm - previousRecorded.distanceKm) /
          previousRecorded.distanceKm) *
        100
      : null;
  return (
    <section
      id="selected-week-detail"
      className="week-detail"
      aria-labelledby="detail-heading"
    >
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
      <div className="week-detail-live" aria-live="polite" aria-atomic="true">
        <motion.div
          key={`${week.weekStartDate}-${metric}-${recorded.availability}-${plan?.completed}`}
          className="week-detail-content"
          initial={reducedMotion ? false : { opacity: 0.45, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.25, ease }}
        >
          <p className="detail-date">
            <span className="detail-date-mark" aria-hidden="true" />
            {weekRange(week.weekStartDate)}
          </p>
          {recorded.availability === "available" ? (
            <>
              <div
                className={cn(
                  "detail-distance",
                  metric === "durationMinutes" && "detail-duration",
                )}
              >
                <strong>
                  {metric === "durationMinutes"
                    ? formatDuration(recorded.durationMinutes)
                    : metric === "distanceKm"
                      ? recorded.distanceKm.toFixed(1)
                      : recorded.runCount}
                </strong>
                <span>
                  {metric === "distanceKm"
                    ? "km"
                    : metric === "runCount"
                      ? recorded.runCount === 1
                        ? "run"
                        : "runs"
                      : null}
                  <span>recorded</span>
                </span>
              </div>
              <div className="detail-change-slot">
                {change !== null && metric === "distanceKm" && (
                  <p className="volume-change">
                    {change >= 0 ? (
                      <ArrowUpRight size={15} aria-hidden="true" />
                    ) : (
                      <ArrowDownRight size={15} aria-hidden="true" />
                    )}
                    <strong>
                      {change >= 0 ? "+" : "−"}
                      {Math.abs(change).toFixed(1)}%
                    </strong>
                    <span>vs previous week</span>
                  </p>
                )}
              </div>
              <dl className="detail-recorded">
                {metric !== "durationMinutes" && (
                  <div>
                    <dt>
                      <Clock3 size={13} aria-hidden="true" />
                      Running time
                    </dt>
                    <dd>{formatDuration(recorded.durationMinutes)}</dd>
                  </div>
                )}
                {metric !== "runCount" && (
                  <div>
                    <dt>
                      <Activity size={13} aria-hidden="true" />
                      Recorded runs
                    </dt>
                    <dd>{recorded.runCount}</dd>
                  </div>
                )}
                {metric !== "distanceKm" && (
                  <div>
                    <dt>Distance</dt>
                    <dd>{recorded.distanceKm.toFixed(1)} km</dd>
                  </div>
                )}
              </dl>
              {recorded.runCount === 0 && (
                <p className="detail-note">
                  Activity coverage is available. No runs were recorded this
                  week.
                </p>
              )}
            </>
          ) : (
            <div className="detail-unavailable">
              <Minus size={24} aria-hidden="true" />
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
                    <strong>{plan.completed}</strong> / {plan.planned} completed
                  </span>
                </div>
                <div
                  className="session-marks"
                  role="img"
                  aria-label={`${plan.matched} activity-matched, ${plan.completed - plan.matched} manual only, ${plan.planned - plan.completed} not completed`}
                >
                  {Array.from({ length: plan.planned }, (_, index) => (
                    <span
                      key={index}
                      className={`session-${sessionState(plan, index)}`}
                    >
                      {index < plan.matched ? (
                        <Activity size={17} />
                      ) : index < plan.completed ? (
                        <Check size={17} />
                      ) : (
                        <Minus size={17} />
                      )}
                    </span>
                  ))}
                </div>
                <p className="session-caption">
                  <span>
                    <span className="legend-dot matched-dot" />
                    {plan.matched} matched
                  </span>
                  <span>
                    <span className="legend-dot manual-dot" />
                    {plan.completed - plan.matched} manual only
                  </span>
                </p>
              </>
            ) : (
              <>
                <h3>No plan for this week</h3>
                <p className="detail-note">
                  Recorded runs count toward volume. No completion calculated.
                </p>
              </>
            )}
          </div>
        </motion.div>
      </div>
      <p className="detail-source">
        <span className="source-mark" aria-hidden="true">
          i
        </span>
        {recorded.availability === "available"
          ? "Synthetic Intervals.icu sample"
          : "Synthetic sample · totals unavailable"}
      </p>
    </section>
  );
}

export default function PerformanceDashboard({ weeks, onExplore }: Props) {
  const [metric, setMetric] = useState<VolumeMetric>("distanceKm");
  const [selectedIndex, setSelectedIndex] = useState(weeks.length - 1);
  const reducedMotion = useReducedMotion();
  const switchId = useId();
  const summary = summarizeHistory(weeks);
  const hasHistory = summary.coveredWeeks > 0 || summary.plannedWeeks > 0;
  const total = weeks.reduce(
    (sum, week) =>
      sum +
      (week.recorded.availability === "available" ? week.recorded[metric] : 0),
    0,
  );
  return (
    <>
      <div className="performance-stage">
        <section className="volume-section" aria-labelledby="volume-heading">
          <div className="volume-heading">
            <h2 id="volume-heading">Your running, over time.</h2>
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
                  {metric === item.id && (
                    <motion.span
                      className="metric-switch-active"
                      layoutId={reducedMotion ? undefined : switchId}
                      transition={{ duration: reducedMotion ? 0 : 0.22, ease }}
                      aria-hidden="true"
                    />
                  )}
                  <span>{item.label}</span>
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
                  Recorded
                  <span className="legend-dot unavailable-dot" />
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
                  <strong>{metricValue(total, metric)}</strong>
                  <span> / {summary.coveredWeeks} recorded weeks</span>
                </p>
                <span>
                  {summary.coveredWeeks < weeks.length
                    ? `${weeks.length - summary.coveredWeeks} unavailable · excluded`
                    : "All weeks available"}
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
                  ? "Recorded volume unavailable. Your plan history is still here."
                  : "Your running and plan history will appear after your first completed weeks."}
              </p>
              {!hasHistory && (
                <button
                  className="preview-action"
                  type="button"
                  onClick={onExplore}
                >
                  Explore sample history{" "}
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </section>
        <WeekDetail
          weeks={weeks}
          metric={metric}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
        />
      </div>
      <CompletionSummary
        weeks={weeks}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
      />
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
