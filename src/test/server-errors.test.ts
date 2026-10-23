// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));
vi.mock("@tanstack/react-start/server-entry", () => ({ default: { fetch: fetchMock } }));
import server from "../server";

afterEach(() => vi.unstubAllEnvs());
it.each(["throw", "swallowed"])(
  "secures the real fallback path for %s failures",
  async (failure) => {
    vi.stubEnv("PROD", true);
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    if (failure === "throw") fetchMock.mockRejectedValueOnce(new Error("Synthetic failure"));
    else
      fetchMock.mockResolvedValueOnce(
        new Response('{"unhandled":true,"message":"HTTPError"}', {
          status: 500,
          headers: { "content-type": "application/json" },
        }),
      );
    try {
      const response = await server.fetch(new Request("https://academy.example/"));
      expect(response.status).toBe(500);
      expect(response.headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
      expect(response.headers.get("Cache-Control")).toBe("private, no-store");
      const html = await response.text();
      expect(html).toContain("Try again");
      expect(html).not.toContain("onclick=");
    } finally {
      log.mockRestore();
    }
  },
);
