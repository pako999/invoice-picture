import type { ReactNode } from "react";
import { InvoiceReviewShortcut } from "@/components/invoice-review-shortcut";

export default function InvoicesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <InvoiceReviewShortcut locale="en" />
      {children}
    </>
  );
}
