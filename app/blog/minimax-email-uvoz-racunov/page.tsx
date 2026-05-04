import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { getPost } from "@/lib/blog";
import { BlogCover } from "@/components/blog-cover";

const post = getPost("minimax-email-uvoz-racunov")!;

export const metadata = pageMetadata({
  title: post.title,
  description: post.description,
  slug: `blog/${post.slug}`,
  altPaths: { sl: `/blog/${post.slug}`, en: `/en/blog/${post.slugEn}` },
});

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: post.title,
  description: post.description,
  datePublished: post.publishedAt,
  dateModified: post.publishedAt,
  inLanguage: "sl-SI",
  keywords: post.keyword,
  author: { "@type": "Organization", name: "Slikaj Račun" },
  publisher: {
    "@type": "Organization",
    name: "Slikaj Račun",
    logo: { "@type": "ImageObject", url: "https://www.posljiracun.si/logo-icon.svg" },
  },
  mainEntityOfPage: `https://www.posljiracun.si/blog/${post.slug}`,
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  inLanguage: "sl-SI",
  mainEntity: [
    {
      "@type": "Question",
      name: "Kakšen je email naslov za uvoz računov v Minimax?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Vsak Minimax račun ima svoj edinstven email naslov v obliki <unique-string>@minimax.si. Najdeš ga v Minimax pod Nastavitve → Avtomatska obdelava prejetih računov.",
      },
    },
    {
      "@type": "Question",
      name: "Ali Minimax samodejno prebere podatke s slike računa?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Da. Minimax uporablja vgrajeno OCR storitev, ki s slike prepozna dobavitelja, datum, znesek in DDV. Prepoznava deluje za .jpg, .png, .pdf in večino fotografij paragrnih računov.",
      },
    },
    {
      "@type": "Question",
      name: "Koliko časa traja, da se račun pojavi v Minimax po pošiljanju?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Običajno 30 sekund do 2 minuti. OCR obdelava poteka v Minimax oblaku in je odvisna od trenutne obremenitve sistema.",
      },
    },
    {
      "@type": "Question",
      name: "Kaj naredim, če Minimax noče prebrati računa?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Najpogostejša razloga sta slaba osvetlitev fotografije in zamegljen tekst. Pošlji ostro fotografijo z dobro svetlobo. Če OCR še vedno odpove, lahko podatke vneseš ročno znotraj Minimax — slika računa ostane priložena.",
      },
    },
  ],
};

