import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

type WeekNavigatorProps = {
  currentWeekOffsetLabel: string;
  onPrevious: () => void;
  onNext: () => void;
  onCurrent: () => void;
  weekLabel: string;
  canGoPrevious: boolean;
  canGoNext: boolean;
  showReturnToCurrent: boolean;
};

export default function WeekNavigator({
  currentWeekOffsetLabel,
  onPrevious,
  onNext,
  onCurrent,
  weekLabel,
  canGoPrevious,
  canGoNext,
  showReturnToCurrent,
}: WeekNavigatorProps) {
  return (
    <nav className="weekly-navigator" aria-label="Week navigation">
      <div className="weekly-navigator-range">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          aria-label="Previous week"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <div
          className="weekly-navigator-label"
          aria-live="polite"
          aria-atomic="true"
        >
          <span>{weekLabel}</span>
          <span>
            {currentWeekOffsetLabel === "Current"
              ? "This week"
              : currentWeekOffsetLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          aria-label="Next week"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
      {showReturnToCurrent ? (
        <button type="button" className="weekly-return" onClick={onCurrent}>
          <CalendarDays size={15} aria-hidden="true" />
          This week
        </button>
      ) : null}
    </nav>
  );
}
