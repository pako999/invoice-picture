import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { getPost } from "@/lib/blog";
import { BlogCover } from "@/components/blog-cover";

const post = getPost("najboljse-aplikacije-za-skeniranje-racunov")!;

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

export default function ComparisonBlog() {
  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <BlogCover post={post} badge="Primerjava" badgeClassName="bg-orange-500/90 text-white border-0 hover:bg-orange-500/90" />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/blog" className="text-sm text-blue-600 hover:underline mb-8 inline-block">← Vsi članki</Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12 prose prose-slate prose-lg max-w-none prose-headings:scroll-mt-20 prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-code:font-mono prose-code:text-sm prose-li:my-1 prose-ul:my-4 prose-ol:my-4 prose-table:rounded-xl prose-table:overflow-hidden prose-th:bg-slate-100 prose-th:p-3 prose-td:p-3 prose-td:border-slate-200 prose-th:border-slate-200">
          <p className="lead">
            Iščeš mobilno aplikacijo za skeniranje papirnatih računov, ki bi jih avtomatsko poslala v računovodski program? V Sloveniji je nekaj možnosti — vsaka s svojimi prednostmi in slabostmi. Tukaj je iskrena primerjava 6 aplikacij za leto 2026, vključno s ceno, podprtimi programi in kdaj uporabiti katero.
          </p>

          <h2>Kaj iskati pri aplikaciji za skeniranje računov</h2>
          <p>
            Pred primerjavo preglej teh 5 stvari — od njih je odvisno, ali ti bo aplikacija dejansko prihranila čas:
          </p>
          <ol>
            <li><strong>Podpora tvojemu računovodskemu programu.</strong> Minimax, Birokrat, Pantheon, SAOP, E-računi, Metakocka — vsak ima svoj email naslov za uvoz. Aplikacija mora znati pošiljati na ta naslov.</li>
            <li><strong>Hitrost zajema.</strong> Od trenutka, ko vzameš telefon iz žepa, do potrjenega pošiljanja: idealno 5–10 sekund.</li>
            <li><strong>Optimizacija fotografije.</strong> Slika mora biti pripravljena za OCR — kompresirana, ostra, brez popačenja. Slabe aplikacije pošljejo 5 MB JPEG, ki ga OCR slabo prebere.</li>
            <li><strong>Arhiv in iskanje.</strong> Včasih moraš preveriti, ali si že poslal nek račun. Brez arhiva to ne gre.</li>
            <li><strong>Cena.</strong> Brezplačni paketi so omejeni — preveri, koliko računov mesečno dejansko pošlješ in primerjaj z naročnino.</li>
          </ol>

          <h2>1. SlikajRačun (priporočeno za Slovenijo)</h2>
          <p>
            <strong>Cena:</strong> brezplačno do 3 računov / mesec, 6,90 € / mesec za neomejeno, 17,90 € / mesec za PRO (več podjetij).
          </p>
          <p>
            <strong>Podprti programi:</strong> Minimax, Birokrat, Pantheon, SAOP, E-računi, Metakocka — vsak računovodski program z email uvozom.
          </p>
          <p>
            <strong>Prednosti:</strong>
          </p>
          <ul>
            <li>Narejena v Sloveniji za slovenske računovodske programe — uporabniški vmesnik in podpora v slovenščini.</li>
            <li>iOS in Android aplikacija, plus spletna stran za pošiljanje s računalnika.</li>
            <li>PRO paket podpira upravljanje več podjetij z ločenimi OCR email naslovi (idealno za računovodske servise).</li>
            <li>Arhiv s predogledom in iskanjem brez časovnih omejitev.</li>
            <li>Avtomatska kompresija slik na velikost, ki jo OCR pravilno prebere.</li>
          </ul>
          <p>
            <strong>Slabosti:</strong>
          </p>
          <ul>
            <li>Mlada storitev (lansirana 2026) — manjša baza uporabnikov kot pri uveljavljenih tujih konkurentih.</li>
            <li>Free paket je omejen na 3 račune mesečno.</li>
          </ul>

          <h2>2. Microsoft Lens + ročno pošiljanje</h2>
          <p>
            <strong>Cena:</strong> brezplačno.
          </p>
          <p>
            <strong>Prednosti:</strong>
          </p>
          <ul>
            <li>Brezplačno za vedno.</li>
            <li>Odlična kvaliteta skena (auto-crop, perspective correction).</li>
          </ul>
          <p>
            <strong>Slabosti:</strong>
          </p>
          <ul>
            <li>Ne pošilja avtomatsko v računovodski program — sken moraš najprej shraniti, nato ročno priložiti v email klient in poslati.</li>
            <li>Ni arhiva poslanih računov.</li>
            <li>Ni podpore za več podjetij.</li>
            <li>Ni slovenskega vmesnika.</li>
          </ul>

          <h2>3. Adobe Scan + email</h2>
          <p>
            <strong>Cena:</strong> brezplačno z Adobe računom, premium 9,99 € / mesec.
          </p>
          <p>
            <strong>Prednosti:</strong>
          </p>
          <ul>
            <li>Najboljši PDF generator iz fotografij na trgu.</li>
            <li>OCR že v aplikaciji (premium).</li>
          </ul>
          <p>
            <strong>Slabosti:</strong>
          </p>
          <ul>
            <li>Tudi tu ročno pošiljanje — Adobe ne ve, kateri računovodski program imaš.</li>
            <li>Optimiziran za pisarniško skeniranje, ne za hitre fotografije računov na poti.</li>
            <li>Premium je drag, brezplačni pa omejen.</li>
          </ul>

          <h2>4. Dext (mednarodna konkurenca)</h2>
          <p>
            <strong>Cena:</strong> ~24 € / mesec (Pro paket).
          </p>
          <p>
            <strong>Prednosti:</strong>
          </p>
          <ul>
            <li>Lasten OCR motor v aplikaciji — neodvisen od računovodskega programa.</li>
            <li>Integracije z QuickBooks, Xero, Sage.</li>
          </ul>
          <p>
            <strong>Slabosti:</strong>
          </p>
          <ul>
            <li>Ni slovenskega vmesnika ali podpore.</li>
            <li>Ne integrira z Minimax, Birokrat ali Pantheon — namenjen tujim trgom.</li>
            <li>Cena je 3× višja kot SlikajRačun.</li>
          </ul>

          <h2>5. ReceiptBank / Hubdoc</h2>
          <p>
            <strong>Cena:</strong> Hubdoc je vključen v Xero naročnino.
          </p>
          <p>
            <strong>Prednosti / slabosti:</strong> Praktično irelevantno za slovenski trg, saj večina uporablja Minimax / Birokrat / Pantheon, ne Xero.
          </p>

          <h2>6. Pošiljanje preko običajnega email klienta</h2>
          <p>
            <strong>Cena:</strong> brezplačno.
          </p>
          <p>
            Tehnično lahko vsak telefon naredi: fotografiraš → odpri Mail / Gmail → priloži sliko → vneseš OCR email naslov → pošlješ.
          </p>
          <p>
            <strong>Slabosti:</strong>
          </p>
          <ul>
            <li>Vsako pošiljanje traja 30–60 sekund (ročno tipkanje email naslova!).</li>
            <li>Slika ni stisnjena — OCR jo lahko zavrne (preveč MB).</li>
            <li>Ni arhiva poslanih računov.</li>
            <li>Pri večih podjetjih: zamenjaj naslov vsakič.</li>
          </ul>

          <h2>Tabela primerjave</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm not-prose mb-8 border-collapse">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left p-3 border border-slate-200">Aplikacija</th>
                  <th className="text-left p-3 border border-slate-200">Cena / mesec</th>
                  <th className="text-left p-3 border border-slate-200">Avtomatsko pošiljanje</th>
                  <th className="text-left p-3 border border-slate-200">Več podjetij</th>
                  <th className="text-left p-3 border border-slate-200">Slovenski programi</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border border-slate-200 font-semibold">SlikajRačun</td>
                  <td className="p-3 border border-slate-200">0–17,90 €</td>
                  <td className="p-3 border border-slate-200">✅</td>
                  <td className="p-3 border border-slate-200">✅ (PRO)</td>
                  <td className="p-3 border border-slate-200">✅ vsi</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-3 border border-slate-200">Microsoft Lens</td>
                  <td className="p-3 border border-slate-200">0 €</td>
                  <td className="p-3 border border-slate-200">❌ ročno</td>
                  <td className="p-3 border border-slate-200">❌</td>
                  <td className="p-3 border border-slate-200">⚠️ ročno</td>
                </tr>
                <tr>
                  <td className="p-3 border border-slate-200">Adobe Scan</td>
                  <td className="p-3 border border-slate-200">0–9,99 €</td>
                  <td className="p-3 border border-slate-200">❌ ročno</td>
                  <td className="p-3 border border-slate-200">❌</td>
                  <td className="p-3 border border-slate-200">⚠️ ročno</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-3 border border-slate-200">Dext</td>
                  <td className="p-3 border border-slate-200">~24 €</td>
                  <td className="p-3 border border-slate-200">✅</td>
                  <td className="p-3 border border-slate-200">✅</td>
                  <td className="p-3 border border-slate-200">❌</td>
                </tr>
                <tr>
                  <td className="p-3 border border-slate-200">Hubdoc / ReceiptBank</td>
                  <td className="p-3 border border-slate-200">~12 €</td>
                  <td className="p-3 border border-slate-200">✅</td>
                  <td className="p-3 border border-slate-200">✅</td>
                  <td className="p-3 border border-slate-200">❌</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-3 border border-slate-200">Email klient</td>
                  <td className="p-3 border border-slate-200">0 €</td>
                  <td className="p-3 border border-slate-200">❌ ročno</td>
                  <td className="p-3 border border-slate-200">❌</td>
                  <td className="p-3 border border-slate-200">⚠️ ročno</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>Katero aplikacijo izbrati?</h2>
          <ul>
            <li><strong>Če uporabljaš Minimax, Birokrat, Pantheon ali drug slovenski računovodski program:</strong> SlikajRačun. Edina, ki je narejena za to.</li>
            <li><strong>Če pošlješ pod 10 računov mesečno in nimaš proračuna:</strong> SlikajRačun brezplačni paket (3 / mesec) ali kombinacija Microsoft Lens + email.</li>
            <li><strong>Če uporabljaš Xero ali QuickBooks:</strong> Hubdoc (vključen v Xero) ali Dext.</li>
            <li><strong>Računovodski servis z več strankami:</strong> SlikajRačun PRO — ločen OCR email za vsako stranko, hitri preklop.</li>
          </ul>

          <h2>Naredi preizkusno pošiljanje</h2>
          <p>
            Najlažji način, da preveriš, ali aplikacija deluje s tvojim računovodskim programom — pošlji prvi račun zdaj. Pri SlikajRačun aplikacija je brezplačna za prve 3 račune. Brez kreditne kartice, brez vezave.
          </p>
          <p>
            <Link
              href="/scan"
              className="not-prose inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 !text-white text-base h-12 px-6 rounded-xl font-semibold transition-colors no-underline"
            >
              📷 Začni brezplačno
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
              <Link href="/blog/pantheon-ebooks-ocr-vodnik" className="text-blue-600 hover:underline">
                Pantheon eBooks OCR: vodnik za avtomatsko knjiženje →
              </Link>
            </li>
          </ul>
        </aside>
      </article>
    </div>
  );
}
