import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { posts } from "@/lib/blog";
import { BlogCover } from "@/components/blog-cover";

const post = posts.find((p) => p.slugEn === "minimax-email-invoice-import")!;

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
  author: { "@type": "Organization", name: "SlikajRačun" },
  publisher: {
    "@type": "Organization",
    name: "SlikajRačun",
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
      name: "What is the email address for invoice import in Minimax?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Every Minimax account gets a unique email address shaped like <unique-string>@minimax.si. You'll find it in Minimax under Settings → Automatic invoice processing.",
      },
    },
    {
      "@type": "Question",
      name: "Does Minimax automatically read data from invoice photos?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Yes. Minimax uses a built-in OCR service that reads the supplier, date, total amount and VAT directly from the photo. It works for JPG, PNG, PDF and most paper-receipt photographs.",
      },
    },
    {
      "@type": "Question",
      name: "How long does an invoice take to appear in Minimax after sending?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Typically 30 seconds to 2 minutes. OCR processing runs in the Minimax cloud and depends on current system load.",
      },
    },
    {
      "@type": "Question",
      name: "What if Minimax can't read my invoice?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "The most common causes are poor lighting and blurred text. Send a sharp photo with good light. If OCR still fails, you can enter the data manually inside Minimax — the photo stays attached as proof.",
      },
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
        badge="Minimax"
        badgeClassName="bg-blue-500/90 text-white border-0 hover:bg-blue-500/90"
      />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/en/blog" className="text-sm text-blue-600 hover:underline mb-8 inline-block">← All articles</Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12 prose prose-slate prose-lg max-w-none prose-headings:scroll-mt-20 prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-code:font-mono prose-code:text-sm prose-li:my-1 prose-ul:my-4 prose-ol:my-4">
          <p className="lead">
            Minimax email invoice import is the fastest way to digitise paper invoices. With one photograph sent to the right email address, the receipt is automatically booked into your bookkeeping. This guide walks through the entire setup, step by step, and shows how to send the first invoice.
          </p>

          <h2>What is Minimax email invoice import?</h2>
          <p>
            Minimax assigns you a unique email address that accepts invoice images and PDFs. The system recognises the attachments using OCR (Optical Character Recognition), extracts data such as supplier, date, total and VAT — and posts a received-invoice entry automatically.
          </p>
          <p>
            The whole process takes under a minute. No more manual typing, no transcribing receipts, no lost paper in a desk drawer.
          </p>

          <h2>Where do I find my Minimax email address?</h2>
          <ol>
            <li>In Minimax, navigate to <strong>Settings → Automatic invoice processing</strong>.</li>
            <li>Activate &ldquo;Receive invoices by email&rdquo; if it&rsquo;s not already enabled.</li>
            <li>The system assigns you a unique address shaped like <code>uniquestring@minimax.si</code>.</li>
            <li>Copy the address — that&rsquo;s your Minimax OCR inbox.</li>
          </ol>
          <p>
            Important: every user gets a unique email. Don&rsquo;t share it — anything sent to that address lands directly in your Minimax account.
          </p>

          <h2>How to send your first invoice</h2>
          <p>The fastest path is the SlikajRačun mobile app:</p>
          <ol>
            <li>In <Link href="/en/settings">app Settings</Link>, paste your Minimax email address.</li>
            <li>Open <Link href="/en/scan">Scan</Link> and photograph the paper invoice.</li>
            <li>Tap <strong>Send</strong>. The app optimises, compresses and emails the photo to Minimax.</li>
            <li>In Minimax the invoice appears under &ldquo;Automatically processed received invoices&rdquo; in 30 seconds to 2 minutes.</li>
            <li>Review the suggested data (amount, date, supplier — Minimax pre-fills these) and confirm the booking.</li>
          </ol>

          <h2>Tips for better OCR recognition</h2>
          <ul>
            <li><strong>Good lighting.</strong> Natural light by a window is ideal. Avoid hard shadows.</li>
            <li><strong>Flat surface.</strong> Crumpled or curved invoices read worse.</li>
            <li><strong>Whole receipt in frame.</strong> The supplier line is at the top — Minimax needs to see it.</li>
            <li><strong>Sharp photo.</strong> Wait for the camera to focus. Blur is the #1 cause of OCR failure.</li>
            <li><strong>No flash glare.</strong> Don&rsquo;t use the flash directly above the receipt — it creates a reflection patch.</li>
          </ul>

          <h2>What happens when Minimax can&rsquo;t read the data?</h2>
          <p>Even the best OCR isn&rsquo;t 100 % reliable. In that case:</p>
          <ol>
            <li>The invoice still arrives in Minimax under received documents.</li>
            <li>You enter the missing fields (amount, VAT) manually.</li>
            <li>The photo stays attached as proof.</li>
          </ol>
          <p>
            You don&rsquo;t lose the document — you just spend a bit more time on data entry. With high-quality photographs Minimax OCR recognises 90+ % of all data correctly.
          </p>

          <h2>Frequently asked questions</h2>

          <h3>What is the email address for invoice import in Minimax?</h3>
          <p>
            Every Minimax account gets a unique email address shaped like <code>&lt;unique-string&gt;@minimax.si</code>. You&rsquo;ll find it in Minimax under <strong>Settings → Automatic invoice processing</strong>.
          </p>

          <h3>Does Minimax automatically read data from invoice photos?</h3>
          <p>
            Yes. Minimax uses a built-in OCR service that reads the supplier, date, total amount and VAT directly from the photo. It works for <code>.jpg</code>, <code>.png</code>, <code>.pdf</code> and most paper-receipt photographs.
          </p>

          <h3>How long does an invoice take to appear in Minimax after sending?</h3>
          <p>
            Typically 30 seconds to 2 minutes. OCR processing runs in the Minimax cloud and depends on current system load.
          </p>

          <h3>What if Minimax can&rsquo;t read my invoice?</h3>
          <p>
            The most common causes are poor lighting and blurred text. Send a sharp photo with good light. If OCR still fails, you can enter the data manually inside Minimax — the photo stays attached as proof.
          </p>

          <h2>Take the first step</h2>
          <p>
            SlikajRačun is free for the first 3 invoices per month — enough to test the entire workflow. No credit card, no accounting-software registration on our side.
          </p>
          <p>
            <Link
              href="/en/scan"
              className="not-prose inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 !text-white text-base h-12 px-6 rounded-xl font-semibold transition-colors no-underline"
            >
              📷 Send your first invoice to Minimax
            </Link>
          </p>
        </div>

        <aside className="mt-12 pt-8 border-t border-slate-200">
          <h2 className="text-lg font-semibold mb-4">Related articles</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/en/blog/birokrat-ocr-invoice-import" className="text-blue-600 hover:underline">Birokrat OCR: how to set up email invoice import →</Link></li>
            <li><Link href="/en/blog/pantheon-ebooks-ocr-guide" className="text-blue-600 hover:underline">Pantheon eBooks OCR: a guide to automatic invoice booking →</Link></li>
            <li><Link href="/en/blog/best-invoice-scanner-apps-slovenia" className="text-blue-600 hover:underline">Best invoice scanner apps in Slovenia (2026 review) →</Link></li>
          </ul>
        </aside>
      </article>
    </div>
  );
}
