import type { Metadata } from "next";
import { RemoteSupportPage } from "@/components/remote-support-page";

export const metadata: Metadata = {
  title: "Oddaljena pomoč | Slikaj Račun",
  description:
    "Navodila za varno oddaljeno pomoč: prenos in namestitev RustDesk, posredovanje ID-ja in enkratnega gesla ter potek podpore.",
  alternates: {
    canonical: "/oddaljena-pomoc",
    languages: {
      "sl-SI": "/oddaljena-pomoc",
      en: "/en/remote-support",
      "x-default": "/oddaljena-pomoc",
    },
  },
};

export default function OddaljenaPomocPage() {
  return <RemoteSupportPage locale="sl" />;
}
