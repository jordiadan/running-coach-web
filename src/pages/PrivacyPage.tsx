import { Link } from "react-router-dom";
import Brand from "@/components/Brand";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <nav
          aria-label="Main navigation"
          className="public-shell flex min-h-20 items-center justify-between gap-4"
        >
          <Brand />
          <Link to="/login" className="text-sm font-medium hover:underline">
            Log in
          </Link>
        </nav>
      </header>
      <main className="public-shell grid gap-10 py-12 sm:py-20 md:grid-cols-[14rem_1fr]">
        <aside>
          <h1 className="page-title">Privacy Policy</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Last updated: March 2026
          </p>
          <nav
            aria-label="Privacy sections"
            className="mt-8 hidden space-y-3 text-sm md:grid"
          >
            {[
              "What we collect",
              "How we use it",
              "Data storage",
              "Cookies",
              "Contact",
            ].map((title, i) => (
              <a
                key={title}
                href={`#privacy-${i}`}
                className="py-1 text-muted-foreground hover:text-primary"
              >
                {title}
              </a>
            ))}
          </nav>
        </aside>
        <article className="max-w-2xl">
          <div className="space-y-10 text-foreground/85 leading-relaxed">
            <section
              id="privacy-0"
              className="scroll-mt-8 border-b border-border pb-8 last:border-0"
            >
              <h2 className="text-3xl font-display mb-3">What we collect</h2>
              <p>
                We collect the minimum information needed to generate your
                training plan: your running goals, fitness level, available
                days, and any preferences you share. If you create an account,
                we store your email address.
              </p>
            </section>

            <section
              id="privacy-1"
              className="scroll-mt-8 border-b border-border pb-8 last:border-0"
            >
              <h2 className="text-3xl font-display mb-3">How we use it</h2>
              <p>
                Your data is used solely to generate and refine your weekly
                running plan. We do not sell, share, or monetize your personal
                information in any way.
              </p>
            </section>

            <section
              id="privacy-2"
              className="scroll-mt-8 border-b border-border pb-8 last:border-0"
            >
              <h2 className="text-3xl font-display mb-3">Data storage</h2>
              <p>
                Your information is stored securely and encrypted at rest. You
                can request deletion of all your data at any time by contacting
                us.
              </p>
            </section>

            <section
              id="privacy-3"
              className="scroll-mt-8 border-b border-border pb-8 last:border-0"
            >
              <h2 className="text-3xl font-display mb-3">Cookies</h2>
              <p>
                We use only essential cookies required for authentication and
                session management. No tracking or advertising cookies are used.
              </p>
            </section>

            <section
              id="privacy-4"
              className="scroll-mt-8 border-b border-border pb-8 last:border-0"
            >
              <h2 className="text-3xl font-display mb-3">Contact</h2>
              <p>
                Questions about your privacy? Reach out at{" "}
                <span className="text-primary">privacy@runningcoach.app</span>
              </p>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}
