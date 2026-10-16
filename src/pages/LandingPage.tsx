import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import {
  PublicLayout,
  Reveal,
  RunningImage,
} from "@/components/public/PublicLayout";
// Illustrative prescriptions, never a visitor's generated plan or recorded activity.
const exampleWeek = [
  {
    day: "Monday",
    short: "Mon",
    name: "Rest",
    duration: "A day off",
    intensity: "Recovery",
    note: "Space between sessions is part of the plan. Today, leave the running shoes by the door.",
  },
  {
    day: "Tuesday",
    short: "Tue",
    name: "Easy run",
    duration: "35 min",
    intensity: "Easy effort",
    note: "Keep the effort comfortable and conversational. Today is about time on your feet, not chasing a pace.",
  },
  {
    day: "Wednesday",
    short: "Wed",
    name: "Strength",
    duration: "20 min",
    intensity: "Supporting work",
    note: "A short strength session with a focus on the legs and core, supporting the running days ahead.",
  },
  {
    day: "Thursday",
    short: "Thu",
    name: "Tempo run",
    duration: "40 min",
    intensity: "Controlled effort",
    note: "An easy warm-up, a sustained section at a controlled effort, then an easy cool-down.",
  },
  {
    day: "Friday",
    short: "Fri",
    name: "Rest",
    duration: "A day off",
    intensity: "Recovery",
    note: "A pause before the weekend. No running session is scheduled in this example.",
  },
  {
    day: "Saturday",
    short: "Sat",
    name: "Long run",
    duration: "70 min",
    intensity: "Easy effort",
    note: "The longest run of this example week. Settle into a comfortable rhythm and keep the effort easy.",
  },
  {
    day: "Sunday",
    short: "Sun",
    name: "Easy run",
    duration: "25 min",
    intensity: "Easy effort",
    note: "A short, relaxed run to close the week. Keep it light after the longer session.",
  },
];
function ExampleWeek() {
  const [selected, setSelected] = useState(1);
  const reducedMotion = useReducedMotion();
  const groupId = useId();
  const sessionId = `${groupId}-session`;
  const session = exampleWeek[selected];
  return (
    <section
      className="public-week public-width"
      aria-labelledby="example-heading"
    >
      <div className="public-week-caption">
        <h2 id="example-heading">A week with a little more direction.</h2>
        <p>
          Example plan <span aria-hidden="true">·</span> Explore a day
        </p>
      </div>
      <LayoutGroup id={groupId}>
        <div
          className="public-days"
          role="group"
          aria-label="Explore the example week"
        >
          {exampleWeek.map((day, index) => (
            <button
              key={day.day}
              type="button"
              className="public-day"
              aria-label={`${day.day}: ${day.name}`}
              aria-pressed={selected === index}
              aria-controls={sessionId}
              onClick={() => setSelected(index)}
            >
              {selected === index && (
                <motion.span
                  className="public-day-selected"
                  layoutId={reducedMotion ? undefined : "selected-day"}
                  transition={{ type: "spring", stiffness: 420, damping: 38 }}
                />
              )}
              <span className="public-day-name">{day.short}</span>
              <span className="public-day-session">{day.name}</span>
              <span className="public-day-mark" aria-hidden="true">
                {index === 0 || index === 4
                  ? "—"
                  : `${parseInt(day.duration)}′`}
              </span>
            </button>
          ))}
        </div>
      </LayoutGroup>
      <div
        id={sessionId}
        className="public-session"
        aria-live="polite"
        aria-atomic="true"
      >
        <motion.div
          key={session.day}
          className="public-session-content"
          initial={reducedMotion ? false : { opacity: 0.6, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <div className="public-session-title">
            <h3>{session.name}</h3>
            <p>{session.day}</p>
          </div>
          <div className="public-session-prescription">
            <p>{session.duration}</p>
            <span>{session.intensity}</span>
          </div>
          <p className="public-session-note">{session.note}</p>
        </motion.div>
      </div>
      <p className="public-example-note">
        An illustration, not your personal plan. Your sessions are generated
        after setup.
      </p>
    </section>
  );
}
export default function LandingPage() {
  return (
    <PublicLayout>
      <main id="main-content">
        <section
          className="public-hero public-width"
          aria-labelledby="landing-heading"
        >
          <Reveal>
            <h1 id="landing-heading" className="public-hero-title">
              <span className="public-title-line">
                Your week.
                <RunningImage priority />
              </span>
              <span className="public-title-line">Your running.</span>
            </h1>
          </Reveal>
          <Reveal className="public-hero-intro" delay={0.08}>
            <p>
              A personalized weekly running plan.
              <br className="public-desktop-break" /> Built around your
              training, your goals and the days you have.
            </p>
            <Link to="/login" className="public-action">
              Get started <ArrowUpRight aria-hidden="true" />
            </Link>
          </Reveal>
        </section>
        <Reveal>
          <ExampleWeek />
        </Reveal>
        <section
          id="how-it-works"
          className="public-story"
          aria-labelledby="story-heading"
        >
          <div className="public-story-grid public-width">
            <div className="public-story-heading">
              <Reveal>
                <h2 id="story-heading">
                  Built around
                  <br />
                  your real life.
                </h2>
              </Reveal>
              <Reveal delay={0.08}>
                <p>
                  A race on the calendar. A steadier routine. A long run on
                  Sunday. Start with what matters to you.
                </p>
              </Reveal>
              <a href="#start-running" className="public-text-link">
                Find your starting point <ArrowDown aria-hidden="true" />
              </a>
            </div>
            <div className="public-story-entries">
              <Reveal>
                <h3>Bring your training.</h3>
                <p>
                  Connect Strava or Intervals.icu so your recent training can
                  inform your plan. One active source, chosen by you.
                </p>
                <p className="public-provider-names">
                  Strava <span aria-hidden="true">/</span> Intervals.icu
                </p>
                <p className="public-story-small">
                  Available recovery data depends on your source. Generated
                  running workouts can also be published to Intervals.icu.
                </p>
              </Reveal>
              <Reveal>
                <h3>Make it your week.</h3>
                <p>
                  Choose a race goal or focus on improving your running. Set at
                  least four running days and tell us which one works for your
                  long run.
                </p>
              </Reveal>
              <Reveal>
                <h3>Know your next run.</h3>
                <p>
                  After setup, open your personalized weekly plan. See the
                  week’s focus, explore each session’s effort, duration and
                  notes, and mark sessions complete as you go.
                </p>
              </Reveal>
            </div>
          </div>
        </section>
        <section
          id="start-running"
          className="public-close public-width"
          aria-labelledby="close-heading"
        >
          <Reveal>
            <RunningImage
              className="public-close-image"
              sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 1440px) 42vw, 600px"
            />
          </Reveal>
          <Reveal className="public-close-copy">
            <h2 id="close-heading">
              A clear week.
              <br />
              An open road.
            </h2>
            <p>Sign in. Connect your training. Find your rhythm.</p>
            <Link to="/login" className="public-action">
              Get started <ArrowUpRight aria-hidden="true" />
            </Link>
          </Reveal>
        </section>
      </main>
    </PublicLayout>
  );
}
