import { Link } from "react-router-dom";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-divider">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-16">
          <Link to="/" className="font-serif text-xl tracking-tight text-foreground">
            Running Coach
          </Link>
        </div>
      </nav>

      <article className="max-w-2xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-serif mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-12">Last updated: March 2026</p>

        <div className="space-y-10 text-foreground/85 leading-relaxed">
          <section>
            <h2 className="text-xl font-serif mb-3">What we collect</h2>
            <p>
              We collect the minimum information needed to generate your training plan: 
              your running goals, fitness level, available days, and any preferences you share. 
              If you create an account, we store your email address.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif mb-3">How we use it</h2>
            <p>
              Your data is used solely to generate and refine your weekly running plan. 
              We do not sell, share, or monetize your personal information in any way.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif mb-3">Data storage</h2>
            <p>
              Your information is stored securely and encrypted at rest. 
              You can request deletion of all your data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif mb-3">Cookies</h2>
            <p>
              We use only essential cookies required for authentication and session management. 
              No tracking or advertising cookies are used.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif mb-3">Contact</h2>
            <p>
              Questions about your privacy? Reach out at{" "}
              <span className="text-primary">privacy@runningcoach.app</span>
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
