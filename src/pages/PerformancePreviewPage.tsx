import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format, addDays } from "date-fns";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  FlaskConical,
  RefreshCw,
} from "lucide-react";
import PerformanceDashboard from "@/components/performance/PerformanceDashboard";
import {
  applySampleScenario,
  createSampleHistory,
  weekDate,
  type SampleScenario,
} from "@/components/performance/performance-data";
import "@/components/performance/performance.css";

export default function PerformancePreviewPage() {
  const [scenario, setScenario] = useState<SampleScenario>("history");
  const baseWeeks = useMemo(() => createSampleHistory(), []);
  const weeks = useMemo(
    () => applySampleScenario(baseWeeks, scenario),
    [baseWeeks, scenario],
  );
  const firstDate = weekDate(weeks[0].weekStartDate);
  const lastDate = addDays(weekDate(weeks[7].weekStartDate), 6);

  return (
    <div className="performance-preview">
      <a href="#performance-main" className="performance-skip">
        Skip to performance
      </a>
      <header className="performance-header">
        <div className="performance-header-inner">
          <Link to="/portal" className="performance-brand">
            <span className="brand-symbol" aria-hidden="true">
              <Activity size={20} />
            </span>
            Running Coach<span className="preview-brand-label">Preview</span>
          </Link>
          <nav aria-label="Training">
            <Link to="/portal">Weekly plan</Link>
            <Link to="/preview/performance" aria-current="page">
              Performance
            </Link>
          </nav>
          <span className="preview-indicator">
            <span />
            Interactive preview
          </span>
        </div>
      </header>
      <main id="performance-main" className="performance-main">
        <div className="performance-intro">
          <div>
            <h1>
              Performance<span>.</span>
            </h1>
          </div>
          <div className="scenario-control">
            <label htmlFor="sample-scenario">
              <FlaskConical size={14} aria-hidden="true" />
              Sample data
            </label>
            <select
              id="sample-scenario"
              value={scenario}
              onChange={(event) =>
                setScenario(event.target.value as SampleScenario)
              }
            >
              <option value="history">Training history</option>
              <option value="unavailable">Recorded data unavailable</option>
              <option value="empty">No history yet</option>
              <option value="zero">Confirmed zero activity</option>
              <option value="loading">Loading preview</option>
              <option value="error">Error preview</option>
            </select>
          </div>
        </div>
        <div className="performance-period">
          <span>
            <CalendarDays size={15} aria-hidden="true" />
            <time dateTime={weeks[0].weekStartDate}>
              {format(firstDate, "d MMM")}
            </time>
            <span>–</span>
            <time dateTime={format(lastDate, "yyyy-MM-dd")}>
              {format(lastDate, "d MMM yyyy")}
            </time>
          </span>
          <span>
            8 completed weeks<span className="period-divider">·</span>
            <span className="current-week-note">Current week excluded</span>
          </span>
        </div>
        {scenario === "loading" ? (
          <section className="performance-loading" role="status">
            <span className="sr-only">Loading performance history…</span>
            <div className="loading-chart">
              <div />
              <div />
              <div />
            </div>
            <div className="loading-summary">
              <div />
              <div />
              <div />
            </div>
          </section>
        ) : scenario === "error" ? (
          <section className="performance-error" role="alert">
            <RefreshCw size={27} strokeWidth={1.5} aria-hidden="true" />
            <h2>History couldn’t load.</h2>
            <p>
              Your training data hasn’t changed. Try loading this sample again.
            </p>
            <button
              className="preview-action"
              onClick={() => setScenario("history")}
            >
              Reload sample <ArrowRight size={16} />
            </button>
          </section>
        ) : (
          <PerformanceDashboard
            weeks={weeks}
            onExplore={() => setScenario("history")}
          />
        )}
        <footer className="performance-footer">
          <Link to="/portal">
            <ArrowLeft size={14} aria-hidden="true" />
            Back to weekly plan
          </Link>
          <span>V1 mockup · Synthetic data only</span>
        </footer>
      </main>
    </div>
  );
}
