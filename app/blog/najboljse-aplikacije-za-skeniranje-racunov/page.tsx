import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { getPost } from "@/lib/blog";
import { BlogCover } from "@/components/blog-cover";

const post = getPost("najboljse-aplikacije-za-skeniranje-racunov")!;

export const metadata = pageMetadata({
  title: post.title,
  description: post.description,
  slug: `blog/${post.slug}`,
  altPaths: { sl: `/blog/${post.slug}`, en: `/en/blog/${post.slugEn}` },
});

const faq = [
  ["Kaj je najbolj pomembno pri aplikaciji za skeniranje računov?", "Odvisno od cilja. Za arhiv je dovolj kakovosten PDF. Za avtomatizacijo računovodstva potrebujete OCR ekstrakcijo, validacijo podatkov in zanesljiv način dostave v računovodski sistem."],
  ["Ali je scanner aplikacija isto kot OCR računov?", "Ne. Scanner ustvari sliko ali PDF. OCR računov iz dokumenta prebere strukturirane podatke, kot so številka računa, dobavitelj, DDV, IBAN, zneski in postavke."],
  ["Ali Slikaj Račun podpira slovenske in angleške račune?", "Da. OCR workflow je namenjen slovenskim in angleškim računom ter pogostim mednarodnim oznakam na računih."],
  ["Ali lahko račun po OCR pošljem v računovodski program?", "Da. Original lahko pošljete na uvozni email, potrjene podatke pa vključite v UBL 2.1, eSLOG 2.0 ali JSON API workflow, odvisno od nastavitev in paketa."],
];

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: post.title,
  description: post.description,
  datePublished: post.publishedAt,
  dateModified: "2026-09-17",
  inLanguage: "sl-SI",
  keywords: post.keyword,
  author: { "@type": "Organization", name: "Slikaj Račun" },
  publisher: { "@type": "Organization", name: "Slikaj Račun", logo: { "@type": "ImageObject", url: "https://www.posljiracun.si/logo-icon.svg" } },
  mainEntityOfPage: `https://www.posljiracun.si/blog/${post.slug}`,
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
};

