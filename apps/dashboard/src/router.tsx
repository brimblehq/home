import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  });

  if (typeof document !== "undefined") {
    import("nprogress").then((mod) => {
      const NProgress = mod.default;
      import("nprogress/nprogress.css");
      NProgress.configure({ showSpinner: false, trickleSpeed: 200 });

      router.subscribe("onBeforeLoad", ({ pathChanged }) => {
        if (pathChanged) NProgress.start();
      });

      router.subscribe("onLoad", () => {
        NProgress.done();
      });
    });
  }

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
