import { test, expect, type Page } from "@playwright/test";
import { loadEnv } from "vite";
import { mkdirSync, writeFileSync } from "node:fs";

// Synthetic authentication is supplied only in the browser test context. All API
// traffic is intercepted; no real athlete, provider or account is contacted.
const fixtureEnv = loadEnv("development", process.cwd(), "VITE_");
const storageKey = `sb-${new URL(fixtureEnv.VITE_SUPABASE_URL).hostname.split(".")[0]}-auth-token`;
const evidence = ".design-experiment/onboarding";
mkdirSync(evidence, { recursive: true });
type State = "connect" | "profile" | "missing" | "preparing" | "failed" | "ready";
const titles: Record<State, string> = {
  connect: "Every plan starts with you.", profile: "Find your running rhythm.",
  missing: "Waiting for your first week.", preparing: "Preparing your first week.",
  failed: "Let’s get your plan ready.", ready: "Your first week is ready.",
};

async function fixture(page: Page, initial: State) {
  const model = {
    state: initial, bootstrapError: false, retryError: false, saveError: false,
    profileError: false, providerError: false, connectError: false, providerStatus: "ABSENT", oauth: false,
    provider: "intervals", connected: initial !== "connect", profileComplete: !["connect", "profile"].includes(initial),
    calls: [] as { method: string; path: string; body: unknown; }[],
    errors: [] as string[],
    profile: { displayName: "Alex Morgan", trainingGoalCode: "prepare_for_race", runningDays: ["TUE", "THU", "SAT", "SUN"], longRunPreferredDay: "SUN", preparation: { primaryGoal: { name: "Valencia Half Marathon", eventDate: "2027-04-25", distanceKm: 21.1, raceTarget: { type: "TIME", targetTimeSeconds: 6300 } } } },
  };
  page.on("pageerror", error => model.errors.push(error.message));
  await page.addInitScript(({ storageKey }) => localStorage.setItem(storageKey, JSON.stringify({ access_token: "synthetic-token", refresh_token: "synthetic-refresh", expires_at: 4102444800, token_type: "bearer", user: { id: "demo-user", aud: "authenticated", role: "authenticated", email: "runner@example.test" } })), { storageKey });
  await page.route("**/*", async route => {
    const req = route.request(), { pathname, hostname } = new URL(req.url());
    if (!pathname.includes("/api/v1/")) {
      if (hostname === "127.0.0.1" || hostname.endsWith("googleapis.com") || hostname.endsWith("gstatic.com")) return route.continue();
      return route.abort();
    }
    model.calls.push({ method: req.method(), path: pathname, body: req.postData() });
    if (pathname.endsWith("/bootstrap")) {
      if (model.bootstrapError) return route.fulfill({ status: 503, json: { message: "Synthetic bootstrap failure" } });
      const state = model.state;
      return route.fulfill({ json: { athleteId: "demo-athlete", user: { userId: "demo-user", displayName: "Alex Morgan" }, profile: { isComplete: model.profileComplete }, trainingProvider: { connected: model.connected, activeProvider: model.connected ? model.provider : undefined, readinessCapability: model.provider === "strava" ? "limited" : "full" }, weeklyPlan: { targetWeekStartDate: "2026-10-12", status: ["connect", "profile", "missing"].includes(state) ? "missing" : state, hasPlan: state === "ready", failureCode: state === "failed" ? "GENERATION_FAILED" : undefined }, nextStep: state === "connect" ? "connect_training_source" : state === "profile" ? "complete_profile" : state === "ready" ? "view_weekly_plan" : "prepare_weekly_plan" } });
    }
    if (pathname.endsWith("weekly-plan:retry")) {
      if (model.retryError) return route.fulfill({ status: 503, json: { message: "Synthetic retry failure" } });
      model.state = "preparing";
      return route.fulfill({ status: 204 });
    }
    if (pathname.includes("integrations")) {
      if (req.method() === "DELETE") { model.connected = false; model.state = "connect"; return route.fulfill({ status: 204 }); }
      if (req.method() === "POST") {
        if (model.connectError) return route.fulfill({ status: 503, json: { message: "Synthetic connection failure" } });
        if (model.oauth) {
          // The provider snapshot may lag the new authorization request.
          model.providerStatus = "ABSENT";
          return route.fulfill({ json: { redirectUrl: "https://provider.example.test/authorize" } });
        }
        model.provider = pathname.includes("strava") ? "strava" : "intervals";
        model.connected = true; model.state = "profile";
        return route.fulfill({ json: {} });
      }
      if (model.providerError) return route.fulfill({ status: 503, json: { message: "Synthetic provider failure" } });
      return route.fulfill({ json: { status: model.connected && pathname.includes(model.provider) ? "CONNECTED" : model.providerStatus } });
    }
    if (pathname.endsWith("/demo-athlete")) {
      if (req.method() === "PUT") {
        if (model.saveError) return route.fulfill({ status: 503, json: { message: "Synthetic save failure" } });
        const body = req.postDataJSON();
        model.profile = { ...model.profile, ...body, trainingGoalCode: body.trainingGoal };
        model.profileComplete = true; model.state = "preparing";
        return route.fulfill({ status: 204 });
      }
      if (model.profileError) return route.fulfill({ status: 503, json: { message: "Synthetic profile failure" } });
      return route.fulfill({ json: model.profile });
    }
    if (pathname.endsWith("/screen")) return route.fulfill({ json: { viewType: "PLAN", selectedWeekStartDate: "2026-10-12", todayWeekStartDate: "2026-10-12", canGoPrevious: false, canGoNext: false, plan: { athleteId: "demo-athlete", weekStartDate: "2026-10-12", planId: "demo-plan", summary: {}, plan: { schemaVersion: "1.0", weekType: "BUILD", weekObjective: "Build a consistent running rhythm.", sessions: [{ day: "MON", modality: "RUN", type: "EASY", title: "Easy run", durationMinutes: 40, intensityCategory: "LOW", notes: "Keep the effort comfortable." }], justification: [] } } } });
    return route.fulfill({ json: {} });
  });
  return model;
}

