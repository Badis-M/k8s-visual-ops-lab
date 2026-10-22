import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/k8s-basics")({
  beforeLoad: () => {
    throw redirect({ to: "/learn/$chapterId", params: { chapterId: "architecture" }, statusCode: 301 });
  },
});
