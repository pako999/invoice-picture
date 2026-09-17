import "./review-route.css";
import { SlovenianWarningTranslator } from "./sl-warning-translator";

export default function InvoiceReviewDetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="invoice-review-route">
      <SlovenianWarningTranslator />
      {children}
    </div>
  );
}
