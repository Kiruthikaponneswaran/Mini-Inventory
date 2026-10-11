import { useIsFetching, useIsMutating } from "@tanstack/react-query";

export function LoadingBar() {
  const busy = useIsFetching() + useIsMutating() > 0;
  return (
    <div
      className={`loading-bar${busy ? " active" : ""}`}
      role="progressbar"
      aria-label="Loading"
      aria-hidden={!busy}
    />
  );
}