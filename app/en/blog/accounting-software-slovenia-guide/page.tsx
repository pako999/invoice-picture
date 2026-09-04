import { pageMetadata } from "@/lib/seo";
import { getPostEn } from "@/lib/blog";
import { GscSeoArticle } from "@/components/gsc-seo-article";

const post = getPostEn("accounting-software-slovenia-guide")!;
export const metadata = pageMetadata({
  title: post.titleEn,
  description: post.descriptionEn,
  slug: `blog/${post.slug}`,
  locale: "en",
  altPaths: { sl: `/blog/${post.slug}`, en: `/en/blog/${post.slugEn}` },
});

export default function Page() {
  return <GscSeoArticle topic="accounting-software" locale="en" />;
}
