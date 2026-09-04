import { pageMetadata } from "@/lib/seo";
import { getPost } from "@/lib/blog";
import { GscSeoArticle } from "@/components/gsc-seo-article";

const post = getPost("spletni-racunovodski-programi-slovenija")!;
export const metadata = pageMetadata({
  title: post.title,
  description: post.description,
  slug: `blog/${post.slug}`,
  altPaths: { sl: `/blog/${post.slug}`, en: `/en/blog/${post.slugEn}` },
});

export default function Page() {
  return <GscSeoArticle topic="online-accounting" locale="sl" />;
}
