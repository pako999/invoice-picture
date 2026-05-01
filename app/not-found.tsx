import Link from "next/link";
import { Home } from "lucide-react";

export const metadata = { title: "Stran ni najdena — SlikajRačun" };

export default function NotFound() {
  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-slate-200">404</h1>
          <h2 className="text-3xl sm:text-4xl tracking-tight mb-4 mt-4 font-bold">Stran ni bila najdena</h2>
          <p className="text-xl text-slate-600 mb-8">
            Oprostite, stran, ki jo iščete, ne obstaja ali je bila premaknjena.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 h-12 rounded-lg font-medium transition-colors"
          >
            <Home className="w-5 h-5" />
            Nazaj na domačo stran
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <h3 className="text-lg mb-4 font-semibold">Morda iščete:</h3>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/kako-deluje" className="text-blue-600 hover:underline">Kako deluje</Link>
            <span className="text-slate-300">•</span>
            <Link href="/integracije" className="text-blue-600 hover:underline">Integracije</Link>
            <span className="text-slate-300">•</span>
            <Link href="/cenik" className="text-blue-600 hover:underline">Cenik</Link>
            <span className="text-slate-300">•</span>
            <Link href="/contact" className="text-blue-600 hover:underline">Kontakt</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
