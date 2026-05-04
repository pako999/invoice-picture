// English subtree — no chrome of its own. Nav/Footer auto-detect locale
// from the URL (they're imported once at the root layout).
// We only need this layout to flip <html lang="en"> on the client.
"use client";
import { useEffect } from "react";

export default function EnLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = "en";
    return () => { document.documentElement.lang = "sl"; };
  }, []);
  return <>{children}</>;
}
