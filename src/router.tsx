import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestNonce } from "./server/nonce.server";
import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

const requestNonce = createIsomorphicFn()
  .server(getRequestNonce)
  .client(() => document.querySelector<HTMLMetaElement>('meta[property="csp-nonce"]')?.content);

export const getRouter = () => {
  const queryClient = new QueryClient();
  const nonce = requestNonce();

  const router = createRouter({
    routeTree,
    ssr: nonce ? { nonce } : {},
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
