import { useEffect, useState } from "react";

/** Returns `value`, but only after it has stopped changing for `delayMs`. */
export function useDebounce<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id); // each keystroke cancels the previous timer
  }, [value, delayMs]);

  return debounced;
}
