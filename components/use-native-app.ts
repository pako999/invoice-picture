"use client";
import { useEffect, useState } from "react";

/**
 * True when the site is running inside the native (Expo/React Native) app
 * rather than a normal browser.
 *
 * Detection signals, any of which is enough:
 *  - `window.ReactNativeWebView` — injected automatically by react-native-webview,
 *    so this works without any change to the mobile app.
 *  - `?platform=ios|android` on the URL (persisted for the session) — a belt-and-
 *    braces flag the app can append to the webview URL.
 *  - a `SlikajRacunApp` token in the User-Agent (if the app sets a custom UA).
 *
 * Used to hide the web (Paddle) checkout on iOS/Android, where digital
 * subscriptions must go through StoreKit / Play Billing (App Store
 * guideline 3.1.1), and route the purchase to the native layer instead.
 */
export function useNativeApp(): boolean {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const platform = new URLSearchParams(window.location.search).get("platform");
    if (platform === "ios" || platform === "android") {
      try { sessionStorage.setItem("nativeApp", platform); } catch {}
    }

    let stored: string | null = null;
    try { stored = sessionStorage.getItem("nativeApp"); } catch {}

    const hasRnBridge = typeof (window as unknown as { ReactNativeWebView?: unknown }).ReactNativeWebView !== "undefined";
    const uaToken = /SlikajRacunApp/i.test(navigator.userAgent);

    setIsNative(Boolean(hasRnBridge || stored || uaToken));
  }, []);

  return isNative;
}

/**
 * Sends a message to the native app shell (no-op in a browser). The mobile app
 * listens via the WebView's `onMessage` and opens the native purchase flow.
 */
export function postToNative(message: Record<string, unknown>): boolean {
  if (typeof window === "undefined") return false;
  const rn = (window as unknown as { ReactNativeWebView?: { postMessage: (s: string) => void } }).ReactNativeWebView;
  if (rn?.postMessage) {
    rn.postMessage(JSON.stringify(message));
    return true;
  }
  return false;
}
