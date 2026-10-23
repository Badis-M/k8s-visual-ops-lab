// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createNonce, secureResponse, securityHeaders } from "../server/security";

describe("production response security", () => {
  it("generates unpredictable request-local 256-bit nonces", () => {
    const nonces = Array.from({ length: 100 }, createNonce);
    expect(new Set(nonces).size).toBe(100);
    for (const nonce of nonces) expect(nonce).toMatch(/^[A-Za-z0-9+/]{43}=$/);
  });
  it.each([200, 404, 500])("secures streamed HTML including status %s", async (status) => {
    const nonce = createNonce();
    const body = `<script nonce="${nonce}">window.test = true</script>`;
    const response = secureResponse(
      new Response(body, { status, headers: { "content-type": "text/html", etag: "stale" } }),
      new Request("https://academy.example/"),
      nonce,
    );
    expect(response.status).toBe(status);
    expect(await response.text()).toBe(body);
    expect(response.headers.get("Content-Security-Policy")).toContain(`'nonce-${nonce}'`);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("Cloudflare-CDN-Cache-Control")).toBe("no-store");
    expect(response.headers.has("etag")).toBe(false);
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("Strict-Transport-Security")).toBe("max-age=300");
  });
  it("does not trust proxy headers or enable HSTS on loopback", () => {
    for (const url of ["http://academy.example/", "https://localhost/", "https://127.0.0.1/"]) {
      const headers = securityHeaders(
        new Request(url, { headers: { "X-Forwarded-Proto": "https" } }),
      );
      expect(headers["Strict-Transport-Security"]).toBeUndefined();
      expect(headers["Content-Security-Policy"]).toContain("script-src 'none'");
    }
  });
  it("blocks inline handlers/eval while allowing only the documented CSS exception", () => {
    const headers = securityHeaders(new Request("https://academy.example/"), createNonce());
    const directives = headers["Content-Security-Policy"]!.split("; ");
    const scripts = directives.find((directive) => directive.startsWith("script-src "))!;
    expect(scripts).not.toContain("unsafe-inline");
    expect(scripts).not.toContain("unsafe-eval");
    expect(directives).toContain("script-src-attr 'none'");
    expect(directives).toContain("frame-ancestors 'none'");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Cross-Origin-Embedder-Policy"]).toBeUndefined();
  });
  it("permits the analytics script and collection origins without widening other directives", () => {
    const nonce = createNonce();
    const headers = securityHeaders(new Request("https://academy.example/"), nonce);
    const directives = headers["Content-Security-Policy"]!.split("; ");
    expect(directives).toContain(
      `script-src 'self' 'nonce-${nonce}' https://static.cloudflareinsights.com`,
    );
    expect(directives).toContain("connect-src 'self' https://cloudflareinsights.com");
    expect(directives).toContain("default-src 'none'");
    expect(directives).toContain("frame-ancestors 'none'");
    expect(directives.some((directive) => directive.includes("*"))).toBe(false);
  });
});
