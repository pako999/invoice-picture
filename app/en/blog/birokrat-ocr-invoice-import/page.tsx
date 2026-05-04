import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { posts } from "@/lib/blog";
import { BlogCover } from "@/components/blog-cover";

const post = posts.find((p) => p.slugEn === "birokrat-ocr-invoice-import")!;

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
      name: "How do I activate OCR in Birokrat?",
      acceptedAnswer: { "@type": "Answer", text: "In Birokrat open Settings → Received invoices by email → Activate OCR. After activation the system assigns you an email address you send your invoice photos to." },
    },
    {
      "@type": "Question",
      name: "How long does Birokrat OCR processing take?",
      acceptedAnswer: { "@type": "Answer", text: "Typically 1–3 minutes. Birokrat OCR runs in the background — the photo arrives instantly, but text recognition takes some time." },
    },
    {
      "@type": "Question",
      name: "What if Birokrat misreads the amount?",
      acceptedAnswer: { "@type": "Answer", text: "You can correct the data before booking. Birokrat OCR provides suggestions — the user must confirm them. The original photo stays attached as proof." },
    },
    {
      "@type": "Question",
      name: "Can I send a PDF to Birokrat?",
      acceptedAnswer: { "@type": "Answer", text: "Yes. Birokrat accepts both photos (JPG, PNG) and PDF documents up to 10 MB." },
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
        badge="Birokrat"
        badgeClassName="bg-green-500/90 text-white border-0 hover:bg-green-500/90"
      />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/en/blog" className="text-sm text-blue-600 hover:underline mb-8 inline-block">← All articles</Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12 prose prose-slate prose-lg max-w-none prose-headings:scroll-mt-20 prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-code:font-mono prose-code:text-sm prose-li:my-1 prose-ul:my-4 prose-ol:my-4">
          <p className="lead">
            Birokrat OCR is a built-in feature that automatically reads data from photographed paper invoices. Once configured, you can photograph all your receipts on a phone and send them straight into your bookkeeping. This guide covers the full path from activation to your first booking.
          </p>

          <h2>What is Birokrat OCR invoice import?</h2>
          <p>
            Birokrat&rsquo;s OCR service receives an attachment (image or PDF) at a special email address and uses machine learning to recognise the key fields: supplier, date, invoice number, net amount, VAT, and total.
          </p>
          <p>
            The system prepares a draft for booking that the user only needs to confirm. With high-quality photographs Birokrat correctly recognises 85–95 % of fields.
          </p>

          <h2>Step 1: Activate Birokrat OCR</h2>
          <p>OCR is an optional feature in Birokrat. To enable it:</p>
          <ol>
            <li>In Birokrat, open <strong>Settings → Received invoices by email</strong>.</li>
            <li>Click <strong>Activate OCR service</strong>.</li>
            <li>The system assigns you a unique email address shaped like <code>invoices-firma@birokrat.si</code>.</li>
            <li>Copy the address — that&rsquo;s your OCR inbox.</li>
          </ol>
          <p>
            Activation is instant. The cost of the OCR service depends on your Birokrat plan — check the price list or contact Birokrat support.
          </p>

          <h2>Step 2: Send your first invoice</h2>
          <p>With the Slikaj Račun mobile app, the flow is:</p>
          <ol>
            <li>Paste your Birokrat email address into <Link href="/en/settings">Slikaj Račun Settings</Link>.</li>
            <li>Open <Link href="/en/scan">Scan</Link> and photograph the invoice.</li>
            <li>The app optimises the photo (resize, contrast) and forwards it to Birokrat.</li>
            <li>Within 1–3 minutes a new entry appears in Birokrat under &ldquo;Received invoices&rdquo;.</li>
            <li>Open the entry, review the suggested fields, and confirm the booking.</li>
          </ol>

          <h2>Step 3: Review the processed invoice</h2>
          <p>Under &ldquo;Received invoices&rdquo; in Birokrat a new card appears with:</p>
          <ul>
            <li>Supplier name (auto-detected)</li>
            <li>Supplier VAT number (cross-checked in the system)</li>
            <li>Invoice date</li>
            <li>Total amount and VAT</li>
            <li>The original photo / PDF as attachment</li>
          </ul>
          <p>You can edit any field before final booking. The photo stays attached for audit.</p>

          <h2>OCR quality: tips for better recognition</h2>
          <ul>
            <li><strong>White paper, good light.</strong> Best results on fresh, unprinted-over receipts.</li>
            <li><strong>Whole invoice in frame.</strong> Include the header (supplier) and footer (total).</li>
            <li><strong>No glare.</strong> Direct light or UV lamination causes reflections that confuse OCR.</li>
            <li><strong>PDFs beat photos.</strong> If you have a PDF invoice (e-invoice), send that — OCR is 99 % accurate.</li>
            <li><strong>Sanity-check on the phone.</strong> If the text is blurry on screen, OCR will struggle too.</li>
          </ul>

          <h2>Common problems and fixes</h2>

          <h3>OCR didn&rsquo;t recognise the supplier</h3>
          <p>
            The most common cause is a missing VAT number in the invoice header. With new suppliers Birokrat may not find the company in its database. Fix: pick the supplier manually from the Birokrat list. Next time the OCR will recognise them automatically.
          </p>

          <h3>The invoice is in Birokrat but with no fields filled in</h3>
          <p>
            The OCR service is likely overloaded — wait 5 minutes. If the data still doesn&rsquo;t arrive, open the invoice manually and enter values. The photo stays attached.
          </p>

          <h3>Birokrat won&rsquo;t accept the attachment</h3>
          <p>
            Attachment size is capped at 10 MB. Slikaj Račun automatically compresses photos to a sensible size (typically 500 KB–1 MB), so you&rsquo;ll never hit this in practice.
          </p>

          <h2>Frequently asked questions</h2>

          <h3>How do I activate OCR in Birokrat?</h3>
          <p>
            In Birokrat open <strong>Settings → Received invoices by email → Activate OCR</strong>. After activation the system assigns you an email address to send invoice photos to.
          </p>

          <h3>How long does Birokrat OCR processing take?</h3>
          <p>
            Typically 1–3 minutes. Birokrat OCR runs in the background — the photo arrives instantly, but text recognition takes a moment.
          </p>

          <h3>What if Birokrat misreads the amount?</h3>
          <p>
            You can correct the data before booking. Birokrat OCR gives <em>suggestions</em> — the user must confirm them. The original photo stays attached as proof.
          </p>

          <h3>Can I send a PDF to Birokrat?</h3>
          <p>
            Yes. Birokrat accepts both photos (JPG, PNG) and PDF documents up to 10 MB.
          </p>

          <h2>Next step</h2>
          <p>
            With Slikaj Račun you can test the full process for free (3 invoices/month). After configuring the Birokrat email address, send your first photo in under a minute.
          </p>
          <p>
            <Link
              href="/en/scan"
              className="not-prose inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 !text-white text-base h-12 px-6 rounded-xl font-semibold transition-colors no-underline"
            >
              📷 Send your first invoice to Birokrat
            </Link>
          </p>
        </div>

        <aside className="mt-12 pt-8 border-t border-slate-200">
          <h2 className="text-lg font-semibold mb-4">Related articles</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/en/blog/minimax-email-invoice-import" className="text-blue-600 hover:underline">Minimax email invoice import: complete 2026 guide →</Link></li>
            <li><Link href="/en/blog/pantheon-ebooks-ocr-guide" className="text-blue-600 hover:underline">Pantheon eBooks OCR: a guide to automatic invoice booking →</Link></li>
            <li><Link href="/en/blog/best-invoice-scanner-apps-slovenia" className="text-blue-600 hover:underline">Best invoice scanner apps in Slovenia (2026 review) →</Link></li>
          </ul>
        </aside>
      </article>
    </div>
  );
}
