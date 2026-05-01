import type { MetadataRoute } from "next";

const SITE_URL = "https://www.posljiracun.si";

const aiBots = [
  // OpenAI
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  // Anthropic
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  // Google
  "Google-Extended",
  "GoogleOther",
  // Perplexity
  "PerplexityBot",
  "Perplexity-User",
  // Meta
  "FacebookBot",
  "Meta-ExternalAgent",
  // Other
  "Applebot-Extended",
  "Bytespider",
  "CCBot",
  "Diffbot",
  "DuckAssistBot",
  "Amazonbot",
  "YouBot",
  "MistralAI-User",
  "cohere-ai",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/scan", "/invoices", "/settings"],
      },
      ...aiBots.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: ["/api/", "/scan", "/invoices", "/settings"],
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
