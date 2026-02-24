import type { ReactNode } from "react";
import { Spinner } from "./spinner";

export function LoadingButtonContent({
  loading,
  children,
  loadingLabel,
  spinnerClassName = "text-white",
  spinnerSize = "size-4",
  gapClassName = "gap-2",
}: {
  loading: boolean;
  children: ReactNode;
  loadingLabel?: ReactNode;
  spinnerClassName?: string;
  spinnerSize?: string;
  gapClassName?: string;
}) {
  if (!loading) {
    return <>{children}</>;
  }

  return (
    <span className={`inline-flex items-center ${gapClassName}`}>
      <Spinner className={spinnerClassName} size={spinnerSize} />
      <span>{loadingLabel ?? children}</span>
    </span>
  );
}

