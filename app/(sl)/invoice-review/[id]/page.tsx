import { InvoiceReviewClient } from "./review-client";
import { ProcessingHistory } from "./processing-history";

export default async function InvoiceReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const documentId = Number(id);
  return (
    <>
      <InvoiceReviewClient documentId={documentId} />
      <ProcessingHistory documentId={documentId} />
    </>
  );
}
