import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProfileScreen from "@/components/portal/ProfileScreen";
import {
  getAthleteProfile,
  updateAthleteProfile,
  type AthleteProfile,
} from "@/lib/portal-api";

vi.mock("@/lib/portal-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/portal-api")>("@/lib/portal-api");

  return {
    ...actual,
    getAthleteProfile: vi.fn(),
    updateAthleteProfile: vi.fn(),
  };
});

const getAthleteProfileMock = vi.mocked(getAthleteProfile);
const updateAthleteProfileMock = vi.mocked(updateAthleteProfile);

const athleteProfile: AthleteProfile = {
  athleteId: "athlete-1",
  displayName: "Jordi",
  trainingGoal: "complete_goal_race",
  runningDays: ["TUE", "THU", "SAT", "SUN"],
  longRunPreferredDay: "SUN",
  goalRaceEventName: "Mediterrani Half",
  goalRaceEventDate: "2026-04-26",
  goalRaceEventDistanceKm: 21.1,
};

function renderWithQueryClient(ui: React.ReactElement, queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})) {
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>,
    ),
  };
}

describe("ProfileScreen race goal focus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAthleteProfileMock.mockResolvedValue(athleteProfile);
    updateAthleteProfileMock.mockResolvedValue({});
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("scrolls, focuses, and highlights the goal race section when requested", async () => {
    const onFocusTargetHandled = vi.fn();

    renderWithQueryClient(
      <ProfileScreen
        athleteId="athlete-1"
        focusTarget="race-goal"
        onFocusTargetHandled={onFocusTargetHandled}
      />,
    );

    const raceNameInput = await screen.findByDisplayValue("Mediterrani Half");

    await waitFor(() => {
      expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "center",
      });
      expect(raceNameInput).toHaveFocus();
    });

    expect(screen.getByText("Goal race / event").closest("#goal-race-section")).toHaveClass("ring-primary/60");

    await waitFor(() => {
      expect(onFocusTargetHandled).toHaveBeenCalledTimes(1);
    }, { timeout: 2500 });
  });

  it("waits for profile data before focusing the goal race section", async () => {
    let resolveProfile: (profile: AthleteProfile) => void = () => {};
    getAthleteProfileMock.mockReturnValue(
      new Promise<AthleteProfile>((resolve) => {
        resolveProfile = resolve;
      }),
    );
    const onFocusTargetHandled = vi.fn();

    renderWithQueryClient(
      <ProfileScreen
        athleteId="athlete-1"
        focusTarget="race-goal"
        onFocusTargetHandled={onFocusTargetHandled}
      />,
    );

    expect(await screen.findByText("Loading your profile…")).toBeInTheDocument();
    expect(HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled();
    expect(onFocusTargetHandled).not.toHaveBeenCalled();

    await act(async () => {
      resolveProfile(athleteProfile);
    });

    const raceNameInput = await screen.findByDisplayValue("Mediterrani Half");

    await waitFor(() => {
      expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "center",
      });
      expect(raceNameInput).toHaveFocus();
    });

    expect(screen.getByText("Goal race / event").closest("#goal-race-section")).toHaveClass("ring-primary/60");

    await waitFor(() => {
      expect(onFocusTargetHandled).toHaveBeenCalledTimes(1);
    }, { timeout: 2500 });
  });

  it("invalidates bootstrap, athlete, and weekly coach screen queries after saving", async () => {
    const { queryClient } = renderWithQueryClient(<ProfileScreen athleteId="athlete-1" />);
    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

    await screen.findByDisplayValue("Mediterrani Half");
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(updateAthleteProfileMock).toHaveBeenCalledWith("athlete-1", expect.objectContaining({
        goalRaceEventName: "Mediterrani Half",
      }));
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ["portal", "bootstrap"] });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ["portal", "athlete", "athlete-1"] });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ["portal", "weekly-coach-screen"] });
    });
  });
});
