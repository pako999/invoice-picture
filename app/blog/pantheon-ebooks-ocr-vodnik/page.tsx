import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { getPost } from "@/lib/blog";
import { BlogCover } from "@/components/blog-cover";

const post = getPost("pantheon-ebooks-ocr-vodnik")!;

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
      name: "Kaj je Pantheon eBooks OCR?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Pantheon eBooks OCR je dodatna storitev programa Pantheon (Datalab), ki samodejno prebere podatke s slike računa ali PDF dokumenta in jih pripravi za knjiženje v sistem.",
      },
    },
    {
      "@type": "Question",
      name: "Kakšna je cena Pantheon eBooks OCR?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Pantheon eBooks OCR se zaračuna po mesečnem paketu in številu obdelanih dokumentov. Točen cenik dobiš pri Datalab predstavniku — odvisi od velikosti podjetja in pogodbe.",
      },
    },
    {
      "@type": "Question",
      name: "Ali se lahko Pantheon poveže z mobilno aplikacijo za fotografiranje?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Da. Pantheon ima email naslov za sprejem dokumentov. Z mobilno aplikacijo (npr. SlikajRačun) lahko fotografiraš račun in ga avtomatsko pošlješ na ta naslov.",
      },
    },
    {
      "@type": "Question",
      name: "Kakšne podatke prepozna Pantheon eBooks OCR?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Dobavitelja, davčno številko, številko in datum računa, znesek brez DDV, znesek DDV, končno vsoto in valuto. Pri kvalitetnih dokumentih natančnost presega 90 %.",
      },
    },
  ],
};