async function open(page: Page, state: State) {
  const model = await fixture(page, state);
  await page.goto("/portal");
  await expect(page.getByRole("heading", { name: titles[state], exact: true })).toBeVisible();
  if (state === "profile") await expect(page.getByLabel("Display name")).toHaveValue("Alex Morgan");
  await page.evaluate(() => document.fonts.ready);
  return model;
}

async function capture(page: Page, name: string) {
  await page.screenshot({ path: `${evidence}/${process.env.CAPTURE_STAGE ?? "after"}-${name}.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

// Measures actual computed colors, compositing every ancestor surface. Disabled
// controls and visually hidden accessibility copy are excluded, not muted copy.
async function contrast(page: Page) {
  return page.evaluate(() => {
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    function rgba(color: string) { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1); return Array.from(ctx.getImageData(0, 0, 1, 1).data).map((v, i) => i === 3 ? v / 255 : v); }
    function blend(f: number[], b: number[]) { return f.slice(0, 3).map((v, i) => v * f[3] + b[i] * (1 - f[3])).concat(1); }
    function lum(c: number[]) { return c.slice(0, 3).map(v => v / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0); }
    let checked = 0, minimum = 100; const failures: { text: string; ratio: number; }[] = [];
    const walker = document.createTreeWalker(document.querySelector(".portal-app")!, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode, el = node.parentElement!;
      if (!node.textContent?.trim() || el.getBoundingClientRect().height === 0 || el.closest("[hidden],.sr-only,button:disabled,details:not([open]) > p")) continue;
      const style = getComputedStyle(el); if (style.visibility === "hidden") continue;
      const chain: Element[] = []; for (let e: Element | null = el; e; e = e.parentElement) chain.unshift(e);
      let bg = [255, 255, 255, 1]; for (const e of chain) bg = blend(rgba(getComputedStyle(e).backgroundColor), bg);
      const fg = blend(rgba(style.color), bg), l1 = lum(fg), l2 = lum(bg), ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && parseFloat(style.fontWeight) >= 700);
      checked++; minimum = Math.min(minimum, ratio);
      if (ratio < (large ? 3 : 4.5)) failures.push({ text: node.textContent!.trim().slice(0, 70), ratio });
    }
    return { checked, minimum, failures };
  });
}

for (const state of ["connect", "profile", "missing", "preparing", "failed"] as const) {
  test(`visual states and themes: ${state}`, async ({ page }) => {
    const model = await open(page, state);
    const audits = [];
    for (const [theme, label, token] of [["warm", "Warm & Earthy", "40 20% 97%"], ["dark", "Dark & Bold", "0 0% 6%"], ["bright", "Clean & Bright", "0 0% 100%"], ["forest", "Forest & Deep", "150 15% 8%"]]) {
      await page.getByRole("button", { name: "Change theme", exact: true }).click();
      await page.getByRole("menuitemradio", { name: label }).click();
      // Inherited theme colors transition through nested controls; allow them to settle.
      await page.waitForTimeout(1000);
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--background").trim())).toBe(token);
      await page.getByRole("heading", { name: titles[state], exact: true }).click();
      for (const [size, width, height] of [["desktop", 1440, 1000], ["mobile", 390, 844]] as const) {
        await page.setViewportSize({ width, height }); await page.evaluate(() => scrollTo(0, 0));
        const audit = await contrast(page); audits.push({ state, theme, size, ...audit });
        await capture(page, `${state}-${theme}-${size}`);
      }
    }
    writeFileSync(`${evidence}/${state}-contrast.json`, JSON.stringify(audits, null, 2));
    expect(audits.flatMap(a => a.failures.map(f => ({ theme: a.theme, ...f })))).toEqual([]);
    for (const width of [320, 640, 768, 900, 1024, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow at ${width}`).toBe(true);
      if (state === "profile") for (const day of await page.locator(".profile-day-grid button").all()) {
        const box = (await day.boundingBox())!; expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
    expect(await page.getByRole("main").count()).toBe(1);
    expect(await page.locator('[aria-current="step"]').count()).toBe(1);
    expect(await page.getByRole("progressbar").count()).toBe(0);
    expect(model.errors).toEqual([]);
  });
}

