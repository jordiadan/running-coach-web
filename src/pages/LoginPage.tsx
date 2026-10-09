import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Brand from "@/components/Brand";
import heroImage from "@/assets/hero-running.jpg";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    supabase.auth.getSession().then(({ data, error }) => {
      if (ignore) return;

      if (error) {
        setErrorMessage("We couldn't check your current session.");
        return;
      }

      if (data.session) {
        navigate("/portal", { replace: true });
      }
    });

    return () => {
      ignore = true;
    };
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/portal`,
      },
    });

    if (error) {
      setErrorMessage("Google sign-in could not be started.");
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="brand-field relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <img
          src={heroImage}
          alt="Runner on a mountain trail"
          className="h-[55vh] min-h-80 w-full object-cover"
        />
        <div className="p-12 xl:p-16">
          <h2 className="font-display text-6xl leading-none">
            Your next run
            <br />
            starts here.
          </h2>
          <p className="mt-6 max-w-sm text-base leading-7">
            A week of purposeful training, built around the runner you are and
            the goals ahead.
          </p>
        </div>
      </aside>
      <main className="flex min-h-screen flex-col px-6 py-8 sm:px-12">
        <Brand />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-16">
          <h1 className="page-title">
            Welcome to your
            <br />
            running week.
          </h1>
          <p className="mb-8 mt-5 text-sm leading-7 text-muted-foreground">
            Sign in or create your account with Google. Your weekly running plan
            starts here.
          </p>
          <Button
            size="lg"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {isLoading ? "Opening Google…" : "Continue with Google"}
          </Button>
          {errorMessage && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {errorMessage} Please try again.
            </p>
          )}
          <div className="mt-8 border-t border-border pt-6">
            <p className="text-xs font-semibold">New to Running Coach?</p>
            <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-muted-foreground">
              <Check className="mt-1 h-4 w-4 shrink-0 text-accent" />
              After signing in, connect your training source and set your
              running goals.
            </p>
          </div>
          <Link
            to="/"
            className="mt-8 flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Running Coach
          </Link>
        </div>
        <Link
          to="/privacy"
          className="mx-auto flex min-h-11 items-center text-xs text-muted-foreground hover:underline"
        >
          Privacy policy
        </Link>
      </main>
    </div>
  );
}
