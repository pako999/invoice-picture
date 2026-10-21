"use client";

import { useState } from "react";
import { ExternalLink, Minus, Plus, RotateCcw } from "lucide-react";

export function InvoiceDocumentViewer({ url, mimeType, filename, children }: { url: string; mimeType: string; filename: string; children?: React.ReactNode }) {
  const [zoom, setZoom] = useState(100);
  const image = mimeType.startsWith("image/");
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-700 sm:px-6">
      <h2 className="font-bold text-slate-900 dark:text-white">Slika računa</h2>
      <div className="flex items-center gap-1">
        {image ? <><button type="button" aria-label="Pomanjšaj račun" disabled={zoom <= 50} onClick={() => setZoom(z => Math.max(50,z-25))} className="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-30"><Minus className="h-4 w-4" /></button><output className="w-12 text-center text-xs tabular-nums" aria-label="Povečava">{zoom}%</output><button type="button" aria-label="Povečaj račun" disabled={zoom >= 250} onClick={() => setZoom(z => Math.min(250,z+25))} className="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-30"><Plus className="h-4 w-4" /></button><button type="button" aria-label="Ponastavi povečavo" onClick={() => setZoom(100)} className="rounded-lg p-2 hover:bg-slate-100"><RotateCcw className="h-4 w-4" /></button></> : null}
        <a href={url} target="_blank" rel="noopener noreferrer" aria-label="Odpri izvirni račun v novem zavihku" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"><ExternalLink className="h-4 w-4" /></a>
      </div>
    </div>
    <div className="h-[65vh] min-h-80 overflow-auto overscroll-contain bg-slate-100 p-3 dark:bg-slate-950 sm:p-5 lg:h-[calc(100vh-15rem)]">
      {image ? <div className="relative mx-auto min-h-full" style={{ width: `${zoom}%` }}><img src={url} alt={filename} className="block h-auto w-full bg-white shadow-sm" />{children}</div> : mimeType === "application/pdf" ? <iframe src={`${url}#zoom=page-width`} title={filename} className="h-full min-h-80 w-full bg-white" /> : <div className="flex h-full items-center justify-center"><a href={url} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">Prenesi izvorni dokument</a></div>}
    </div>
  </div>;
}
