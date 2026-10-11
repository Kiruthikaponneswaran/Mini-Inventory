import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDebounce } from "./useDebounce";

describe("useDebounce", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("a", 300));
    expect(result.current).toBe("a");
  });

  it("only updates after the delay, and restarts the timer on each change", () => {
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 300), { initialProps: { v: "a" } });

    rerender({ v: "ab" });
    act(() => void vi.advanceTimersByTime(200));
    rerender({ v: "abc" });
    act(() => void vi.advanceTimersByTime(200));
    expect(result.current).toBe("a"); // 200ms since the last change: still waiting

    act(() => void vi.advanceTimersByTime(100));
    expect(result.current).toBe("abc");
  });
});
