import Link from "next/link";
import { BlogCover } from "@/components/blog-cover";
import { getPost, getPostEn } from "@/lib/blog";

type Locale = "sl" | "en";
type Topic = "accounting-software" | "online-accounting" | "cloud-integration";

const content = {
  sl: {
    "accounting-software": {
      intro: "Računovodska programska oprema danes ni več samo program za knjiženje. Pri izbiri je pomembno, kako hitro vanjo spravite prejete račune, ali podpira OCR, email uvoz, delo z več podjetji in varen dostop iz različnih naprav.",
      sections: [
        ["Kaj mora dobra računovodska programska oprema omogočati?", ["Osnova je izdaja in knjiženje računov, vendar pri vsakodnevnem delu največ časa pogosto vzame zbiranje dokumentov. Zato preverite, ali program podpira digitalni uvoz prejetih računov, OCR, arhiv dokumentov, uporabniške pravice in delo z več podjetji.", "Pomemben je tudi način vnosa. Če račun prejmete na papirju ali v PDF, mora biti pot do računovodstva čim krajša. Dober proces pomeni: zajem dokumenta, pošiljanje v pravi sistem, OCR obdelavo in nato pregled oziroma knjiženje." ]],
        ["OCR in email uvoz prejetih računov", ["OCR prebere ključne podatke z računa, vendar mora dokument najprej priti v sistem. Veliko računovodskih rešitev uporablja namenski email naslov za uvoz dokumentov. To omogoča enostaven in zelo zanesljiv workflow brez ročnega nalaganja vsake datoteke skozi več menijev.", "Slikaj Račun je namenjen ravno temu vhodnemu koraku: dokument fotografirate ali naložite, aplikacija pa ga pošlje na nastavljen OCR oziroma uvozni email vašega računovodskega programa." ]],
        ["Računovodska programska oprema za več podjetij", ["Računovodski servisi in skupine podjetij imajo dodatno težavo: vsak subjekt ima svoj cilj za dokumente. Če zaposleni uporablja več različnih prijav ali ročno menja email naslove, hitro pride do napak.", "Boljši pristop je ena prijava, seznam podjetij in ločena nastavitev ciljnega emaila za vsako podjetje. Tako lahko izberete družbo, naložite tudi več deset ali sto računov in jih pošljete v ločenih sporočilih na pravi OCR naslov." ]],
        ["Spletna ali namizna rešitev?", ["Spletna računovodska programska oprema je dostopna iz brskalnika in praviloma lažje podpira delo na več lokacijah. Namizni programi so lahko primerni za bolj zaprta okolja. Pri izbiri je pomembneje od same platforme preveriti, kako dobro rešitev vključite v svoj dejanski tok dokumentov." ]],
        ["Kako izbrati pravi sistem", ["Najprej določite, ali potrebujete predvsem izdajo računov, celotno računovodstvo ali hitrejši zajem prejetih dokumentov. Nato preverite integracije, OCR, email uvoz, število podjetij, uporabniške pravice in stroške na uporabnika oziroma podjetje.", "Če računovodski program že imate, ga pogosto ni treba menjati. Velik prihranek lahko dosežete že z boljšim zajemom in pošiljanjem prejetih računov." ]],
      ],
    },
    "online-accounting": {
      intro: "Spletni računovodski programi omogočajo dostop iz brskalnika, sodelovanje z računovodstvom in delo iz različnih naprav. Pri računih pa je ključno, kako dobro rešijo vhod dokumentov: PDF, fotografije, OCR in avtomatski uvoz.",
      sections: [
        ["Kaj pomeni spletni računovodski program?", ["Gre za računovodsko rešitev, ki deluje v oblaku in do katere dostopate prek spleta. Posodobitve praviloma izvaja ponudnik, podatki pa so na voljo uporabnikom z ustreznimi pravicami ne glede na lokacijo.", "Za podjetnika je največja prednost, da lahko dokumente obdeluje sproti, računovodski servis pa vidi iste podatke brez pošiljanja map in fizičnih računov." ]],
        ["Katere funkcije so pri prejetih računih najpomembnejše?", ["Preverite podporo za PDF in slike, OCR, email uvoz, iskanje arhiva, status obdelave in možnost ločevanja dokumentov po podjetjih. Če program omogoča namenski email za prejete račune, lahko zajem zelo poenostavite." ]],
        ["Spletni računovodski programi in mobilni zajem", ["Telefon je najhitrejši skener, kadar račun dobite na poti. Namesto fotografiranja, shranjevanja, odpiranja emaila in ročnega vnašanja prejemnika lahko mobilna aplikacija dokument pošlje neposredno na nastavljen računovodski email.", "To je posebej uporabno za terenske ekipe, trgovine, gostinstvo in podjetnike, ki imajo veliko manjših računov." ]],
        ["Več podjetij v enem računu", ["Pri računovodskih servisih ali skupinah podjetij je smiselno, da uporabnik vidi seznam družb in za vsako posebej določi OCR oziroma uvozni email. Tako se isti uporabniški račun uporablja za več podjetij, dokumenti pa še vedno končajo v pravilnem sistemu." ]],
        ["Kdaj je spletni sistem prava izbira?", ["Spletna rešitev je posebej primerna, če delate na več lokacijah, potrebujete sodelovanje med podjetjem in računovodstvom ali želite zmanjšati odvisnost od enega računalnika. Pri izbiri pa preverite tudi varnost, izvoz podatkov in integracije z obstoječimi procesi." ]],
      ],
    },
    "cloud-integration": {
      intro: "Cloud računovodska integracija ni nujno zapleten API projekt. Pri prejetih računih lahko zelo učinkovit sistem sestavljajo mobilni zajem, namenski email in OCR obdelava v računovodskem programu.",
      sections: [
        ["Kaj je cloud računovodska integracija?", ["To je povezava med orodjem, kjer dokument nastane ali ga zajamete, in računovodskim sistemom v oblaku. Namen je zmanjšati ročne prenose datotek in preprečiti podvajanje vnosa.", "Pri računih je najpreprostejši primer integracije pošiljanje dokumenta na namenski email, ki ga računovodski program spremlja in obdeluje z OCR." ]],
        ["Email integracija proti API integraciji", ["API je smiseln, ko morate prenašati strukturirane podatke med sistemi, izvajati povratne sinhronizacije ali graditi kompleksne procese. Za osnovni uvoz računov pa je email pogosto hitrejši za uvedbo in lažji za vzdrževanje.", "Če program že zna sprejeti PDF ali sliko po emailu in ga obdelati z OCR, lahko ta vhod uporabite brez dodatnega razvoja." ]],
        ["Kako izgleda avtomatiziran OCR workflow", ["Uporabnik izbere podjetje, naloži ali fotografira račune, aplikacija vsak dokument pošlje kot ločeno sporočilo na pravi OCR email, računovodski sistem pa nato izvede prepoznavo in pripravi dokument za nadaljnjo obdelavo.", "Pri večjih paketih lahko uporabnik izbere tudi 100+ dokumentov naenkrat. Pomembno je, da se vsak dokument pošlje ločeno, saj veliko OCR sistemov tako zanesljiveje obdeluje priloge." ]],
        ["Integracija za več podjetij", ["Za računovodske servise mora integracija vedeti, kateremu podjetju pripada dokument. Ena uporabniška prijava lahko zato vsebuje več podjetij, vsako s svojim ciljnim emailom. S tem se zmanjša možnost, da račun konča pri napačni stranki." ]],
        ["Kaj preveriti pred uvedbo", ["Preverite, ali vaš računovodski program podpira sprejem dokumentov po emailu, katere formate sprejema, največjo velikost datoteke in ali je OCR vključen v vaš paket. Nato nastavite testno podjetje in pošljite nekaj dokumentov, preden proces razširite na vse uporabnike." ]],
      ],
    },
  },
  en: {
    "accounting-software": {
      intro: "Accounting software is no longer only about bookkeeping. When choosing a system, look at how quickly incoming invoices can enter it, whether OCR and email import are supported, and how multi-company workflows are handled.",
      sections: [
        ["What should modern accounting software include?", ["Beyond invoicing and bookkeeping, the daily bottleneck is often document collection. Look for digital invoice import, OCR, searchable archives, user permissions and multi-company support.", "A good workflow is short: capture the document, route it to the correct system, let OCR process it, then review or book it." ]],
        ["OCR and invoice email import", ["OCR can read invoice data, but the document first needs to reach the accounting system. Many platforms provide a dedicated import email address. This creates a simple and reliable workflow without manually uploading each document through several screens." ]],
        ["Multi-company accounting workflows", ["Accounting firms and business groups need to route each document to the correct company. A single login with separate company profiles and destination emails reduces errors and avoids switching between accounts." ]],
        ["Cloud or desktop?", ["Cloud accounting software is easier to access from multiple locations, while desktop software may suit closed environments. The more important question is how well the platform fits your real document workflow and integrations." ]],
        ["How to choose", ["Decide whether you mainly need invoicing, full accounting, or faster incoming-document capture. Then compare integrations, OCR, email import, company limits, user permissions and pricing. If you already have accounting software, improving document capture may deliver more value than replacing the system." ]],
      ],
    },
    "online-accounting": {
      intro: "Online accounting software gives browser access, easier collaboration and cloud workflows. For incoming invoices, the key features are PDF/image handling, OCR, email import and document routing.",
      sections: [
        ["What is online accounting software?", ["It is a cloud-based accounting system accessed through a browser. The provider typically manages updates while authorized users can work from different locations.", "For businesses and accounting firms, this removes much of the friction around exchanging physical documents." ]],
        ["Important incoming-invoice features", ["Check support for PDFs and images, OCR, invoice email import, archive search, processing status and company-level routing. A dedicated document inbox can simplify the entire process." ]],
        ["Mobile capture", ["A phone is often the fastest scanner for receipts and paper invoices. Instead of taking a photo, saving it, opening email and typing a destination, a capture app can route it directly to the accounting inbox." ]],
        ["Multiple companies", ["Accounting firms benefit from one user account that can select among several companies, each with its own OCR or import email address. Documents still land in the correct accounting environment." ]],
        ["When online accounting is a good fit", ["Cloud systems are attractive when teams work from several locations, collaborate with external accountants or want to avoid dependence on one computer. Security, exports and integrations should still be part of the evaluation." ]],
      ],
    },
    "cloud-integration": {
      intro: "A cloud accounting integration does not always require a complex API project. For incoming invoices, mobile capture plus a dedicated email inbox and OCR can be an effective automation layer.",
      sections: [
        ["What is a cloud accounting integration?", ["It connects the place where a document is captured with the cloud accounting system. The goal is to reduce manual file transfers and duplicate data entry.", "For invoices, one of the simplest integrations is sending a document to a dedicated inbox monitored by the accounting platform." ]],
        ["Email integration vs API integration", ["APIs are useful for structured data exchange, two-way synchronization and complex automation. For basic invoice intake, email can be faster to implement and easier to maintain.", "If the accounting platform already accepts PDF or image attachments and processes them with OCR, that inbox can become the integration point." ]],
        ["An automated OCR workflow", ["The user selects a company, uploads or photographs invoices, each document is sent separately to the correct OCR inbox, and the accounting system prepares it for further processing.", "Bulk workflows can handle dozens or hundreds of files at once while still sending each document separately." ]],
        ["Multi-company integration", ["Accounting firms need routing by company. A single user account can hold several company profiles, each with its own destination inbox, reducing the risk of sending a document to the wrong client." ]],
        ["What to verify before rollout", ["Confirm that your accounting software accepts documents by email, which formats and file sizes are allowed, and whether OCR is included in your plan. Test with a small set of documents before rolling the process out broadly." ]],
      ],
    },
  },
} as const;

