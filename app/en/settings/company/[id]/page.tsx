import { CompanyDeliverySettings } from "@/components/company-delivery-settings";

export default async function CompanyDeliveryPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  return <CompanyDeliverySettings companyId={id} locale="en" />;
}
