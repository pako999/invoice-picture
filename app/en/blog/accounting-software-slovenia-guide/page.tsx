import { blogMetadata } from "@/lib/seo";
import { getPostEn } from "@/lib/blog";
import { GscSeoArticle } from "@/components/gsc-seo-article";

const post = getPostEn("accounting-software-slovenia-guide")!;
export const metadata = blogMetadata(post, "en");

export default function Page() {
  return <GscSeoArticle topic="accounting-software" locale="en" />;
}
