import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    url: `https://www.posljiracun.si/blog/${p.slug}`,
    datePublished: p.publishedAt,
    keywords: p.keyword,
  })),
};

export default function BlogIndex() {
  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-purple-100 text-purple-700 hover:bg-purple-200 border-0">Blog</Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-6 font-bold">
            Vodniki za pošiljanje računov v računovodski program
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Praktični nasveti za Minimax, Birokrat, Pantheon in ostale slovenske računovodske programe — OCR, email uvoz, prihranek časa.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {posts.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="block transition-transform hover:scale-[1.01]"
            >
              <Card className="border-slate-200 hover:shadow-lg transition-shadow h-full">
                <CardHeader>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                    <time dateTime={p.publishedAt}>
                      {new Date(p.publishedAt).toLocaleDateString("sl-SI", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                      })}
                    </time>
                    <span>·</span>
                    <span>{p.readingMinutes} min branja</span>
                  </div>
                  <CardTitle className="text-xl leading-snug">{p.title}</CardTitle>
                  <CardDescription className="mt-3 text-base">{p.excerpt}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-sm font-semibold text-blue-600 hover:underline">
                    Preberi članek →
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
