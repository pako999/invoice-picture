import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "SlikajRačun — Pošlji račun z emailom",
  description: "Fotografiraj račun in ga pošlji na email v sekundi.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="sl">
        <body>
          <Nav />
          <main className="pb-20 md:pb-0">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
