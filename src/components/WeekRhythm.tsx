import { Check } from "lucide-react";
import type { CSSProperties } from "react";

type RhythmSession = {
  day: string;
  title: string;
  modality: string;
  durationMinutes: number;
  completed?: boolean;
};

export default function WeekRhythm({
  sessions,
  todayDay,
  selectedDay,
  onSelectDay,
}: {
  sessions: RhythmSession[];
  todayDay?: string;
  selectedDay?: string | null;
  onSelectDay: (day: string) => void;
}) {
  const maximum = Math.max(
    1,
    ...sessions.map((session) =>
      session.modality === "REST" ? 0 : session.durationMinutes,
    ),
  );
  return (
    <div className="week-rhythm">
      <div className="rhythm-caption">
        <h2>The rhythm of your week</h2>
        <p>
          Planned minutes{" "}
          <span className="hidden sm:inline">· Select a day to explore</span>
        </p>
      </div>
      <nav aria-label="Days in your plan" className="rhythm-days">
        {sessions.map((session) => {
          const day =
            session.day.slice(0, 1) + session.day.slice(1).toLowerCase();
          const rest = session.modality === "REST";
          const today = session.day === todayDay;
          return (
            <button
              key={session.day}
              type="button"
              className={`rhythm-day ${today ? "is-today" : ""} ${session.completed ? "is-complete" : ""}`}
              onClick={() => onSelectDay(session.day)}
              aria-label={`${day}: ${session.title}${session.completed ? ", completed" : ""}`}
              aria-description={
                rest
                  ? "Recovery day"
                  : `${session.durationMinutes} minutes planned`
              }
              aria-current={today ? "date" : undefined}
              aria-pressed={selectedDay === session.day}
            >
              <span className="rhythm-day-name">
                {day}
                {session.completed && (
                  <Check className="h-3 w-3" aria-hidden="true" />
                )}
              </span>
              <span className="rhythm-track" aria-hidden="true">
                {!rest && (
                  <span
                    className={`rhythm-bar ${session.modality === "STRENGTH" ? "is-strength" : ""}`}
                    style={
                      {
                        "--bar-height": `${(Math.max(0, session.durationMinutes) / maximum) * 100}%`,
                      } as CSSProperties
                    }
                  />
                )}
              </span>
              <span className="rhythm-duration">
                {rest ? "Rest" : `${session.durationMinutes} min`}
              </span>
              <span className="rhythm-state">
                {today
                  ? "Today"
                  : session.modality === "STRENGTH"
                    ? "Strength"
                    : rest
                      ? "Recovery"
                      : "Run"}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