export default function ComparisonBlog() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <BlogCover post={post} badge="Posodobljeno 2026" badgeClassName="bg-orange-500/90 text-white border-0 hover:bg-orange-500/90" />

      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Link href="/blog" className="mb-8 inline-block text-sm text-blue-600 hover:underline">← Vsi članki</Link>

        <div className="prose prose-slate prose-lg max-w-none rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12 prose-headings:font-bold prose-a:text-blue-600">
          <p className="lead">Ko nekdo išče <strong>aplikacijo za skeniranje računov</strong>, lahko išče dve zelo različni stvari: aplikacijo, ki naredi lep PDF, ali sistem, ki račun tudi prebere in pripravi podatke za računovodstvo. To je ključna razlika med navadnim scannerjem in <strong>OCR računov</strong>.</p>

          <h2>Scanner aplikacija ali OCR računov?</h2>
          <table>
            <thead><tr><th>Funkcija</th><th>Scanner</th><th>OCR računov</th></tr></thead>
            <tbody>
              <tr><td>Fotografija / PDF</td><td>Da</td><td>Da</td></tr>
              <tr><td>Prebere številko računa in datume</td><td>Ne</td><td>Da</td></tr>
              <tr><td>Prebere DDV, IBAN in zneske</td><td>Ne</td><td>Da</td></tr>
              <tr><td>Prebere postavke</td><td>Ne</td><td>Da</td></tr>
              <tr><td>Preveri matematične zneske</td><td>Ne</td><td>Da</td></tr>
              <tr><td>Pripravi UBL/eSLOG/API podatke</td><td>Ne</td><td>Da</td></tr>
            </tbody>
          </table>

          <h2>1. Slikaj Račun: skeniranje + OCR + računovodski workflow</h2>
          <p>Slikaj Račun je narejen za prejete račune. Uporabnik naloži PDF, fotografijo ali več dokumentov, sistem pa lahko poleg arhiva in pošiljanja izvede tudi lastno OCR ekstrakcijo.</p>
          <p>Med podatki, ki jih sistem prebere, so številka računa, datumi, dobavitelj, kupec, DDV številke, IBAN, neto znesek, DDV, bruto znesek, DDV razčlenitev in postavke. Podprti so slovenski in angleški računi.</p>
          <ul>
            <li>OCR ekstrakcija podatkov iz PDF-ja ali slike,</li>
            <li>validacija zneskov, DDV in IBAN,</li>
            <li>pregled dokumentov z nizko zanesljivostjo,</li>
            <li>upravljanje več podjetij,</li>
            <li>pošiljanje originala na računovodski email,</li>
            <li>strukturirana dostava prek UBL, eSLOG ali JSON API.</li>
          </ul>
          <p>Podrobnosti so na strani <Link href="/ocr-racunov">OCR računov</Link>.</p>

          <h2>2. Microsoft Lens: dober za PDF, ne za računovodski workflow</h2>
          <p>Microsoft Lens je uporaben, ko potrebujete čist sken dokumenta. Omogoča crop, popravljanje perspektive in PDF. Vendar scanner sam po sebi ne pripravi računovodskih polj niti ne ve, kateremu podjetju ali računovodskemu procesu mora dokument pripadati.</p>

          <h2>3. Adobe Scan: kakovostno skeniranje dokumentov</h2>
          <p>Adobe Scan je močan splošni dokumentni scanner. Primeren je, kadar je glavni cilj izdelava kakovostnega PDF-ja. Za slovenski računovodski proces pa morate še vedno urediti, kam dokument poslati in kako podatke prenesti naprej.</p>

          <h2>4. Mednarodne receipt-capture rešitve</h2>
          <p>Rešitve za zajem računov, kot so Dext in podobna orodja, so usmerjene v ekstrakcijo podatkov in povezave z mednarodnimi računovodskimi sistemi. Pri izbiri preverite, ali podpirajo vaš računovodski program, jezik računov, zahtevane izvozne formate in način dela z več slovenskimi podjetji.</p>

          <h2>5. Telefon + email</h2>
          <p>Najbolj preprost postopek je še vedno fotografija in ročno pošiljanje po emailu. To lahko deluje pri majhnem številu računov, vendar hitro nastanejo težave: napačen prejemnik, ni strukturiranih podatkov, ni validacije in težje preverite, ali je bil račun že poslan.</p>

          <h2>Kaj izbrati glede na vaš cilj?</h2>
          <ul>
            <li><strong>Samo lep PDF:</strong> klasična scanner aplikacija.</li>
            <li><strong>Prebrani podatki računa:</strong> potrebujete OCR računov.</li>
            <li><strong>Slovenski in angleški dobavitelji:</strong> preverite podporo obema jezikoma in računovodskim oznakam.</li>
            <li><strong>Računovodski servis:</strong> pomembni so multi-company workflow, ločene destinacije in množični upload.</li>
            <li><strong>Avtomatizacija:</strong> poleg OCR preverite še UBL, eSLOG ali API dostavo.</li>
          </ul>

          <h2>Kako poteka OCR pri Slikaj Račun?</h2>
          <ol>
            <li>Naložite PDF ali fotografijo.</li>
            <li>Sistem prebere in normalizira podatke računa.</li>
            <li>Preveri DDV, IBAN, zneske in možne duplikate.</li>
            <li>Negotovi dokumenti gredo v ročni pregled.</li>
            <li>Potrjen račun se pošlje v nastavljen računovodski workflow.</li>
          </ol>
          <p>Za podjetja, ki že uporabljajo Minimax, Birokrat, Pantheon ali drug sistem, je posebej pomembna stran <Link href="/integracije">integracija z računovodskim programom</Link>.</p>

          <h2>Pogosta vprašanja</h2>
          {faq.map(([q, a]) => <section key={q}><h3>{q}</h3><p>{a}</p></section>)}

          <div className="not-prose mt-10 rounded-2xl bg-slate-950 p-7 text-white">
            <h2 className="text-2xl font-black">Preverite OCR na svojem računu</h2>
            <p className="mt-2 text-slate-300">Namesto da primerjate samo scannerje, naložite pravi račun in preverite, katere podatke lahko sistem uporabi naprej.</p>
            <Link href="/sign-up" className="mt-5 inline-flex rounded-xl bg-white px-5 py-3 font-bold text-slate-950">Preizkusi Slikaj Račun</Link>
          </div>
        </div>

        <aside className="mt-12 border-t border-slate-200 pt-8">
          <h2 className="mb-4 text-lg font-semibold">Sorodne strani</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/ocr-racunov" className="text-blue-600 hover:underline">OCR računov: avtomatsko branje in validacija →</Link></li>
            <li><Link href="/programi-za-racune" className="text-blue-600 hover:underline">Programi za račune v Sloveniji →</Link></li>
            <li><Link href="/blog/minimax-email-uvoz-racunov" className="text-blue-600 hover:underline">Minimax OCR in email uvoz računov →</Link></li>
          </ul>
        </aside>
      </article>
    </div>
  );
}