export default function PantheonBlog() {
  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <BlogCover post={post} badge="Pantheon" badgeClassName="bg-purple-500/90 text-white border-0 hover:bg-purple-500/90" />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/blog" className="text-sm text-blue-600 hover:underline mb-8 inline-block">← Vsi članki</Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12 prose prose-slate prose-lg max-w-none prose-headings:scroll-mt-20 prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-code:font-mono prose-code:text-sm prose-li:my-1 prose-ul:my-4 prose-ol:my-4 prose-table:rounded-xl prose-table:overflow-hidden prose-th:bg-slate-100 prose-th:p-3 prose-td:p-3 prose-td:border-slate-200 prose-th:border-slate-200">
          <p className="lead">
            Pantheon eBooks OCR je dodatek za avtomatsko obdelavo dokumentov v Datalab Pantheon poslovnem sistemu. Z njim prejeti račun fotografiraš s telefonom, pošlješ na poseben email naslov in v minuti je knjižen — brez ročnega tipkanja zneskov, davčnih številk ali datumov.
          </p>

          <h2>Kaj je Pantheon eBooks OCR?</h2>
          <p>
            Pantheon eBooks je modul znotraj Datalab Pantheon ERP sistema, namenjen elektronski obdelavi dokumentov. Njegova OCR funkcionalnost preberi tekst s skeniranih ali fotografiranih dokumentov in ga avtomatsko poveže s šifrantom dobaviteljev, kontnim načrtom in knjiženjem.
          </p>
          <p>
            V praksi: pošlješ sliko računa na poseben email, sistem v ozadju izlušči podatke in pripravi predlog knjiženja, ki ga uporabnik samo potrdi.
          </p>

          <h2>Kako nastavim Pantheon eBooks OCR</h2>
          <p>
            Aktivacija je za večino podjetij dvojni proces — najprej tehnična nastavitev s strani Datalab partnerja, nato uporabniška konfiguracija znotraj Pantheona:
          </p>
          <ol>
            <li><strong>Naročilo storitve.</strong> Kontaktiraj svojega Datalab predstavnika. eBooks OCR ni vključen v osnovni Pantheon paket — naročiti ga je treba posebej.</li>
            <li><strong>Aktivacija.</strong> Po podpisu pogodbe dobiš edinstven email naslov za sprejem dokumentov.</li>
            <li><strong>Konfiguracija pravil.</strong> V Pantheonu nastaviš, kdo ima dostop do prejetih dokumentov, kako se obravnavajo različni tipi računov, kateri dobavitelji so že v šifrantu.</li>
            <li><strong>Test.</strong> Pošlji prvi tekstovni PDF — to je najlažje za OCR. Preveri, ali se podatki pravilno prepoznajo.</li>
          </ol>

          <h2>Kaj prepozna Pantheon eBooks OCR</h2>
          <p>
            Sistem izlušči naslednje podatke:
          </p>
          <ul>
            <li>Ime dobavitelja in davčna številka</li>
            <li>Številka računa in datum računa</li>
            <li>Datum opravljene storitve / dobave</li>
            <li>Skupni znesek brez DDV</li>
            <li>Stopnja in znesek DDV</li>
            <li>Skupni znesek za plačilo</li>
            <li>Sklic / referenca</li>
            <li>Valuta plačila</li>
          </ul>
          <p>
            Vsak podatek je v predlogu knjiženja označen z odstotkom zaupanja. Tisti pod 80 % so označeni in čakajo, da uporabnik potrdi.
          </p>

          <h2>Pošiljanje fotografij računov v Pantheon</h2>
          <p>
            Z mobilno aplikacijo SlikajRačun nastavitev traja minuto:
          </p>
          <ol>
            <li>V <Link href="/settings">SlikajRačun nastavitvah</Link> dodaš svoj Pantheon email naslov za prejem dokumentov.</li>
            <li>Pojdi na <Link href="/scan">Skeniraj</Link> in fotografiraj račun.</li>
            <li>Aplikacija optimizira sliko (1600px max, JPEG quality 80) in jo pošlje.</li>
            <li>Pantheon eBooks v Pantheonu prikaže nov dokument v sekciji &ldquo;Prejete priponke&rdquo; v 1–5 minutah.</li>
            <li>Klikneš na dokument, preveriš predlog knjiženja in potrdiš.</li>
          </ol>

          <h2>Nasveti za maksimalno natančnost</h2>
          <ul>
            <li><strong>PDF je vedno boljši od slike.</strong> Če je račun digitalen (e-račun, PDF iz emaila), pošlji original — OCR doseže 99 % natančnost.</li>
            <li><strong>Visoka ločljivost.</strong> Fotografije pod 1000px so pretežke za zanesljiv OCR. SlikajRačun aplikacija avtomatsko stisne na 1600px (idealno).</li>
            <li><strong>Direktna svetloba.</strong> Ne pod oknom z senco mizo, raje na ravni svetli površini.</li>
            <li><strong>Brez deformacije.</strong> Računi v žepu se zguzajo — pred fotografiranjem zravnaj.</li>
            <li><strong>En račun na sliko.</strong> Več računov v enem kadru zmedeš OCR — pošlji vsako posebej.</li>
          </ul>

          <h2>Pantheon eBooks OCR vs ostali slovenski programi</h2>
          <p>
            V primerjavi z Minimax in Birokrat OCR rešitvami ima Pantheon eBooks dve prednosti in eno slabost:
          </p>
          <ul>
            <li><strong>+</strong> Globlja integracija s šifrantom in kontnim načrtom — sistem že pri prvem prepoznavanju ve, kateri konto naj uporabi.</li>
            <li><strong>+</strong> Boljši za večja podjetja — workflow odobravanja, več-stopenjsko potrjevanje, sledenje.</li>
            <li><strong>−</strong> Doplačilo. Minimax in Birokrat imata OCR vključen v paket, Pantheon je dodatna storitev.</li>
          </ul>

          <h2>Pogosta vprašanja</h2>

          <h3>Kaj je Pantheon eBooks OCR?</h3>
          <p>
            Pantheon eBooks OCR je dodatna storitev programa Pantheon (Datalab), ki samodejno prebere podatke s slike računa ali PDF dokumenta in jih pripravi za knjiženje v sistem.
          </p>

          <h3>Kakšna je cena Pantheon eBooks OCR?</h3>
          <p>
            Pantheon eBooks OCR se zaračuna po mesečnem paketu in številu obdelanih dokumentov. Točen cenik dobiš pri Datalab predstavniku — odvisi od velikosti podjetja in pogodbe.
          </p>

          <h3>Ali se lahko Pantheon poveže z mobilno aplikacijo za fotografiranje?</h3>
          <p>
            Da. Pantheon ima email naslov za sprejem dokumentov. Z mobilno aplikacijo (npr. SlikajRačun) lahko fotografiraš račun in ga avtomatsko pošlješ na ta naslov.
          </p>

          <h3>Kakšne podatke prepozna Pantheon eBooks OCR?</h3>
          <p>
            Dobavitelja, davčno številko, številko in datum računa, znesek brez DDV, znesek DDV, končno vsoto in valuto. Pri kvalitetnih dokumentih natančnost presega 90 %.
          </p>

          <h2>Naredi prvi korak</h2>
          <p>
            Če imaš že aktivno Pantheon eBooks OCR storitev, je SlikajRačun najhitrejša pot do mobilnega fotografiranja računov. Brezplačno za prve 3 račune mesečno.
          </p>
          <p>
            <Link
              href="/scan"
              className="not-prose inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 !text-white text-base h-12 px-6 rounded-xl font-semibold transition-colors no-underline"
            >
              📷 Pošlji prvi račun v Pantheon
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
              <Link href="/blog/birokrat-ocr-uvoz-racunov" className="text-blue-600 hover:underline">
                Birokrat OCR: kako nastaviti uvoz računov po emailu →
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
