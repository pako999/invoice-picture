import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { posts } from "@/lib/blog";
import { BlogCover } from "@/components/blog-cover";

const post = posts.find((p) => p.slugEn === "best-invoice-scanner-apps-slovenia")!;

export const metadata = pageMetadata({
  title: post.titleEn,
  description: post.descriptionEn,
  slug: `blog/${post.slug}`,
  locale: "en",
  altPaths: { sl: `/blog/${post.slug}`, en: `/en/blog/${post.slugEn}` },
});

const faq = [
  ["What should I look for in an invoice scanner app?", "It depends on the goal. If you only need a clean PDF, a scanner app is enough. If you want accounting automation, look for invoice OCR, field validation and a reliable way to send data into your accounting workflow."],
  ["Is invoice scanning the same as invoice OCR?", "No. Scanning creates an image or PDF. Invoice OCR extracts structured fields such as invoice number, supplier, VAT, IBAN, totals and line items."],
  ["Does Slikaj Račun support Slovenian and English invoices?", "Yes. The OCR workflow is designed for Slovenian and English invoices and common international invoice terminology."],
  ["Can OCR data be sent to accounting software?", "Yes. You can forward the original file to an import email or use approved structured data in UBL 2.1, eSLOG 2.0 or JSON API workflows, depending on your configuration and plan."],
];

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: post.titleEn,
  description: post.descriptionEn,
  image: post.coverImage,
  datePublished: post.publishedAt,
  dateModified: "2026-09-17",
  inLanguage: "en",
  keywords: post.keywordEn,
  author: { "@type": "Organization", name: "Slikaj Račun" },
  publisher: { "@type": "Organization", name: "Slikaj Račun", logo: { "@type": "ImageObject", url: "https://www.posljiracun.si/logo-icon.svg" } },
  mainEntityOfPage: `https://www.posljiracun.si/en/blog/${post.slugEn}`,
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
};

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <BlogCover post={{ ...post, title: post.titleEn, coverAlt: post.coverAltEn, readingMinutes: post.readingMinutesEn }} badge="Updated 2026" badgeClassName="bg-orange-500/90 text-white border-0 hover:bg-orange-500/90" />

      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Link href="/en/blog" className="mb-8 inline-block text-sm text-blue-600 hover:underline">← All articles</Link>
        <div className="prose prose-slate prose-lg max-w-none rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12 prose-headings:font-bold prose-a:text-blue-600">
          <p className="lead">When people search for an <strong>invoice scanner app in Slovenia</strong>, they may need one of two very different tools: a scanner that creates a clean PDF, or an <strong>invoice OCR</strong> workflow that extracts accounting data and prepares it for downstream processing.</p>

          <h2>Scanner app vs invoice OCR</h2>
          <table>
            <thead><tr><th>Capability</th><th>Scanner app</th><th>Invoice OCR</th></tr></thead>
            <tbody>
              <tr><td>Create image / PDF</td><td>Yes</td><td>Yes</td></tr>
              <tr><td>Extract invoice number and dates</td><td>No</td><td>Yes</td></tr>
              <tr><td>Extract VAT, IBAN and totals</td><td>No</td><td>Yes</td></tr>
              <tr><td>Extract line items</td><td>No</td><td>Yes</td></tr>
              <tr><td>Validate accounting totals</td><td>No</td><td>Yes</td></tr>
              <tr><td>Prepare UBL/eSLOG/API data</td><td>No</td><td>Yes</td></tr>
            </tbody>
          </table>

          <h2>1. Slikaj Račun: scanning + invoice OCR + accounting workflow</h2>
          <p>Slikaj Račun is built for incoming invoices. Users can upload a PDF, photo or multiple documents, then use the same workflow for archiving, forwarding and AI invoice extraction.</p>
          <p>The system can extract invoice number, dates, supplier and buyer details, VAT IDs, IBAN, net amount, VAT, gross total, VAT breakdown and line items. The workflow supports Slovenian and English invoices.</p>
          <ul>
            <li>invoice data extraction from PDFs and images,</li>
            <li>validation of totals, VAT and IBAN,</li>
            <li>manual review for low-confidence documents,</li>
            <li>multi-company routing,</li>
            <li>forwarding original invoices to accounting import emails,</li>
            <li>structured delivery through UBL, eSLOG or JSON API.</li>
          </ul>
          <p>See the dedicated <Link href="/en/invoice-ocr-slovenia">Invoice OCR in Slovenia</Link> page for the complete workflow.</p>

          <h2>2. Microsoft Lens: strong PDF capture, manual accounting workflow</h2>
          <p>Microsoft Lens is useful when you need a clean scan. It handles cropping and perspective correction well, but it is not an accounting workflow by itself. You still need to decide where the document goes and how invoice data is entered into your accounting system.</p>

          <h2>3. Adobe Scan: high-quality general document scanning</h2>
          <p>Adobe Scan is a capable document scanner and works well when PDF quality is the main requirement. For Slovenian accounting operations, the remaining question is still how the document and its structured data reach your accounting process.</p>

          <h2>4. International receipt-capture platforms</h2>
          <p>Receipt-capture products such as Dext and similar tools focus on extraction and integrations with international accounting ecosystems. When comparing them for Slovenia, check support for your accounting platform, invoice languages, export formats and multi-company workflows.</p>

          <h2>5. Phone camera + email</h2>
          <p>The simplest approach is taking a photo and emailing it manually. It can work for very small invoice volumes, but it does not solve structured extraction, validation, duplicate checks or reliable multi-company routing.</p>

          <h2>Which option fits your use case?</h2>
          <ul>
            <li><strong>Need only a clean PDF:</strong> use a general scanner app.</li>
            <li><strong>Need reusable invoice fields:</strong> use invoice OCR.</li>
            <li><strong>Receive Slovenian and English invoices:</strong> verify both language workflows.</li>
            <li><strong>Accounting firm with many clients:</strong> prioritise multi-company routing and bulk upload.</li>
            <li><strong>Need automation:</strong> look for UBL, eSLOG or API delivery in addition to OCR.</li>
          </ul>

          <h2>How the Slikaj Račun OCR workflow works</h2>
          <ol>
            <li>Upload an invoice PDF or image.</li>
            <li>The system extracts and normalises invoice fields.</li>
            <li>VAT, IBAN, totals and possible duplicates are checked.</li>
            <li>Uncertain documents are moved to human review.</li>
            <li>Approved invoices continue through the configured accounting workflow.</li>
          </ol>
          <p>For companies already using local accounting systems, see <Link href="/en/integrations">accounting integrations in Slovenia</Link>.</p>

          <h2>Frequently asked questions</h2>
          {faq.map(([q, a]) => <section key={q}><h3>{q}</h3><p>{a}</p></section>)}

          <div className="not-prose mt-10 rounded-2xl bg-slate-950 p-7 text-white">
            <h2 className="text-2xl font-black">Test OCR on a real invoice</h2>
            <p className="mt-2 text-slate-300">Instead of comparing scanner apps only, upload an invoice and review which accounting fields can be extracted and validated.</p>
            <Link href="/en/sign-up" className="mt-5 inline-flex rounded-xl bg-white px-5 py-3 font-bold text-slate-950">Try Slikaj Račun</Link>
          </div>
        </div>

        <aside className="mt-12 border-t border-slate-200 pt-8">
          <h2 className="mb-4 text-lg font-semibold">Related pages</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/en/invoice-ocr-slovenia" className="text-blue-600 hover:underline">Invoice OCR in Slovenia →</Link></li>
            <li><Link href="/en/integrations" className="text-blue-600 hover:underline">Accounting integrations →</Link></li>
            <li><Link href="/en/blog/minimax-email-invoice-import" className="text-blue-600 hover:underline">Minimax OCR and email invoice import →</Link></li>
          </ul>
        </aside>
      </article>
    </div>
  );
}
