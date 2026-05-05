import { Badge } from "@/components/ui/badge";
import { DeleteAccountForm } from "@/components/delete-account-form";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Delete your account",
  description:
    "Permanently delete your account and all related data (sent invoices, companies, emails). GDPR-compliant and meets Google Play account-deletion requirements.",
  slug: "izbrisi-racun",
});

export default function DeleteAccountPage() {
  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <Badge className="mb-4 bg-rose-100 text-rose-700 hover:bg-rose-200 border-0">
            Danger zone
          </Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-4 font-bold">
            Delete your account
          </h1>
          <p className="text-lg text-slate-600">
            Permanently remove your account and all related data.
          </p>
        </div>

        <DeleteAccountForm locale="en" />
      </div>
    </div>
  );
}