export function GscSeoArticle({ topic, locale }: { topic: Topic; locale: Locale }) {
  const slugMap = {
    "accounting-software": locale === "sl" ? "racunovodska-programska-oprema-slovenija" : "accounting-software-slovenia-guide",
    "online-accounting": locale === "sl" ? "spletni-racunovodski-programi-slovenija" : "online-accounting-software-slovenia",
    "cloud-integration": locale === "sl" ? "cloud-racunovodska-integracija-ocr" : "cloud-accounting-integration-ocr",
  } as const;

  const post = locale === "sl" ? getPost(slugMap[topic])! : getPostEn(slugMap[topic])!;
  const c = content[locale][topic];
  const postSlug = locale === "sl" ? post.slug : post.slugEn;
  const canonical = locale === "sl" ? `https://www.posljiracun.si/blog/${postSlug}` : `https://www.posljiracun.si/en/blog/${postSlug}`;
  const title = locale === "sl" ? post.title : post.titleEn;
  const description = locale === "sl" ? post.description : post.descriptionEn;
  const publishedAt = post.publishedAt;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    datePublished: publishedAt,
    dateModified: publishedAt,
    inLanguage: locale === "sl" ? "sl-SI" : "en",
    author: { "@type": "Organization", name: "Slikaj Račun" },
    publisher: { "@type": "Organization", name: "Slikaj Račun" },
    mainEntityOfPage: canonical,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <BlogCover post={post} locale={locale} badge={locale === "sl" ? "Vodnik 2026" : "2026 Guide"} />
      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Link href={locale === "sl" ? "/blog" : "/en/blog"} className="mb-8 inline-block text-sm text-blue-600 hover:underline">
          {locale === "sl" ? "← Vsi članki" : "← All articles"}
        </Link>
        <div className="prose prose-lg prose-slate max-w-none rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
          <p className="lead">{c.intro}</p>
          {c.sections.map(([heading, paragraphs]) => (
            <section key={heading}>
              <h2>{heading}</h2>
              {paragraphs.map((p) => <p key={p}>{p}</p>)}
            </section>
          ))}

          <h2>{locale === "sl" ? "Povezani vodiči in naslednji koraki" : "Related guides and next steps"}</h2>
          <ul>
            <li><Link href={locale === "sl" ? "/integracije" : "/en/integrations"}>{locale === "sl" ? "Integracije z računovodskimi programi" : "Accounting software integrations"}</Link></li>
            <li><Link href={locale === "sl" ? "/programi-za-racune" : "/en/blog/best-invoice-scanner-apps-slovenia"}>{locale === "sl" ? "Primerjava programov za račune" : "Best invoice scanner apps"}</Link></li>
            <li><Link href={locale === "sl" ? "/blog/minimax-email-uvoz-racunov" : "/en/blog/minimax-email-invoice-import"}>{locale === "sl" ? "Minimax OCR in email uvoz" : "Minimax OCR and email import"}</Link></li>
            <li><Link href={locale === "sl" ? "/blog/birokrat-ocr-uvoz-racunov" : "/en/blog/birokrat-ocr-invoice-import"}>{locale === "sl" ? "Birokrat OCR vodnik" : "Birokrat OCR guide"}</Link></li>
          </ul>

          <div className="not-prose mt-10 rounded-2xl bg-slate-950 p-7 text-white">
            <h2 className="text-2xl font-bold">{locale === "sl" ? "Želite hitrejši zajem prejetih računov?" : "Want a faster incoming-invoice workflow?"}</h2>
            <p className="mt-2 text-slate-300">{locale === "sl" ? "Z enim računom upravljajte več podjetij, naložite tudi 100+ dokumentov in jih pošljite na prave OCR emaile." : "Manage multiple companies from one account, upload 100+ documents and route them to the correct OCR inboxes."}</p>
            <Link href={locale === "sl" ? "/sign-up" : "/en/sign-up"} className="mt-5 inline-flex rounded-xl bg-white px-5 py-3 font-semibold text-slate-950">
              {locale === "sl" ? "Preizkusi Slikaj Račun" : "Try Slikaj Račun"}
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
