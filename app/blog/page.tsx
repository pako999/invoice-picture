import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { pageMetadata } from "@/lib/seo";
import { posts } from "@/lib/blog";

export const metadata = pageMetadata({
  title: "Blog — vodniki za pošiljanje računov v računovodstvo",
  description:
    "Praktični vodniki za Minimax, Birokrat, Pantheon in ostale slovenske računovodske programe. OCR, email uvoz, primerjave aplikacij — vse na enem mestu.",
  slug: "blog",
});

const blogJsonLd = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "SlikajRačun blog",
  description:
    "Vodniki za pošiljanje papirnatih računov v računovodske programe — Minimax, Birokrat, Pantheon, SAOP, E-računi, Metakocka.",
  inLanguage: "sl-SI",
  publisher: {
    "@type": "Organization",
    name: "SlikajRačun",
  },
  blogPost: posts.map((p) => ({
    "@type": "BlogPosting",
    headline: p.title,
    description: p.description,
    image: p.coverImage,
    url: `https://www.posljiracun.si/blog/${p.slug}`,
    datePublished: p.publishedAt,
    keywords: p.keyword,
  })),
};

export default function BlogIndex() {
  const [featured, ...rest] = posts;

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />

      {/* Hero with background image — credibility + visual anchor for the page */}
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
            Vodniki za pošiljanje računov v računovodstvo
          </h1>
          <p className="text-lg sm:text-xl text-slate-100 max-w-3xl mx-auto leading-relaxed">
            Praktični nasveti za Minimax, Birokrat, Pantheon in ostale slovenske računovodske programe — OCR, email uvoz, prihranek časa.
          </p>
        </div>
      </section>

      {/* Featured post — most recent, hero card */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16 relative">
        <Link
          href={`/blog/${featured.slug}`}
          className="group block bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden hover:shadow-2xl transition-shadow"
        >
          <div className="grid md:grid-cols-2">
            <div className="relative h-64 md:h-full min-h-[280px] bg-slate-100">
              <Image
                src={featured.coverImage}
                alt={featured.coverAlt}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-8 sm:p-10 flex flex-col justify-center">
              <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-0">Najnovejši</Badge>
                <time dateTime={featured.publishedAt}>
                  {new Date(featured.publishedAt).toLocaleDateString("sl-SI", {
                    day: "2-digit", month: "long", year: "numeric",
                  })}
                </time>
                <span>·</span>
                <span>{featured.readingMinutes} min branja</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-3 leading-tight">
                {featured.title}
              </h2>
              <p className="text-slate-600 text-base leading-relaxed mb-5">{featured.excerpt}</p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 group-hover:gap-2 transition-all">
                Preberi članek <span>→</span>
              </span>
            </div>
          </div>
        </Link>
      </section>

      {/* Remaining posts */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-8">Vsi članki</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="group block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className="relative h-44 bg-slate-100 overflow-hidden">
                <Image
                  src={p.coverImage}
                  alt={p.coverAlt}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                  <time dateTime={p.publishedAt}>
                    {new Date(p.publishedAt).toLocaleDateString("sl-SI", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                    })}
                  </time>
                  <span>·</span>
                  <span>{p.readingMinutes} min branja</span>
                </div>
                <h3 className="font-bold text-lg text-slate-900 leading-snug mb-2 group-hover:text-blue-600 transition-colors">
                  {p.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{p.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
