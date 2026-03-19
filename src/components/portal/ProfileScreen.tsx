import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const allDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ProfileScreen() {
  const [selectedDays, setSelectedDays] = useState<string[]>(["Mon", "Wed", "Thu", "Sat"]);
  const [raceDate, setRaceDate] = useState<Date | undefined>(new Date(2026, 9, 18));

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? (prev.length > 4 ? prev.filter((d) => d !== day) : prev) : [...prev, day]
    );
  };

  return (
    <div className="max-w-lg">
      <h2 className="font-serif text-2xl mb-2">Your profile</h2>
      <p className="text-muted-foreground text-sm mb-8">
        Update your running context to keep your plan relevant.
      </p>

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-2">
          <Label>Weekly distance goal</Label>
          <Input defaultValue="30 km" />
        </div>

        <div className="space-y-2">
          <Label>Training days <span className="text-muted-foreground font-normal">(min. 4)</span></Label>
          <div className="flex gap-2">
            {allDays.map((day) => {
              const active = selectedDays.includes(day);
              const canDeselect = active && selectedDays.length > 4;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors",
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-divider text-muted-foreground hover:text-foreground hover:border-foreground/20",
                    active && !canDeselect && "cursor-default"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">{selectedDays.length} days selected</p>
        </div>

        <div className="space-y-2">
          <Label>Current fitness level</Label>
          <div className="flex gap-2">
            {["Beginner", "Intermediate", "Advanced"].map((level) => (
              <button
                key={level}
                type="button"
                className={cn(
                  "px-4 py-2 rounded-lg text-sm border transition-colors",
                  level === "Intermediate"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-divider text-muted-foreground hover:text-foreground hover:border-foreground/20"
                )}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Goal race / event</Label>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input defaultValue="Half marathon" placeholder="Event name" />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !raceDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {raceDate ? format(raceDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={raceDate}
                  onSelect={setRaceDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notes for your coach</Label>
          <Input defaultValue="Recovering from mild shin splints" />
        </div>

        <Button variant="hero" className="mt-2">Save changes</Button>
      </form>
    </div>
  );
}
