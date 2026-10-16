import { useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO, startOfToday } from "date-fns";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarIcon, Check, RefreshCcw } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import "./portal.css";
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
import HeartRateZones from "@/components/portal/HeartRateZones";
import {
  getAthleteProfile,
  isProfileUpdateComplete,
  trainingGoalOptions,
  updateAthleteProfile,
  type AthleteProfileUpdate,
  type RaceTargetType,
} from "@/lib/portal-api";
import {
  equivalentPaceSeconds,
  equivalentTimeSeconds,
  formatRacePace,
  formatRaceTime,
  parseRacePace,
  parseRaceTime,
} from "@/lib/race-target";

const allDays = [
  { value: "MON", label: "Mon", full: "Monday" },
  { value: "TUE", label: "Tue", full: "Tuesday" },
  { value: "WED", label: "Wed", full: "Wednesday" },
  { value: "THU", label: "Thu", full: "Thursday" },
  { value: "FRI", label: "Fri", full: "Friday" },
  { value: "SAT", label: "Sat", full: "Saturday" },
  { value: "SUN", label: "Sun", full: "Sunday" },
] as const;

const raceTargetOptions: { value: RaceTargetType; label: string }[] = [
  { value: "FINISH_ONLY", label: "Finish" },
  { value: "TIME", label: "Target time" },
  { value: "PACE", label: "Target pace" },
];

export type ProfileDraft = {
  form: AthleteProfileUpdate;
  timeInputValue: string;
  paceInputValue: string;
};

type ProfileScreenProps = {
  athleteId: string;
  variant?: "page" | "onboarding";
  onComplete?: () => void | Promise<unknown>;
  focusTarget?: "race-goal" | null;
  onFocusTargetHandled?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  draft?: ProfileDraft | null;
  onDraftChange?: (draft: ProfileDraft | null) => void;
};

const emptyForm: AthleteProfileUpdate = {
  displayName: "",
  trainingGoal: "",
  runningDays: ["TUE", "THU", "SAT", "SUN"],
  longRunPreferredDay: "SUN",
  goalRaceEventName: "",
  goalRaceEventDate: "",
  goalRaceEventDistanceKm: "",
  raceTargetType: "FINISH_ONLY",
  targetTimeSeconds: "",
  targetPaceSecondsPerKm: "",
};

function profileSnapshot(values: AthleteProfileUpdate) {
  const isRaceGoal = values.trainingGoal === "prepare_for_race";
  return JSON.stringify({
    ...values,
    goalRaceEventName: isRaceGoal ? values.goalRaceEventName : "",
    goalRaceEventDate: isRaceGoal ? values.goalRaceEventDate : "",
    goalRaceEventDistanceKm: isRaceGoal ? values.goalRaceEventDistanceKm : "",
    raceTargetType: isRaceGoal ? values.raceTargetType : "FINISH_ONLY",
    // Only the selected target is persisted; its equivalent is display-only.
    targetTimeSeconds: isRaceGoal && values.raceTargetType === "TIME" ? values.targetTimeSeconds : "",
    targetPaceSecondsPerKm: isRaceGoal && values.raceTargetType === "PACE" ? values.targetPaceSecondsPerKm : "",
  });
}

