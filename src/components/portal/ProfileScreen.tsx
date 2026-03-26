import { useEffect, useMemo, useState } from "react";
import { format, parseISO, startOfToday } from "date-fns";
import { CalendarIcon, MessageSquareMore, RefreshCcw } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  getAthleteProfile,
  trainingGoalOptions,
  updateAthleteProfile,
  type AthleteProfileUpdate,
} from "@/lib/portal-api";

const allDays = [
  { value: "MON", label: "Mon" },
  { value: "TUE", label: "Tue" },
  { value: "WED", label: "Wed" },
  { value: "THU", label: "Thu" },
  { value: "FRI", label: "Fri" },
  { value: "SAT", label: "Sat" },
  { value: "SUN", label: "Sun" },
] as const;

type ProfileScreenProps = {
  athleteId: string;
  variant?: "page" | "onboarding";
  onComplete?: () => void | Promise<unknown>;
};

const emptyForm: AthleteProfileUpdate = {
  displayName: "",
  trainingGoal: "",
  runningDays: ["TUE", "THU", "SAT", "SUN"],
  longRunPreferredDay: "SUN",
  goalRaceEventName: "",
  goalRaceEventDate: "",
  goalRaceEventDistanceKm: "",
};

export default function ProfileScreen({
  athleteId,
  variant = "page",
  onComplete,
}: ProfileScreenProps) {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["portal", "athlete", athleteId],
    queryFn: () => getAthleteProfile(athleteId),
    enabled: Boolean(athleteId),
  });

  const [form, setForm] = useState<AthleteProfileUpdate>(emptyForm);

  useEffect(() => {
    if (!profileQuery.data) return;

    setForm({
      displayName: profileQuery.data.displayName,
      trainingGoal: profileQuery.data.trainingGoal,
      runningDays:
        profileQuery.data.runningDays.length > 0
          ? profileQuery.data.runningDays
          : emptyForm.runningDays,
      longRunPreferredDay:
        profileQuery.data.longRunPreferredDay ||
        profileQuery.data.runningDays.at(-1) ||
        emptyForm.longRunPreferredDay,
      goalRaceEventName: profileQuery.data.goalRaceEventName,
      goalRaceEventDate: profileQuery.data.goalRaceEventDate,
      goalRaceEventDistanceKm: profileQuery.data.goalRaceEventDistanceKm,
    });
  }, [profileQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (values: AthleteProfileUpdate) => updateAthleteProfile(athleteId, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["portal", "bootstrap"] });
      await queryClient.invalidateQueries({ queryKey: ["portal", "athlete", athleteId] });
      await onComplete?.();
    },
  });

  const raceDate = useMemo(() => {
    if (!form.goalRaceEventDate) return undefined;

    try {
      return parseISO(form.goalRaceEventDate);
    } catch {
      return undefined;
    }
  }, [form.goalRaceEventDate]);

  const toggleDay = (day: string) => {
    setForm((prev) => {
      if (prev.runningDays.includes(day)) {
        if (prev.runningDays.length <= 4) {
          return prev;
        }

        const runningDays = prev.runningDays.filter((item) => item !== day);

        return {
          ...prev,
          runningDays,
          longRunPreferredDay:
            prev.longRunPreferredDay === day
              ? runningDays[runningDays.length - 1] ?? emptyForm.longRunPreferredDay
              : prev.longRunPreferredDay,
        };
      }

      return {
        ...prev,
        runningDays: [...prev.runningDays, day],
      };
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveMutation.mutate(form);
  };
  const isOnboarding = variant === "onboarding";
  const isFormComplete =
    form.displayName.trim().length > 0 &&
    form.trainingGoal.trim().length > 0 &&
    form.runningDays.length >= 4 &&
    form.runningDays.includes(form.longRunPreferredDay) &&
    form.goalRaceEventName.trim().length > 0 &&
    form.goalRaceEventDate.trim().length > 0 &&
    form.goalRaceEventDistanceKm !== "" &&
    Number(form.goalRaceEventDistanceKm) > 0;

  if (profileQuery.isLoading) {
    return (
      <div className={isOnboarding ? "rounded-2xl border border-divider bg-card p-6 shadow-card" : "max-w-lg rounded-2xl border border-divider bg-card p-6 shadow-card"}>
        <p className="text-sm text-muted-foreground">Loading your profile…</p>
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div className={isOnboarding ? "rounded-2xl border border-divider bg-card p-6 shadow-card" : "max-w-lg rounded-2xl border border-divider bg-card p-6 shadow-card"}>
        <h2 className="font-serif text-2xl text-foreground">We couldn't load your profile</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Refresh the page or try again in a moment. The portal still needs your athlete context before the plan can stay in sync.
        </p>
      </div>
    );
  }

  return (
    <div className={isOnboarding ? "" : "max-w-lg"}>
      {!isOnboarding ? (
        <>
          <h2 className="mb-2 font-serif text-2xl">Your profile</h2>
          <p className="mb-8 text-sm text-muted-foreground">
            Update your running context to keep your plan relevant.
          </p>
        </>
      ) : null}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="display-name">Display name</Label>
          <Input
            id="display-name"
            value={form.displayName}
            onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="training-goal">Training goal</Label>
          <Select
            value={form.trainingGoal}
            onValueChange={(value) => setForm((prev) => ({ ...prev, trainingGoal: value as AthleteProfileUpdate["trainingGoal"] }))}
          >
            <SelectTrigger id="training-goal">
              <SelectValue placeholder="Choose a training goal" />
            </SelectTrigger>
            <SelectContent>
              {trainingGoalOptions.map((option) => (
                <SelectItem key={option.code} value={option.code}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>
            Running days <span className="font-normal text-muted-foreground">(min. 4)</span>
          </Label>
          <div className="flex gap-2">
            {allDays.map((day) => {
              const active = form.runningDays.includes(day.value);
              const locked = active && form.runningDays.length === 4;

              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={cn(
                    "flex-1 rounded-lg border px-0 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-divider text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                    locked && "cursor-default"
                  )}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">{form.runningDays.length} days selected</p>
        </div>

        <div className="space-y-2">
          <Label>
            Preferred long run day <span className="font-normal text-muted-foreground">(anchor)</span>
          </Label>
          <div className="flex gap-2">
            {allDays.map((day) => {
              const isRunDay = form.runningDays.includes(day.value);
              const isLongRun = form.longRunPreferredDay === day.value;

              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() =>
                    isRunDay &&
                    setForm((prev) => ({
                      ...prev,
                      longRunPreferredDay: day.value,
                    }))
                  }
                  disabled={!isRunDay}
                  className={cn(
                    "flex-1 rounded-lg border px-0 py-2.5 text-sm font-medium transition-colors",
                    !isRunDay
                      ? "cursor-not-allowed border-border bg-muted/30 text-muted-foreground opacity-30"
                      : isLongRun
                        ? "border-accent bg-accent text-accent-foreground shadow-sm"
                        : "border-divider text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                  )}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Long run scheduled on{" "}
            <span className="font-medium text-foreground">
              {allDays.find((day) => day.value === form.longRunPreferredDay)?.label ?? form.longRunPreferredDay}
            </span>
          </p>
        </div>

        <div className="space-y-3">
          <Label>Goal race / event</Label>
          <div className="space-y-3">
            <Input
              value={form.goalRaceEventName}
              placeholder="Event name"
              onChange={(event) => setForm((prev) => ({ ...prev, goalRaceEventName: event.target.value }))}
            />
            <div className="grid gap-3 sm:grid-cols-[minmax(8rem,0.75fr)_minmax(0,1.25fr)]">
              <Input
                type="number"
                min="1"
                max="250"
                step="0.1"
                value={form.goalRaceEventDistanceKm}
                placeholder="Distance (km)"
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    goalRaceEventDistanceKm: event.target.value === "" ? "" : Number(event.target.value),
                  }))
                }
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !raceDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {raceDate ? format(raceDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={raceDate}
                    disabled={(date) => date < startOfToday()}
                    onSelect={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        goalRaceEventDate: value ? format(value, "yyyy-MM-dd") : "",
                      }))
                    }
                    initialFocus
                    className={cn("pointer-events-auto p-3")}
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

        {saveMutation.isError && (
          <p className="text-sm text-destructive">We couldn't save your profile. Try again.</p>
        )}

        {saveMutation.isSuccess && (
          <p className="text-sm text-primary">Profile saved.</p>
        )}

        <Button
          variant="hero"
          className="mt-2"
          disabled={saveMutation.isPending || (isOnboarding && !isFormComplete)}
        >
          {saveMutation.isPending ? (
            <><RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> Saving</>
          ) : (
            isOnboarding ? "Save & continue" : "Save changes"
          )}
        </Button>
      </form>
    </div>
  );
}
