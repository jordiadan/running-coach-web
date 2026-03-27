import { motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  return (
    <motion.div
      className="flex items-center justify-between gap-2"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
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

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">{weekLabel}</span>
        {currentWeekOffsetLabel === "Current" ? (
          <Badge
            variant="secondary"
            className="h-4 bg-primary/10 px-1.5 py-0 text-[10px] text-primary border-primary/20"
          >
            Current
          </Badge>
        ) : null}
        {currentWeekOffsetLabel === "Future" ? (
          <Badge
            variant="outline"
            className="h-4 px-1.5 py-0 text-[10px] text-muted-foreground"
          >
            Future
          </Badge>
        ) : null}
        {currentWeekOffsetLabel !== "Current" && currentWeekOffsetLabel !== "Future" ? (
          <Badge
            variant="outline"
            className="h-4 px-1.5 py-0 text-[10px] text-muted-foreground"
          >
            {currentWeekOffsetLabel}
          </Badge>
        ) : null}
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
            Current
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
