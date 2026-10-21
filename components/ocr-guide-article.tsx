import Link from "next/link";
import { BlogCover } from "@/components/blog-cover";
import { ocrGuides, type OcrGuide } from "@/lib/ocr-guides";
import { SITE_URL } from "@/lib/seo";

export function OcrGuideArticle({ guide, locale = "sl" }: { guide: OcrGuide; locale?: "sl" | "en" }) {
  const en = locale === "en", post = guide.post, content = guide[locale];
  const prefix = en ? "/en" : "";
  const url = `${SITE_URL}${prefix}/blog/${en ? post.slugEn : post.slug}`;
  const title = en ? post.titleEn : post.title;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting", "@id": `${url}#article`, headline: title,
        description: en ? post.descriptionEn : post.description, image: [post.coverImage],
        datePublished: post.publishedAt, dateModified: post.updatedAt ?? post.publishedAt,
        inLanguage: en ? "en" : "sl-SI", mainEntityOfPage: url,
        author: { "@type": "Organization", name: "Slikaj Račun", url: SITE_URL },
        publisher: { "@id": `${SITE_URL}#organization` },
      },
      {
        "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: en ? "Home" : "Domov", item: `${SITE_URL}${prefix || "/"}` },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}${prefix}/blog` },
          { "@type": "ListItem", position: 3, name: title, item: url },
        ],
      },
    ],
  };
  return <div className="min-h-screen bg-slate-50">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <BlogCover post={post} locale={locale} badge={en ? "Practical invoice OCR guide" : "Praktični vodnik za OCR računov"} />
    <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href={`${prefix}/blog`} className="mb-6 inline-block font-semibold text-blue-700 hover:underline">← {en ? "All guides" : "Vsi vodniki"}</Link>
      <div className="prose prose-slate max-w-none rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-10 prose-headings:scroll-mt-20 prose-headings:font-bold prose-a:text-blue-700">
        <p className="lead">{content.intro}</p>
        <nav aria-label={en ? "Article contents" : "Vsebina članka"} className="not-prose my-8 rounded-xl bg-blue-50 p-5">
          <p className="mb-3 font-bold text-slate-950">{en ? "In this guide" : "V tem vodniku"}</p>
          <ol className="space-y-2 text-sm">{content.sections.map((s, i) => <li key={s.title}><a className="text-blue-800 hover:underline" href={`#korak-${i + 1}`}>{s.title}</a></li>)}</ol>
        </nav>
        {content.sections.map((section, i) => <section key={section.title} id={`korak-${i + 1}`}>
          <h2>{section.title}</h2>
          {section.paragraphs.map(text => <p key={text}>{text}</p>)}
          {section.items ? section.ordered ? <ol>{section.items.map(text => <li key={text}>{text}</li>)}</ol> : <ul>{section.items.map(text => <li key={text}>{text}</li>)}</ul> : null}
          {section.table ? <div className="overflow-x-auto"><table><thead><tr>{section.table.headings.map(heading => <th scope="col" key={heading}>{heading}</th>)}</tr></thead><tbody>{section.table.rows.map((row, r) => <tr key={r}>{row.map((cell, c) => <td key={c}>{cell}</td>)}</tr>)}</tbody></table></div> : null}
        </section>)}
        <section><h2>{en ? "Frequently asked questions" : "Pogosta vprašanja"}</h2>{content.faq.map(([question, answer]) => <section key={question}><h3>{question}</h3><p>{answer}</p></section>)}</section>
        {content.sources?.length ? <aside><h2>{en ? "Further reading" : "Dodatni viri"}</h2><ul>{content.sources.map(source => <li key={source.href}><a href={source.href} rel="noopener noreferrer" target="_blank">{source.label}</a></li>)}</ul></aside> : null}
        <div className="not-prose mt-10 rounded-2xl bg-blue-950 p-6 text-white sm:p-8">
          <h2 className="text-2xl font-bold text-white">{en ? "Try the workflow on your own invoice" : "Preizkusite postopek na svojem računu"}</h2>
          <p className="mt-3 text-blue-100">{en ? "Free: 3 invoices and 10 OCR pages per month. Review the result before sending it to accounting." : "Brezplačno: 3 računi in 10 OCR strani mesečno. Rezultat preverite, preden dokument pošljete v računovodstvo."}</p>
          <div className="mt-5 flex flex-wrap gap-3"><Link href="/sign-up" className="inline-flex min-h-12 items-center rounded-xl bg-white px-5 py-3 font-bold text-blue-950 hover:bg-blue-50">{en ? "Start free" : "Začnite brezplačno"} →</Link><Link href={en ? "/en/pricing" : "/cenik"} className="inline-flex min-h-12 items-center rounded-xl border border-blue-300 px-5 py-3 font-semibold text-white hover:bg-blue-900">{en ? "View plans" : "Poglejte pakete"}</Link></div>
        </div>
      </div>
      <aside className="mt-10 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold">{en ? "Continue reading" : "Preberite še"}</h2><ul className="mt-4 space-y-3 text-blue-700">
        <li><Link href={en ? "/en/invoice-ocr-slovenia" : "/ocr-racunov"} className="hover:underline">{en ? "Invoice OCR: extraction and review" : "OCR računov: prepoznavanje in pregled podatkov"} →</Link></li>
        {ocrGuides.filter(g => g.post.id !== post.id).map(g => <li key={g.post.id}><Link className="hover:underline" href={`${prefix}/blog/${en ? g.post.slugEn : g.post.slug}`}>{en ? g.post.titleEn : g.post.title} →</Link></li>)}
        <li><Link href={en ? "/en/user-guide" : "/navodila-za-uporabo"} className="hover:underline">{en ? "Application user guide" : "Navodila za uporabo aplikacije"} →</Link></li>
      </ul></aside>
    </article>
  </div>;
}
