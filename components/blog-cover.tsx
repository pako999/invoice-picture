import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { BlogPost } from "@/lib/blog";

/** Reusable hero header for individual blog posts.
 *  Renders a full-width cover image with a soft gradient overlay,
 *  badge + title + meta on top. Keeps post pages consistent. */
export function BlogCover({
  post,
  badge,
  badgeClassName = "bg-blue-100 text-blue-700 hover:bg-blue-200 border-0",
}: {
  post: BlogPost;
  badge: string;
  badgeClassName?: string;
}) {
  return (
    <section className="relative overflow-hidden h-[420px] sm:h-[500px]">
      <div className="absolute inset-0">
        <Image
          src={post.coverImage}
          alt={post.coverAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/65 to-slate-900/40" />
      </div>
      <div className="relative h-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12 sm:pb-16">
        <Badge className={`mb-4 backdrop-blur w-fit ${badgeClassName}`}>{badge}</Badge>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-white leading-tight max-w-3xl">
          {post.title}
        </h1>
        <div className="flex items-center gap-3 text-sm text-slate-200">
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString("sl-SI", { day: "2-digit", month: "long", year: "numeric" })}
          </time>
          <span>·</span>
          <span>{post.readingMinutes} min branja</span>
        </div>
      </div>
    </section>
  );
}

/** Inline figure for blog body — used inside .prose content.
 *  Wraps next/image with a caption and proper rounded card styling.
 *  Marked not-prose so prose typography doesn't fight with the figure. */
export function BlogFigure({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string;
}) {
  return (
    <figure className="not-prose my-8 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      <div className="relative aspect-[16/9] bg-slate-100">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 768px) 768px, 100vw"
          className="object-cover"
        />
      </div>
      {caption && (
        <figcaption className="px-4 py-3 text-sm text-slate-500 bg-slate-50 border-t border-slate-200">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