export default function ProfileScreen({
  athleteId,
  variant = "page",
  onComplete,
  focusTarget,
  onFocusTargetHandled,
  onDirtyChange,
  draft,
  onDraftChange,
}: ProfileScreenProps) {
  const queryClient = useQueryClient();
  const reduceMotion = useReducedMotion();
  const profileQuery = useQuery({
    queryKey: ["portal", "athlete", athleteId],
    queryFn: () => getAthleteProfile(athleteId),
    enabled: Boolean(athleteId),
    // Zone calculation is asynchronous. Poll briefly only while a newer threshold is pending.
    refetchInterval: (query) =>
      variant !== "onboarding" &&
        query.state.data?.heartRateZones?.status === "PENDING_CALCULATION" &&
        query.state.dataUpdateCount < 8 &&
        query.state.fetchFailureCount === 0
        ? 15_000
        : false,
  });

  const [form, setForm] = useState<AthleteProfileUpdate>(draft?.form ?? emptyForm);
  const [savedForm, setSavedForm] = useState<AthleteProfileUpdate>(emptyForm);
  const [timeInputValue, setTimeInputValue] = useState(draft?.timeInputValue ?? "");
  const [paceInputValue, setPaceInputValue] = useState(draft?.paceInputValue ?? "");
  const [highlightRaceGoal, setHighlightRaceGoal] = useState(false);
  const initialDraftRef = useRef(draft);
  const loadedProfileRef = useRef<string | null>(null);
  const raceGoalSectionRef = useRef<HTMLDivElement | null>(null);
  const raceGoalEventNameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!profileQuery.data) return;

    const loadedForm: AthleteProfileUpdate = {
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
      raceTargetType: profileQuery.data.raceTargetType,
      targetTimeSeconds: profileQuery.data.targetTimeSeconds,
      targetPaceSecondsPerKm: profileQuery.data.targetPaceSecondsPerKm,
    };
    const snapshot = profileSnapshot(loadedForm);
    if (loadedProfileRef.current === snapshot) return;
    loadedProfileRef.current = snapshot;
    const restoredDraft = initialDraftRef.current;
    initialDraftRef.current = null;
    setForm(restoredDraft?.form ?? loadedForm);
    setSavedForm(loadedForm);
    setTimeInputValue(restoredDraft?.timeInputValue ?? formatRaceTime(profileQuery.data.targetTimeSeconds));
    setPaceInputValue(restoredDraft?.paceInputValue ?? formatRacePace(profileQuery.data.targetPaceSecondsPerKm));
  }, [profileQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (values: AthleteProfileUpdate) => updateAthleteProfile(athleteId, values),
    onSuccess: async (_result, values) => {
      setSavedForm(values);
      await queryClient.invalidateQueries({ queryKey: ["portal", "bootstrap"] });
      await queryClient.invalidateQueries({ queryKey: ["portal", "athlete", athleteId] });
      await queryClient.invalidateQueries({ queryKey: ["portal", "weekly-coach-screen"] });
      await onComplete?.();
    },
  });

  useEffect(() => {
    if (focusTarget !== "race-goal") return;
    if (!profileQuery.data) return;

    const animationFrameId = window.requestAnimationFrame(() => {
      raceGoalSectionRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
      });
      raceGoalEventNameRef.current?.focus({ preventScroll: true });
      raceGoalEventNameRef.current?.select();
      setHighlightRaceGoal(true);
    });
    const timeoutId = window.setTimeout(() => {
      setHighlightRaceGoal(false);
      onFocusTargetHandled?.();
    }, 1800);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.clearTimeout(timeoutId);
    };
  }, [focusTarget, profileQuery.data, onFocusTargetHandled, reduceMotion]);

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
    if (!isProfileUpdateComplete(form)) return;
    saveMutation.mutate(form);
  };

  const handleDistanceChange = (value: string) => {
    const distanceKm = value === "" ? "" : Number(value);

    if (form.raceTargetType === "TIME") {
      const targetPaceSecondsPerKm = equivalentPaceSeconds(
        form.targetTimeSeconds,
        distanceKm,
      );
      setPaceInputValue(formatRacePace(targetPaceSecondsPerKm));
      setForm((previous) => ({
        ...previous,
        goalRaceEventDistanceKm: distanceKm,
        targetPaceSecondsPerKm,
      }));
      return;
    }

    if (form.raceTargetType === "PACE") {
      const targetTimeSeconds = equivalentTimeSeconds(
        form.targetPaceSecondsPerKm,
        distanceKm,
      );
      setTimeInputValue(formatRaceTime(targetTimeSeconds));
      setForm((previous) => ({
        ...previous,
        goalRaceEventDistanceKm: distanceKm,
        targetTimeSeconds,
      }));
      return;
    }

    setForm((previous) => ({ ...previous, goalRaceEventDistanceKm: distanceKm }));
  };

  const handleRaceTargetTypeChange = (raceTargetType: RaceTargetType) => {
    if (raceTargetType === "FINISH_ONLY") {
      setTimeInputValue("");
      setPaceInputValue("");
      setForm((previous) => ({
        ...previous,
        raceTargetType,
        targetTimeSeconds: "",
        targetPaceSecondsPerKm: "",
      }));
      return;
    }

    if (raceTargetType === "TIME") {
      const targetTimeSeconds =
        form.targetTimeSeconds ||
        equivalentTimeSeconds(form.targetPaceSecondsPerKm, form.goalRaceEventDistanceKm);
      const targetPaceSecondsPerKm = equivalentPaceSeconds(
        targetTimeSeconds,
        form.goalRaceEventDistanceKm,
      );
      setTimeInputValue(formatRaceTime(targetTimeSeconds));
      setPaceInputValue(formatRacePace(targetPaceSecondsPerKm));
      setForm((previous) => ({
        ...previous,
        raceTargetType,
        targetTimeSeconds,
        targetPaceSecondsPerKm,
      }));
      return;
    }

    const targetPaceSecondsPerKm =
      form.targetPaceSecondsPerKm ||
      equivalentPaceSeconds(form.targetTimeSeconds, form.goalRaceEventDistanceKm);
    const targetTimeSeconds = equivalentTimeSeconds(
      targetPaceSecondsPerKm,
      form.goalRaceEventDistanceKm,
    );
    setPaceInputValue(formatRacePace(targetPaceSecondsPerKm));
    setTimeInputValue(formatRaceTime(targetTimeSeconds));
    setForm((previous) => ({
      ...previous,
      raceTargetType,
      targetTimeSeconds,
      targetPaceSecondsPerKm,
    }));
  };

  const handleTimeChange = (value: string) => {
    const targetTimeSeconds = parseRaceTime(value);
    const targetPaceSecondsPerKm = equivalentPaceSeconds(
      targetTimeSeconds,
      form.goalRaceEventDistanceKm,
    );

    setTimeInputValue(value);
    setPaceInputValue(formatRacePace(targetPaceSecondsPerKm));
    setForm((previous) => ({
      ...previous,
      targetTimeSeconds,
      targetPaceSecondsPerKm,
    }));
  };

  const handlePaceChange = (value: string) => {
    const targetPaceSecondsPerKm = parseRacePace(value);
    const targetTimeSeconds = equivalentTimeSeconds(
      targetPaceSecondsPerKm,
      form.goalRaceEventDistanceKm,
    );

    setPaceInputValue(value);
    setTimeInputValue(formatRaceTime(targetTimeSeconds));
    setForm((previous) => ({
      ...previous,
      targetTimeSeconds,
      targetPaceSecondsPerKm,
    }));
  };

  const isOnboarding = variant === "onboarding";
  const isDirty = profileSnapshot(form) !== profileSnapshot(savedForm);
  useEffect(() => {
    onDirtyChange?.(isDirty);
    return () => onDirtyChange?.(false);
  }, [isDirty, onDirtyChange]);
  useEffect(() => {
    onDraftChange?.(isDirty ? { form, timeInputValue, paceInputValue } : null);
  }, [form, timeInputValue, paceInputValue, isDirty, onDraftChange]);
  const isFormComplete = isProfileUpdateComplete(form);
  const invalidTime =
    form.raceTargetType === "TIME" &&
    timeInputValue.trim().length > 0 &&
    parseRaceTime(timeInputValue) === "";
  const invalidPace =
    form.raceTargetType === "PACE" &&
    paceInputValue.trim().length > 0 &&
    parseRacePace(paceInputValue) === "";

  if (profileQuery.isLoading) {
    return (
      <div className="portal-settings portal-state" role="status" aria-busy="true">
        <p>Loading your profile…</p>
        <div className="portal-skeleton" />
        <div className="portal-skeleton" />
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div className="portal-settings portal-state" role="alert">
        <h2 className="font-serif text-2xl text-foreground">We couldn't load your profile</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Your training settings are unavailable. Try loading them again.
        </p>
        <Button type="button" variant="outline" onClick={() => void profileQuery.refetch()}>Try again</Button>
      </div>
    );
  }

  return (
    <div className={`portal-settings profile-screen ${isOnboarding ? "profile-onboarding" : ""}`}>
      {!isOnboarding && <div className="portal-page-heading">
        <h1>Your profile<span className="portal-title-dot" aria-hidden="true">.</span>
        </h1>
        <p>A plan that fits your goals, and your week.</p>
      </div>}
      <div className="profile-layout">
        {!isOnboarding && <aside className="profile-identity" aria-label="Athlete overview">
          <div className="profile-monogram" aria-hidden="true">{(savedForm.displayName.trim() || "Runner").split(/\s+/).slice(0, 2).map(name => name[0]).join("")}</div>
          <div className="profile-identity-name">
            <h2>{savedForm.displayName || "Your athlete profile"}</h2>
            <p>{trainingGoalOptions.find(option => option.code === savedForm.trainingGoal)?.label || "Athlete profile"}</p>
          </div>
          <dl className="profile-summary">
            <div>
              <dt>Running days</dt>
              <dd>{savedForm.runningDays.length}<span> / week</span>
              </dd>
            </div>
            <div>
              <dt>Long run</dt>
              <dd>{allDays.find(day => day.value === savedForm.longRunPreferredDay)?.full}</dd>
            </div>
          </dl>
        </aside>}
        <form className="profile-editor" onSubmit={handleSubmit}>
          <fieldset disabled={saveMutation.isPending} className="profile-fields">
            <section className="profile-section" aria-labelledby="profile-essentials-heading">
              <div className="profile-section-heading">
                <h2 id="profile-essentials-heading">The essentials</h2>
                <p>Your name and what you're training for.</p>
              </div>
              <div className="profile-essentials-grid">
                <div className="space-y-2">
                  <Label htmlFor="display-name">Display name</Label>
                  <Input
                    id="display-name"
                    autoComplete="nickname"
                    name="displayName"
                    value={form.displayName}
                    maxLength={120}
                    required
                    onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="training-goal">Training goal</Label>
                  <Select
                    name="trainingGoal"
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

              </div>
            </section>
            <section className="profile-section" aria-labelledby="profile-rhythm-heading">
              <div className="profile-section-heading">
                <h2 id="profile-rhythm-heading">Your training rhythm</h2>
                <p>Make room for running, and for everything else.</p>
              </div>
              <fieldset className="profile-running-days" aria-describedby="running-days-hint">
                <legend>Running days <span>(min. 4)</span>
                </legend>
                <div className="profile-day-grid">
                  {allDays.map(day => {
                    const active = form.runningDays.includes(day.value);
                    const locked = active && form.runningDays.length === 4;
                    return <button key={day.value} type="button" aria-label={day.full} aria-pressed={active} aria-disabled={locked} onClick={() => toggleDay(day.value)}>
                      <span>{day.label}</span>
                      <span className="profile-day-indicator" aria-hidden="true">{active ? <Check size={14} strokeWidth={2} /> : <span />}</span>
                    </button>;
                  })}
                </div>
                <p id="running-days-hint" className="profile-field-hint">{form.runningDays.length} days selected. Choose at least four running days.</p>
              </fieldset>
              <div className="profile-long-run">
                <div>
                  <Label htmlFor="long-run-day">Preferred long run day</Label>
                  <p className="profile-field-hint">The anchor of your training week.</p>
                </div>
                <select id="long-run-day" name="longRunPreferredDay" value={form.longRunPreferredDay} onChange={event => setForm(prev => ({ ...prev, longRunPreferredDay: event.target.value }))}>
                  {allDays.filter(day => form.runningDays.includes(day.value)).map(day => <option key={day.value} value={day.value}>{day.full}</option>)}
                </select>
              </div>
            </section>

            {form.trainingGoal === "prepare_for_race" ? (
              <motion.div
                ref={raceGoalSectionRef}
                id="goal-race-section"
                className={cn(
                  "profile-section profile-race space-y-5 transition-colors duration-200",
                  highlightRaceGoal
                    ? "bg-primary/5 shadow-sm ring-2 ring-primary/60"
                    : "ring-0 ring-transparent",
                )}
                animate={
                  highlightRaceGoal && !reduceMotion
                    ? { scale: [1, 1.01, 1] }
                    : { scale: 1 }
                }
                transition={{ duration: 0.45, ease: "easeOut" }}
              >
                <div className="profile-section-heading">
                  <h2>Race goal</h2>
                  <p>Your next start line, and how you want to reach it.</p>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="goal-race-event-name">Goal race / event</Label>
                  <Input
                    id="goal-race-event-name"
                    name="goalRaceEventName"
                    autoComplete="off"
                    ref={raceGoalEventNameRef}
                    value={form.goalRaceEventName}
                    placeholder="Event name"
                    maxLength={120}
                    required
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, goalRaceEventName: event.target.value }))
                    }
                  />
                  <div className="grid gap-3 sm:grid-cols-[minmax(8rem,0.75fr)_minmax(0,1.25fr)]">
                    <div className="space-y-2">
                      <Label htmlFor="race-distance">Distance (km)</Label>
                      <Input
                        id="race-distance"
                        name="raceDistanceKm"
                        autoComplete="off"
                        aria-label="Race distance in kilometres"
                        type="number"
                        min="1"
                        max="250"
                        step="0.1"
                        value={form.goalRaceEventDistanceKm}
                        placeholder="Distance (km)"
                        required
                        onChange={(event) => handleDistanceChange(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="race-date">Race date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="race-date"
                            aria-label={raceDate ? `Race date: ${format(raceDate, "PPP")}` : "Pick a race date"}
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !raceDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon aria-hidden="true" className="mr-2 h-4 w-4" />
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

                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium leading-none text-foreground">
                    Race target
                  </legend>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {raceTargetOptions.map((option) => (
                      <label
                        key={option.value}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium transition-colors",
                          form.raceTargetType === option.value
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-divider text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                        )}
                      >
                        <input
                          type="radio"
                          name="race-target"
                          value={option.value}
                          checked={form.raceTargetType === option.value}
                          onChange={() => handleRaceTargetTypeChange(option.value)}
                          className="h-4 w-4 accent-primary"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>

                  {form.raceTargetType === "FINISH_ONLY" ? (
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      No finish time target. Your plan will focus on getting you race-ready.
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="target-time">
                          {form.raceTargetType === "TIME" ? "Target time" : "Equivalent time"}
                        </Label>
                        <Input
                          id="target-time"
                          name="targetTime"
                          autoComplete="off"
                          value={timeInputValue}
                          placeholder="1:45:00"
                          inputMode="numeric"
                          readOnly={form.raceTargetType !== "TIME"}
                          required={form.raceTargetType === "TIME"}
                          aria-invalid={invalidTime}
                          aria-describedby="target-format-hint"
                          className={cn(
                            form.raceTargetType !== "TIME" && "bg-muted/40 text-muted-foreground",
                          )}
                          onChange={(event) => handleTimeChange(event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="target-pace">
                          {form.raceTargetType === "PACE"
                            ? "Target pace / km"
                            : "Equivalent pace / km"}
                        </Label>
                        <Input
                          id="target-pace"
                          name="targetPace"
                          autoComplete="off"
                          value={paceInputValue}
                          placeholder="4:58"
                          inputMode="numeric"
                          readOnly={form.raceTargetType !== "PACE"}
                          required={form.raceTargetType === "PACE"}
                          aria-invalid={invalidPace}
                          aria-describedby="target-format-hint"
                          className={cn(
                            form.raceTargetType !== "PACE" && "bg-muted/40 text-muted-foreground",
                          )}
                          onChange={(event) => handlePaceChange(event.target.value)}
                        />
                      </div>
                      <p
                        id="target-format-hint"
                        className="text-xs leading-relaxed text-muted-foreground sm:col-span-2"
                      >
                        Enter time as h:mm:ss or mm:ss, and pace as mm:ss. The equivalent
                        updates from the race distance.
                      </p>
                    </div>
                  )}
                </fieldset>
              </motion.div>
            ) : null}

            <div className="profile-notes">
              <p>
                <strong>Notes for your coach</strong>
                <span>Coming soon</span>
              </p>
              <p>Soon you'll be able to add context for your coach, like race constraints, recovery notes, or travel.</p>
            </div>
          </fieldset>
          <div className={`profile-save-bar ${isDirty || saveMutation.isPending || saveMutation.isError ? "is-active" : ""}`}>
            <div className="profile-save-feedback" aria-live="polite" aria-atomic="true">
              {saveMutation.isPending ? <p>Saving your profile…</p> : saveMutation.isError ? <p className="portal-inline-error" role="alert">We couldn't save your profile. Try again.</p> : isDirty ? <p>Unsaved changes</p> : saveMutation.isSuccess ? <p className="profile-saved">
                <Check size={16} aria-hidden="true" /> Profile saved.</p> : <p>Your training, your way.</p>}
              {!isFormComplete && <p className="profile-validation-hint">Complete the required fields to save.</p>}
            </div>
            <Button variant="hero" disabled={saveMutation.isPending || !isFormComplete}>
              {saveMutation.isPending ? <>
                <RefreshCcw className="portal-spin" size={16} aria-hidden="true" /> Saving</> : isOnboarding ? "Save & continue" : "Save changes"}
            </Button>
          </div>
        </form>
        {!isOnboarding && <div className="profile-zones">
          <HeartRateZones zones={profileQuery.data?.heartRateZones} />
        </div>}
      </div>
    </div>
  );
}
