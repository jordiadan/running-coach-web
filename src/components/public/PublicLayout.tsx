import { useEffect, useRef, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { Link, useNavigate, type LinkProps } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  MotionConfig,
  motion,
  useAnimationControls,
  useInView,
  useReducedMotion,
} from "framer-motion";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import training from "@/assets/public/training-1800.webp";
import trainingSmall from "@/assets/public/training-900.webp";
import stride from "@/assets/public/stride-1000.webp";
import runner from "@/assets/public/runner-900.webp";
import "./public.css";

export function PublicLink({
  children,
  ...props
}: Pick<LinkProps, "to" | "className" | "children" | "aria-label">) {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  return (
    <Link
      {...props}
      onClick={(event) => {
        // Preserve native link behavior for new tabs, modified clicks and older browsers.
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          reducedMotion ||
          !document.startViewTransition
        )
          return;
        event.preventDefault();
        const transition = document.startViewTransition(async () => {
          flushSync(() => navigate(props.to));
          window.scrollTo(0, 0);
          const photo = document.querySelector<HTMLImageElement>(
            ".public-transition-photo img",
          );
          if (photo) await photo.decode().catch(() => {});
        });
        void transition.finished.catch(() => {});
      }}
    >
      {children}
    </Link>
  );
}

function PublicBrand() {
  return (
    <PublicLink to="/" className="public-brand" aria-label="Running Coach home">
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path
          d="M7 25V14a7 7 0 0 1 14 0v11M12 25V14a2 2 0 0 1 4 0v11M26 25V14A12 12 0 0 0 14 2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span>Running Coach</span>
    </PublicLink>
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
      : "Running Coach · A week worth running.";
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
              <PublicLink
                to="/"
                className="public-text-link"
                aria-label="Back to home"
              >
                <ArrowLeft aria-hidden="true" />
                <span>Back to home</span>
              </PublicLink>
            ) : (
              <PublicLink to="/login" className="public-text-link">
                Log in <ArrowRight aria-hidden="true" />
              </PublicLink>
            )}
          </nav>
        </header>
        {children}
        <footer className="public-footer public-width">
          <PublicBrand />
          <p className="public-photo-credits">
            Photography:{" "}
            <a href="https://unsplash.com/photos/oGv9xIl7DkY">Fitsum Admasu</a>,{" "}
            <a href="https://unsplash.com/photos/XCkRGOX2VgM">Filip Mroz</a>{" "}
            &amp;{" "}
            <a href="https://unsplash.com/photos/j5kEQ1JLqZk">Jakob Owens</a> /
            Unsplash
          </p>
          <Link to="/privacy">Privacy</Link>
        </footer>
      </div>
    </MotionConfig>
  );
}

const photos = {
  training: {
    src: training,
    srcSet: `${trainingSmall} 900w, ${training} 1800w`,
    width: 1800,
    height: 1200,
    alt: "Three runners training together on a road in the low morning sun",
  },
  stride: {
    src: stride,
    srcSet: undefined,
    width: 1000,
    height: 1500,
    alt: "A runner’s stride across the marked lanes of a running track",
  },
  runner: {
    src: runner,
    srcSet: undefined,
    width: 900,
    height: 1260,
    alt: "A woman running beside the water, her stride caught in motion",
  },
};

export function PublicPhoto({
  variant,
  className = "",
  priority = false,
  transition = false,
}: {
  variant: keyof typeof photos;
  className?: string;
  priority?: boolean;
  transition?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.18 });
  const controls = useAnimationControls();
  const reducedMotion = useReducedMotion();
  const photo = photos[variant];
  useEffect(() => {
    if (inView && !reducedMotion)
      void controls.start({
        clipPath: ["inset(0 0 0 12%)", "inset(0 0 0 0%)"],
        transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
      });
    return () => controls.stop();
  }, [inView, controls, reducedMotion]);
  return (
    <figure
      ref={ref}
      className={`public-photo public-photo-${variant} ${className}${transition ? " public-transition-photo" : ""}`}
    >
      <motion.img
        src={photo.src}
        srcSet={photo.srcSet}
        sizes={
          variant === "training"
            ? "(max-width: 640px) calc(100vw - 40px), 100vw"
            : "(max-width: 640px) calc(100vw - 40px), 45vw"
        }
        width={photo.width}
        height={photo.height}
        alt={photo.alt}
        loading={priority ? "eager" : "lazy"}
        initial={false}
        animate={controls}
      />
    </figure>
  );
}

export function PublicTitle({
  lines,
  className = "",
}: {
  lines: [string, string];
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <h1 className={className} aria-label={lines.join(" ")}>
      {lines.map((line, index) => (
        <span className="public-title-mask" key={line}>
          <motion.span
            initial={reducedMotion ? false : { y: "105%" }}
            animate={{ y: 0 }}
            transition={{
              duration: 0.75,
              delay: 0.12 + index * 0.09,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}

export function PublicEntrance({
  children,
  className = "",
  delay = 0.3,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : { opacity: 0.4 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, delay }}
    >
      {children}
    </motion.div>
  );
}
