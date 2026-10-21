import type { ReactNode } from "react";
import { OcrUsagePanel } from "@/components/ocr-usage-panel";
import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata;

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="mx-auto max-w-xl px-4">
        <OcrUsagePanel locale="en" contained />
      </div>
      {children}
    </>
  );
}
