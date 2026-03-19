import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Flame, MapPin, Timer, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const weekPlan = [
  {
    day: "Monday",
    shortDay: "Mon",
    type: "Easy Run",
    distance: 5,
    pace: "6:00 /km",
    notes: "Keep it conversational. Warm up with a 5-min walk.",
    icon: "🏃",
  },
  {
    day: "Tuesday",
    shortDay: "Tue",
    type: "Rest",
    distance: 0,
    pace: "—",
    notes: "Active recovery: light stretching or a short walk.",
    icon: "🧘",
  },
  {
    day: "Wednesday",
    shortDay: "Wed",
    type: "Tempo Run",
    distance: 7,
    pace: "5:15 /km",
    notes: "2 km warm-up, 3 km at tempo, 2 km cool-down.",
    icon: "⚡",
  },
  {
    day: "Thursday",
    shortDay: "Thu",
    type: "Easy Run",
    distance: 5,
    pace: "6:10 /km",
    notes: "Focus on form. Short strides at the end.",
    icon: "🏃",
  },
  {
    day: "Friday",
    shortDay: "Fri",
    type: "Rest",
    distance: 0,
    pace: "—",
    notes: "Foam rolling and mobility work recommended.",
    icon: "🧘",
  },
  {
    day: "Saturday",
    shortDay: "Sat",
    type: "Long Run",
    distance: 13,
    pace: "6:20 /km",
    notes: "Steady effort. Hydrate well before and during.",
    icon: "🏔️",
  },
  {
    day: "Sunday",
    shortDay: "Sun",
    type: "Recovery Jog",
    distance: 3,
    pace: "6:45 /km",
    notes: "Very easy. Shake out the legs.",
    icon: "🚶",
  },
];

const typeStyles: Record<string, string> = {
  "Easy Run": "bg-primary/10 text-primary border-primary/20",
  "Tempo Run": "bg-accent/15 text-accent border-accent/20",
  "Long Run": "bg-primary/20 text-primary border-primary/30",
  "Recovery Jog": "bg-secondary text-muted-foreground border-border",
  Rest: "bg-muted text-muted-foreground border-border",
};

const totalDistance = weekPlan.reduce((sum, d) => sum + d.distance, 0);

export default function WeeklyPlanScreen() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const toggleDay = (day: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const completedDistance = weekPlan
    .filter((d) => completed.has(d.day))
    .reduce((sum, d) => sum + d.distance, 0);

  const progressPercent = Math.round((completedDistance / totalDistance) * 100);
  const completedCount = weekPlan.filter((d) => completed.has(d.day) && d.distance > 0).length;
  const runDays = weekPlan.filter((d) => d.distance > 0).length;

  return (
    <TooltipProvider>
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-serif text-2xl mb-1">This week's plan</h2>
            <p className="text-muted-foreground text-sm">March 17 – 23, 2026</p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: MapPin, label: "Total", value: `${totalDistance} km` },
            { icon: Check, label: "Completed", value: `${completedDistance} km` },
            { icon: TrendingUp, label: "Sessions", value: `${completedCount}/${runDays}` },
            { icon: Flame, label: "Est. calories", value: `${Math.round(completedDistance * 65)} kcal` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <stat.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-sm font-semibold text-foreground">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Weekly progress</span>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2.5" />
        </div>

        {/* Day cards */}
        <div className="space-y-3">
          {weekPlan.map((day, i) => {
            const done = completed.has(day.day);
            const isRest = day.type === "Rest";

            return (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className={`group relative flex items-start gap-4 p-4 sm:p-5 rounded-xl border transition-all duration-200 ${
                  done
                    ? "bg-primary/5 border-primary/20"
                    : "bg-card border-border hover:border-primary/20 hover:shadow-sm"
                } ${isRest && !done ? "opacity-60" : ""}`}
              >
                {/* Checkbox */}
                <div className="pt-0.5">
                  <Checkbox
                    checked={done}
                    onCheckedChange={() => toggleDay(day.day)}
                    className="h-5 w-5"
                  />
                </div>

                {/* Icon */}
                <div className="text-xl leading-none pt-0.5 select-none">{day.icon}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`font-medium text-sm ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {day.day}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${typeStyles[day.type] || ""}`}
                    >
                      {day.type}
                    </span>
                  </div>

                  {day.distance > 0 && (
                    <div className="flex items-center gap-4 mb-1.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5" />
                            {day.distance} km
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>Distance</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Timer className="w-3.5 h-3.5" />
                            {day.pace}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>Target pace</TooltipContent>
                      </Tooltip>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground leading-relaxed">{day.notes}</p>
                </div>

                {/* Done badge */}
                {done && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 right-4 p-1 rounded-full bg-primary text-primary-foreground"
                  >
                    <Check className="w-3 h-3" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
