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

export default function Page() {
  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <BlogCover
        post={{ ...post, title: post.titleEn, coverAlt: post.coverAltEn, readingMinutes: post.readingMinutesEn }}
        badge="Comparison"
        badgeClassName="bg-orange-500/90 text-white border-0 hover:bg-orange-500/90"
      />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/en/blog" className="text-sm text-blue-600 hover:underline mb-8 inline-block">← All articles</Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12 prose prose-slate prose-lg max-w-none prose-headings:scroll-mt-20 prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-code:font-mono prose-code:text-sm prose-li:my-1 prose-ul:my-4 prose-ol:my-4">
          <p className="lead">
            Looking for a mobile app that scans paper invoices and forwards them automatically to your accounting software? In Slovenia there are several options — each with strengths and weaknesses. Here&rsquo;s an honest 2026 comparison of 6 apps including pricing, supported programs and when to pick which one.
          </p>

          <h2>What to look for in an invoice-scanning app</h2>
          <p>Before you compare, check these 5 things — they decide whether the app actually saves you time:</p>
          <ol>
            <li><strong>Support for your accounting program.</strong> Minimax, Birokrat, Pantheon, SAOP, E-računi, Metakocka — each has its own import email. The app must know how to send to that address.</li>
            <li><strong>Capture speed.</strong> From the moment you pull out the phone to confirmed send: ideally 5–10 seconds.</li>
            <li><strong>Photo optimisation.</strong> The image must be ready for OCR — compressed, sharp, undistorted. Bad apps send a 5 MB JPEG that the OCR can&rsquo;t handle.</li>
            <li><strong>Archive and search.</strong> Sometimes you need to verify whether you sent a particular invoice. Without an archive that&rsquo;s impossible.</li>
            <li><strong>Price.</strong> Free plans have caps — check how many invoices you actually send per month and compare with the subscription.</li>
          </ol>

          <h2>1. Slikaj Račun (recommended for Slovenia)</h2>
          <p><strong>Price:</strong> free up to 3 invoices/month, €6.90/month for unlimited, €17.90/month for PRO (multiple companies).</p>
          <p><strong>Supported programs:</strong> Minimax, Birokrat, Pantheon, SAOP, E-računi, Metakocka — and any accounting program with email-based invoice import.</p>
          <p><strong>Pros:</strong></p>
          <ul>
            <li>Built in Slovenia for Slovenian accounting programs — UI and support in Slovenian (and English).</li>
            <li>iOS and Android apps, plus a web version for desktop.</li>
            <li>The PRO plan supports unlimited companies with separate OCR addresses (ideal for accounting firms).</li>
            <li>Archive with preview and search, no time limits.</li>
            <li>Automatic image compression to a size that OCR reads correctly.</li>
          </ul>
          <p><strong>Cons:</strong></p>
          <ul>
            <li>Young service (launched 2026) — smaller user base than the established international competitors.</li>
            <li>Free plan capped at 3 invoices/month.</li>
          </ul>

          <h2>2. Microsoft Lens + manual sending</h2>
          <p><strong>Price:</strong> free.</p>
          <p><strong>Pros:</strong></p>
          <ul>
            <li>Free forever.</li>
            <li>Excellent scan quality (auto-crop, perspective correction).</li>
          </ul>
          <p><strong>Cons:</strong></p>
          <ul>
            <li>Doesn&rsquo;t send to your accounting program automatically — you must save the scan, then manually attach it to an email and send.</li>
            <li>No sent-invoice archive.</li>
            <li>No multi-company support.</li>
          </ul>

          <h2>3. Adobe Scan + email</h2>
          <p><strong>Price:</strong> free with an Adobe account, premium €9.99/month.</p>
          <p><strong>Pros:</strong></p>
          <ul>
            <li>Best PDF generator from photos on the market.</li>
            <li>OCR included in the app (premium).</li>
          </ul>
          <p><strong>Cons:</strong></p>
          <ul>
            <li>Manual sending again — Adobe doesn&rsquo;t know which accounting program you use.</li>
            <li>Optimised for office scanning, not quick on-the-go invoice photos.</li>
            <li>Premium is expensive, free is capped.</li>
          </ul>

          <h2>4. Dext (international competitor)</h2>
          <p><strong>Price:</strong> ~€24/month (Pro plan).</p>
          <p><strong>Pros:</strong></p>
          <ul>
            <li>Own OCR engine in the app — independent of the accounting program.</li>
            <li>Integrations with QuickBooks, Xero, Sage.</li>
          </ul>
          <p><strong>Cons:</strong></p>
          <ul>
            <li>No Slovenian UI or support.</li>
            <li>Doesn&rsquo;t integrate with Minimax, Birokrat or Pantheon — built for foreign markets.</li>
            <li>Price is roughly 3× Slikaj Račun.</li>
          </ul>

          <h2>5. ReceiptBank / Hubdoc</h2>
          <p><strong>Price:</strong> Hubdoc is included with Xero subscriptions.</p>
          <p><strong>Pros / cons:</strong> Mostly irrelevant for the Slovenian market — most users run Minimax / Birokrat / Pantheon, not Xero.</p>

          <h2>6. Sending via your regular email client</h2>
          <p><strong>Price:</strong> free.</p>
          <p>Technically every phone can do this: photograph → open Mail / Gmail → attach photo → type the OCR address → send.</p>
          <p><strong>Cons:</strong></p>
          <ul>
            <li>Each send takes 30–60 s (manual address typing!).</li>
            <li>The image isn&rsquo;t compressed — OCR may reject it (too many MB).</li>
            <li>No archive of sent invoices.</li>
            <li>If you have multiple companies: change the address every time.</li>
          </ul>

          <h2>Comparison table</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm not-prose mb-8 border-collapse">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left p-3 border border-slate-200">App</th>
                  <th className="text-left p-3 border border-slate-200">Price / month</th>
                  <th className="text-left p-3 border border-slate-200">Auto-send</th>
                  <th className="text-left p-3 border border-slate-200">Multiple companies</th>
                  <th className="text-left p-3 border border-slate-200">Slovenian programs</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border border-slate-200 font-semibold">Slikaj Račun</td>
                  <td className="p-3 border border-slate-200">€0–17.90</td>
                  <td className="p-3 border border-slate-200">✅</td>
                  <td className="p-3 border border-slate-200">✅ (PRO)</td>
                  <td className="p-3 border border-slate-200">✅ all</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-3 border border-slate-200">Microsoft Lens</td>
                  <td className="p-3 border border-slate-200">€0</td>
                  <td className="p-3 border border-slate-200">❌ manual</td>
                  <td className="p-3 border border-slate-200">❌</td>
                  <td className="p-3 border border-slate-200">⚠️ manual</td>
                </tr>
                <tr>
                  <td className="p-3 border border-slate-200">Adobe Scan</td>
                  <td className="p-3 border border-slate-200">€0–9.99</td>
                  <td className="p-3 border border-slate-200">❌ manual</td>
                  <td className="p-3 border border-slate-200">❌</td>
                  <td className="p-3 border border-slate-200">⚠️ manual</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-3 border border-slate-200">Dext</td>
                  <td className="p-3 border border-slate-200">~€24</td>
                  <td className="p-3 border border-slate-200">✅</td>
                  <td className="p-3 border border-slate-200">✅</td>
                  <td className="p-3 border border-slate-200">❌</td>
                </tr>
                <tr>
                  <td className="p-3 border border-slate-200">Hubdoc / ReceiptBank</td>
                  <td className="p-3 border border-slate-200">~€12</td>
                  <td className="p-3 border border-slate-200">✅</td>
                  <td className="p-3 border border-slate-200">✅</td>
                  <td className="p-3 border border-slate-200">❌</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-3 border border-slate-200">Email client</td>
                  <td className="p-3 border border-slate-200">€0</td>
                  <td className="p-3 border border-slate-200">❌ manual</td>
                  <td className="p-3 border border-slate-200">❌</td>
                  <td className="p-3 border border-slate-200">⚠️ manual</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>Which app should you pick?</h2>
          <ul>
            <li><strong>If you use Minimax, Birokrat, Pantheon or another Slovenian accounting program:</strong> Slikaj Račun. The only one purpose-built for it.</li>
            <li><strong>If you send under 10 invoices per month and have no budget:</strong> Slikaj Račun&rsquo;s free plan (3/month) or Microsoft Lens + email.</li>
            <li><strong>If you use Xero or QuickBooks:</strong> Hubdoc (bundled with Xero) or Dext.</li>
            <li><strong>Accounting firm with multiple clients:</strong> Slikaj Račun PRO — separate OCR email per client, fast company switching.</li>
          </ul>

          <h2>Try a test send</h2>
          <p>
            The easiest way to see whether an app works with your accounting program — send the first invoice now. Slikaj Račun is free for the first 3 invoices. No credit card, no commitment.
          </p>
          <p>
            <Link
              href="/en/scan"
              className="not-prose inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 !text-white text-base h-12 px-6 rounded-xl font-semibold transition-colors no-underline"
            >
              📷 Start free
            </Link>
          </p>
        </div>

        <aside className="mt-12 pt-8 border-t border-slate-200">
          <h2 className="text-lg font-semibold mb-4">Related articles</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/en/blog/minimax-email-invoice-import" className="text-blue-600 hover:underline">Minimax email invoice import: complete 2026 guide →</Link></li>
            <li><Link href="/en/blog/birokrat-ocr-invoice-import" className="text-blue-600 hover:underline">Birokrat OCR: how to set up email invoice import →</Link></li>
            <li><Link href="/en/blog/pantheon-ebooks-ocr-guide" className="text-blue-600 hover:underline">Pantheon eBooks OCR: a guide to automatic invoice booking →</Link></li>
          </ul>
        </aside>
      </article>
    </div>
  );
}