test("complete journey, save recovery, focus, and ready handoff", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const model = await open(page, "connect");
  await page.getByRole("radio", { name: "Intervals.icu", exact: true }).check();
  await page.waitForTimeout(200);
  await page.getByRole("radio", { name: "Strava", exact: true }).check();
  await page.waitForTimeout(400);
  await capture(page, "selected-source-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await capture(page, "selected-source-mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Connect Strava", exact: true }).click();
  await expect(page.getByRole("heading", { name: titles.profile })).toBeFocused();
  await expect(page.getByLabel("Display name")).toHaveValue("Alex Morgan");
  await page.getByLabel("Display name").fill("Alex Runner");
  await page.getByRole("button", { name: "Monday", exact: true }).click();
  await page.getByLabel("Preferred long run day").selectOption("MON");
  await page.getByRole("button", { name: "Sunday", exact: true }).click();
  await expect(page.getByRole("option", { name: "Sunday" })).toHaveCount(0);
  await page.getByRole("radio", { name: "Target pace", exact: true }).check();
  await page.getByRole("textbox", { name: "Target pace / km", exact: true }).fill("5:00");
  await expect(page.getByLabel("Equivalent time")).toHaveValue("1:45:30");
  model.saveError = true;
  await page.getByRole("button", { name: "Save & continue", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("We couldn't save your profile.");
  await expect(page.getByLabel("Display name")).toHaveValue("Alex Runner");
  model.saveError = false;
  await page.getByRole("button", { name: "Save & continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: titles.preparing })).toBeFocused();
  // A failed background bootstrap retains the existing journey and saved work.
  model.bootstrapError = true;
  await page.getByRole("button", { name: "Check status", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("We couldn’t check your setup.");
  await expect(page.getByRole("heading", { name: titles.preparing })).toBeVisible();
  model.bootstrapError = false; model.state = "ready";
  await expect(page.getByRole("heading", { name: titles.ready })).toBeFocused({ timeout: 8000 });
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.locator(".onboarding-plan-mark g")).toHaveCSS("opacity", "0");
  for (const [size, width, height] of [["desktop", 1440, 1000], ["mobile", 390, 844]] as const) {
    await page.setViewportSize({ width, height }); await page.waitForTimeout(400); await capture(page, `ready-${size}`);
  }
  await page.getByText("View your setup", { exact: true }).click();
  await expect(page.locator(".onboarding-receipt")).toContainText("Strava");
  await expect(page.locator(".onboarding-receipt")).toContainText("Saved");
  await page.getByText("View your setup", { exact: true }).click();
  await page.getByRole("button", { name: "Open weekly plan", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your schedule", exact: true })).toBeVisible();
  await expect(page.getByRole("main")).toBeFocused();
  await expect(page.getByRole("link", { name: "Weekly Plan", exact: true })).toHaveAttribute("aria-current", "page");
  expect(model.calls.some(c => c.method === "PUT")).toBe(true);
  expect(model.errors).toEqual([]);
});

test("failed generation retries, interruption recovery, and reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const model = await open(page, "failed");
  model.retryError = true;
  await page.getByRole("button", { name: "Retry plan generation", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("We couldn’t restart your plan.");
  model.retryError = false;
  await page.getByRole("button", { name: "Retry plan generation", exact: true }).click();
  await expect(page.getByRole("heading", { name: titles.preparing })).toBeVisible();
  await expect(page.locator(".onboarding-plan-mark")).toHaveCSS("animation-name", "none");
  expect(await page.locator(".onboarding-layout").evaluate(el => [...el.querySelectorAll("*")].filter(node => getComputedStyle(node).animationName !== "none").length)).toBe(0);
  await page.reload(); await expect(page.getByRole("heading", { name: titles.preparing })).toBeVisible();
  // Polling discovers readiness without requiring the manual status button.
  model.state = "ready";
  await expect(page.getByRole("heading", { name: titles.ready })).toBeVisible({ timeout: 8000 });
  for (const label of ["Warm & Earthy", "Dark & Bold", "Clean & Bright", "Forest & Deep"]) {
    await page.getByRole("button", { name: "Change theme", exact: true }).click();
    await page.getByRole("menuitemradio", { name: label }).click();
    await page.waitForTimeout(1000); expect((await contrast(page)).failures).toEqual([]);
  }
  expect(model.calls.filter(c => c.path.endsWith("weekly-plan:retry"))).toHaveLength(2);
  expect(model.errors).toEqual([]);
});

test("onboarding draft exit guard and keyboard access", async ({ page }) => {
  const model = await open(page, "profile");
  await page.getByLabel("Display name").fill("Unsaved runner");
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: "Keep editing", exact: true }).click();
  await expect(page.getByLabel("Display name")).toHaveValue("Unsaved runner");
  await page.getByRole("link", { name: "Running Coach home" }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /Race date:/ }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /Race date:/ })).toBeFocused();
  await page.getByLabel("Display name").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("combobox", { name: "Training goal" })).toBeFocused();
  expect(model.errors).toEqual([]);
});

test("initial ready bootstrap opens the weekly plan directly", async ({ page }) => {
  const model = await fixture(page, "ready");
  await page.goto("/portal");
  await expect(page.getByRole("heading", { name: "Your schedule", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open weekly plan" })).toHaveCount(0);
  expect(model.errors).toEqual([]);
});

test("provider authorization polling and failed authorization recovery", async ({ page }) => {
  const model = await fixture(page, "connect");
  model.providerStatus = "AUTH_FAILED";
  model.oauth = true;
  await page.goto("/portal");
  const provider = page.getByRole("region", { name: "Intervals.icu", exact: true });
  await expect(provider.getByText("Needs retry", { exact: true })).toBeVisible();
  // Observe the real component's popup request without opening a live provider.
  await page.evaluate(() => {
    (window as Window & { oauthRequest?: unknown; }).oauthRequest = null;
    window.open = (...args) => { (window as Window & { oauthRequest?: unknown; }).oauthRequest = args; return {} as Window; };
  });
  await page.getByRole("radio", { name: "Intervals.icu", exact: true }).check();
  await page.getByRole("button", { name: "Reconnect Intervals.icu", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as Window & { oauthRequest?: unknown; }).oauthRequest)).toEqual(["https://provider.example.test/authorize", "_blank", "noopener,noreferrer"]);
  model.providerStatus = "PENDING_AUTHORIZATION";
  await expect(provider.getByText("Waiting", { exact: true })).toBeVisible({ timeout: 5000 });
  model.providerStatus = "CONNECTED"; model.connected = true; model.state = "profile";
  await expect(page.getByRole("heading", { name: titles.profile })).toBeVisible({ timeout: 6000 });
  expect(model.errors).toEqual([]);
});

test("profile, provider and initial bootstrap errors remain recoverable", async ({ page }) => {
  const model = await fixture(page, "profile");
  model.bootstrapError = true;
  await page.goto("/portal");
  await expect(page.getByRole("heading", { name: "We couldn't open your portal" })).toBeVisible();
  model.bootstrapError = false; model.profileError = true;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByRole("heading", { name: "We couldn't load your profile" })).toBeVisible({ timeout: 15000 });
  model.profileError = false;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByLabel("Display name")).toHaveValue("Alex Morgan");
  // Reload resumes the source step when the backend asks for reconnection.
  model.state = "connect"; model.connected = false; model.providerError = true;
  await page.reload();
  await expect(page.getByText("We couldn't load this source status.").first()).toBeVisible({ timeout: 15000 });
  model.providerError = false;
  await page.getByRole("button", { name: "Check again", exact: true }).first().click();
  await expect(page.getByText("Status unavailable")).toHaveCount(1);
  expect(model.errors).toEqual([]);
});


test("source selection has one action, native keyboard control and reduced-motion continuity", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const model = await open(page, "connect");
  const action = page.getByRole("button", { name: "Connect a source", exact: true });
  await expect(action).toBeDisabled();
  const strava = page.getByRole("radio", { name: "Strava", exact: true });
  await strava.focus();
  await page.keyboard.press("Space");
  await expect(strava).toBeChecked();
  await expect(page.getByRole("button", { name: "Connect Strava", exact: true })).toBeEnabled();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("radio", { name: "Intervals.icu", exact: true })).toBeChecked();
  await expect(page.locator(".onboarding-source-selection")).toHaveCount(1);
  await expect(page.locator(".onboarding-source-selection")).toHaveCSS("transform", "none");
  await page.getByText("What’s shared?", { exact: true }).click();
  await expect(page.getByText("Strava shares runs", { exact: false })).toBeVisible();
  model.connectError = true;
  await page.getByRole("button", { name: "Connect Intervals.icu", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("We couldn't connect this source. Try again.");
  await expect(page.getByRole("radio", { name: "Intervals.icu", exact: true })).toBeChecked();
  model.connectError = false;
  await page.getByRole("button", { name: "Connect Intervals.icu", exact: true }).click();
  await expect(page.getByRole("heading", { name: titles.profile })).toBeFocused();
  await expect(page.locator("[inert]")).toHaveCount(0);
  expect(model.calls.filter(c => c.method === "POST" && c.path.includes("integrations"))).toHaveLength(2);
  expect(model.errors).toEqual([]);
});
