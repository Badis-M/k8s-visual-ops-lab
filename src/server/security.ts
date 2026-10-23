/** The streamed HTML and its nonce must be delivered as one uncacheable response. */
export function createNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes));
}

export function securityHeaders(request: Request, nonce?: string): Record<string, string> {
  const scripts = nonce ? `'self' 'nonce-${nonce}'` : "'none'";
  const headers: Record<string, string> = {
    "Content-Security-Policy": [
      "default-src 'none'",
      `script-src ${scripts}`,
      "script-src-attr 'none'",
      // React positions diagrams with style attributes; Radix may inject style elements.
      // This exception permits CSS only, never inline JavaScript or event handlers.
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'none'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  };
  // Never infer TLS from user-supplied X-Forwarded-Proto or Forwarded headers.
  const url = new URL(request.url);
  if (url.protocol === "https:" && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    headers["Strict-Transport-Security"] = "max-age=300";
  }
  return headers;
}

export function secureResponse(response: Response, request: Request, nonce: string): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(securityHeaders(request, nonce)))
    headers.set(key, value);
  if (headers.get("content-type")?.includes("text/html")) {
    headers.set("Cache-Control", "private, no-store");
    headers.set("CDN-Cache-Control", "no-store");
    headers.set("Cloudflare-CDN-Cache-Control", "no-store");
    headers.delete("etag");
    headers.delete("last-modified");
  }
  // Preserve the stream. Buffering/replacing script tags would break SSR and trust boundaries.
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
