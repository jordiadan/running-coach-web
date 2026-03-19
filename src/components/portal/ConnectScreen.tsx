import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const sources = [
  { id: "strava", name: "Strava", description: "Import runs, pace, and distance data", connected: false },
  { id: "garmin", name: "Garmin Connect", description: "Sync heart rate and training load", connected: false },
  { id: "intervals", name: "Intervals.icu", description: "Sync structured workouts, fitness and fatigue data", connected: false },
  { id: "apple", name: "Apple Health", description: "Pull activity and workout data", connected: false },
  { id: "manual", name: "Manual Input", description: "Enter your recent training history by hand", connected: true },
];

export default function ConnectScreen() {
  const [connections, setConnections] = useState(sources);

  const toggle = (id: string) => {
    setConnections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, connected: !s.connected } : s))
    );
  };

  return (
    <div className="max-w-2xl">
      <h2 className="font-serif text-2xl mb-2">Connect your data</h2>
      <p className="text-muted-foreground text-sm mb-8">
        Link your training sources so we can build a plan around your real activity.
      </p>

      <div className="space-y-3">
        {connections.map((source) => (
          <div
            key={source.id}
            className="flex items-center justify-between p-5 rounded-xl border border-divider bg-card"
          >
            <div>
              <p className="font-medium text-foreground">{source.name}</p>
              <p className="text-sm text-muted-foreground">{source.description}</p>
            </div>
            <Button
              variant={source.connected ? "secondary" : "outline"}
              size="sm"
              onClick={() => toggle(source.id)}
              className="min-w-[110px]"
            >
              {source.connected ? (
                <><Check className="w-3.5 h-3.5 mr-1" /> Connected</>
              ) : (
                <><Plus className="w-3.5 h-3.5 mr-1" /> Connect</>
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
