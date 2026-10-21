import { blogMetadata } from "@/lib/seo";
import { getPost } from "@/lib/blog";
import { GscSeoArticle } from "@/components/gsc-seo-article";

const post = getPost("spletni-racunovodski-programi-slovenija")!;
export const metadata = blogMetadata(post, "sl");

export default function Page() {
  return <GscSeoArticle topic="online-accounting" locale="sl" />;
}
