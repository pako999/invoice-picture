import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { posts } from "@/lib/blog";
import { BlogCover } from "@/components/blog-cover";

const post = posts.find((p) => p.slugEn === "pantheon-ebooks-ocr-guide")!;

export const metadata = pageMetadata({
  title: post.titleEn,
  description: post.descriptionEn,
  slug: `blog/${post.slug}`,
  locale: "en",
  altPaths: { sl: `/blog/${post.slug}`, en: `/en/blog/${post.slugEn}` },
});

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: post.titleEn,
  description: post.descriptionEn,
  image: post.coverImage,
  datePublished: post.publishedAt,
  dateModified: post.publishedAt,
  inLanguage: "en",
  keywords: post.keywordEn,
  author: { "@type": "Organization", name: "Slikaj Račun" },
  publisher: {
    "@type": "Organization",
    name: "Slikaj Račun",
    logo: { "@type": "ImageObject", url: "https://www.posljiracun.si/logo-icon.svg" },
  },
  mainEntityOfPage: `https://www.posljiracun.si/en/blog/${post.slugEn}`,
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  inLanguage: "en",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Pantheon eBooks OCR?",
      acceptedAnswer: { "@type": "Answer", text: "Pantheon eBooks OCR is an add-on service for the Datalab Pantheon ERP that auto-reads data from invoice images or PDFs and prepares them for booking." },
    },
    {
      "@type": "Question",
      name: "How much does Pantheon eBooks OCR cost?",
      acceptedAnswer: { "@type": "Answer", text: "Pantheon eBooks OCR is billed via a monthly plan and per processed-document fee. The exact price depends on company size and your Datalab contract." },
    },
    {
      "@type": "Question",
      name: "Can Pantheon work with a mobile photographing app?",
      acceptedAnswer: { "@type": "Answer", text: "Yes. Pantheon has an email address for receiving documents. With a mobile app (e.g. Slikaj Račun) you can photograph an invoice and forward it to that address automatically." },
    },
    {
      "@type": "Question",
      name: "Which fields does Pantheon eBooks OCR recognise?",
      acceptedAnswer: { "@type": "Answer", text: "Supplier name, VAT number, invoice number and date, net amount, VAT amount, total and currency. With high-quality documents accuracy exceeds 90 %." },
    },
  ],
};

