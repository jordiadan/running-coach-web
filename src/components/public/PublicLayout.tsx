import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { MotionConfig, motion, useReducedMotion } from "framer-motion";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import runningSmall from "@/assets/public/running-480.webp";
import runningLarge from "@/assets/public/running-960.webp";
import "./public.css";
export function PublicBrand() {
  return (
    <Link to="/" className="public-brand" aria-label="Running Coach home">
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path
          d="M7 25V14a7 7 0 0 1 14 0v11M12 25V14a2 2 0 0 1 4 0v11M26 25V14A12 12 0 0 0 14 2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span>Running Coach</span>
    </Link>
  );
}
export function PublicLayout({
  children,
  login = false,
}: {
  children: ReactNode;
  login?: boolean;
}) {
  useEffect(() => {
    document.title = login
      ? "Sign in · Running Coach"
      : "Running Coach · Your week. Your running.";
  }, [login]);
  return (
    <MotionConfig reducedMotion="user">
      <div className={`public-app${login ? " public-login" : ""}`}>
        <a className="public-skip" href="#main-content">
          Skip to content
        </a>
        <header className="public-header public-width">
          <PublicBrand />
          <nav aria-label="Main navigation">
            {!login && (
              <a className="public-nav-story" href="#how-it-works">
                How it works
              </a>
            )}
            <ThemeSwitcher />
            {login ? (
              <Link
                to="/"
                className="public-text-link"
                aria-label="Back to home"
              >
                <ArrowLeft aria-hidden="true" /> <span>Back to home</span>
              </Link>
            ) : (
              <Link to="/login" className="public-text-link">
                Log in <ArrowUpRight aria-hidden="true" />
              </Link>
            )}
          </nav>
        </header>
        {children}
        <footer className="public-footer public-width">
          <span>
            Running Coach{" "}
            <span className="public-copyright">
              © {new Date().getFullYear()}
            </span>
          </span>
          <Link to="/privacy">Privacy</Link>
        </footer>
      </div>
    </MotionConfig>
  );
}
export function RunningImage({
  className = "",
  priority = false,
  sizes = "(max-width: 640px) 160px, 400px",
}: {
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <span className={`public-running-image ${className}`}>
      <motion.img
        src={runningLarge}
        srcSet={`${runningSmall} 480w, ${runningLarge} 960w`}
        sizes={sizes}
        width="960"
        height="540"
        alt="A runner following a winding mountain trail"
        loading={priority ? "eager" : "lazy"}
        initial={reducedMotion ? false : { scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
    </span>
  );
}
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : { y: 16 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
