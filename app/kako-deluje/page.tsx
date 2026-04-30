import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Camera, Send } from "lucide-react";

export const metadata = {
  title: "Kako deluje | SlikajRačun",
  description: "3 preprosti koraki do avtomatizirane obdelave računov",
};

export default function KakoDeluje() {
  return (
    <div className="py-24 bg-white dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6">
            3 preprosti koraki do avtomatizirane obdelave računov
          </h1>
          <p className="text-xl text-gray-500 dark:text-slate-400">
            Aplikacija je zasnovana za hitro in enostavno uporabo.
          </p>
        </div>

        <div className="space-y-12">
          <Card className="border-gray-200 dark:border-slate-700">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Settings className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">1. Enkrat nastavi email</CardTitle>
                  <CardDescription>Postavite osnovno konfiguracijo</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-slate-300">
                V nastavitvah aplikacije vnesite email naslov, ki vam ga da vaš računovodski program za uvoz računov.
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-slate-700">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Camera className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">2. Fotografirajte račun</CardTitle>
                  <CardDescription>Poslikajte papirnat dokument</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-slate-300">
                Odprite aplikacijo in uporabite kamero za fotografiranje papirnatega računa.
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-slate-700">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Send className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">3. En klik — poslano</CardTitle>
                  <CardDescription>Pošljite račun v obdelavo</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-slate-300">
                Pritisnite Pošlji. Račun prispe na email vašega programa v sekundi.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
# Create Kako Deluje page
cat > app/kako-deluje/page.tsx << 'ENDOFFILE'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Camera, Send } from "lucide-react";

export const metadata = {
  title: "Kako deluje | SlikajRačun",
  description: "3 preprosti koraki do avtomatizirane obdelave računov",
};

export default function KakoDeluje() {
  return (
    <div className="py-24 bg-white dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6">
            3 preprosti koraki do avtomatizirane obdelave računov
          </h1>
          <p className="text-xl text-gray-500 dark:text-slate-400">
            Aplikacija je zasnovana za hitro in enostavno uporabo.
          </p>
        </div>

        <div className="space-y-12">
          <Card className="border-gray-200 dark:border-slate-700">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Settings className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">1. Enkrat nastavi email</CardTitle>
                  <CardDescription>Postavite osnovno konfiguracijo</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-slate-300">
                V nastavitvah aplikacije vnesite email naslov, ki vam ga da vaš računovodski program za uvoz računov.
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-slate-700">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Camera className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">2. Fotografirajte račun</CardTitle>
                  <CardDescription>Poslikajte papirnat dokument</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-slate-300">
                Odprite aplikacijo in uporabite kamero za fotografiranje papirnatega računa.
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-slate-700">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Send className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">3. En klik — poslano</CardTitle>
                  <CardDescription>Pošljite račun v obdelavo</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-slate-300">
                Pritisnite Pošlji. Račun prispe na email vašega programa v sekundi.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
ycat temp_nav_update.txt
rm temp_nav_update.txt}
