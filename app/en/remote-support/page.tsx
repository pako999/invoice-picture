import type { Metadata } from "next";
import { RemoteSupportPage } from "@/components/remote-support-page";

export const metadata: Metadata = {
  title: "Remote support | Slikaj Račun",
  description:
    "Secure remote support instructions: download and install RustDesk, share your ID and one-time password, and understand how the support session works.",
  alternates: {
    canonical: "/en/remote-support",
    languages: {
      "sl-SI": "/oddaljena-pomoc",
      en: "/en/remote-support",
      "x-default": "/oddaljena-pomoc",
    },
  },
};

export default function RemoteSupportEnglishPage() {
  return <RemoteSupportPage locale="en" />;
}
