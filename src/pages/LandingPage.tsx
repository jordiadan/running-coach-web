import { Link } from "react-router-dom";
import { ArrowRight, ArrowDown, Check, MoveUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Brand from "@/components/Brand";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import heroImage from "@/assets/hero-running.jpg";

const exampleWeek = [
  {
    day: "Mon",
    title: "Easy aerobic run",
    detail: "40 min · Easy",
    done: true,
  },
  {
    day: "Tue",
    title: "Threshold intervals",
    detail: "50 min · Quality",
    done: true,
  },
  {
    day: "Wed",
    title: "Rest & recover",
    detail: "Room to recharge",
    done: false,
  },
  {
    day: "Thu",
    title: "Runner strength",
    detail: "30 min · Strength",
    done: false,
  },
  {
    day: "Fri",
    title: "Easy run + strides",
    detail: "45 min · Easy",
    done: false,
  },
  { day: "Sat", title: "Rest day", detail: "Take it easy", done: false },
  {
    day: "Sun",
    title: "Long aerobic run",
    detail: "80 min · Endurance",
    done: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="border-b border-border bg-card">
        <nav
          aria-label="Main navigation"
          className="public-shell flex min-h-20 items-center justify-between gap-3"
        >
          <Brand />
          <div className="flex items-center gap-2 sm:gap-5">
            <a
              href="#how-it-works"
              className="hidden text-sm font-medium hover:text-primary sm:inline"
            >
              How it works
            </a>
            <ThemeSwitcher />
            <Button asChild variant="outline" size="sm">
              <Link to="/login">
                Log in <ArrowRight className="hidden h-4 w-4 sm:block" />
              </Link>
            </Button>
          </div>
        </nav>
      </header>
      <main id="main-content">
        <section className="brand-field">
          <div className="public-shell grid lg:min-h-[640px] lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col items-start justify-center py-14 sm:py-20 lg:pr-16">
              <h1 className="max-w-xl font-display text-6xl font-semibold leading-[0.98] sm:text-7xl lg:text-8xl">
                A clear plan.
                <br />A purpose for
                <br />
                <span className="text-[hsl(var(--brand-lime))]">
                  every run.
                </span>
              </h1>
              <p className="mt-7 max-w-md text-base leading-7 text-[hsl(var(--brand-paper))] sm:text-lg">
                Your training, your schedule, your next goal. Bring them
                together in a weekly running plan that tells you what to do and
                why.
              </p>
              <Button
                asChild
                size="lg"
                className="brand-action mt-8 hover:opacity-90"
              >
                <Link to="/login">
                  Build my running plan <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <p className="mt-4 text-xs text-[hsl(var(--brand-paper))]">
                Connect with Strava or Intervals.icu
              </p>
              <a
                href="#your-week"
                className="mt-10 flex min-h-11 items-center gap-2 text-sm underline underline-offset-4"
              >
                Take a look inside <ArrowDown className="h-4 w-4" />
              </a>
            </div>
            <figure className="relative -mx-5 sm:-mx-8 lg:mx-0 lg:-mr-12">
              <img
                src={heroImage}
                alt="Runner following a mountain trail in the evening light"
                className="h-72 w-full object-cover sm:h-96 lg:absolute lg:inset-0 lg:h-full"
                fetchPriority="high"
              />
              <figcaption className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-[hsl(var(--brand-ink))] px-5 py-4 text-sm lg:bottom-6 lg:left-6 lg:right-6 lg:rounded-lg">
                <span>Make room for the run.</span>
                <MoveUpRight className="h-5 w-5" aria-hidden="true" />
              </figcaption>
            </figure>
          </div>
        </section>
        <section
          id="your-week"
          className="public-shell grid gap-10 py-16 sm:py-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24"
        >
          <div className="lg:pt-6">
            <h2 className="font-display text-5xl leading-none sm:text-6xl">
              Less deciding.
              <br />
              More running.
            </h2>
            <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground">
              Open your week and know where to begin. See the purpose of each
              session, make time for recovery, and keep your goal in view.
            </p>
            <ul className="mt-8 space-y-5 text-sm">
              {[
                "Workouts built around your available days",
                "Clear instructions for each session",
                "Your recorded activities alongside your plan",
              ].map((text) => (
                <li key={text} className="flex items-start gap-3">
                  <Check
                    className="h-5 w-5 shrink-0 text-accent"
                    aria-hidden="true"
                  />
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <div className="surface overflow-hidden">
            <div className="flex items-baseline justify-between gap-3 border-b border-border px-5 py-5 sm:px-7">
              <h3 className="section-title">A week with Running Coach</h3>
              <span className="text-xs text-muted-foreground">
                Illustrative plan
              </span>
            </div>
            <ol className="divide-y divide-border">
              {exampleWeek.map((session, i) => (
                <li
                  key={session.day}
                  className={`flex items-center gap-4 px-5 py-4 sm:px-7 ${i === 4 ? "bg-primary/5" : ""}`}
                >
                  <span className="w-8 shrink-0 text-xs font-semibold text-muted-foreground">
                    {session.day}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">
                      {session.title}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {session.detail}
                    </span>
                  </span>
                  {session.done ? (
                    <Check
                      className="h-4 w-4 text-accent"
                      aria-label="Complete"
                    />
                  ) : i === 4 ? (
                    <span className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground">
                      Today
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </section>
        <section id="how-it-works" className="border-y border-border bg-card">
          <div className="public-shell py-16 sm:py-24">
            <h2 className="font-display text-4xl sm:text-5xl">
              From your training to your next run.
            </h2>
            <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-12">
              {[
                [
                  "Connect your training",
                  "Choose Strava or Intervals.icu to bring your activity history into your plan. One source, one place to start.",
                ],
                [
                  "Make it yours",
                  "Choose your running days and long-run day. Set a race goal or focus on improving your running.",
                ],
                [
                  "Run your week",
                  "Get your weekly plan, explore each workout, and check off your sessions as you go.",
                ],
              ].map(([title, description], i) => (
                <li key={title} className="border-t border-border pt-5">
                  <h3 className="mb-3 font-display text-3xl">
                    <span className="mr-2 text-primary">{i + 1}.</span>
                    {title}
                  </h3>
                  <p className="text-sm leading-7 text-muted-foreground">
                    {description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>
        <section className="public-shell flex flex-col items-start justify-between gap-7 py-16 sm:py-20 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-5xl">
              Give your next run a plan.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Start with your goals. Take it one week at a time.
            </p>
          </div>
          <Button asChild size="lg">
            <Link to="/login">
              Start training <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </section>
      </main>
      <footer className="border-t border-border">
        <div className="public-shell flex flex-wrap items-center justify-between gap-5 py-8">
          <Brand />
          <Link
            to="/privacy"
            className="flex min-h-11 items-center text-sm text-muted-foreground hover:underline"
          >
            Privacy policy
          </Link>
        </div>
      </footer>
    </div>
  );
}
