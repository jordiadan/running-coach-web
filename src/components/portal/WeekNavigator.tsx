import { motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const isCurrentWeek =
    currentWeekOffsetLabel === "Current" || currentWeekOffsetLabel === "This week";
  const secondaryLabel = isCurrentWeek
    ? "This week"
    : currentWeekOffsetLabel === "Future"
      ? "Future"
      : currentWeekOffsetLabel;

  return (
    <motion.div
      className="flex items-center justify-between rounded-xl border border-border bg-card/40 px-1.5 py-1"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-lg"
        onClick={onPrevious}
        disabled={!canGoPrevious}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex min-w-0 items-center gap-2 text-[13px]">
        <span
          className={`truncate font-medium tabular-nums ${
            isCurrentWeek ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {weekLabel}
        </span>
        <span
          className={`inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-widest ${
            isCurrentWeek ? "text-primary" : "text-muted-foreground"
          }`}
        >
          {isCurrentWeek ? <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> : null}
          {secondaryLabel}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {showReturnToCurrent ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-primary"
            onClick={onCurrent}
          >
            <CalendarDays className="mr-1 h-3.5 w-3.5" />
            Today
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={onNext}
          disabled={!canGoNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
