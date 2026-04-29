import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Fraunces, Syne } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SlikajRačun — Pošlji račun z emailom",
  description: "Fotografiraj račun in ga pošlji na email v sekundi.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="sl" className={`${fraunces.variable} ${syne.variable}`}>
        <body>
          <Nav />
          <main className="pb-20 md:pb-0">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
