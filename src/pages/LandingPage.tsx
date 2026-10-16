import { useId, useState } from "react";
import { ArrowRight, ArrowDown } from "lucide-react";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import {
  PublicLayout,
  PublicLink,
  PublicPhoto,
  PublicTitle,
  PublicEntrance,
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
    <section className="public-week" aria-labelledby="example-heading">
      <div className="public-week-caption">
        <h2 id="example-heading">
          Every run
          <br />
          has its place.
        </h2>
        <p className="public-week-description">
          A clear weekly plan, with the effort, duration and purpose of each
          session.
        </p>
        <p>
          Example plan <span aria-hidden="true">·</span> Choose a day
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
      <main id="main-content" tabIndex={-1}>
        <section
          className="public-hero"
          aria-label="Personalized weekly running plans"
        >
          <PublicPhoto
            variant="training"
            priority
            transition
            className="public-hero-photo"
          />
          <div className="public-hero-copy">
            <PublicTitle
              lines={["A week", "worth running."]}
              className="public-hero-title"
            />
            <PublicEntrance>
              <p>
                Personalized running plans, built around your training, your
                goals and the days you have.
              </p>
              <PublicLink to="/login" className="public-action">
                Build my week <ArrowRight aria-hidden="true" />
              </PublicLink>
              <p className="public-hero-source">
                Connect Strava or Intervals.icu. <br />
                One training source, chosen by you.
              </p>
            </PublicEntrance>
          </div>
          <a href="#example-week" className="public-hero-explore">
            Explore a week <ArrowDown aria-hidden="true" />
          </a>
        </section>

        <section
          id="example-week"
          className="public-plan-section public-width"
          aria-label="Explore a weekly running plan"
        >
          <div className="public-plan-layout">
            <ExampleWeek />
            <PublicPhoto variant="runner" className="public-plan-photo" />
          </div>
        </section>

        <section
          id="how-it-works"
          className="public-story public-width"
          aria-labelledby="story-heading"
        >
          <PublicPhoto variant="stride" className="public-story-photo" />
          <div className="public-story-copy">
            <h2 id="story-heading">
              Your training.
              <br />
              Your terms.
            </h2>
            <div className="public-story-entry">
              <h3>Start with the running you do.</h3>
              <p>
                Connect Strava or Intervals.icu. Your recent training helps
                shape your plan, with one active source at a time.
              </p>
              <p className="public-provider-names">
                Strava <span aria-hidden="true">/</span> Intervals.icu
              </p>
              <p className="public-story-small">
                Recovery data depends on your source. Generated running workouts
                can also be published to Intervals.icu.
              </p>
            </div>
            <div className="public-story-entry">
              <h3>A goal. A rhythm. Your week.</h3>
              <p>
                Prepare for a race or focus on improving your running. Choose at
                least four running days and your preferred long-run day.
              </p>
            </div>
            <div className="public-story-entry">
              <h3>A plan you can put into practice.</h3>
              <p>
                After setup, open your personalized weekly plan. See the week’s
                focus, explore each session’s effort, duration and notes, and
                mark sessions complete as you go.
              </p>
            </div>
          </div>
        </section>

        <section className="public-close" aria-labelledby="close-heading">
          <div className="public-width public-close-inner">
            <h2 id="close-heading">Make the week yours.</h2>
            <PublicLink
              to="/login"
              className="public-action public-action-inverse"
            >
              Build my week <ArrowRight aria-hidden="true" />
            </PublicLink>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
