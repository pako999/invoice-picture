"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  FileText,
  Files,
  Loader2,
  Send,
  UploadCloud,
} from "lucide-react";

const companies = [
  ["Matej Gornik s.p.", "materj@gornik-sp.com"],
  ["Podjetje 1 d.o.o.", "podjetje1@icloud.com"],
  ["Podjetje XY", "xy@gmail.com"],
  ["Podjetje 3 d.o.o.", "3@podjetje.com"],
];

const docs = [
  "2026-07-01_Invoice-QTJE1DQO-0006.pdf",
  "2026-07-01_Receipt-2176-7312.pdf",
  "2026-07-02_5616552034.pdf",
];

export function HomeBusinessHero() {
  return (
    <section className="business-home-hero relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-white via-blue-50/70 to-indigo-50">
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,#dbeafe_1px,transparent_1px),linear-gradient(to_bottom,#dbeafe_1px,transparent_1px)] [background-size:32px_32px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" />
      <div className="absolute -left-24 top-20 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:px-8 lg:pb-24 lg:pt-20">
        <div className="max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
            <Building2 className="h-4 w-4" />
            Za podjetja in računovodske servise
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight text-slate-950 sm:text-6xl lg:text-[4.2rem] lg:leading-[1.02]">
            Upravljajte več podjetij <span className="text-blue-600">z enim računom</span>
          </h1>

          <p className="mt-7 max-w-lg text-xl leading-relaxed text-slate-600">
            Naložite <strong className="text-slate-900">100+ računov naenkrat</strong>. Vsak dokument se ločeno pošlje na pravi e-mail izbranega podjetja za OCR obdelavo.
          </p>

          <div className="mt-8 space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700"><Building2 className="h-5 w-5" /></div>
              <div><div className="font-bold text-slate-950">Več podjetij</div><div className="text-sm text-slate-500">Ena prijava za vsa vaša podjetja</div></div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700"><Files className="h-5 w-5" /></div>
              <div><div className="font-bold text-slate-950">100+ računov naenkrat</div><div className="text-sm text-slate-500">Hitra množična obdelava dokumentov</div></div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700"><Send className="h-5 w-5" /></div>
              <div><div className="font-bold text-slate-950">Ločeno pošiljanje za OCR</div><div className="text-sm text-slate-500">Vsak dokument na pravi e-mail</div></div>
            </div>
          </div>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/sign-up" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
              Preizkusi za podjetja <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/kako-deluje" className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 font-semibold text-slate-800 transition hover:bg-slate-50">
              Poglej, kako deluje
            </Link>
          </div>
        </div>

        <div className="relative mx-auto min-h-[650px] w-full max-w-[760px] lg:min-h-[690px]">
          <div className="absolute left-0 top-8 z-20 w-[62%] rounded-[26px] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-300/40 sm:p-5">
            <div className="mb-1 text-xl font-extrabold text-slate-950">Pošlji račun</div>
            <div className="mb-4 text-xs text-slate-500">Fotografirajte ali naložite račun in ga pošljite z enim klikom.</div>
            <div className="rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500"><span>Podjetje</span><span className="text-blue-600">Uredi →</span></div>
              <div className="p-2">
                {companies.map(([name, email], i) => (
                  <div key={name} className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 ${i === 1 ? "border border-blue-200 bg-blue-50" : ""}`}>
                    <span className={`h-4 w-4 rounded-full border-2 ${i === 1 ? "border-blue-500 bg-blue-500 ring-4 ring-blue-100" : "border-slate-300"}`} />
                    <div className="min-w-0"><div className="truncate text-xs font-bold text-slate-900">{name}</div><div className="truncate text-[10px] text-slate-400">{email}</div></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Vsi dokumenti so bili poslani — Podjetje 1 d.o.o.!</div>
            <div className="mt-3 flex h-32 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 text-center">
              <UploadCloud className="mb-2 h-7 w-7 text-blue-600" />
              <div className="text-xs font-bold text-slate-700">Povleci dokumente sem</div>
              <div className="mt-1 text-[10px] text-slate-400">do 500 dokumentov · JPG · PNG · WEBP · PDF</div>
              <div className="mt-1 text-[10px] font-medium text-blue-600">Vsak dokument se pošlje kot ločen email.</div>
            </div>
          </div>

          <div className="absolute right-0 top-0 z-30 w-[45%] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-900"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">1</span> Izberi dokumente</div>
            <div className="rounded-lg bg-blue-600 p-2 text-[8px] leading-4 text-white">
              <div>▣ 2026-07-01_Invoice-0006.pdf</div><div>▣ 2026-07-01_Receipt-7312.pdf</div><div>▣ 2026-07-02_5616552034.pdf</div><div>… in še 29 dokumentov</div>
            </div>
            <div className="mt-2 text-right text-[9px] font-semibold text-slate-500">32 izbranih dokumentov</div>
          </div>

          <div className="absolute right-0 top-[205px] z-30 w-[48%] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-900"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">2</span> Pregled in priprava</div>
            <div className="mb-2 flex items-center justify-between text-[9px]"><span className="font-semibold text-slate-600">Izbranih dokumentov: 32/500</span><span className="text-red-500">Odstrani vse</span></div>
            <div className="space-y-1.5">
              {docs.map((d) => <div key={d} className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-2"><FileText className="h-4 w-4 shrink-0 text-red-400" /><span className="min-w-0 flex-1 truncate text-[8px] font-semibold">{d}</span><span className="text-slate-400">×</span></div>)}
            </div>
            <div className="mt-3 rounded-lg bg-blue-600 py-2 text-center text-[10px] font-bold text-white">📤 Pošlji 32 dokumentov</div>
          </div>

          <div className="absolute bottom-[112px] right-5 z-30 w-[42%] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">3</span> Pošiljanje</div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-5 text-center"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-blue-600" /><div className="text-xs font-bold text-blue-700">Pošiljam 5/32…</div><div className="mt-1 text-[9px] text-slate-500">Vsak dokument se pošlje posebej.</div></div>
          </div>

          <div className="absolute bottom-0 left-[31%] z-30 w-[38%] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">4</span> Uspešno</div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center"><span className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white"><Check className="h-5 w-5" /></span><div className="text-[10px] font-bold text-emerald-800">Vsi dokumenti so bili poslani!</div><div className="mt-1 text-[8px] text-emerald-700">32 dokumentov poslanih za OCR obdelavo.</div></div>
          </div>

          <div className="absolute bottom-0 left-0 z-20 w-[31%] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">5</span> Poslani računi</div>
            <div className="mb-2 flex gap-1"><span className="rounded-full bg-slate-900 px-2 py-1 text-[7px] text-white">Vsa podjetja</span><span className="rounded-full border px-2 py-1 text-[7px]">Podjetje 1</span></div>
            <div className="grid grid-cols-3 gap-1 text-center"><div className="rounded-lg bg-slate-50 p-2"><div className="font-bold">40</div><div className="text-[6px]">SKUPAJ</div></div><div className="rounded-lg bg-emerald-50 p-2 text-emerald-700"><div className="font-bold">40</div><div className="text-[6px]">POSLANO</div></div><div className="rounded-lg bg-red-50 p-2 text-red-600"><div className="font-bold">0</div><div className="text-[6px]">NAPAKE</div></div></div>
          </div>

          <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full text-blue-500" viewBox="0 0 760 690" fill="none" aria-hidden="true">
            <path d="M470 150 C540 135 570 140 608 167" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="7 8" />
            <path d="M690 180 C730 215 728 250 705 280" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="M690 470 C725 500 708 535 682 552" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="M500 625 C448 648 398 650 350 635" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeDasharray="7 7" />
          </svg>
        </div>
      </div>
    </section>
  );
}
