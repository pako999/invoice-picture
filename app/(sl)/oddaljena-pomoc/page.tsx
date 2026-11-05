import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { RemoteSupportPage } from "@/components/remote-support-page";

export const metadata: Metadata = pageMetadata({
  title: "Oddaljena pomoč z RustDesk",
  description:
    "Navodila za varno oddaljeno pomoč: prenos in namestitev RustDesk, posredovanje ID-ja in enkratnega gesla ter potek podpore ekipe Slikaj Račun.",
  slug: "oddaljena-pomoc",
});

export default function OddaljenaPomocPage() {
  return <RemoteSupportPage locale="sl" />;
}
