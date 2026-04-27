import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ConnectScreen from "@/components/portal/ConnectScreen";
import {
  connectTrainingProvider,
  disconnectTrainingProvider,
  getTrainingProviderIntegrationStatus,
  type TrainingProviderId,
} from "@/lib/portal-api";

vi.mock("@/lib/portal-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/portal-api")>("@/lib/portal-api");

  return {
    ...actual,
    connectTrainingProvider: vi.fn(),
    disconnectTrainingProvider: vi.fn(),
    getTrainingProviderIntegrationStatus: vi.fn(),
  };
});

const connectTrainingProviderMock = vi.mocked(connectTrainingProvider);
const disconnectTrainingProviderMock = vi.mocked(disconnectTrainingProvider);
const getTrainingProviderIntegrationStatusMock = vi.mocked(getTrainingProviderIntegrationStatus);

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>,
  );
}

describe("ConnectScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getTrainingProviderIntegrationStatusMock.mockImplementation((provider: TrainingProviderId) =>
      Promise.resolve({
        provider,
        status: provider === "strava" ? "connected" : "absent",
        connected: provider === "strava",
        providerAccountRef: provider === "strava" ? "strava-athlete-42" : undefined,
      }),
    );
    connectTrainingProviderMock.mockResolvedValue({ redirectUrl: undefined });
    disconnectTrainingProviderMock.mockResolvedValue(undefined);
  });

  it("requires explicit replacement when another training source is connected", async () => {
    renderWithQueryClient(
      <ConnectScreen
        athleteId="athlete-1"
        trainingProvider={{
          activeProvider: "strava",
          connected: true,
          activeProviderAccountRef: "strava-athlete-42",
          readinessCapability: "limited",
        }}
      />,
    );

    expect(screen.getByText("Only one activity source (Strava or Intervals.icu) can be active at a time.")).toBeInTheDocument();
    expect(await screen.findByText("Connected as strava-athlete-42.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /replace/i }));

    expect(screen.getByText("Replace active source?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /replace with intervals\.icu/i }));

    await waitFor(() => {
      expect(connectTrainingProviderMock).toHaveBeenCalledWith("intervals", "athlete-1", true);
    });
  });
});
