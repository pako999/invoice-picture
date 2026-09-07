import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/admin";
import { InvoiceProcessingDashboard } from "./processing-dashboard";

export default async function InvoiceProcessingAdminPage() {
  if (!(await isCurrentUserAdmin())) redirect("/");
  return <InvoiceProcessingDashboard />;
}
