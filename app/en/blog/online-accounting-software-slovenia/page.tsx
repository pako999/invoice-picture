import { blogMetadata } from "@/lib/seo";
import { getPostEn } from "@/lib/blog";
import { GscSeoArticle } from "@/components/gsc-seo-article";

const post = getPostEn("online-accounting-software-slovenia")!;
export const metadata = blogMetadata(post, "en");

export default function Page() {
  return <GscSeoArticle topic="online-accounting" locale="en" />;
}
