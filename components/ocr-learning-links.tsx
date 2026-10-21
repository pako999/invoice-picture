import Link from "next/link";

const guides = [
  { sl: "Skeniranje računov s telefonom", en: "Scan invoices with your phone", slug: "skeniranje-racunov-s-telefonom", slugEn: "scan-invoices-with-phone", text: "Od berljive fotografije do pregleda OCR podatkov in dostave računovodji.", textEn: "From a readable photo to reviewed OCR fields and accounting delivery." },
  { sl: "Razdelitev PDF-ja z več računi", en: "Split a PDF with multiple invoices", slug: "razdelitev-pdf-vec-racunov", slugEn: "split-pdf-multiple-invoices", text: "Ohranite vse strani istega računa skupaj in preverite predlagane meje.", textEn: "Keep continuation pages together and review the proposed document boundaries." },
  { sl: "PDF račun v XML eSLOG", en: "Invoice PDF to XML", slug: "pdf-racun-v-xml-eslog", slugEn: "invoice-pdf-to-xml-eslog", text: "Pripravite in preverite podatke pred uvozom v računovodski program.", textEn: "Prepare and review structured data before importing it into accounting software." },
];
export function OcrLearningLinks({ locale = "sl" }: { locale?: "sl" | "en" }) {
  const en = locale === "en";
  return <section className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl">
    <h2 className="text-3xl font-extrabold tracking-tight text-slate-950">{en ? "Practical invoice scanning and OCR guides" : "Praktični vodniki za skeniranje računov in OCR"}</h2>
    <p className="mt-4 max-w-3xl text-slate-600">{en ? "Learn how to capture incoming invoices, review extracted data and prepare complete documents for accounting." : "Naučite se zajeti prejete račune, preveriti prebrane podatke in pripraviti celotne dokumente za računovodstvo."}</p>
    <div className="mt-8 grid gap-5 md:grid-cols-3">{guides.map(g => <Link key={g.slug} href={`${en ? "/en" : ""}/blog/${en ? g.slugEn : g.slug}`} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-400 hover:shadow-md"><h3 className="text-xl font-bold text-slate-950">{en ? g.en : g.sl}</h3><p className="mt-3 leading-relaxed text-slate-600">{en ? g.textEn : g.text}</p><span className="mt-5 inline-block font-semibold text-blue-700">{en ? "Read the guide" : "Preberite vodnik"} →</span></Link>)}</div>
    <Link href={en ? "/en/invoice-ocr-slovenia" : "/ocr-racunov"} className="mt-7 inline-block font-bold text-blue-700 hover:underline">{en ? "Explore invoice OCR and supported exports" : "Več o OCR računov in podprtih izvozih"} →</Link>
  </div></section>;
}
