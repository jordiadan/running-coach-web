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
  trainingGoal: "prepare_for_race",
  runningDays: ["TUE", "THU", "SAT", "SUN"],
  longRunPreferredDay: "SUN",
  goalRaceEventName: "Mediterrani Half",
  goalRaceEventDate: "2027-04-26",
  goalRaceEventDistanceKm: 21.1,
  raceTargetType: "FINISH_ONLY",
  targetTimeSeconds: "",
  targetPaceSecondsPerKm: "",
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

  it("keeps calculated zones outside profile updates", async () => {
    getAthleteProfileMock.mockResolvedValue({
      ...athleteProfile,
      heartRateZones: { status: "PENDING_CALCULATION" },
    });
    renderWithQueryClient(<ProfileScreen athleteId="athlete-1" />);
    expect(await screen.findByText("Calculation pending")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("Display name")).toHaveValue("Jordi"));

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(updateAthleteProfileMock).toHaveBeenCalledTimes(1));
    expect(updateAthleteProfileMock.mock.calls[0][1]).not.toHaveProperty("heartRateZones");
  });

  it("keeps onboarding focused on completing the profile", async () => {
    renderWithQueryClient(<ProfileScreen athleteId="athlete-1" variant="onboarding" />);
    await screen.findByDisplayValue("Jordi");
    expect(screen.queryByRole("heading", { name: "Running heart-rate zones" })).not.toBeInTheDocument();
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
    let resolveProfile: (profile: AthleteProfile) => void = () => { };
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

  it("shows race details only when preparing for a race", async () => {
    getAthleteProfileMock.mockResolvedValueOnce({
      ...athleteProfile,
      trainingGoal: "improve_running",
      goalRaceEventName: "",
      goalRaceEventDate: "",
      goalRaceEventDistanceKm: "",
    });

    renderWithQueryClient(<ProfileScreen athleteId="athlete-1" />);

    expect(await screen.findByDisplayValue("Jordi")).toBeInTheDocument();
    expect(screen.queryByText("Goal race / event")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save changes/i })).toBeEnabled();
  });

  it("keeps target time and equivalent pace in sync with distance", async () => {
    renderWithQueryClient(<ProfileScreen athleteId="athlete-1" />);

    await screen.findByDisplayValue("Mediterrani Half");
    fireEvent.click(screen.getByRole("radio", { name: "Target time" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Target time" }), {
      target: { value: "1:45:30" },
    });

    expect(screen.getByLabelText("Equivalent pace / km")).toHaveValue("5:00");

    fireEvent.change(screen.getByLabelText("Race distance in kilometres"), {
      target: { value: "10" },
    });

    expect(screen.getByLabelText("Equivalent pace / km")).toHaveValue("10:33");
  });

  it("keeps target pace and equivalent time in sync with distance", async () => {
    renderWithQueryClient(<ProfileScreen athleteId="athlete-1" />);

    await screen.findByDisplayValue("Mediterrani Half");
    fireEvent.click(screen.getByRole("radio", { name: "Target pace" }));
    fireEvent.change(screen.getByLabelText("Target pace / km"), { target: { value: "5:00" } });

    expect(screen.getByLabelText("Equivalent time")).toHaveValue("1:45:30");
  });

  it("exposes the four-day minimum and keeps the long run on a running day", async () => {
    renderWithQueryClient(<ProfileScreen athleteId="athlete-1" />);
    const tuesday = await screen.findByRole("button", { name: "Tuesday" });
    await waitFor(() => expect(tuesday).toHaveAttribute("aria-pressed", "true"));
    expect(tuesday).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(tuesday);
    expect(tuesday).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Monday" }));
    expect(tuesday).toHaveAttribute("aria-disabled", "false");
    fireEvent.click(screen.getByRole("button", { name: "Sunday" }));
    expect(screen.getByLabelText("Preferred long run day")).toHaveValue("MON");
    expect(screen.queryByRole("option", { name: "Sunday" })).not.toBeInTheDocument();
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
  });

  it("preserves an edited draft when calculated zones refresh", async () => {
    const { queryClient } = renderWithQueryClient(<ProfileScreen athleteId="athlete-1" />);
    await screen.findByDisplayValue("Jordi");
    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Draft athlete" } });
    getAthleteProfileMock.mockResolvedValue({ ...athleteProfile, heartRateZones: { status: "PENDING_CALCULATION" } });
    await act(async () => { await queryClient.invalidateQueries({ queryKey: ["portal", "athlete", "athlete-1"] }); });
    expect(screen.getByLabelText("Display name")).toHaveValue("Draft athlete");
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
  });

  it.each([
    { type: "TIME", time: 6300, pace: "", label: "Target time", changed: "1:45:01", original: "1:45:00" },
    { type: "PACE", time: "", pace: 300, label: "Target pace / km", changed: "5:01", original: "5:00" },
  ] as const)("ignores the derived equivalent when reverting a $type target and saving", async ({ type, time, pace, label, changed, original }) => {
    getAthleteProfileMock.mockResolvedValue({
      ...athleteProfile,
      raceTargetType: type,
      targetTimeSeconds: time,
      targetPaceSecondsPerKm: pace,
    });
    const onDirtyChange = vi.fn();
    const onDraftChange = vi.fn();
    renderWithQueryClient(<ProfileScreen athleteId="athlete-1" onDirtyChange={onDirtyChange} onDraftChange={onDraftChange} />);
    const target = await screen.findByRole("textbox", { name: label });
    await waitFor(() => expect(target).toHaveValue(original));
    fireEvent.change(target, { target: { value: changed } });
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    fireEvent.change(target, { target: { value: original } });
    expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    expect(onDraftChange).toHaveBeenLastCalledWith(null);

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Profile saved.")).toBeInTheDocument();
    expect(getAthleteProfileMock).toHaveBeenCalledTimes(2);
    expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();
  });

  it("acknowledges a successful save even when the profile refetch returns the previous snapshot", async () => {
    const onDraftChange = vi.fn();
    renderWithQueryClient(<ProfileScreen athleteId="athlete-1" onDraftChange={onDraftChange} />);
    await screen.findByDisplayValue("Jordi");
    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Saved athlete" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Profile saved.")).toBeInTheDocument();
    expect(screen.getByLabelText("Display name")).toHaveValue("Saved athlete");
    expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();
    expect(onDraftChange).toHaveBeenLastCalledWith(null);
  });

  it("retains the dirty draft after a failed save", async () => {
    updateAthleteProfileMock.mockRejectedValueOnce(new Error("Unavailable"));
    const onDraftChange = vi.fn();
    renderWithQueryClient(<ProfileScreen athleteId="athlete-1" onDraftChange={onDraftChange} />);
    await screen.findByDisplayValue("Jordi");
    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Unsaved athlete" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't save your profile.");
    expect(screen.getByLabelText("Display name")).toHaveValue("Unsaved athlete");
    expect(onDraftChange).toHaveBeenLastCalledWith(expect.objectContaining({ form: expect.objectContaining({ displayName: "Unsaved athlete" }) }));
  });

});
