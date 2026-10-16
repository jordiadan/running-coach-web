import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, LoaderCircle } from "lucide-react";
import {
  PublicLayout,
  PublicPhoto,
  PublicEntrance,
} from "@/components/public/PublicLayout";
import { supabase } from "@/integrations/supabase/client";
function GoogleMark() {
  return (
    <svg className="public-google-mark" viewBox="0 0 24 24" aria-hidden="true">
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
  );
}
export default function LoginPage() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestPending = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    heading.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    let ignore = false;
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (ignore) return;
        if (error) {
          setErrorMessage(
            "We couldn’t check your session. You can try signing in below.",
          );
        } else if (data.session) {
          navigate("/portal", { replace: true });
          return;
        }
      } catch {
        if (ignore) return;
        setErrorMessage(
          "We couldn’t check your session. Check your connection and try signing in below.",
        );
      }
      if (!ignore) setIsChecking(false);
    };
    void checkSession();
    return () => {
      ignore = true;
      mounted.current = false;
    };
  }, [navigate]);
  const handleGoogleSignIn = async () => {
    if (requestPending.current || isChecking) return;
    requestPending.current = true;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/portal` },
      });
      if (error) throw error;
    } catch {
      requestPending.current = false;
      if (!mounted.current) return;
      setErrorMessage(
        "Google sign-in couldn’t open. Check your connection and try again.",
      );
      setIsLoading(false);
    }
  };
  return (
    <PublicLayout login>
      <main
        id="main-content"
        tabIndex={-1}
        className="public-login-main public-width"
      >
        <PublicPhoto
          variant="stride"
          priority
          transition
          className="public-login-photo"
        />
        <PublicEntrance className="public-login-form" delay={0.16}>
          <h1 ref={heading} tabIndex={-1}>
            Your next run
            <br />
            starts here.
          </h1>
          <p>
            Sign in to build your weekly running plan or pick up where you left
            off.
          </p>
          <button
            type="button"
            className="public-action public-google-action"
            onClick={() => void handleGoogleSignIn()}
            disabled={isLoading || isChecking}
            aria-describedby="login-status login-error"
          >
            <GoogleMark />
            <span>
              {isChecking
                ? "Checking your session…"
                : isLoading
                  ? "Opening Google…"
                  : "Continue with Google"}
            </span>
            {isLoading || isChecking ? (
              <LoaderCircle className="public-spinner" aria-hidden="true" />
            ) : (
              <ArrowUpRight aria-hidden="true" />
            )}
          </button>
          <div className="public-login-feedback">
            <p id="login-status" role="status">
              {isChecking
                ? "Checking for an existing session."
                : isLoading
                  ? "Taking you to Google to sign in securely…"
                  : ""}
            </p>
            <p id="login-error" role="alert">
              {errorMessage}
            </p>
          </div>
          <div className="public-login-next">
            <h2>New here?</h2>
            <p>
              After sign-in, connect Strava or Intervals.icu, choose your goal
              and running days, then open your first weekly plan.
            </p>
          </div>
          <ol className="public-login-path" aria-label="After sign-in">
            <li>Connect</li>
            <li>Your profile</li>
            <li>Your week</li>
          </ol>
          <p className="public-login-privacy">
            Your training connection comes next.
            <br />
            Read how your data is handled in our{" "}
            <Link to="/privacy">Privacy Policy</Link>.
          </p>
        </PublicEntrance>
      </main>
    </PublicLayout>
  );
}
