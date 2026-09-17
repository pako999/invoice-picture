import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, FileSearch, ShieldCheck, Send, FileText, CheckCircle } from "lucide-react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Kako deluje OCR računov: naloži, preberi, preveri, pošlji",
  description: "Kako deluje Slikaj Račun: naložite PDF ali fotografijo, OCR prebere podatke, sistem preveri DDV, IBAN in zneske, nato račun potrdite in pošljete naprej.",
  slug: "kako-deluje",
});

export default function KakoDeluje() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <Badge className="mb-4 border-0 bg-blue-100 text-blue-700 hover:bg-blue-200">Kako deluje</Badge>
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl">Od PDF-ja ali fotografije do preverjenih podatkov računa</h1>
          <p className="mx-auto max-w-3xl text-xl text-slate-600">Slikaj Račun lahko deluje kot preprost pošiljatelj originalnega dokumenta ali kot AI OCR workflow, ki račun prebere, validira in pripravi za nadaljnjo dostavo.</p>
        </div>

        <div className="space-y-10">
          <StepCard number="1" icon={<Camera className="h-8 w-8 text-blue-600" />} title="Naložite ali fotografirajte račun" description="PDF, slika ali strukturiran dokument">
            <p>Naložite račun iz telefona ali računalnika. Podprti so PDF, JPG, PNG, WEBP in strukturirani XML dokumenti. Pri večjem obsegu lahko naložite več dokumentov naenkrat.</p>
            <p>Če vodite več podjetij, pred nalaganjem izberete pravo podjetje, da se dokument obdeluje v pravem kontekstu.</p>
          </StepCard>

          <StepCard number="2" icon={<FileSearch className="h-8 w-8 text-indigo-600" />} title="OCR prebere podatke računa" description="Ekstrakcija slovenskih in angleških računov">
            <p>Sistem iz računa prebere ključna polja, kot so številka računa, datumi, dobavitelj, kupec, DDV številke, IBAN, neto, DDV, bruto znesek in postavke.</p>
            <p>Če dokument že vsebuje strukturiran XML ali uporaben podatkovni sloj, ga sistem lahko uporabi pred klasičnim OCR. Več o ekstrakciji je na strani <Link href="/ocr-racunov" className="font-semibold text-blue-700 hover:underline">OCR računov</Link>.</p>
          </StepCard>

          <StepCard number="3" icon={<ShieldCheck className="h-8 w-8 text-emerald-600" />} title="Sistem preveri račun" description="Validacija pred avtomatizacijo">
            <p>Prebrani podatki niso samo prikazani. Preverijo se matematični zneski, DDV, IBAN, obvezna računovodska polja in možni duplikati. Če zanesljivost ni dovolj visoka, račun dobi status za pregled.</p>
            <p>V OCR pregledu uporabnik vidi originalni dokument in izluščene podatke drug ob drugem, nato jih popravi ali potrdi. Spremembe ostanejo v revizijski sledi.</p>
          </StepCard>

          <StepCard number="4" icon={<Send className="h-8 w-8 text-purple-600" />} title="Potrjeni račun pošljete naprej" description="Email, UBL, eSLOG ali API">
            <p>Najenostavneje je originalni PDF ali sliko poslati na uvozni email računovodskega programa. Pri strukturiranem načinu pa se potrjeni podatki lahko pripravijo za UBL 2.1, eSLOG 2.0 ali JSON API dostavo.</p>
            <p>Na strani <Link href="/integracije" className="font-semibold text-blue-700 hover:underline">integracije z računovodskimi programi</Link> je prikazano, kako se Slikaj Račun vključi v obstoječi računovodski proces.</p>
          </StepCard>
        </div>

        <div className="mt-16 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
          <h2 className="mb-8 text-center text-2xl font-semibold">Celoten proces</h2>
          <div className="flex flex-wrap items-center justify-center gap-4 text-center">
            <Flow icon={<FileText className="h-12 w-12 text-blue-600" />} label="Prejeti račun" />
            <Arrow />
            <Flow icon={<Camera className="h-12 w-12 text-green-600" />} label="Upload / slika" />
            <Arrow />
            <Flow icon={<FileSearch className="h-12 w-12 text-indigo-600" />} label="OCR ekstrakcija" />
            <Arrow />
            <Flow icon={<ShieldCheck className="h-12 w-12 text-amber-600" />} label="Validacija" />
            <Arrow />
            <Flow icon={<CheckCircle className="h-12 w-12 text-teal-600" />} label="Potrditev / dostava" />
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link href="/sign-up" className="inline-flex rounded-xl bg-slate-950 px-6 py-3 font-bold text-white hover:bg-slate-800">Preizkusi z enim računom</Link>
        </div>
      </div>
    </div>
  );
}

function StepCard({ number, icon, title, description, children }: { number: string; icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return <Card className="border-slate-200"><CardHeader><div className="mb-4 flex items-center gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-100">{icon}</div><div><p className="text-xs font-black uppercase tracking-widest text-blue-700">Korak {number}</p><CardTitle className="text-2xl">{title}</CardTitle><CardDescription>{description}</CardDescription></div></div></CardHeader><CardContent className="space-y-4 text-slate-700">{children}</CardContent></Card>;
}

function Flow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <div className="min-w-[120px] flex-1">{icon}<p className="mt-2 text-sm font-medium">{label}</p></div>;
}

function Arrow() { return <div className="text-2xl text-slate-400">→</div>; }
