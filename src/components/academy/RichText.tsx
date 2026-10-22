import type { ReactNode } from "react";

/** Renders `inline code` segments inside lesson strings. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i): ReactNode =>
        p.startsWith("`") && p.endsWith("`") && p.length > 1 ? <code key={i}>{p.slice(1, -1)}</code> : p,
      )}
    </>
  );
}
