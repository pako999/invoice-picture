import Link from "next/link";
import { Home } from "lucide-react";

export const metadata = {
  title: { absolute: "Page not found — Slikaj Račun" },
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8">
          <p className="text-9xl font-bold text-slate-200" aria-hidden="true">404</p>
          <h1 className="text-3xl sm:text-4xl tracking-tight mb-4 mt-4 font-bold">Page not found</h1>
          <p className="text-xl text-slate-600 mb-8">
            Sorry, the page you are looking for does not exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/en"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 h-12 rounded-lg font-medium transition-colors"
          >
            <Home className="w-5 h-5" />
            Back to the home page
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <h2 className="text-lg mb-4 font-semibold">You might be looking for:</h2>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/en/how-it-works" className="text-blue-600 hover:underline">How it works</Link>
            <span className="text-slate-300">•</span>
            <Link href="/en/integrations" className="text-blue-600 hover:underline">Integrations</Link>
            <span className="text-slate-300">•</span>
            <Link href="/en/pricing" className="text-blue-600 hover:underline">Pricing</Link>
            <span className="text-slate-300">•</span>
            <Link href="/en/contact" className="text-blue-600 hover:underline">Contact</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
