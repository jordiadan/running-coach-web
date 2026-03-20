import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, MessageSquareMore } from "lucide-react";
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
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        return prev.length > 4 ? prev.filter((d) => d !== day) : prev;
      }

      return [...prev, day];
    });
  };

  return (
    <div className="max-w-lg">
      <h2 className="font-serif text-2xl mb-2">Your profile</h2>
      <p className="text-muted-foreground text-sm mb-8">
        Update your running context to keep your plan relevant.
      </p>

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-2">
          <Label htmlFor="display-name">Display name</Label>
          <Input id="display-name" defaultValue="Jordi" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="training-goal">Training goal</Label>
          <Input id="training-goal" defaultValue="Build toward a half marathon in October" />
        </div>

        <div className="space-y-2">
          <Label>Training days</Label>
          <div className="grid grid-cols-7 gap-2">
            {allDays.map((day) => {
              const active = selectedDays.includes(day);
              const locked = active && selectedDays.length === 4;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "w-full px-0 py-2.5 rounded-lg text-sm font-medium border transition-colors",
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-divider text-muted-foreground hover:text-foreground hover:border-foreground/20",
                    locked && "cursor-default"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Choose the days you usually train. Minimum 4 days.
          </p>
        </div>

        <div className="space-y-3">
          <Label>Goal race / event</Label>
          <div className="space-y-3">
            <Input defaultValue="Half marathon" placeholder="Event name" />
            <div className="grid gap-3 sm:grid-cols-[minmax(8rem,0.75fr)_minmax(0,1.25fr)]">
              <Input type="number" min="1" defaultValue="21" placeholder="Distance (km)" />
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
        </div>

        <div className="space-y-2">
          <Label>Notes for your coach</Label>
          <div className="rounded-xl border border-divider bg-card px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-secondary p-2 text-muted-foreground">
                <MessageSquareMore className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Coming soon</p>
                <p className="text-sm text-muted-foreground">
                  Soon you'll be able to add context for your coach, like race constraints, recovery notes, or travel.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Button variant="hero" className="mt-2">Save changes</Button>
      </form>
    </div>
  );
}
