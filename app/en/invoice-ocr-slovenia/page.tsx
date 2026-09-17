import Link from "next/link";
import { CheckCircle2, FileSearch, Languages, ShieldCheck, Workflow, ArrowRight } from "lucide-react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Invoice OCR in Slovenia: AI data extraction for invoices",
  description: "Invoice OCR for Slovenian businesses and accounting firms. Extract invoice data from PDF or images, validate VAT, IBAN and totals, then export via UBL, eSLOG or API.",
  slug: "invoice-ocr-slovenia",
  locale: "en",
  altPaths: { sl: "/ocr-racunov", en: "/en/invoice-ocr-slovenia" },
});

const faq = [
  ["What is invoice OCR?", "Invoice OCR converts a PDF or invoice image into structured accounting data. Slikaj Račun extracts key fields, validates them and sends uncertain documents to a review queue."],
  ["Which invoice fields can be extracted?", "Invoice number, issue and due dates, supplier and buyer details, VAT IDs, IBAN, currency, net amount, VAT, gross amount, VAT breakdown and line items are among the supported fields."],
  ["Does it work with Slovenian and English invoices?", "Yes. The workflow is designed for invoices in Slovenian and English and also recognises common international invoice labels."],
  ["Which file formats are supported?", "PDF, JPG, PNG, WEBP and structured XML documents are supported. Structured XML is parsed directly when possible, avoiding unnecessary OCR processing."],
  ["What happens when OCR confidence is low?", "The invoice is moved to manual review. The original document and extracted fields are shown side by side so the user can correct and approve the result."],
  ["How can extracted data be sent to accounting software?", "You can forward the original file to an accounting import email or deliver approved structured data as UBL 2.1, eSLOG 2.0 or JSON through an API workflow, depending on the configured plan and delivery method."],
];

const fields = [
  "invoice number and purchase-order reference",
  "issue date, service date and due date",
  "supplier, buyer, addresses and VAT IDs",
  "IBAN, BIC, payment reference and payment terms",
  "net, VAT, gross and amount due",
  "VAT breakdown by tax rate",
  "line items, quantity, unit price, discounts and VAT",
  "currency and document type",
];

export default function InvoiceOcrSloveniaPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Slikaj Račun",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: ["sl-SI", "en"],
    description: "Invoice OCR and data extraction for Slovenian businesses and accounting workflows.",
    url: "https://www.posljiracun.si/en/invoice-ocr-slovenia",
    featureList: ["invoice OCR", "invoice data extraction", "VAT and IBAN validation", "human review", "UBL 2.1", "eSLOG 2.0", "JSON API"],
    publisher: { "@type": "Organization", name: "Sport Group d.o.o." },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.posljiracun.si/en" },
      { "@type": "ListItem", position: 2, name: "Invoice OCR Slovenia", item: "https://www.posljiracun.si/en/invoice-ocr-slovenia" },
    ],
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <section className="mx-auto max-w-6xl px-4 pb-14 pt-20 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-wider text-blue-700">AI invoice OCR for Slovenia</p>
          <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">Invoice OCR and data extraction for Slovenian businesses</h1>
          <p className="mt-6 text-xl leading-relaxed text-slate-600">Upload an invoice PDF or image. Slikaj Račun extracts accounting fields, validates totals, VAT and IBAN, and prepares the document for approval or automated downstream processing. The OCR workflow supports <strong>Slovenian and English invoices</strong>.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/en/sign-up" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white hover:bg-slate-800">Try invoice OCR <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/en/integrations" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-900 hover:bg-slate-50">Accounting integrations</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 pb-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <Feature icon={<FileSearch className="h-6 w-6" />} title="Extract invoice data" text="Turn PDF, image or XML invoices into a consistent structured accounting model." />
        <Feature icon={<ShieldCheck className="h-6 w-6" />} title="Validate before export" text="Check totals, VAT, IBAN, duplicate invoices and required accounting fields." />
        <Feature icon={<Languages className="h-6 w-6" />} title="Slovenian + English" text="Designed for local Slovenian invoices and English-language supplier invoices." />
        <Feature icon={<Workflow className="h-6 w-6" />} title="Deliver downstream" text="Forward originals or deliver approved data as UBL, eSLOG or JSON API." />
      </section>

      <article className="mx-auto max-w-4xl px-4 pb-20 sm:px-6 lg:px-8 prose prose-slate prose-lg max-w-none">
        <h2>Which invoice fields can OCR extract?</h2>
        <p>A basic document scanner only creates a PDF or image. <strong>Invoice OCR</strong> goes further by extracting the accounting data your finance team or accounting platform needs.</p>
        <ul>{fields.map((field) => <li key={field}><CheckCircle2 className="mr-2 inline h-4 w-4 text-emerald-600" />{field}</li>)}</ul>

        <h2>From incoming invoice to validated accounting data</h2>
        <p>Slikaj Račun first checks whether a document already contains structured data. When usable XML or an embedded structured layer exists, it can be used before invoking OCR. Standard PDFs and images go through invoice extraction.</p>
        <ol>
          <li><strong>Upload.</strong> Select a company and upload one or multiple invoices.</li>
          <li><strong>Extraction.</strong> Invoice fields are extracted and normalised into one schema.</li>
          <li><strong>Validation.</strong> Totals, VAT, IBAN, required fields and possible duplicates are checked.</li>
          <li><strong>Review.</strong> High-confidence invoices can continue automatically; uncertain results are sent to human review.</li>
          <li><strong>Delivery.</strong> Approved data is sent through the accounting workflow you configured.</li>
        </ol>

        <h2>Invoice OCR for Slovenian and English documents</h2>
        <p>Companies in Slovenia often receive invoices from both domestic and international suppliers. The system therefore needs to understand Slovenian labels such as <em>davčna številka, rok plačila, sklic</em> as well as English labels such as <em>invoice number, VAT, due date, net amount</em> and <em>total amount</em>.</p>
        <p>This makes the same incoming-invoice workflow usable for local suppliers and English-language invoices instead of maintaining separate processes.</p>

        <h2>Validation matters more than raw OCR text</h2>
        <p>Invoice automation should not simply copy text from a document. Accounting data needs consistency checks. Slikaj Račun can verify relationships between net, VAT and gross amounts, validate IBAN structure, compare VAT breakdowns with invoice totals and flag possible duplicate invoices.</p>
        <p>When confidence is not high enough, the invoice is not silently pushed downstream. It is moved to the review interface where the original document and extracted fields are displayed side by side.</p>

        <h2>UBL, eSLOG and API delivery</h2>
        <p>After approval, invoice data can be used in a structured workflow. Slikaj Račun supports forwarding the original document to an accounting import email and structured delivery via <strong>UBL 2.1, eSLOG 2.0 or JSON API</strong>. See the <Link href="/en/integrations">accounting integrations</Link> page for the workflow options.</p>

        <h2>Invoice OCR for accounting firms</h2>
        <p>Accounting firms can manage multiple client companies from one user account. Each company can have a separate destination email or delivery configuration, reducing the risk of routing an invoice to the wrong client and making bulk document intake easier to standardise.</p>

        <h2>Invoice OCR vs a simple scanner app</h2>
        <p>If you only need a clean PDF, a scanner app may be enough. If you need reusable invoice data, validation and accounting-system delivery, you need OCR and a structured workflow. You can also read our <Link href="/en/blog/best-invoice-scanner-apps-slovenia">invoice scanner app comparison for Slovenia</Link>.</p>

        <h2>Invoice OCR FAQ</h2>
        {faq.map(([q, a]) => <section key={q}><h3>{q}</h3><p>{a}</p></section>)}

        <div className="not-prose mt-12 rounded-2xl bg-blue-700 p-8 text-white">
          <h2 className="text-2xl font-black">Test OCR on one of your invoices</h2>
          <p className="mt-2 text-blue-100">Upload a PDF or image and review the extracted fields before sending data to your accounting workflow.</p>
          <Link href="/en/sign-up" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-blue-800">Create an account <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </article>
    </main>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">{icon}</div><h2 className="font-black text-slate-950">{title}</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p></div>;
}