export default function MinimaxBlog() {
  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <BlogCover post={post} badge="Minimax" badgeClassName="bg-blue-500/90 text-white border-0 hover:bg-blue-500/90" />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/blog" className="text-sm text-blue-600 hover:underline mb-8 inline-block">← Vsi članki</Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12 prose prose-slate prose-lg max-w-none prose-headings:scroll-mt-20 prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-code:font-mono prose-code:text-sm prose-li:my-1 prose-ul:my-4 prose-ol:my-4 prose-table:rounded-xl prose-table:overflow-hidden prose-th:bg-slate-100 prose-th:p-3 prose-td:p-3 prose-td:border-slate-200 prose-th:border-slate-200">
          <p className="lead">
            Minimax email uvoz računov je najhitrejši način za digitalizacijo papirnatih računov v Sloveniji. Z eno fotografijo poslano na pravilen email naslov dobiš račun avtomatsko knjižen v knjigovodstvo. Ta vodnik pokaže korak za korakom, kako vse skupaj nastaviš in pošlješ prvi račun.
          </p>

          <h2>Kaj je Minimax email uvoz računov?</h2>
          <p>
            Minimax ti dodeli edinstven email naslov, na katerega lahko pošiljaš slike ali PDF-je računov. Sistem prejete priponke prepozna z OCR (Optical Character Recognition) tehnologijo, izlušči podatke kot dobavitelj, datum, znesek, DDV — in jih samodejno knjiži kot prejet račun.
          </p>
          <p>
            Cel proces traja manj kot minuto. Ni več ročnega tipkanja, prepisovanja ali izgubljenih papirjev v predalu.
          </p>

          <h2>Kje najdem svoj Minimax email naslov?</h2>
          <ol>
            <li>V Minimax pojdi na <strong>Nastavitve → Avtomatska obdelava prejetih računov</strong>.</li>
            <li>Aktiviraj funkcijo &ldquo;Sprejem računov po e-pošti&rdquo;, če še ni vključena.</li>
            <li>Sistem ti dodeli unikaten email naslov v obliki <code>nekajzaposnih@minimax.si</code>.</li>
            <li>Kopiraj naslov — to je tvoj OCR email za Minimax.</li>
          </ol>
          <p>
            Pomembno: vsak uporabnik ima svoj unikaten email. Naslov ne deli z drugimi — vsa pošta na ta naslov pristane v tvojem Minimax računu.
          </p>

          <h2>Kako pošljem prvi račun</h2>
          <p>
            Najlažje s Slikaj Račun aplikacijo:
          </p>
          <ol>
            <li>V <Link href="/settings">Nastavitvah aplikacije</Link> vneseš svoj Minimax email naslov.</li>
            <li>Pojdi na <Link href="/scan">Skeniraj</Link> in fotografiraš papirnat račun.</li>
            <li>Pritisneš <strong>Pošlji</strong>. Aplikacija sliko optimizira, stisne in pošlje na Minimax email naslov.</li>
            <li>V Minimax se račun pojavi v &ldquo;Avtomatsko obdelani prejeti računi&rdquo; v 30 sekundah do 2 minutah.</li>
            <li>Pregledaš podatke (znesek, datum, dobavitelj — Minimax jih je že izpolnil) in potrdiš knjiženje.</li>
          </ol>

          <h2>Nasveti za boljše OCR prepoznavanje</h2>
          <ul>
            <li><strong>Dobra osvetlitev.</strong> Naravna svetloba ob oknu je idealna. Izogibaj se sencam.</li>
            <li><strong>Račun na ravni podlagi.</strong> Zmečkani ali zaviti računi pomenijo slabše prepoznavanje.</li>
            <li><strong>Cel račun v kadru.</strong> Robovi morajo biti vidni — Minimax izlušči dobavitelja iz glave dokumenta.</li>
            <li><strong>Ostra fotografija.</strong> Počakaj, da kamera fokusira. Zamegljen tekst je največji razlog za neuspešno prepoznavanje.</li>
            <li><strong>Brez prevelikih senc.</strong> Ne fotografiraj direktno nad računom z uporabo bliskavice — ustvari odsev.</li>
          </ul>

          <h2>Kaj se zgodi, ko Minimax ne prepozna podatkov?</h2>
          <p>
            Tudi najboljši OCR ni 100 % zanesljiv. V tem primeru:
          </p>
          <ol>
            <li>V Minimax račun še vedno pristane v seznamu prejetih dokumentov.</li>
            <li>Manjkajoče podatke (znesek, davek) ročno vneseš v urejevalniku.</li>
            <li>Slika računa ostane priložena kot dokazilo.</li>
          </ol>
          <p>
            Tako ne izgubiš dokumenta, samo nekoliko dlje časa porabiš za vnos. Pri kvalitetnih fotografijah Minimax OCR prepozna 90+ % vseh podatkov.
          </p>

          <h2>Pogosta vprašanja</h2>

          <h3>Kakšen je email naslov za uvoz računov v Minimax?</h3>
          <p>
            Vsak Minimax račun ima svoj edinstven email naslov v obliki <code>&lt;unique-string&gt;@minimax.si</code>. Najdeš ga v Minimax pod <strong>Nastavitve → Avtomatska obdelava prejetih računov</strong>.
          </p>

          <h3>Ali Minimax samodejno prebere podatke s slike računa?</h3>
          <p>
            Da. Minimax uporablja vgrajeno OCR storitev, ki s slike prepozna dobavitelja, datum, znesek in DDV. Prepoznava deluje za <code>.jpg</code>, <code>.png</code>, <code>.pdf</code> in večino fotografij paragrnih računov.
          </p>

          <h3>Koliko časa traja, da se račun pojavi v Minimax po pošiljanju?</h3>
          <p>
            Običajno 30 sekund do 2 minuti. OCR obdelava poteka v Minimax oblaku in je odvisna od trenutne obremenitve sistema.
          </p>

          <h3>Kaj naredim, če Minimax noče prebrati računa?</h3>
          <p>
            Najpogostejša razloga sta slaba osvetlitev fotografije in zamegljen tekst. Pošlji ostro fotografijo z dobro svetlobo. Če OCR še vedno odpove, lahko podatke vneseš ročno znotraj Minimax — slika računa ostane priložena.
          </p>

          <h2>Naredi prvi korak</h2>
          <p>
            Slikaj Račun je brezplačen za prve 3 račune mesečno — dovolj, da preizkusiš kompleten proces. Brez kreditne kartice, brez registracije računovodskega programa pri nas.
          </p>
          <p>
            <Link
              href="/scan"
              className="not-prose inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 !text-white text-base h-12 px-6 rounded-xl font-semibold transition-colors no-underline"
            >
              📷 Pošlji prvi račun v Minimax
            </Link>
          </p>
        </div>

        <aside className="mt-12 pt-8 border-t border-slate-200">
          <h2 className="text-lg font-semibold mb-4">Sorodni članki</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/blog/birokrat-ocr-uvoz-racunov" className="text-blue-600 hover:underline">
                Birokrat OCR: kako nastaviti uvoz računov po emailu →
              </Link>
            </li>
            <li>
              <Link href="/blog/pantheon-ebooks-ocr-vodnik" className="text-blue-600 hover:underline">
                Pantheon eBooks OCR: vodnik za avtomatsko knjiženje →
              </Link>
            </li>
            <li>
              <Link href="/blog/najboljse-aplikacije-za-skeniranje-racunov" className="text-blue-600 hover:underline">
                Najboljše aplikacije za skeniranje računov v Sloveniji 2026 →
              </Link>
            </li>
          </ul>
        </aside>
      </article>
    </div>
  );
}
