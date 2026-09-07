import { InvoiceReviewClient } from "./review-client";

export default async function InvoiceReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InvoiceReviewClient documentId={Number(id)} />;
}
