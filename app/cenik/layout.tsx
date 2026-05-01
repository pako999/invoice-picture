import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Cenik",
  description: "Osnovno za 9.90 € / mesec, PRO Računovodstvo za 19.90 € / mesec. Letno -20%. Brez vezave, odpoveš kadarkoli. Neomejeno fotografij in pošiljanj.",
  path: "/cenik",
});

export default function CenikLayout({ children }: { children: React.ReactNode }) {
  return children;
}
