import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Link2,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface OnboardingDemoScreenProps {
  onComplete: () => void;
}

const steps = [
  {
    id: "connect",
    title: "Connect your data",
    subtitle: "Link a training source so we can understand your fitness",
    icon: Link2,
    emoji: "🔗",
  },
  {
    id: "profile",
    title: "Set up your profile",
    subtitle: "Tell us about your goals and training preferences",
    icon: User,
    emoji: "🏃",
  },
  {
    id: "ready",
    title: "Your plan is ready",
    subtitle: "We'll generate a personalized weekly plan just for you",
    icon: Zap,
    emoji: "⚡",
  },
] as const;

function ConnectStep({ onDone }: { onDone: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const sources = [
    {
      id: "intervals",
      name: "Intervals.icu",
      desc: "Sync structured workouts, fitness and fatigue data",
      available: true,
    },
    { id: "strava", name: "Strava", desc: "Coming soon", available: false },
    {
      id: "garmin",
      name: "Garmin Connect",
      desc: "Coming soon",
      available: false,
    },
  ];

  const handleConnect = () => {
    if (!selected) return;
    setConnected(true);
    window.setTimeout(onDone, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-5"
    >
      <div className="grid gap-3">
        {sources.map((source, i) => (
          <motion.button
            key={source.id}
            type="button"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            disabled={!source.available || connected}
            onClick={() => setSelected(source.id)}
            className={`relative flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 ${
              !source.available
                ? "cursor-not-allowed border-border bg-muted/30 opacity-40"
                : selected === source.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-primary/30 hover:bg-card/80"
            } ${connected && selected === source.id ? "border-primary bg-primary/10" : ""}`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                selected === source.id
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Link2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{source.name}</p>
              <p className="text-xs text-muted-foreground">{source.desc}</p>
            </div>
            {selected === source.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  connected
                    ? "bg-primary text-primary-foreground"
                    : "border-2 border-primary"
                }`}
              >
                {connected ? <Check className="h-3.5 w-3.5" /> : null}
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selected && !connected ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Button onClick={handleConnect} className="w-full gap-2" variant="hero">
              Connect {sources.find((source) => source.id === selected)?.name}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {connected ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg bg-primary/10 p-3 text-sm font-medium text-primary"
        >
          <Check className="h-4 w-4" />
          Connected successfully! Moving on…
        </motion.div>
      ) : null}
    </motion.div>
  );
}

function ProfileStep({ onDone }: { onDone: () => void }) {
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState<string | null>(null);
  const [days, setDays] = useState<string[]>(["Mon", "Wed", "Thu", "Sat"]);
  const allDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const toggleDay = (day: string) => {
    setDays((prev) =>
      prev.includes(day)
        ? prev.length > 4
          ? prev.filter((item) => item !== day)
          : prev
        : [...prev, day],
    );
  };

  const canContinue = level && goal.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-2"
      >
        <label className="text-sm font-medium text-foreground">
          What's your goal race or event?
        </label>
        <input
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          placeholder="e.g. Half marathon, 10K PB, first ultra…"
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <label className="text-sm font-medium text-foreground">
          Current fitness level
        </label>
        <div className="grid grid-cols-3 gap-2">
          {["Beginner", "Intermediate", "Advanced"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setLevel(item)}
              className={`rounded-xl border py-3 text-sm font-medium transition-all duration-200 ${
                level === item
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-2"
      >
        <label className="text-sm font-medium text-foreground">
          Training days <span className="font-normal text-muted-foreground">(min. 4)</span>
        </label>
        <div className="flex gap-1.5">
          {allDays.map((day) => {
            const active = days.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`flex-1 rounded-lg border py-2.5 text-xs font-medium transition-all duration-200 ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground">{days.length} days selected</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          onClick={onDone}
          disabled={!canContinue}
          className="w-full gap-2"
          variant="hero"
        >
          Save & continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}

function ReadyStep({ onDone }: { onDone: () => void }) {
  const [generating, setGenerating] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setGenerating(false), 2500);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 py-4 text-center"
    >
      {generating ? (
        <motion.div className="space-y-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20"
          >
            <Sparkles className="h-8 w-8 text-primary" />
          </motion.div>
          <div>
            <h3 className="mb-2 font-serif text-xl text-foreground">Building your plan…</h3>
            <p className="text-sm text-muted-foreground">
              Analyzing your data and creating a personalized weekly plan
            </p>
          </div>
          <div className="mx-auto max-w-xs space-y-2">
            <Progress value={65} className="h-1.5" />
            <p className="text-[11px] text-muted-foreground">Crunching the numbers…</p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15"
          >
            <Check className="h-8 w-8 text-primary" />
          </motion.div>
          <div>
            <h3 className="mb-2 font-serif text-xl text-foreground">Your plan is ready! 🎉</h3>
            <p className="text-sm text-muted-foreground">
              We've created a personalized deload week based on your profile and training data
            </p>
          </div>
          <Button onClick={onDone} className="gap-2" variant="hero" size="lg">
            View my plan
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function OnboardingDemoScreen({
  onComplete,
}: OnboardingDemoScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const markDone = (stepIdx: number) => {
    setCompletedSteps((prev) => new Set(prev).add(stepIdx));
    if (stepIdx < steps.length - 1) {
      window.setTimeout(() => setCurrentStep(stepIdx + 1), 300);
    }
  };

  const progressPercent = Math.round(
    ((currentStep + (completedSteps.has(currentStep) ? 1 : 0)) / steps.length) * 100,
  );

  return (
    <div className="mx-auto max-w-lg">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", bounce: 0.4 }}
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
        >
          <Sparkles className="h-4 w-4" />
          Welcome aboard
        </motion.div>
        <h2 className="mb-2 font-serif text-2xl text-foreground sm:text-3xl">
          Let's get you set up
        </h2>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          Just a couple of quick steps and your personalized training plan will be ready
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <div className="relative mb-6">
          <Progress value={progressPercent} className="h-1" />
        </div>

        <div className="flex items-center justify-between gap-2">
          {steps.map((step, i) => {
            const isDone = completedSteps.has(i);
            const isCurrent = currentStep === i;

            return (
              <motion.button
                key={step.id}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.1 }}
                onClick={() => {
                  if (isDone || isCurrent) setCurrentStep(i);
                }}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-200 ${
                  isCurrent
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : isDone
                      ? "border-primary/10 bg-primary/5 text-primary/70"
                      : "border-transparent text-muted-foreground"
                }`}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] ${
                    isDone
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                        ? "border border-primary/30 bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                <span className="hidden sm:inline">{step.title}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        className="rounded-2xl border border-border bg-card p-6 shadow-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="mb-5">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xl">{steps[currentStep].emoji}</span>
            <h3 className="font-serif text-lg text-foreground">{steps[currentStep].title}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{steps[currentStep].subtitle}</p>
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 0 ? (
            <ConnectStep key="connect" onDone={() => markDone(0)} />
          ) : null}
          {currentStep === 1 ? (
            <ProfileStep key="profile" onDone={() => markDone(1)} />
          ) : null}
          {currentStep === 2 ? <ReadyStep key="ready" onDone={onComplete} /> : null}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
