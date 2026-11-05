import { blogMetadata } from "@/lib/seo";
import { getPost } from "@/lib/blog";
import { GscSeoArticle } from "@/components/gsc-seo-article";

const post = getPost("cloud-racunovodska-integracija-ocr")!;
export const metadata = blogMetadata(post, "sl");

export default function Page() {
  return <GscSeoArticle topic="cloud-integration" locale="sl" />;
}
