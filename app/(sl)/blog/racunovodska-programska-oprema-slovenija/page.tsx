import { blogMetadata } from "@/lib/seo";
import { getPost } from "@/lib/blog";
import { GscSeoArticle } from "@/components/gsc-seo-article";

const post = getPost("racunovodska-programska-oprema-slovenija")!;
export const metadata = blogMetadata(post, "sl");

export default function Page() {
  return <GscSeoArticle topic="accounting-software" locale="sl" />;
}
