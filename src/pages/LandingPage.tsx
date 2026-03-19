import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Zap, Calendar, Brain, Timer, TrendingUp, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useRef } from "react";
import heroImage from "@/assets/hero-running.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
};

const features = [
  {
    icon: Brain,
    title: "Context-aware",
    description: "Share your goals, fitness level, and schedule. The plan adapts to you — not the other way around.",
  },
  {
    icon: Calendar,
    title: "Weekly clarity",
    description: "Every run mapped out with pace, distance, and purpose. No guesswork, just structure.",
  },
  {
    icon: Zap,
    title: "Lightweight",
    description: "No bloat. No social feed. No noise. Just your plan, ready when you lace up.",
  },
];

const stats = [
  { value: "30km", label: "avg weekly plan", icon: TrendingUp },
  { value: "4:52", label: "avg pace /km", icon: Timer },
  { value: "142", label: "avg heart rate", icon: Heart },
];

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <Link to="/" className="font-serif text-xl tracking-tight text-foreground">
            Running Coach
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
            <ThemeSwitcher />
            <Link to="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero with image */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background image with parallax */}
        <motion.div
          style={{ y: heroY }}
          className="absolute inset-0 -top-20"
        >
          <img
            src={heroImage}
            alt="Runner on mountain trail at golden hour"
            className="w-full h-[120%] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/40 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/60" />
        </motion.div>

        {/* Hero content */}
        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 max-w-4xl mx-auto text-center px-6 pt-16">
          <motion.div
            initial="hidden"
            animate="visible"
            custom={0}
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 text-primary text-sm font-medium mb-8 backdrop-blur-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Your personal running plan
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeUp}
            className="text-5xl sm:text-7xl lg:text-8xl font-serif leading-[1.05] tracking-tight text-foreground mb-8"
          >
            Run with
            <br />
            <span className="text-primary">purpose</span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={2}
            variants={fadeUp}
            className="text-lg sm:text-xl text-foreground/70 max-w-xl mx-auto mb-12 leading-relaxed"
          >
            Connect your training context. Get a clear weekly plan built around your goals, your body, and your life.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            custom={3}
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/login">
              <Button variant="hero" size="lg" className="min-w-[200px] h-13 text-base">
                Start training <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="hero-outline" size="lg" className="min-w-[200px] h-13 text-base">
                See how it works
              </Button>
            </a>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="w-5 h-8 rounded-full border-2 border-foreground/30 flex items-start justify-center p-1"
          >
            <div className="w-1 h-2 rounded-full bg-foreground/40" />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats bar */}
      <section className="relative z-10 -mt-1 bg-background">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-3 gap-8"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                custom={i}
                variants={fadeUp}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary mb-3">
                  <stat.icon className="w-4 h-4" />
                </div>
                <p className="text-3xl sm:text-4xl font-serif text-foreground mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="py-24 px-6 bg-card">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.p custom={0} variants={fadeUp} className="text-sm uppercase tracking-[0.2em] text-primary mb-4">
              How it works
            </motion.p>
            <motion.h2 custom={1} variants={fadeUp} className="text-4xl sm:text-5xl font-serif mb-4">
              Three steps. Zero friction.
            </motion.h2>
            <motion.p custom={2} variants={fadeUp} className="text-muted-foreground max-w-md mx-auto text-lg">
              From setup to your first run in under two minutes.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i + 3}
                variants={fadeUp}
                className="group relative bg-background rounded-2xl p-8 border border-divider hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="font-serif text-2xl mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Plan preview */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <motion.h2 custom={0} variants={fadeUp} className="text-4xl sm:text-5xl font-serif mb-4">
              Your week, structured
            </motion.h2>
            <motion.p custom={1} variants={fadeUp} className="text-muted-foreground text-lg">
              Here's what a typical training week looks like.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={2}
            variants={fadeUp}
            className="bg-card rounded-2xl border border-divider overflow-hidden"
          >
            {[
              { day: "Mon", type: "Easy Run", dist: "5 km", pace: "6:00", color: "bg-primary/10 text-primary" },
              { day: "Tue", type: "Rest", dist: "—", pace: "—", color: "bg-muted text-muted-foreground" },
              { day: "Wed", type: "Tempo", dist: "7 km", pace: "5:15", color: "bg-accent/15 text-accent" },
              { day: "Thu", type: "Easy Run", dist: "5 km", pace: "6:10", color: "bg-primary/10 text-primary" },
              { day: "Fri", type: "Rest", dist: "—", pace: "—", color: "bg-muted text-muted-foreground" },
              { day: "Sat", type: "Long Run", dist: "13 km", pace: "6:20", color: "bg-primary/15 text-primary" },
              { day: "Sun", type: "Recovery", dist: "3 km", pace: "6:45", color: "bg-secondary text-muted-foreground" },
            ].map((row, i) => (
              <div
                key={row.day}
                className={`flex items-center px-6 py-4 ${i < 6 ? "border-b border-divider" : ""} ${row.type === "Rest" ? "opacity-50" : ""}`}
              >
                <span className="w-12 text-sm font-medium text-foreground">{row.day}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${row.color} mr-4`}>{row.type}</span>
                <span className="text-sm text-muted-foreground ml-auto tabular-nums">
                  {row.dist !== "—" ? `${row.dist} · ${row.pace} /km` : ""}
                </span>
              </div>
            ))}
          </motion.div>

          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={3}
            variants={fadeUp}
            className="text-center text-sm text-muted-foreground mt-6"
          >
            33 km total · Adapted to your half-marathon goal
          </motion.p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          variants={fadeUp}
          className="max-w-3xl mx-auto relative overflow-hidden rounded-3xl bg-primary p-14 sm:p-20 text-center"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-foreground/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-5xl font-serif mb-5 text-primary-foreground">
              Ready to run smarter?
            </h2>
            <p className="text-primary-foreground/70 mb-10 max-w-md mx-auto text-lg">
              Set up in two minutes. Your first plan is waiting.
            </p>
            <Link to="/login">
              <Button
                variant="hero-outline"
                size="lg"
                className="min-w-[220px] h-13 text-base border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                Create your plan <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-divider py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-serif text-lg text-foreground">Running Coach</span>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
