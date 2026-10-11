import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, ArrowDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Brand from "@/components/Brand";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import WeekRhythm from "@/components/WeekRhythm";
import heroImage from "@/assets/running-track.webp";

const exampleWeek = [
  {
    day: "MON",
    title: "Easy aerobic run",
    modality: "RUN",
    durationMinutes: 40,
    notes: "Find a conversational effort and settle into a comfortable rhythm.",
  },
  {
    day: "TUE",
    title: "Threshold intervals",
    modality: "RUN",
    durationMinutes: 50,
    notes:
      "A focused quality session. Keep your effort controlled, with recovery between intervals.",
  },
  {
    day: "WED",
    title: "Rest & recover",
    modality: "REST",
    durationMinutes: 0,
    notes:
      "Take a break from structured training. Recovery has a place in your plan, too.",
  },
  {
    day: "THU",
    title: "Runner strength",
    modality: "STRENGTH",
    durationMinutes: 30,
    notes:
      "Make time for single-leg stability, core work and your posterior chain.",
  },
  {
    day: "FRI",
    title: "Easy run + strides",
    modality: "RUN",
    durationMinutes: 45,
    notes:
      "Run at a conversational effort. Finish with a few short, relaxed strides.",
  },
  {
    day: "SAT",
    title: "Rest day",
    modality: "REST",
    durationMinutes: 0,
    notes: "A little space before the long run. Take it easy today.",
  },
  {
    day: "SUN",
    title: "Long aerobic run",
    modality: "RUN",
    durationMinutes: 80,
    notes:
      "More time on your feet, at an easy effort. Keep it comfortable from start to finish.",
  },
];

export default function LandingPage() {
  const [selectedDay, setSelectedDay] = useState("FRI");
  const session = exampleWeek.find((item) => item.day === selectedDay)!;
  return (
    <div className="landing-page">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="campaign-header">
        <nav
          aria-label="Main navigation"
          className="public-shell flex min-h-20 items-center justify-between gap-3"
        >
          <Brand />
          <div className="flex items-center gap-2 sm:gap-7">
            <a
              href="#how-it-works"
              className="hidden text-sm font-semibold hover:underline sm:inline"
            >
              How it works
            </a>
            <ThemeSwitcher />
            <Link to="/login" className="campaign-login">
              Log in <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </nav>
      </header>
      <main id="main-content">
        <section className="campaign-hero" aria-labelledby="campaign-title">
          <div className="public-shell campaign-heading">
            <h1 id="campaign-title">
              Your week.
              <br />
              With purpose.
            </h1>
            <div className="campaign-offer">
              <p>
                A personal running plan, built around your training, your
                schedule and your next goal.
              </p>
              <Button asChild size="lg" className="campaign-button">
                <Link to="/login">
                  Build my running plan <ArrowUpRight />
                </Link>
              </Button>
            </div>
          </div>
          <div className="campaign-scene">
            <img
              src={heroImage}
              alt="Runner in stride on a sunlit red athletics track"
              width="1536"
              height="1024"
              fetchPriority="high"
            />
            <div className="campaign-note">
              <h2>
                Make room
                <br />
                for the run.
              </h2>
              <p>
                A little structure.
                <br />A clear next step.
                <br />A week that works for you.
              </p>
              <a href="#your-week">
                Take a look inside <ArrowDown className="h-5 w-5" />
              </a>
            </div>
          </div>
        </section>
        <div className="connection-band public-shell">
          <p>Your training. Connected.</p>
          <span>
            Strava <span className="mx-3 opacity-50">/</span> Intervals.icu
          </span>
          <span className="hidden text-sm sm:block">
            One source. Your choice.
          </span>
        </div>
        <section id="your-week" className="public-shell week-story">
          <div className="story-heading">
            <h2>
              Find your
              <br />
              running rhythm.
            </h2>
            <p>
              Easy days. Focused efforts. Room to recover. See how it all fits
              together, then know exactly what comes next.
            </p>
          </div>
          <div className="example-plan">
            <div className="example-label">
              <h3>A week with Running Coach</h3>
              <span>Illustrative plan</span>
            </div>
            <WeekRhythm
              sessions={exampleWeek}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
            <div
              className="example-session"
              aria-live="polite"
              aria-atomic="true"
            >
              <div key={session.day} className="example-session-content">
                <div>
                  <h3>{session.title}</h3>
                  <p>{session.notes}</p>
                </div>
                <span className="example-duration">
                  {session.modality === "REST" ? (
                    "Rest day"
                  ) : (
                    <>
                      {session.durationMinutes}
                      <small>min planned</small>
                    </>
                  )}
                </span>
              </div>
            </div>
            <p className="example-help">
              Select a day to explore. Your own plan will reflect your profile
              and training.
            </p>
          </div>
        </section>
        <section id="how-it-works" className="setup-story">
          <div className="public-shell setup-layout">
            <div>
              <h2>
                Your running.
                <br />A little more
                <br />
                connected.
              </h2>
              <p>
                No blank calendar to fill. Start with the training you already
                do and the days you can run.
              </p>
            </div>
            <ol className="setup-steps">
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
                  "Get your weekly plan, explore the purpose of each workout, and check off your sessions as you go.",
                ],
              ].map(([title, description], index) => (
                <li key={title}>
                  <span className="setup-number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
        <section className="public-shell training-principle">
          <h2>
            The plan is personal.
            <br />
            The next step is clear.
          </h2>
          <ul>
            {[
              "Workouts built around your available days",
              "Clear instructions for each session",
              "Recorded activities alongside your plan",
            ].map((text) => (
              <li key={text}>
                <Check className="h-5 w-5" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </section>
        <section className="closing-field">
          <div className="public-shell">
            <h2>
              Let’s make
              <br />
              this your week.
            </h2>
            <Button asChild size="lg" className="campaign-button">
              <Link to="/login">
                Start training <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <footer className="public-shell flex flex-wrap items-center justify-between gap-5 py-8">
        <Brand />
        <Link
          to="/privacy"
          className="flex min-h-11 items-center text-sm text-muted-foreground hover:underline"
        >
          Privacy policy
        </Link>
      </footer>
    </div>
  );
}
