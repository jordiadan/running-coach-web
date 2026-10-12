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
      className="mt-10 border-t border-divider pt-8"
    >
      <h3
        id="heart-rate-zones-heading"
        className="font-serif text-xl text-foreground"
      >
        Running heart-rate zones
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-foreground/75">
        Your personal intensity ranges, calculated by Running Coach.
      </p>
      {available ? (
        <>
          <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-foreground/75">
                Lactate-threshold heart rate (LTHR)
              </dt>
              <dd className="mt-1 font-medium tabular-nums text-foreground">
                {zones.sourceThresholdBpm} bpm
              </dd>
            </div>
            <div>
              <dt className="text-foreground/75">Measured</dt>
              <dd className="mt-1 text-foreground">
                <time dateTime={zones.sourceThresholdMeasuredAt}>
                  {new Intl.DateTimeFormat("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    timeZone: "UTC",
                  }).format(new Date(zones.sourceThresholdMeasuredAt))}
                </time>
                <span className="ml-1 text-xs text-foreground/75">(UTC)</span>
              </dd>
            </div>
          </dl>
          <table
            aria-label="Running heart-rate zones"
            className="mt-6 w-full text-sm"
          >
            <thead>
              <tr className="border-b border-divider text-foreground/75">
                <th scope="col" className="pb-3 text-left font-normal">
                  Zone
                </th>
                <th scope="col" className="pb-3 text-right font-normal">
                  Heart rate · bpm
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {zones.zones.map((zone) => (
                <tr key={zone.number}>
                  <th
                    scope="row"
                    className="py-3 text-left font-medium text-foreground"
                  >
                    Z{zone.number}
                  </th>
                  <td className="py-3 text-right tabular-nums text-foreground">
                    {rangeLabel(zone)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs leading-relaxed text-foreground/75">
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
