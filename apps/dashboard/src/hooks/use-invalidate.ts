import { useRouter } from "@tanstack/react-router";
import { useCallback, useRef } from "react";

export function useInvalidate() {
  const router = useRouter();

  return useCallback(() => {
    router.invalidate();
  }, [router]);
}

export function useInvalidatingServerFn<TArgs extends { data?: unknown }, TResult>(serverFn: (args: TArgs) => Promise<TResult>) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  return useCallback(
    async (args: TArgs): Promise<TResult> => {
      const result = await serverFn(args);
      routerRef.current.invalidate();
      return result;
    },
    [serverFn],
  );
}
