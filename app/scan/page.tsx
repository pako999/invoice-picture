"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";

function readFileAsBase64(file: File): Promise<{ base64: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [header, base64] = result.split(",");
      const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
      resolve({ base64, mime });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ScanPage() {
  const [image, setImage] = useState<{ url: string; base64: string; mime: string; name: string } | null>(null);
  const [recipientEmail, setRecipientEmail] = useState<string | null>(null);
  const [subject, setSubject] = useState("Račun");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [errMsg, setErrMsg] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setRecipientEmail(d.recipientEmail || null))
      .catch(() => {});
  }, []);

  async function handleFile(file: File) {
    const { base64, mime } = await readFileAsBase64(file);
    setImage({ url: URL.createObjectURL(file), base64, mime, name: file.name });
    setStatus("idle");
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) handleFile(file);
  }, []);

  async function handleSend() {
    if (!image) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject || "Račun",
          imageBase64: image.base64,
          filename: image.name,
          mime: image.mime,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Napaka");
      setStatus("ok");
      setImage(null);
      setSubject("Račun");
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "Napaka pri pošiljanju");
      setStatus("err");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Skeniraj račun</h1>
      <p className="text-gray-500 dark:text-slate-400 mb-6">
        Naloži ali fotografiraj račun in ga pošlji na email.
      </p>

      {/* Recipient email banner */}
      {recipientEmail ? (
        <div className="mb-6 flex items-center justify-between gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-3 rounded-xl">
          <div className="flex items-center gap-2 text-sm">
            <span>📧</span>
            <span className="text-blue-800 dark:text-blue-300">
              Pošlji na: <strong>{recipientEmail}</strong>
            </span>
          </div>
          <Link href="/settings" className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex-shrink-0">
            Spremeni →
          </Link>
        </div>
      ) : (
        <div className="mb-6 flex items-center justify-between gap-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 px-4 py-3 rounded-xl">
          <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-300">
            <span>⚠️</span>
            <span>Najprej nastavi email prejemnika v nastavitvah.</span>
          </div>
          <Link href="/settings" className="text-xs text-yellow-700 dark:text-yellow-400 font-bold hover:underline flex-shrink-0">
            Nastavi →
          </Link>
        </div>
      )}

      {/* Notifications */}
      {status === "ok" && (
        <div className="mb-5 flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl text-sm font-medium">
          ✅ Račun uspešno poslan na {recipientEmail}!
        </div>
      )}
      {status === "err" && (
        <div className="mb-5 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
          ❌ {errMsg}
        </div>
      )}

      {/* Drop zone / Preview */}
      {image ? (
        <div className="relative mb-6 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt="račun" className="w-full max-h-96 object-contain" />
          <button
            onClick={() => setImage(null)}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-900 rounded-full shadow text-gray-500 hover:text-red-500 transition-colors"
          >
            ×
          </button>
          <div className="px-4 py-2 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 text-xs text-gray-400 truncate">
            {image.name}
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`mb-6 h-52 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors select-none
            ${dragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-slate-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-slate-800/50"
            }`}
        >
          <span className="text-5xl">📄</span>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">Povleci sliko sem ali klikni</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">JPG, PNG, WEBP — do 10 MB</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      )}

      {/* Subject */}
      <div className="mb-5">
        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
          Zadeva
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Račun"
          className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <button
        onClick={handleSend}
        disabled={!image || !recipientEmail || status === "sending"}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-base transition-colors"
      >
        {status === "sending" ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Pošiljam...
          </>
        ) : (
          <>📤 Pošlji račun</>
        )}
      </button>
    </div>
  );
}
