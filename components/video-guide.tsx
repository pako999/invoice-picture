"use client";

import { useEffect, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";

type Variant = "desktop" | "mobile";

const copy = {
  sl: {
    title: "Video vodič",
    text: "Poglejte, kako v nekaj korakih nastavite podjetje, pošljete račun ter preverite in potrdite prebrane podatke.",
    desktop: "Računalnik",
    mobile: "Telefon",
    note: null as string | null,
    fallback: "Vaš brskalnik ne podpira predvajanja videa.",
  },
  en: {
    title: "Video guide",
    text: "See how to set up a company, send an invoice and review and approve the extracted data in a few steps.",
    desktop: "Desktop",
    mobile: "Mobile",
    note: "Captions are in Slovenian.",
    fallback: "Your browser does not support video playback.",
  },
};

const sources: Record<Variant, { src: string; poster: string; width: number; height: number }> = {
  desktop: { src: "/videos/vodic-splet.mp4", poster: "/videos/vodic-splet.webp", width: 1920, height: 1080 },
  mobile: { src: "/videos/vodic-mobilni.mp4", poster: "/videos/vodic-mobilni.webp", width: 780, height: 1688 },
};

/** Screen-recorded walkthrough with a desktop and a mobile version. */
export function VideoGuide({ locale = "sl", className = "", heading = true }: { locale?: "sl" | "en"; className?: string; heading?: boolean }) {
  const t = copy[locale];
  const [variant, setVariant] = useState<Variant>("desktop");

  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) setVariant("mobile");
  }, []);

  const video = sources[variant];

  return (
    <section id="video" className={`scroll-mt-24 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7 ${className}`} aria-labelledby={heading ? "video-guide-title" : undefined} aria-label={heading ? undefined : t.title}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        {heading ? <div>
          <h2 id="video-guide-title" className="text-2xl font-black text-slate-950">{t.title}</h2>
          <p className="mt-1 max-w-2xl text-slate-600">{t.text}</p>
          {t.note && <p className="mt-1 text-sm text-slate-500">{t.note}</p>}
        </div> : t.note ? <p className="text-sm text-slate-500">{t.note}</p> : <span />}
        <div className="inline-flex shrink-0 self-start rounded-xl border border-slate-200 bg-slate-50 p-1" role="tablist" aria-label={t.title}>
          {(["desktop", "mobile"] as const).map((key) => {
            const Icon = key === "desktop" ? Monitor : Smartphone;
            const active = variant === key;
            return (
              <button key={key} type="button" role="tab" aria-selected={active} onClick={() => setVariant(key)}
                className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-bold transition ${active ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:text-slate-900"}`}>
                <Icon className="h-4 w-4" aria-hidden />{t[key]}
              </button>
            );
          })}
        </div>
      </div>
      <div className={`mx-auto mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 ${variant === "mobile" ? "max-w-[340px]" : "w-full"}`}>
        <video key={variant} controls playsInline preload="metadata" poster={video.poster} width={video.width} height={video.height} className="block h-auto w-full">
          <source src={video.src} type="video/mp4" />
          {t.fallback}
        </video>
      </div>
    </section>
  );
}
