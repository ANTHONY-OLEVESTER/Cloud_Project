import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const TransitionContext = createContext({
  startTransition: () => {},
});

const TRANSITION_DURATION = 700;
const TRANSITION_DELAY = 260;

export function TransitionProvider({ children }) {
  const [state, setState] = useState({ active: false, direction: "forward" });
  const callbackRef = useRef(null);

  const startTransition = useCallback((direction = "forward", callback) => {
    callbackRef.current = callback ?? null;
    setState({ active: true, direction });
  }, []);

  useEffect(() => {
    if (!state.active) {
      return;
    }

    const performTimer = window.setTimeout(() => {
      callbackRef.current?.();
      callbackRef.current = null;
    }, TRANSITION_DELAY);

    const resetTimer = window.setTimeout(() => {
      setState((prev) => ({ ...prev, active: false }));
    }, TRANSITION_DURATION);

    return () => {
      window.clearTimeout(performTimer);
      window.clearTimeout(resetTimer);
    };
  }, [state.active, state.direction]);

  const value = useMemo(
    () => ({
      startTransition,
      isTransitioning: state.active,
    }),
    [startTransition, state.active]
  );

  return (
    <TransitionContext.Provider value={value}>
      {children}
      <div
        className={`route-transition${
          state.active ? " route-transition--active" : ""
        } route-transition--${state.direction}`}
        aria-hidden="true"
      />
    </TransitionContext.Provider>
  );
}

export function useRouteTransition() {
  const ctx = useContext(TransitionContext);
  if (!ctx) {
    throw new Error("useRouteTransition must be used within TransitionProvider");
  }
  return ctx;
}
