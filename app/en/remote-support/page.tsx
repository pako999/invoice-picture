import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { RemoteSupportPage } from "@/components/remote-support-page";

export const metadata: Metadata = pageMetadata({
  title: "Remote support with RustDesk",
  description:
    "Secure remote support instructions: download and install RustDesk, share your ID and one-time password, and understand how the support session works.",
  slug: "oddaljena-pomoc",
  locale: "en",
});

export default function RemoteSupportEnglishPage() {
  return <RemoteSupportPage locale="en" />;
}
