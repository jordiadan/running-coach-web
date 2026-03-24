import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw } from "lucide-react";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import OnboardingDemoScreen from "@/components/portal/OnboardingDemoScreen";
import { Button } from "@/components/ui/button";

export default function OnboardingDemoPage() {
  const [completed, setCompleted] = useState(false);
  const [seed, setSeed] = useState(0);

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-40 border-b border-divider bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="font-serif text-xl tracking-tight text-foreground">
              Running Coach
            </Link>
            <span className="hidden rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground sm:inline-flex">
              Onboarding demo
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <Button asChild variant="ghost" size="sm">
              <Link to="/portal">
                <ArrowLeft className="h-4 w-4" />
                Back to portal
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {completed ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-card"
          >
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">
              Demo complete
            </p>
            <h1 className="font-serif text-3xl text-foreground">The flow is ready to review</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              This route is intentionally dummy. It mirrors the onboarding UX from
              `stride-craft-87` without replacing the real backend-driven portal flow.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                variant="hero-outline"
                onClick={() => {
                  setCompleted(false);
                  setSeed((value) => value + 1);
                }}
              >
                <RotateCcw className="h-4 w-4" />
                Restart demo
              </Button>
              <Button asChild variant="hero">
                <Link to="/portal">Open real portal</Link>
              </Button>
            </div>
          </motion.div>
        ) : (
          <OnboardingDemoScreen key={seed} onComplete={() => setCompleted(true)} />
        )}
      </div>
    </div>
  );
}
