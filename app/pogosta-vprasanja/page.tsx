import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Pogosta vprašanja",
  description: "15 odgovorov na najpogostejša vprašanja: kako deluje aplikacija, podprti programi, varnost podatkov, cena, OCR obdelava, podprti formati, odpoved.",
  slug: "pogosta-vprasanja",
});

const faqs = [
  { question: "Kako deluje aplikacija Računi?", answer: "Aplikacija omogoča fotografiranje papirnatih računov s telefonom in njihovo avtomatsko pošiljanje na email naslov vašega računovodskega programa. Program nato z OCR tehnologijo prebere podatke in jih knjiži v sistem." },
  { question: "Ali moram imeti določen računovodski program?", answer: "Ne. Aplikacija deluje z vsakim računovodskim programom, ki podpira uvoz računov preko emaila. Podprta so najmanj Minimax, Birokrat, Pantheon, SAOP, E-računi in Metakocka." },
  { question: "Kdo izvaja OCR obdelavo računov?", answer: "OCR obdelavo (branje podatkov s slike) izvaja vaš računovodski program, ne naša aplikacija. Mi samo poskrbimo, da slika računa prispe na pravilen email naslov v vašem programu." },
  { question: "Ali potrebujem posebno opremo?", answer: "Ne. Potrebujete samo pametni telefon s kamero in dostop do interneta. Aplikacija deluje v brskalniku ali kot mobilna aplikacija." },
  { question: "Koliko računov lahko pošljem?", answer: "Pri osnovnem paketu lahko pošljete neomejeno računov mesečno. Ni omejitev glede števila pošiljanj." },
  { question: "Kaj je vključeno v PRO paket?", answer: "PRO paket je namenjen računovodskim servisom in podjetjem z več subjekti. Omogoča upravljanje neomejeno podjetij, ločene OCR email naslove za vsako podjetje, hitri preklop med podjetji in ločeno shranjevanje arhiva po podjetjih." },
  { question: "Ali lahko aplikacijo odpojem kadarkoli?", answer: "Da. Naročnino lahko odpoveste kadarkoli brez vezave ali skritih stroškov. Paket je aktiven do konca plačanega obdobja." },
  { question: "Kako varna je aplikacija?", answer: "Aplikacija uporablja Clerk avtentikacijo za varen dostop. Slike računov se pošiljajo preko varnih kanalov direktno na email vašega računovodskega programa. Mi ne shranjujemo občutljivih finančnih podatkov." },
  { question: "Kaj če moj računovodski program ne podpira email uvoza?", answer: "Preverite nastavitve vašega programa ali kontaktirajte ponudnika. Večina sodobnih računovodskih programov že podpira to funkcijo, morda jo je potrebno samo aktivirati v nastavitvah." },
  { question: "Katere formate slik podpira aplikacija?", answer: "Aplikacija podpira JPG, PNG, WEBP in PDF formate. To vključuje tako fotografije kot tudi digitalne dokumente." },
  { question: "Kako dolgo so računi shranjeni v arhivu?", answer: "Vsi poslani računi so shranjeni v arhivu brez časovnih omejitev. Do njih lahko dostopate kadarkoli." },
  { question: "Ali lahko uporabim aplikacijo za več podjetij?", answer: "Da. Z osnovnim paketom lahko upravljate eno podjetje. Za več podjetij potrebujete PRO paket, ki omogoča upravljanje neomejeno subjektov." },
  { question: "Kaj če račun ni bil pravilno prepoznan?", answer: "Kakovost OCR prepoznave je odvisna od vašega računovodskega programa in kvalitete slike. Poskrbite za dobro osvetlitev in ostro sliko. Če težave vztrajajo, kontaktirajte ponudnika vašega računovodskega programa." },
  { question: "Ali ponujate brezplačno preizkusno dobo?", answer: "Da, vsak nov uporabnik dobi 7-dnevno brezplačno preizkusno dobo brez vnosa kreditne kartice. Po preteku se lahko odločite za nadgradnjo na osnovni paket (6,90 €/mesec) ali PRO paket (17,90 €/mesec)." },
  { question: "Kako dobim podporo, če imam težave?", answer: "Kontaktirajte nas preko kontaktne strani ali pišite na našo podporo. Z veseljem vam pomagamo pri nastavitvi in reševanju težav." },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.answer,
    },
  })),
};

export default function PogostaPrasanja() {
  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-purple-100 text-purple-700 hover:bg-purple-200 border-0">Pogosta vprašanja</Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-6 font-bold">Imate vprašanja? Tu so odgovori.</h1>
          <p className="text-xl text-slate-600">Odgovori na najpogostejša vprašanja o aplikaciji Računi</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex gap-3">
                  <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
          <h2 className="text-2xl mb-4 font-semibold">Niste našli odgovora na vaše vprašanje?</h2>
          <p className="text-slate-600 mb-6">Kontaktirajte našo podporo in z veseljem vam bomo pomagali.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Kontaktirajte nas
            </Link>
            <Link
              href="/pomoc-pri-nastavitvi"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Pomoč pri nastavitvi
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
