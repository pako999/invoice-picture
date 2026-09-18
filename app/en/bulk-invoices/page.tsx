import { BulkInvoiceJobList } from "@/components/bulk-invoice-job-list";

export const metadata = {
  title: "Invoice PDF batches | Slikaj Račun",
  robots: { index: false, follow: false },
};

export default function BulkInvoicesPage() {
  return <BulkInvoiceJobList locale="en" />;
}
