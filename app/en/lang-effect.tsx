"use client";
import { useEffect } from "react";

/** Flips <html lang> to "en" while inside the /en subtree.
 *  Runs on the client because Next.js doesn't yet support per-segment
 *  <html> overrides. Keeps screen readers + Google in sync. */
export function LangEffect() {
  useEffect(() => {
    document.documentElement.lang = "en";
    return () => { document.documentElement.lang = "sl"; };
  }, []);
  return null;
}
