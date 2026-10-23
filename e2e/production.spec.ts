import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Exercise CSP and script lifecycle without sending test traffic to real analytics.
  await page.route("https://static.cloudflareinsights.com/beacon.min.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: `window.cloudflareBeaconLoads = (window.cloudflareBeaconLoads || 0) + 1;
        navigator.sendBeacon("https://cloudflareinsights.com/cdn-cgi/rum", "{}");`,
    }),
  );
  await page.route("https://cloudflareinsights.com/cdn-cgi/rum", (route) =>
    route.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*" } }),
  );
});

test("analytics loads once across shared-layout navigation and language changes", async ({
  page,
}) => {
  const violations: string[] = [];
  const scriptRequests: string[] = [];
  page.on("console", (message) => {
    if (message.text().includes("Content Security Policy")) violations.push(message.text());
  });
  page.on("request", (request) => {
    if (request.url() === "https://static.cloudflareinsights.com/beacon.min.js")
      scriptRequests.push(request.url());
  });
  const collection = page.waitForRequest("https://cloudflareinsights.com/cdn-cgi/rum");
  await page.goto("/");
  await collection;
  const beacon = page.locator("script[data-cf-beacon]");
  await expect(beacon).toHaveCount(1);
  await expect(beacon).toHaveAttribute("type", "module");
  expect(JSON.parse((await beacon.getAttribute("data-cf-beacon"))!)).toEqual({
    token: "5b83c8beea424e25b3810d5d866a6752",
  });
  await page.getByRole("link", { name: "Academy", exact: true }).click();
  await expect(page).toHaveURL("/academy");
  for (const language of ["fr", "en"]) {
    await page.getByRole("button", { name: language, exact: true }).click();
    await expect(beacon).toHaveCount(1);
  }
  expect(scriptRequests).toHaveLength(1);
  expect(await page.evaluate(() => Reflect.get(window, "cloudflareBeaconLoads"))).toBe(1);
  expect(violations).toEqual([]);
});

test("production SSR has unique nonces, secure errors and static assets", async ({ request }) => {
  const responses = await Promise.all(Array.from({ length: 4 }, () => request.get("/")));
  const nonces = new Set<string>();
  for (const response of responses) {
    expect(response.status()).toBe(200);
    const headers = response.headers();
    const csp = headers["content-security-policy"]!;
    const nonce = csp.match(/'nonce-([^']+)'/)![1]!;
    nonces.add(nonce);
    expect(headers["cache-control"]).toBe("private, no-store");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    const html = await response.text();
    const scripts = [...html.matchAll(/<script\b([^>]*)>/g)];
    expect(scripts.length).toBeGreaterThan(0);
    for (const [, attrs] of scripts) expect(attrs).toContain(`nonce="${nonce}"`);
    expect(html).toContain(`property="csp-nonce" content="${nonce}"`);
    const assetPath = html.match(/href="([^" ]+\.css)"/)![1]!;
    const asset = await request.get(assetPath);
    expect(asset.status()).toBe(200);
    expect(asset.headers()["x-content-type-options"]).toBe("nosniff");
  }
  expect(nonces.size).toBe(4);
  const missing = await request.get("/this-page-does-not-exist");
  expect(missing.status()).toBe(404);
  expect(missing.headers()["x-frame-options"]).toBe("DENY");
  expect(missing.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
});

test("hydration, bilingual navigation and literal templates work under CSP", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => {
    const violations: string[] = [];
    Object.assign(window, { cspViolations: violations });
    document.addEventListener("securitypolicyviolation", (event) => {
      violations.push(`${event.effectiveDirective}: ${event.blockedURI}`);
    });
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Understand Kubernetes");
  await page.getByRole("button", { name: "fr", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Comprenez Kubernetes");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Comprenez Kubernetes");
  await page.getByRole("button", { name: "next step", exact: true }).click();
  await page.getByRole("button", { name: "reset", exact: true }).click();
  await page.goto("/learn/helm-charts");
  const helpers = page.locator("pre").filter({ hasText: '{{- define "academy-web.fullname"' });
  await expect(helpers).toHaveCount(1);
  await expect(helpers).toContainText(".Release.Name");
  await page.getByRole("button", { name: "en", exact: true }).click();
  await expect(helpers).toContainText(".Chart.Name");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  const original = await helpers.textContent();
  await helpers.locator("..").getByRole("button", { name: "Copy", exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(original);
  const solution = page.getByRole("button", { name: "Show the detailed solution", exact: true });
  await expect(solution).toHaveAttribute("aria-expanded", "false");
  await solution.click();
  await expect(
    page.getByRole("button", { name: "Hide the solution", exact: true }),
  ).toHaveAttribute("aria-expanded", "true");
  for (const fieldset of await page.locator("fieldset").all()) {
    await fieldset.getByRole("radio").first().check();
  }
  await page.getByRole("button", { name: "Submit answers", exact: true }).click();
  await expect(page.getByRole("button", { name: "Retry", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Mark chapter as complete", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Mark as not done", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(() => (window as unknown as { cspViolations: string[] }).cspViolations),
  ).toEqual([]);
  const family = await page.locator("body").evaluate((body) => getComputedStyle(body).fontFamily);
  expect(family).toContain("Geist");
  await expect
    .poll(() =>
      page.evaluate(() =>
        [...document.fonts].some(
          (font) => font.family.includes("Geist") && font.status === "loaded",
        ),
      ),
    )
    .toBe(true);
  await page.screenshot({ path: test.info().outputPath("helm-production.png"), fullPage: true });
});

test("Bash, YAML, Python and Go examples remain literal in both languages", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const language of ["fr", "en"]) {
    for (const route of ["/source-files", "/lab", "/learn/custom-controllers"]) {
      await page.goto(route);
      await page.getByRole("button", { name: language, exact: true }).click();
      await expect(page.locator("pre").first()).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
    }
  }
  expect(errors).toEqual([]);
});

test("CSP rejects injected inline JavaScript", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    const script = document.createElement("script");
    script.textContent = "window.injectedInlineScript = true";
    document.body.append(script);
  });
  expect(await page.evaluate(() => "injectedInlineScript" in window)).toBe(false);
});
