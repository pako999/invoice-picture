import { notFound } from "next/navigation";
import { OcrGuideArticle } from "@/components/ocr-guide-article";
import { ocrGuides } from "@/lib/ocr-guides";
import { blogMetadata } from "@/lib/seo";

export const dynamicParams = false;
export function generateStaticParams() { return ocrGuides.map(g => ({ slug: g.post.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = ocrGuides.find(g => g.post.slug === slug);
  if (!guide) notFound();
  return blogMetadata(guide.post, "sl");
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = ocrGuides.find(g => g.post.slug === slug);
  if (!guide) notFound();
  return <OcrGuideArticle guide={guide} />;
}
