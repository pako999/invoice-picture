import { notFound } from "next/navigation";
import { BulkInvoiceJobDetail } from "@/components/bulk-invoice-job-detail";

export const metadata = {
  title: "PDF batch processing | Slikaj Račun",
  robots: { index: false, follow: false },
};

export default async function BulkInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <BulkInvoiceJobDetail id={id} locale="en" />;
}
