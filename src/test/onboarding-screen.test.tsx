import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OnboardingScreen from "@/components/portal/OnboardingScreen";
import { retryCurrentUserWeeklyPlanGeneration, type PortalBootstrapResponse } from "@/lib/portal-api";

vi.mock("@/lib/portal-api", async () => ({
  ...await vi.importActual<typeof import("@/lib/portal-api")>("@/lib/portal-api"),
  retryCurrentUserWeeklyPlanGeneration: vi.fn(),
}));
// Exercise journey orchestration independently of the shared settings forms,
// whose validation, persistence and provider contracts have their own tests.
vi.mock("@/components/portal/ConnectScreen", () => ({ default: ({ onComplete }: { onComplete: () => void; }) => <button onClick={() => void onComplete()}>Provider connected</button> }));
vi.mock("@/components/portal/ProfileScreen", () => ({ default: ({ onComplete }: { onComplete: () => void; }) => <button onClick={() => void onComplete()}>Profile saved</button> }));

function bootstrap(nextStep: PortalBootstrapResponse["nextStep"] = "prepare_weekly_plan", status: PortalBootstrapResponse["weeklyPlan"]["status"] = "preparing"): PortalBootstrapResponse {
  return { athleteId: "athlete-1", user: { userId: "user-1", displayName: "Alex" }, profile: { isComplete: nextStep !== "complete_profile" }, trainingProvider: { connected: nextStep !== "connect_training_source", activeProvider: "intervals", readinessCapability: "full" }, weeklyPlan: { targetWeekStartDate: "2026-10-12", hasPlan: status === "ready", status }, nextStep };
}
function mount(initial = bootstrap(), onRefresh = vi.fn<() => Promise<PortalBootstrapResponse | undefined>>().mockResolvedValue(initial)) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const onEnterPortal = vi.fn();
  const tree = (data: PortalBootstrapResponse, refreshFailed?: boolean) => <QueryClientProvider client={queryClient}><OnboardingScreen bootstrap={data} onRefresh={onRefresh} onEnterPortal={onEnterPortal} refreshFailed={refreshFailed} /></QueryClientProvider>;
  const result = render(tree(initial));
  return { ...result, onRefresh, onEnterPortal, update: (data: PortalBootstrapResponse, refreshFailed = false) => result.rerender(tree(data, refreshFailed)) };
}

beforeEach(() => vi.clearAllMocks());
describe("onboarding journey", () => {
  it("keeps generation indeterminate and reports only supported setup facts", () => {
    mount();
    expect(screen.getByText("Intervals.icu")).toBeInTheDocument();
    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("Preparing your weekly plan…")).toHaveAttribute("role", "status");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByText(/Syncing your latest|Balancing fatigue|100%/)).not.toBeInTheDocument();
  });
  it("distinguishes missing from actively preparing without claiming a queue position", () => {
    mount(bootstrap("prepare_weekly_plan", "missing"));
    expect(screen.getByRole("status")).toHaveTextContent("Waiting for your first plan");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Waiting for your first week.");
    expect(screen.queryByText(/queuing|minutes|seconds/i)).not.toBeInTheDocument();
  });
  it.each(["connect_training_source", "complete_profile"] as const)("waits for backend progression after %s completion", async nextStep => {
    const data = bootstrap(nextStep, "missing");
    const { onRefresh, update } = mount(data);
    fireEvent.click(screen.getByRole("button", { name: nextStep === "complete_profile" ? "Profile saved" : "Provider connected" }));
    await waitFor(() => expect(onRefresh).toHaveBeenCalledOnce());
    expect(screen.queryByText("Preparing your weekly plan…")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(nextStep === "complete_profile" ? "Find your running rhythm." : "Every plan starts with you.");
    update(bootstrap());
    expect(screen.getByRole("heading", { level: 1 })).toBe(document.activeElement);
  });
  it("shows retry rejection inline and recovers on the next attempt", async () => {
    vi.mocked(retryCurrentUserWeeklyPlanGeneration).mockRejectedValueOnce(new Error("Offline")).mockResolvedValueOnce(undefined);
    const { onRefresh } = mount(bootstrap("prepare_weekly_plan", "failed"));
    fireEvent.click(screen.getByRole("button", { name: "Retry plan generation" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn’t restart your plan.");
    expect(onRefresh).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Retry plan generation" }));
    await waitFor(() => expect(onRefresh).toHaveBeenCalledOnce());
    expect(retryCurrentUserWeeklyPlanGeneration).toHaveBeenCalledTimes(2);
  });
  it("retains the task and offers recovery after a refresh rejection", async () => {
    const onRefresh = vi.fn<() => Promise<PortalBootstrapResponse | undefined>>().mockRejectedValueOnce(new Error("Offline")).mockResolvedValueOnce(bootstrap());
    mount(bootstrap(), onRefresh);
    fireEvent.click(screen.getByRole("button", { name: "Check status" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Your last loaded step is still here.");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Preparing your first week.");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });
  it("renders a failed background refresh without replacing an editable profile", () => {
    const data = bootstrap("complete_profile", "missing");
    const { update } = mount(data);
    update(data, true);
    expect(screen.getByRole("button", { name: "Profile saved" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("We couldn’t check your setup.");
  });
  it("clears a manual refresh failure after successful automatic polling, even with unchanged data", async () => {
    const data = bootstrap();
    const onRefresh = vi.fn<() => Promise<PortalBootstrapResponse | undefined>>().mockRejectedValue(new Error("Offline"));
    const { update } = mount(data, onRefresh);
    fireEvent.click(screen.getByRole("button", { name: "Check status" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    update(data, false);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("clears a failed retry when automatic polling reports a ready plan", async () => {
    vi.mocked(retryCurrentUserWeeklyPlanGeneration).mockRejectedValueOnce(new Error("Offline"));
    const { update } = mount(bootstrap("prepare_weekly_plan", "failed"));
    fireEvent.click(screen.getByRole("button", { name: "Retry plan generation" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn’t restart your plan.");
    update(bootstrap("view_weekly_plan", "ready"));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Open weekly plan" })).toBeInTheDocument();
    expect(screen.getByText("View your setup").closest("details")).not.toHaveAttribute("open");
  });
  it("announces completion, focuses the ready heading and enters only on request", () => {
    const { update, onEnterPortal } = mount();
    update(bootstrap("view_weekly_plan", "ready"));
    expect(screen.getByRole("heading", { level: 1 })).toBe(document.activeElement);
    expect(screen.getByRole("status")).toHaveTextContent("Ready to open");
    expect(onEnterPortal).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Open weekly plan" }));
    expect(onEnterPortal).toHaveBeenCalledOnce();
  });
});
