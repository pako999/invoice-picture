import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { pageMetadata } from "@/lib/seo";
import { posts } from "@/lib/blog";

export const metadata = pageMetadata({
  title: "Blog — guides for sending invoices to accounting software",
  description:
    "Practical guides for Minimax, Birokrat, Pantheon and other Slovenian accounting programs. OCR, email import, app comparisons — all in one place.",
  slug: "blog",
  locale: "en",
});

const blogJsonLd = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "Slikaj Račun blog",
  description:
    "Guides for sending paper invoices to accounting software — Minimax, Birokrat, Pantheon, SAOP, E-računi, Metakocka.",
  inLanguage: "en",
  publisher: { "@type": "Organization", name: "Slikaj Račun" },
  blogPost: posts.map((p) => ({
    "@type": "BlogPosting",
    headline: p.titleEn,
    description: p.descriptionEn,
    image: p.coverImage,
    url: `https://www.posljiracun.si/en/blog/${p.slugEn}`,
    datePublished: p.publishedAt,
    keywords: p.keywordEn,
    inLanguage: "en",
  })),
};

export default function BlogIndex() {
  const [featured, ...rest] = posts;

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=2000&q=80"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 via-blue-900/75 to-indigo-900/65" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
          <Badge className="mb-5 bg-white/15 backdrop-blur text-white border-white/30 hover:bg-white/20">Blog</Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-6 font-bold text-white">
            Guides for sending invoices to your accounting software
          </h1>
          <p className="text-lg sm:text-xl text-slate-100 max-w-3xl mx-auto leading-relaxed">
            Practical tips for Minimax, Birokrat, Pantheon and other Slovenian programs — OCR, email import, time saved.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16 relative">
        <Link
          href={`/en/blog/${featured.slugEn}`}
          className="group block bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden hover:shadow-2xl transition-shadow"
        >
          <div className="grid md:grid-cols-2">
            <div className="relative h-64 md:h-full min-h-[280px] bg-slate-100">
              <Image
                src={featured.coverImage}
                alt={featured.coverAltEn}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-8 sm:p-10 flex flex-col justify-center">
              <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-0">Latest</Badge>
                <time dateTime={featured.publishedAt}>
                  {new Date(featured.publishedAt).toLocaleDateString("en-GB", {
                    day: "2-digit", month: "long", year: "numeric",
                  })}
                </time>
                <span>·</span>
                <span>{featured.readingMinutesEn} min read</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-3 leading-tight">
                {featured.titleEn}
              </h2>
              <p className="text-slate-600 text-base leading-relaxed mb-5">{featured.excerptEn}</p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 group-hover:gap-2 transition-all">
                Read article <span>→</span>
              </span>
            </div>
          </div>
        </Link>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-8">All articles</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((p) => (
            <Link
              key={p.slugEn}
              href={`/en/blog/${p.slugEn}`}
              className="group block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className="relative h-44 bg-slate-100 overflow-hidden">
                <Image
                  src={p.coverImage}
                  alt={p.coverAltEn}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                  <time dateTime={p.publishedAt}>
                    {new Date(p.publishedAt).toLocaleDateString("en-GB", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                    })}
                  </time>
                  <span>·</span>
                  <span>{p.readingMinutesEn} min read</span>
                </div>
                <h3 className="font-bold text-lg text-slate-900 leading-snug mb-2 group-hover:text-blue-600 transition-colors">
                  {p.titleEn}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{p.excerptEn}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
