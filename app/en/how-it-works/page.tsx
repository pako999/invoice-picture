import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Camera, Send, FileText, Mail, CheckCircle } from "lucide-react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "How it works",
  description:
    "Three simple steps to automated invoice processing: configure your OCR email, photograph the invoice, send in one tap. Verified with Minimax, Birokrat, Pantheon.",
  slug: "kako-deluje",
  locale: "en",
});

export default function HowItWorks() {
  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">How it works</Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-6 font-bold">
            Three simple steps to automated invoice processing
          </h1>
          <p className="text-xl text-slate-600">
            The app is designed for fast, simple use. Follow these steps to get started.
          </p>
        </div>

        <div className="space-y-12">
          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Settings className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">1. Set up your email once</CardTitle>
                  <CardDescription>One-time configuration</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">
                In the app settings, paste the email address that your accounting program assigns you for invoice import. This is the address your program uses to receive and OCR-process invoices automatically.
              </p>
              <p className="text-slate-700">
                Example email: <code className="bg-slate-100 px-2 py-1 rounded">uvoz@minimax.si</code>
              </p>
              <p className="text-sm text-slate-600">
                <strong>Important:</strong> you only do this once. The address is saved and reused for every send.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Camera className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">2. Photograph the invoice</CardTitle>
                  <CardDescription>Snap the paper document</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">
                Open the app and use your phone&rsquo;s camera to photograph the paper invoice. The app supports several formats:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-700">
                <li>JPG / JPEG</li>
                <li>PNG</li>
                <li>WEBP</li>
                <li>PDF documents</li>
              </ul>
              <p className="text-sm text-slate-600">
                <strong>Tip:</strong> ensure good lighting and try to capture the whole invoice in frame. A higher-quality photo means cleaner OCR results.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Send className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">3. One click — sent</CardTitle>
                  <CardDescription>Push the invoice to your accounting program</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">
                Once you&rsquo;re happy with the photo, tap &ldquo;Send&rdquo;. The app immediately delivers the image to your configured email address.
              </p>
              <p className="text-slate-700">
                The invoice arrives at your accounting program&rsquo;s inbox in seconds. From there your program takes over and:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-700">
                <li>Reads amounts from the image with OCR</li>
                <li>Detects the invoice date</li>
                <li>Identifies the supplier</li>
                <li>Extracts every relevant data point</li>
                <li>Posts the invoice into your books</li>
              </ul>
              <p className="text-sm text-slate-600">
                <strong>Important:</strong> OCR runs in your accounting program — not on our servers. We only deliver the image to the right place.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
          <h2 className="text-2xl mb-6 text-center font-semibold">The full process</h2>
          <div className="flex flex-wrap justify-center gap-4 items-center text-center">
            <div className="flex-1 min-w-[120px]">
              <FileText className="w-12 h-12 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium">Paper invoice</p>
            </div>
            <div className="text-slate-400 text-2xl">→</div>
            <div className="flex-1 min-w-[120px]">
              <Camera className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium">Photograph</p>
            </div>
            <div className="text-slate-400 text-2xl">→</div>
            <div className="flex-1 min-w-[120px]">
              <Send className="w-12 h-12 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium">Send</p>
            </div>
            <div className="text-slate-400 text-2xl">→</div>
            <div className="flex-1 min-w-[120px]">
              <Mail className="w-12 h-12 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-medium">OCR processing</p>
            </div>
            <div className="text-slate-400 text-2xl">→</div>
            <div className="flex-1 min-w-[120px]">
              <CheckCircle className="w-12 h-12 text-teal-600 mx-auto mb-2" />
              <p className="text-sm font-medium">Booked!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
