import { blogMetadata } from "@/lib/seo";
import { getPostEn } from "@/lib/blog";
import { GscSeoArticle } from "@/components/gsc-seo-article";

const post = getPostEn("cloud-accounting-integration-ocr")!;
export const metadata = blogMetadata(post, "en");

export default function Page() {
  return <GscSeoArticle topic="cloud-integration" locale="en" />;
}
