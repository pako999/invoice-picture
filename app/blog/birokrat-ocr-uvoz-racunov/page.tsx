import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { pageMetadata } from "@/lib/seo";
import { getPost } from "@/lib/blog";

const post = getPost("birokrat-ocr-uvoz-racunov")!;

export const metadata = pageMetadata({
  title: post.title,
  description: post.description,
  slug: `blog/${post.slug}`,
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
  author: { "@type": "Organization", name: "SlikajRačun" },
  publisher: {
    "@type": "Organization",
    name: "SlikajRačun",
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
      name: "Kako vključim OCR v Birokratu?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "V Birokrat odpri Nastavitve → Prejeti računi po e-pošti → Aktiviraj OCR. Po aktivaciji ti sistem dodeli email naslov na katerega pošiljaš slike računov.",
      },
    },
    {
      "@type": "Question",
      name: "Koliko časa traja OCR obdelava v Birokratu?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Tipično 1–3 minute. Birokrat OCR se izvaja v ozadju, slika prispe takoj, prepoznavanje besedila pa potrebuje nekaj časa.",
      },
    },
    {
      "@type": "Question",
      name: "Kaj če Birokrat ne prepozna pravilno zneska?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Pred knjiženjem lahko podatke vedno popraviš. Birokrat OCR daje predloge — uporabnik mora potrditi pravilnost. Slika računa ostane priložena kot dokazilo.",
      },
    },
    {
      "@type": "Question",
      name: "Ali lahko pošljem PDF v Birokrat?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Da. Birokrat sprejme tako fotografije (JPG, PNG) kot PDF dokumente do velikosti 10 MB.",
      },
    },
  ],
};

