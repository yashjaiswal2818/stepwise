"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { IconButton } from "./IconButton";

type Theme = "dark" | "light";

/* The <html> data-theme attribute is the single source of truth — it is set by
   the bootstrap script in app/layout.tsx before first paint. Reading it through
   useSyncExternalStore keeps this component in step with it without duplicating
   the value into local state (which also means two toggles can never desync). */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

const getSnapshot = (): Theme =>
  document.documentElement.dataset.theme === "light" ? "light" : "dark";

const getServerSnapshot = (): Theme => "dark";

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    if (next === "light") document.documentElement.dataset.theme = "light";
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem("stepwise-theme", next);
    } catch {}
  }

  /* The name states the ACTION and therefore reveals the current state: hearing
     "Switch to light theme" tells you that you are in dark. This is preferred
     over aria-pressed here because the icon already shows the target rather
     than the current mode, and "Toggle theme, pressed" leaves a screen-reader
     user to guess which of two equal modes counts as "pressed". Both channels
     must agree, so title and aria-label are the same string. */
  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <IconButton onClick={toggle} aria-label={label} title={label}>
      {theme === "dark" ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
    </IconButton>
  );
}
