import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/prerequisites")({
  beforeLoad: () => {
    throw redirect({ to: "/learn/$chapterId", params: { chapterId: "setup-kind" }, statusCode: 301 });
  },
});
