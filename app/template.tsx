"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { HomeBusinessHero } from "@/components/home-business-hero";

export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isSlHomepage = pathname === "/";

  return (
    <>
      {isSlHomepage && (
        <>
          <HomeBusinessHero />
          <style jsx global>{`
            .business-home-hero + div > section:first-child {
              display: none;
            }
          `}</style>
        </>
      )}
      {children}
    </>
  );
}
