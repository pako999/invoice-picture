import { Badge } from "@/components/ui/badge";
import { DeleteAccountForm } from "@/components/delete-account-form";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Izbris uporabniškega računa",
  description:
    "Trajno izbrišite svoj uporabniški račun in vse povezane podatke (poslane račune, podjetja, e-naslove). Skladno z GDPR in zahtevami Google Play.",
  slug: "izbrisi-racun",
});

export default function IzbrisiRacunPage() {
  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <Badge className="mb-4 bg-rose-100 text-rose-700 hover:bg-rose-200 border-0">
            Nevarno območje
          </Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-4 font-bold">
            Izbris uporabniškega računa
          </h1>
          <p className="text-lg text-slate-600">
            Tukaj lahko trajno izbrišete svoj račun in vse povezane podatke.
          </p>
        </div>

        <DeleteAccountForm locale="sl" />
      </div>
    </div>
  );
}
