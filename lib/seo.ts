import type { Metadata } from "next";

export const SITE_URL = "https://www.posljiracun.si";
export const SITE_NAME = "SlikajRačun";

interface PageSeoInput {
  title: string;
  description: string;
  path: string;
}

export function pageMetadata({ title, description, path }: PageSeoInput): Metadata {
  const url = `${SITE_URL}${path}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "sl_SI",
      siteName: SITE_NAME,
      url,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
