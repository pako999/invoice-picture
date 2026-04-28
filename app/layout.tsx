import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "Invoice Picture — Pošlji račun z emailom",
  description: "Fotografiraj račun in ga pošlji na email v sekundi. Preprosto, hitro, brez registracije.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sl">
      <body>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
