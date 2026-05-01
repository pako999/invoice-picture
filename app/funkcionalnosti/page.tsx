import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Mail, Archive, Smartphone, Shield, Zap, Clock, FileCheck, Users, BarChart } from "lucide-react";

import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Funkcionalnosti",
  description: "En klik za pošiljanje računa, neomejeno fotografij, arhiv s predogledom, status v realnem času, varna Clerk avtentikacija. Vse, kar potrebujete za hitro knjiženje.",
  path: "/funkcionalnosti",
});

const features = [
  { Icon: Camera, color: "blue", title: "📷 En klik — račun poslan", desc: "Poslikajte papirnat račun in pritisnite Pošlji. Nič tipkanja, nič prenašanja datotek. Celoten proces traja manj kot 5 sekund. Aplikacija je optimizirana za mobilne naprave in omogoča izjemno hitro fotografiranje ter pošiljanje dokumentov." },
  { Icon: Mail, color: "green", title: "📧 Posredovanje na vaš program", desc: "App pošlje sliko na email naslov, ki ga nastavi vaš računovodski program. OCR obdelavo opravi program — Minimax, Birokrat, Pantheon in drugi. Podatki se avtomatsko prenesejo v vaš sistem brez ročnega vnosa." },
  { Icon: Archive, color: "purple", title: "📋 Arhiv vseh pošiljanj", desc: "Vsi poslani računi so shranjeni z datumom, statusom dostave in predogledom. Kadarkoli preverite, ali je bil račun poslan. Zgodovina pošiljanj je dostopna neomejeno dolgo in omogoča hitro iskanje po dokumentih." },
  { Icon: Smartphone, color: "orange", title: "Mobilno optimizirana", desc: "Aplikacija je narejena za uporabo na mobilnih napravah. Preprost vmesnik, hitra kamera in takojšnje pošiljanje — vse kar potrebujete za učinkovito delo na terenu ali v pisarni." },
  { Icon: Shield, color: "teal", title: "Varna avtentikacija", desc: "Dostop do aplikacije je zaščiten s Clerk avtentikacijo — sodobnim sistemom za upravljanje identitete uporabnikov. Vaši podatki so varni in dostopni samo vam." },
  { Icon: Zap, color: "pink", title: "Takojšnja dostava", desc: "Status pošiljanja v realnem času. Takoj vidite, kdaj je bil račun poslan in dostavljen na email vašega računovodskega programa. Brez čakanja, brez dvomov." },
  { Icon: FileCheck, color: "indigo", title: "Podpora za vse formate", desc: "Aplikacija podpira JPG, PNG, WEBP in PDF formate. Ne glede na to, kako poslikate račun ali ga prejmete, ga boste lahko poslali naprej v obdelavo." },
  { Icon: Clock, color: "yellow", title: "Prihranek časa", desc: "Nadomestite minute ročnega tipkanja z enim klikom. Prihranite do 80% časa pri vnosu računov. Osredotočite se na pomembnejše naloge, aplikacija poskrbi za rutinsko delo." },
  { Icon: Users, color: "cyan", title: "Upravljanje več podjetij (PRO)", desc: "PRO paket omogoča upravljanje neomejeno podjetij na enem računu. Hitri preklop med podjetji, ločeni OCR email naslovi in arhiv računov ločen po podjetjih." },
  { Icon: BarChart, color: "emerald", title: "Shramba brez omejitev", desc: "Celotna zgodovina poslanih računov je shranjena brez časovnih ali količinskih omejitev. Vedno imate dostop do svojih podatkov in lahko jih kadarkoli pregledate." },
];

const colorClasses: Record<string, string> = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  purple: "bg-purple-100 text-purple-600",
  orange: "bg-orange-100 text-orange-600",
  teal: "bg-teal-100 text-teal-600",
  pink: "bg-pink-100 text-pink-600",
  indigo: "bg-indigo-100 text-indigo-600",
  yellow: "bg-yellow-100 text-yellow-600",
  cyan: "bg-cyan-100 text-cyan-600",
  emerald: "bg-emerald-100 text-emerald-600",
};

export default function Funkcionalnosti() {
  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0">Funkcionalnosti</Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-6 font-bold">
            Vse kar potrebujete za upravljanje računov
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Močne funkcije, ki poenostavijo vaš delovni proces in prihranijo dragocen čas
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f) => (
            <Card key={f.title} className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${colorClasses[f.color]}`}>
                  <f.Icon className="w-6 h-6" />
                </div>
                <CardTitle>{f.title}</CardTitle>
                <CardDescription className="mt-3">{f.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
