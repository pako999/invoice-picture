import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Settings, Camera, Send, CheckCircle } from "lucide-react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "User Guide",
  description:
    "Guide to SlikajRačun: setting up the OCR email, photography tips, sending workflow, archive and history, supported formats.",
  slug: "navodila-za-uporabo",
  locale: "en",
});

export default function UserGuide() {
  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">User Guide</Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-6 font-bold">SlikajRačun user guide</h1>
          <p className="text-xl text-slate-600">Detailed instructions for getting the most out of the app</p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Initial setup</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="font-semibold">1. Sign up and sign in</h3>
              <p className="text-slate-700">
                Visit the website and register with your email address. The Clerk system sends a confirmation email — click the link to activate your account.
              </p>

              <h3 className="font-semibold mt-4">2. Configure the OCR email address</h3>
              <p className="text-slate-700">
                After signing in, go to Settings and paste the email address that your accounting program assigns you for invoice import. Examples:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                <li>Minimax: <code className="bg-slate-100 px-2 py-1 rounded text-sm">uvoz@minimax.si</code></li>
                <li>Birokrat: <code className="bg-slate-100 px-2 py-1 rounded text-sm">racuni@birokrat.si</code></li>
                <li>Pantheon: <code className="bg-slate-100 px-2 py-1 rounded text-sm">ebooks@pantheon.si</code></li>
              </ul>
              <p className="text-sm text-slate-600 mt-2">
                <strong>Note:</strong> verify the exact address inside your accounting program&rsquo;s settings or with the vendor.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Camera className="w-5 h-5 text-green-600" />
                </div>
                <CardTitle className="text-xl">Photographing invoices</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="font-semibold">Tips for the best results:</h3>
              <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
                <li>Ensure good lighting — natural light works best</li>
                <li>Place the invoice on a flat surface</li>
                <li>Capture the whole invoice in frame</li>
                <li>Make sure the photo is sharp (wait for the camera to focus)</li>
                <li>Avoid shadows and reflections</li>
              </ul>

              <h3 className="font-semibold mt-4">Supported formats:</h3>
              <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                <li>JPG / JPEG</li>
                <li>PNG</li>
                <li>WEBP</li>
                <li>PDF (for already-digital invoices)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Send className="w-5 h-5 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Sending an invoice</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="font-semibold">Step by step:</h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-700 ml-4">
                <li>Open the app and tap &ldquo;New photo&rdquo; or the camera icon</li>
                <li>Photograph the invoice or pick an existing image from the gallery</li>
                <li>Review the photo and confirm it&rsquo;s readable</li>
                <li>Tap &ldquo;Send&rdquo;</li>
                <li>Wait for delivery confirmation (usually under 2 seconds)</li>
              </ol>

              <p className="text-sm text-slate-600 mt-4">
                <strong>Send status:</strong> the send status shows immediately after tapping Send. When the invoice is delivered, a green checkmark confirms it.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-orange-600" />
                </div>
                <CardTitle className="text-xl">Archive and history</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">
                All sent invoices are automatically saved in the archive. Access at any time:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
                <li>Tap the &ldquo;Archive&rdquo; or &ldquo;History&rdquo; tab</li>
                <li>Browse all sent invoices with timestamps</li>
                <li>Tap an invoice to see the preview</li>
                <li>Check delivery status (Sent / Delivered / Error)</li>
              </ul>

              <p className="text-sm text-slate-600 mt-4">
                <strong>Search:</strong> use the search feature to quickly locate a specific invoice by date or other data.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-teal-600" />
                </div>
                <CardTitle className="text-xl">Common questions and issues</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="font-semibold">Invoice not delivered?</h3>
              <p className="text-slate-700">
                Verify that you entered the correct OCR email address in Settings. Also check that your accounting program has email-based invoice import enabled.
              </p>

              <h3 className="font-semibold mt-4">Poor OCR recognition?</h3>
              <p className="text-slate-700">
                OCR is performed by your accounting program, not by our app. Try sending a higher-quality photo (better lighting, sharper image). If the issue persists, contact your accounting software vendor.
              </p>

              <h3 className="font-semibold mt-4">Need more help?</h3>
              <p className="text-slate-700">
                Visit the{" "}
                <Link href="/en/setup-help" className="text-blue-600 hover:underline">setup help</Link>{" "}
                page or{" "}
                <Link href="/en/contact" className="text-blue-600 hover:underline">contact our support</Link>.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
