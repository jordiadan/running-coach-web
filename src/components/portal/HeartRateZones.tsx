import { motion, useReducedMotion } from "framer-motion";
import type {
  AthleteHeartRateZone,
  AthleteHeartRateZones,
} from "@/lib/portal-api";

function rangeLabel(zone: AthleteHeartRateZone) {
  if (zone.minBpmInclusive === null) return `≤ ${zone.maxBpmInclusive}`;
  if (zone.maxBpmInclusive === null) return `≥ ${zone.minBpmInclusive}`;
  return `${zone.minBpmInclusive}–${zone.maxBpmInclusive}`;
}

export default function HeartRateZones({
  zones,
}: {
  zones: AthleteHeartRateZones | undefined;
}) {
  const reduceMotion = useReducedMotion();
  const available = zones?.status === "AVAILABLE";
  const message =
    zones?.status === "CALIBRATION_REQUIRED"
      ? [
          "Threshold test needed",
          "Complete a running threshold test in your plan. Once a valid result is recorded, your personalized zones can be calculated.",
        ]
      : zones?.status === "PENDING_CALCULATION"
        ? [
            "Calculation pending",
            "Your running threshold is recorded. Your latest zones will appear once calculation finishes. Check back in a moment.",
          ]
        : [
            "Zones unavailable",
            "Your profile does not include heart-rate zones yet. Try reloading your profile later.",
          ];

  return (
    <section
      aria-labelledby="heart-rate-zones-heading"
      className="heart-rate-zones mt-10 border-t border-divider pt-8"
    >
      <h3
        id="heart-rate-zones-heading"
        className="font-sans text-xl font-medium tracking-tight text-foreground"
      >
        Running heart-rate zones
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-foreground/75">
        Your personal intensity ranges, calculated by Running Coach.
      </p>
      {available ? (
        <>
          <dl className="mt-6">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-sm leading-relaxed text-foreground/75">
                <span className="block font-medium text-foreground">LTHR</span>
                Lactate-threshold heart rate
              </dt>
              <dd className="shrink-0 text-3xl font-medium tracking-tight tabular-nums text-foreground">
                {zones.sourceThresholdBpm}{" "}
                <span className="text-sm font-normal tracking-normal text-foreground/75">
                  bpm
                </span>
              </dd>
            </div>
          </dl>
          <ol aria-label="Running heart-rate zones" className="mt-8 space-y-5">
            {zones.zones.map((zone, index) => (
              <li key={zone.number}>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-base font-medium text-foreground">
                    Z{zone.number}
                  </span>
                  <span className="text-lg font-medium tabular-nums text-foreground">
                    {rangeLabel(zone)}{" "}
                    <span className="text-sm font-normal text-foreground/75">
                      bpm
                    </span>
                  </span>
                </div>
                <motion.div
                  aria-hidden="true"
                  className="heart-rate-zone-band mt-2 h-1.5 rounded-sm"
                  style={{
                    backgroundColor: `hsl(var(--heart-rate-zone-${zone.number}))`,
                  }}
                  initial={
                    reduceMotion ? false : { clipPath: "inset(0 25% 0 0)" }
                  }
                  whileInView={
                    reduceMotion ? undefined : { clipPath: "inset(0 0% 0 0)" }
                  }
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.5,
                    delay: reduceMotion ? 0 : index * 0.03,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
              </li>
            ))}
          </ol>
          <dl className="mt-6 text-sm text-foreground/75">
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <dt>Measured</dt>
              <dd>
                <time dateTime={zones.sourceThresholdMeasuredAt}>
                  {new Intl.DateTimeFormat("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    timeZone: "UTC",
                  }).format(new Date(zones.sourceThresholdMeasuredAt))}
                </time>{" "}
                <span>(UTC)</span>
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-xs leading-relaxed text-foreground/75">
            Range limits are included. These are your Running Coach zones for
            running.
          </p>
        </>
      ) : (
        <div className="mt-5">
          <p className="text-sm font-medium text-foreground">{message[0]}</p>
          <p className="mt-1 text-sm leading-relaxed text-foreground/75">
            {message[1]}
          </p>
        </div>
      )}
    </section>
  );
}