export default function BirokratBlog() {
  return (
    <div className="py-16 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/blog" className="text-sm text-blue-600 hover:underline">← Vsi članki</Link>

        <header className="mt-6 mb-10">
          <Badge className="mb-4 bg-green-100 text-green-700 hover:bg-green-200 border-0">Birokrat</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">{post.title}</h1>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString("sl-SI", { day: "2-digit", month: "long", year: "numeric" })}
            </time>
            <span>·</span>
            <span>{post.readingMinutes} min branja</span>
          </div>
        </header>

        <div className="prose prose-slate prose-lg max-w-none">
          <p className="lead">
            Birokrat OCR je vgrajena funkcija za avtomatsko branje podatkov s slike papirnatega računa. Ko jo enkrat nastaviš, lahko vse svoje račune fotografiraš s telefonom in pošlješ direktno v knjigovodstvo. Ta vodnik pokaže celotno pot od aktivacije do prvega knjiženja.
          </p>

          <h2>Kaj je Birokrat OCR uvoz računov?</h2>
          <p>
            Birokrat OCR storitev prejme priponko (sliko ali PDF) na poseben email naslov in s pomočjo strojnega učenja prepozna vse pomembne podatke: dobavitelj, datum, številka računa, znesek brez DDV, znesek DDV in končna vsota.
          </p>
          <p>
            Sistem nato pripravi predlog za knjiženje, ki ga uporabnik samo potrdi. Pri kvalitetnih fotografijah Birokrat prepozna 85–95 % podatkov pravilno.
          </p>

          <h2>1. korak: Aktiviraj Birokrat OCR</h2>
          <p>
            OCR je v Birokratu vključen kot opcijska funkcija. Aktivacija:
          </p>
          <ol>
            <li>V Birokratu odpri <strong>Nastavitve → Prejeti računi po e-pošti</strong>.</li>
            <li>Klikni <strong>Aktiviraj OCR storitev</strong>.</li>
            <li>Sistem ti dodeli edinstven email naslov v obliki <code>racuni-firma@birokrat.si</code>.</li>
            <li>Skopiraj naslov — to je tvoj OCR vhod.</li>
          </ol>
          <p>
            Aktivacija je takojšnja. Cena OCR storitve je odvisna od tvojega Birokrat paketa — preveri v ceniku ali kontaktiraj Birokrat podporo.
          </p>

          <h2>2. korak: Pošlji prvi račun</h2>
          <p>
            Z mobilno aplikacijo SlikajRačun je proces takšen:
          </p>
          <ol>
            <li>V <Link href="/settings">SlikajRačun nastavitvah</Link> vneseš svoj Birokrat email naslov.</li>
            <li>Pojdi na <Link href="/scan">Skeniraj</Link> in fotografiraš račun.</li>
            <li>Aplikacija optimizira fotografijo (zmanjšanje velikosti, izboljšanje kontrasta) in jo pošlje v Birokrat.</li>
            <li>V Birokratu se v 1–3 minutah pojavi nova vrstica v &ldquo;Prejeti računi&rdquo;.</li>
            <li>Kliknite na vrstico, preverite predlagane podatke in potrdite knjiženje.</li>
          </ol>

          <h2>3. korak: Preglej obdelan račun</h2>
          <p>
            V Birokratu se v sekciji &ldquo;Prejeti računi&rdquo; pojavi nova kartica z:
          </p>
          <ul>
            <li>Imenom dobavitelja (avtomatsko prepoznano)</li>
            <li>Davčno številko dobavitelja (preverjen v sistemu)</li>
            <li>Datumom računa</li>
            <li>Skupnim zneskom in DDV-jem</li>
            <li>Originalno sliko / PDF kot priponko</li>
          </ul>
          <p>
            Vsak podatek lahko ročno popraviš pred dokončnim knjiženjem. Slika računa ostane priložena za revizijo.
          </p>

          <h2>Kvaliteta OCR: nasveti za boljše prepoznavanje</h2>
          <ul>
            <li><strong>Beli papir, dobra svetloba.</strong> Najboljši rezultati so na svežih, neodtisnenih računih.</li>
            <li><strong>Cel račun v kadru.</strong> Vključuje glavo (z dobaviteljem) in nogo (s skupnim zneskom).</li>
            <li><strong>Brez senc.</strong> Direktna svetloba ali UV-laminacija ustvari odboje, ki zmotijo OCR.</li>
            <li><strong>PDF je boljši od fotografije.</strong> Če imaš PDF račun (npr. e-račun), pošlji ta — OCR je 99 % natančen.</li>
            <li><strong>Pred pošiljanjem preveri sliko.</strong> Če je tekst zamegljen na zaslonu telefona, je tudi za OCR.</li>
          </ul>

          <h2>Pogosti problemi in rešitve</h2>

          <h3>OCR ni prepoznal dobavitelja</h3>
          <p>
            Najpogostejši razlog je manjkajoča davčna številka v glavi računa. Pri novih dobaviteljih Birokrat morda ne najde podjetja v svoji bazi. Rešitev: ročno izberi dobavitelja iz Birokrat seznama. Naslednjič bo OCR prepoznavanje boljše.
          </p>

          <h3>Račun je v Birokratu, a brez podatkov</h3>
          <p>
            Verjetno je OCR storitev preobremenjena — počakaj 5 minut. Če podatki ne pridejo, ročno odpri račun in vnesi vrednosti. Slika ostane priložena.
          </p>

          <h3>Birokrat ne sprejme priponke</h3>
          <p>
            Velikost priponke je omejena na 10 MB. SlikajRačun aplikacija fotografije avtomatsko stisne na primerno velikost (običajno 500 KB–1 MB), tako da te omejitve v praksi ne dosežeš.
          </p>

          <h2>Pogosta vprašanja</h2>

          <h3>Kako vključim OCR v Birokratu?</h3>
          <p>
            V Birokrat odpri <strong>Nastavitve → Prejeti računi po e-pošti → Aktiviraj OCR</strong>. Po aktivaciji ti sistem dodeli email naslov na katerega pošiljaš slike računov.
          </p>

          <h3>Koliko časa traja OCR obdelava v Birokratu?</h3>
          <p>
            Tipično 1–3 minute. Birokrat OCR se izvaja v ozadju, slika prispe takoj, prepoznavanje besedila pa potrebuje nekaj časa.
          </p>

          <h3>Kaj če Birokrat ne prepozna pravilno zneska?</h3>
          <p>
            Pred knjiženjem lahko podatke vedno popraviš. Birokrat OCR daje <em>predloge</em> — uporabnik mora potrditi pravilnost. Slika računa ostane priložena kot dokazilo.
          </p>

          <h3>Ali lahko pošljem PDF v Birokrat?</h3>
          <p>
            Da. Birokrat sprejme tako fotografije (JPG, PNG) kot PDF dokumente do velikosti 10 MB.
          </p>

          <h2>Naslednji korak</h2>
          <p>
            S SlikajRačun aplikacijo preizkusi celoten proces brezplačno (3 računi mesečno). Po nastavitvi Birokrat email naslova pošlji prvo fotografijo v manj kot minuti.
          </p>
          <p>
            <Link
              href="/scan"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-base h-12 px-6 rounded-xl font-semibold transition-colors no-underline"
            >
              📷 Pošlji prvi račun v Birokrat
            </Link>
          </p>
        </div>

        <aside className="mt-12 pt-8 border-t border-slate-200">
          <h2 className="text-lg font-semibold mb-4">Sorodni članki</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/blog/minimax-email-uvoz-racunov" className="text-blue-600 hover:underline">
                Minimax email uvoz računov: kompletni vodnik 2026 →
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
