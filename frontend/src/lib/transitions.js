const ENTER_CLASS = "app-transition--enter";
const EXIT_CLASS = "app-transition--exit";
const TRANSITION_DURATION = 520;

function toggleClass(className) {
  const body = document.body;
  if (!body) return () => {};
  body.classList.remove(ENTER_CLASS, EXIT_CLASS);
  // Force reflow so animation restarts
  void body.offsetWidth;
  body.classList.add(className);
  return () => {
    body.classList.remove(className);
  };
}

export function runAppTransition(type, callback) {
  const isEnter = type === "enter";
  const className = isEnter ? ENTER_CLASS : EXIT_CLASS;
  const cleanup = toggleClass(className);
  const delay = isEnter ? 260 : 220;

  window.setTimeout(() => {
    try {
      callback?.();
    } finally {
      window.setTimeout(() => {
        cleanup();
      }, TRANSITION_DURATION);
    }
  }, delay);
}
