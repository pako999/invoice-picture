import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, BookOpen, Video, Phone } from "lucide-react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Setup Help",
  description:
    "We help you with the initial setup: registration, OCR email address, first test send. Step-by-step instructions for Minimax, Birokrat, Pantheon and SAOP.",
  slug: "pomoc-pri-nastavitvi",
  locale: "en",
});

export default function SetupHelp() {
  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-green-100 text-green-700 hover:bg-green-200 border-0">Setup Help</Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-6 font-bold">We&rsquo;ll help you get started</h1>
          <p className="text-xl text-slate-600">
            If you need help setting up or run into issues, we&rsquo;re here for you
          </p>
        </div>

        <div className="space-y-8">
          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Help with the basics</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">If you don&rsquo;t know where to start, we&rsquo;ll walk you through it:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
                <li>Registration and signing in</li>
                <li>Finding the right OCR email address for your accounting program</li>
                <li>Entering your settings and configuring the app</li>
                <li>The first test invoice send</li>
                <li>Verifying that the invoice arrives in your program</li>
              </ul>
              <p className="text-sm text-slate-600 mt-4">
                Reach out at{" "}
                <a href="mailto:info@posljiracun.si" className="text-blue-600 hover:underline">info@posljiracun.si</a>{" "}
                and we&rsquo;ll arrange a video call or send detailed instructions.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-green-600" />
                </div>
                <CardTitle className="text-xl">Per-program guides</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">We have dedicated guides for the most popular accounting programs:</p>
              <div className="space-y-3">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold">Minimax</h3>
                  <p className="text-sm text-slate-600">
                    How to enable email import and OCR processing in Minimax
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold">Birokrat</h3>
                  <p className="text-sm text-slate-600">
                    Step-by-step guide to setting up Birokrat
                  </p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-semibold">Pantheon</h3>
                  <p className="text-sm text-slate-600">
                    Activating eBooks OCR and connecting to our app
                  </p>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="font-semibold">SAOP</h3>
                  <p className="text-sm text-slate-600">Configuring API access and email import in SAOP</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-4">
                Email us for detailed instructions for your specific accounting program.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Video className="w-5 h-5 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Video tutorials</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">Watch our video tutorials that walk you through the whole process:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
                <li>Getting started with the app (5 min)</li>
                <li>Configuring the OCR email address (3 min)</li>
                <li>Photographing and sending your first invoice (2 min)</li>
                <li>Using the archive and send history (4 min)</li>
                <li>Advanced PRO features (6 min)</li>
              </ul>
              <p className="text-sm text-slate-600 mt-4">Coming soon on our YouTube channel.</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-orange-600" />
                </div>
                <CardTitle className="text-xl">Personal support</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">PRO subscribers get personal phone or video support:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
                <li>Priority support</li>
                <li>Scheduled video setup call</li>
                <li>Personal needs assessment</li>
                <li>Help with multi-company integration</li>
              </ul>
              <Link
                href="/en/pricing"
                className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                See PRO plan
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
          <h2 className="text-2xl mb-4 font-semibold">Still need help?</h2>
          <p className="text-slate-600 mb-6">
            Reach out to our support team and we&rsquo;ll be happy to help with setup.
          </p>
          <Link
            href="/en/contact"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}
