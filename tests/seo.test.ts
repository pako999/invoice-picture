import test from "node:test";
import assert from "node:assert/strict";
import sitemap from "../app/sitemap";
import robots from "../app/robots";
import { posts } from "../lib/blog";
import { ocrGuides } from "../lib/ocr-guides";
import { blogMetadata, privateMetadata, SITE_URL } from "../lib/seo";
import { metadata as slPricing } from "../app/cenik/layout";
import { metadata as enPricing } from "../app/en/pricing/layout";

test("published blog URLs are unique and discoverable in both languages", () => {
  const urls = sitemap().map(entry => entry.url);
  assert.equal(new Set(urls).size, urls.length);
  assert.equal(new Set(posts.map(p => p.slug)).size, posts.length);
  assert.equal(new Set(posts.map(p => p.slugEn)).size, posts.length);
  for (const post of posts) {
    assert.ok(urls.includes(`${SITE_URL}/blog/${post.slug}`));
    assert.ok(urls.includes(`${SITE_URL}/en/blog/${post.slugEn}`));
  }
  assert.ok(!urls.some(url => /(?:izbrisi-racun|delete-account|checkout|upgrade)/.test(url)));
});

test("new guides have self canonicals and reciprocal language alternatives", () => {
  for (const { post } of ocrGuides) {
    const sl = blogMetadata(post, "sl"), en = blogMetadata(post, "en");
    assert.equal(sl.alternates?.canonical, `/blog/${post.slug}`);
    assert.equal(en.alternates?.canonical, `/en/blog/${post.slugEn}`);
    assert.deepEqual(sl.alternates?.languages, en.alternates?.languages);
    assert.equal(sl.alternates?.languages?.en, en.alternates?.canonical);
    assert.equal(en.alternates?.languages?.["sl-SI"], sl.alternates?.canonical);
    assert.equal((sl.openGraph as { type: string }).type, "article");
  }
});

test("sitemap modification dates do not move forward just because the server clock changes", context => {
  const before = sitemap().map(entry => [entry.url, entry.lastModified?.toString()]);
  context.mock.timers.enable({ apis: ["Date"], now: new Date("2027-01-01T00:00:00Z") });
  assert.deepEqual(sitemap().map(entry => [entry.url, entry.lastModified?.toString()]), before);
});

test("account pages are noindex and crawlers exclude private app routes in both languages", () => {
  assert.equal((privateMetadata.robots as { index: boolean }).index, false);
  const rules = robots().rules;
  for (const rule of Array.isArray(rules) ? rules : [rules]) {
    assert.ok(rule.disallow?.includes("/api/"));
    for (const path of ["/scan", "/settings", "/invoices", "/bulk-invoices"]) {
      assert.ok(rule.disallow?.includes(path));
      assert.ok(rule.disallow?.includes(`/en${path}`));
    }
  }
});

test("search descriptions match the current visible OCR offers", () => {
  assert.match(String(slPricing.description), /16,50 €/);
  assert.match(String(slPricing.description), /150/);
  assert.match(String(slPricing.description), /54 €/);
  assert.match(String(enPricing.description), /16\.50 €/);
  assert.doesNotMatch(String(slPricing.description) + String(enPricing.description), /6[.,]99|17[.,]99/);
});