export default function Page() {
  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <BlogCover
        post={{ ...post, title: post.titleEn, coverAlt: post.coverAltEn, readingMinutes: post.readingMinutesEn }}
        badge="Pantheon"
        badgeClassName="bg-purple-500/90 text-white border-0 hover:bg-purple-500/90"
      />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/en/blog" className="text-sm text-blue-600 hover:underline mb-8 inline-block">← All articles</Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12 prose prose-slate prose-lg max-w-none prose-headings:scroll-mt-20 prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-code:font-mono prose-code:text-sm prose-li:my-1 prose-ul:my-4 prose-ol:my-4">
          <p className="lead">
            Pantheon eBooks OCR is an add-on for automatic document processing inside the Datalab Pantheon business system. With it, an incoming invoice gets photographed on a phone, sent to a dedicated email, and is booked within a minute — no manual entry of amounts, VAT numbers or dates.
          </p>

          <h2>What is Pantheon eBooks OCR?</h2>
          <p>
            Pantheon eBooks is a module inside Datalab Pantheon ERP focused on electronic document handling. Its OCR capability reads text from scanned or photographed documents and ties it to the supplier directory, chart of accounts and booking process.
          </p>
          <p>
            In practice: you forward an invoice image to a special email address, the system extracts data in the background and prepares a booking draft that the user only confirms.
          </p>

          <h2>How to set up Pantheon eBooks OCR</h2>
          <p>For most companies this is a two-step process — initial technical setup by your Datalab partner, then user-side configuration inside Pantheon:</p>
          <ol>
            <li><strong>Order the service.</strong> Contact your Datalab representative. eBooks OCR isn&rsquo;t included in the base Pantheon plan — it must be ordered separately.</li>
            <li><strong>Activation.</strong> After the contract is signed you&rsquo;ll get a unique email address for receiving documents.</li>
            <li><strong>Configure rules.</strong> In Pantheon you decide who has access to incoming documents, how each invoice type is handled, which suppliers are pre-listed.</li>
            <li><strong>Test.</strong> Send a text-based PDF first — the easiest case for OCR. Verify the data is recognised correctly.</li>
          </ol>

          <h2>What Pantheon eBooks OCR recognises</h2>
          <p>The system extracts:</p>
          <ul>
            <li>Supplier name and VAT number</li>
            <li>Invoice number and date</li>
            <li>Date of supply / service performed</li>
            <li>Total net amount</li>
            <li>VAT rate and amount</li>
            <li>Total payable</li>
            <li>Reference / sklic</li>
            <li>Payment currency</li>
          </ul>
          <p>
            Each field in the booking draft is tagged with a confidence score. Anything under 80 % is flagged for the user to confirm.
          </p>

          <h2>Sending photographed invoices into Pantheon</h2>
          <p>With the Slikaj Račun mobile app, setup takes a minute:</p>
          <ol>
            <li>In <Link href="/en/settings">Slikaj Račun Settings</Link> add your Pantheon email address for incoming documents.</li>
            <li>Open <Link href="/en/scan">Scan</Link> and photograph the invoice.</li>
            <li>The app optimises the image (1600px max, JPEG quality 80) and sends it.</li>
            <li>Pantheon eBooks shows a new document under &ldquo;Received attachments&rdquo; in 1–5 minutes.</li>
            <li>Click the document, review the booking draft, confirm.</li>
          </ol>

          <h2>Tips for maximum accuracy</h2>
          <ul>
            <li><strong>PDFs always beat photos.</strong> If the invoice is digital (e-invoice, PDF from email), send the original — OCR hits 99 % accuracy.</li>
            <li><strong>High resolution.</strong> Sub-1000px photos are too soft for reliable OCR. Slikaj Račun auto-compresses to 1600px (the sweet spot).</li>
            <li><strong>Direct lighting.</strong> Not under a window with the desk shadow — use a flat, well-lit surface.</li>
            <li><strong>No deformation.</strong> Pocket-folded invoices wrinkle — flatten them before photographing.</li>
            <li><strong>One invoice per photo.</strong> Multiple invoices in one frame confuse OCR — send each separately.</li>
          </ul>

          <h2>Pantheon eBooks OCR vs other Slovenian programs</h2>
          <p>Compared with Minimax and Birokrat OCR, Pantheon eBooks has two advantages and one drawback:</p>
          <ul>
            <li><strong>+</strong> Deeper integration with the supplier directory and chart of accounts — the system already knows which account to use on first match.</li>
            <li><strong>+</strong> Better suited to larger companies — approval workflows, multi-stage confirmations, audit trails.</li>
            <li><strong>−</strong> Extra cost. Minimax and Birokrat include OCR in the plan; Pantheon is an add-on.</li>
          </ul>

          <h2>Frequently asked questions</h2>
          <h3>What is Pantheon eBooks OCR?</h3>
          <p>Pantheon eBooks OCR is an add-on service for the Datalab Pantheon ERP that auto-reads data from invoice images or PDFs and prepares them for booking.</p>

          <h3>How much does Pantheon eBooks OCR cost?</h3>
          <p>Pantheon eBooks OCR is billed via a monthly plan and per processed-document fee. The exact price depends on company size and your Datalab contract.</p>

          <h3>Can Pantheon work with a mobile photographing app?</h3>
          <p>Yes. Pantheon has an email address for receiving documents. With a mobile app (e.g. Slikaj Račun) you can photograph an invoice and forward it to that address automatically.</p>

          <h3>Which fields does Pantheon eBooks OCR recognise?</h3>
          <p>Supplier name, VAT number, invoice number and date, net amount, VAT amount, total and currency. With high-quality documents accuracy exceeds 90 %.</p>

          <h2>Take the first step</h2>
          <p>
            If you already have an active Pantheon eBooks OCR service, Slikaj Račun is the fastest path to mobile invoice photography. Free for the first 3 invoices per month.
          </p>
          <p>
            <Link
              href="/en/scan"
              className="not-prose inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 !text-white text-base h-12 px-6 rounded-xl font-semibold transition-colors no-underline"
            >
              📷 Send your first invoice to Pantheon
            </Link>
          </p>
        </div>

        <aside className="mt-12 pt-8 border-t border-slate-200">
          <h2 className="text-lg font-semibold mb-4">Related articles</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/en/blog/minimax-email-invoice-import" className="text-blue-600 hover:underline">Minimax email invoice import: complete 2026 guide →</Link></li>
            <li><Link href="/en/blog/birokrat-ocr-invoice-import" className="text-blue-600 hover:underline">Birokrat OCR: how to set up email invoice import →</Link></li>
            <li><Link href="/en/blog/best-invoice-scanner-apps-slovenia" className="text-blue-600 hover:underline">Best invoice scanner apps in Slovenia (2026 review) →</Link></li>
          </ul>
        </aside>
      </article>
    </div>
  );
}
