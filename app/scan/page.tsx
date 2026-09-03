"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { Company } from "@/lib/schema";

interface SubStatus {
  isFree: boolean;
  monthlyUsage: number;
  monthlyLimit: number | null;
}

interface SelectedFile {
  id: string;
  file: File;
  url: string;
}

const MAX_BATCH_FILES = 500;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

// Compress image to max 1600px and 80% quality — keeps file small but preview-ready
function compressImage(file: File): Promise<{ base64: string; mime: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1600;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
        else { width = Math.round((width * MAX) / height); height = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      const [, base64] = dataUrl.split(",");
      resolve({ base64, mime: "image/jpeg" });
    };
    img.src = url;
  });
}

function isPdf(mime: string) {
  return mime === "application/pdf";
}

function FreeLimitModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="text-center mb-5">
          <div className="text-5xl mb-3">📊</div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">
            Mesečna omejitev dosežena
          </h2>
          <p className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed">
            Dosegli ste mesečno omejitev 3 računov. Nadgradite na Osnovni paket za neomejeno obdelavo računov.
          </p>
        </div>
        <div className="space-y-3">
          <Link
            href="/upgrade?plan=basic"
            className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            Nadgradi na Osnovni paket →
          </Link>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            Zapri
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ScanPage() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [recipientEmail, setRecipientEmail] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [subject, setSubject] = useState("Račun");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [errMsg, setErrMsg] = useState("");
  const [dragging, setDragging] = useState(false);
  const [subStatus, setSubStatus] = useState<SubStatus | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const noStore: RequestInit = { cache: "no-store", headers: { "Cache-Control": "no-cache" } };
    Promise.all([
      fetch("/api/settings", noStore).then(r => r.json()).catch(() => ({})),
      fetch("/api/companies", noStore).then(r => r.json()).catch(() => []),
      fetch("/api/subscription", noStore).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([settings, comps, sub]) => {
      setRecipientEmail(settings.recipientEmail || null);
      const list: Company[] = Array.isArray(comps) ? comps : [];
      setCompanies(list);
      if (list.length > 0) setSelectedCompanyId(list[0].id);
      if (sub) setSubStatus({ isFree: sub.isFree, monthlyUsage: sub.monthlyUsage, monthlyLimit: sub.monthlyLimit });
    });
  }, []);

  function addFiles(incoming: File[]) {
    const valid = incoming.filter((f) => f.type.startsWith("image/") || f.type === "application/pdf");
    const oversized = valid.filter((f) => f.size > MAX_FILE_SIZE);
    const allowed = valid.filter((f) => f.size <= MAX_FILE_SIZE);
    const freeRemaining = subStatus?.isFree && subStatus.monthlyLimit !== null
      ? Math.max(0, subStatus.monthlyLimit - subStatus.monthlyUsage)
      : MAX_BATCH_FILES;
    const availableSlots = Math.max(0, Math.min(MAX_BATCH_FILES, freeRemaining) - files.length);
    const accepted = allowed.slice(0, availableSlots);

    if (accepted.length > 0) {
      setFiles((current) => [
        ...current,
        ...accepted.map((file) => ({
          id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
          file,
          url: URL.createObjectURL(file),
        })),
      ]);
    }

    if (oversized.length > 0 || allowed.length > accepted.length) {
      const messages = [];
      if (oversized.length > 0) messages.push(`${oversized.length} datotek je večjih od 10 MB`);
      if (allowed.length > accepted.length) {
        messages.push(subStatus?.isFree
          ? `brezplačni paket dovoljuje še ${freeRemaining} računov ta mesec`
          : `naenkrat lahko naložite največ ${MAX_BATCH_FILES} dokumentov`);
      }
      setErrMsg(messages.join("; "));
      setStatus("err");
      return;
    }
    setStatus("idle");
  }

  function removeFile(id: string) {
    setFiles((current) => {
      const removed = current.find((item) => item.id === id);
      if (removed) URL.revokeObjectURL(removed.url);
      return current.filter((item) => item.id !== id);
    });
  }

  function clearFiles(items = files) {
    items.forEach((item) => URL.revokeObjectURL(item.url));
    setFiles([]);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }

  const selectedCompany = companies.find(c => c.id === selectedCompanyId) ?? null;
  const hasRecipient = selectedCompany !== null || !!recipientEmail;
  const sentToLabel = selectedCompany ? selectedCompany.name : recipientEmail;

  async function handleSend() {
    if (files.length === 0) return;
    setStatus("sending");
    setErrMsg("");
    setSendProgress({ current: 0, total: files.length });
    const failed: SelectedFile[] = [];
    let sent = 0;

    for (let index = 0; index < files.length; index += 1) {
      const selected = files[index];
      setSendProgress({ current: index + 1, total: files.length });
      try {
        const encoded = selected.file.type === "application/pdf"
          ? await readFileAsBase64(selected.file)
          : await compressImage(selected.file);
      const body: Record<string, unknown> = {
        subject: subject || "Račun",
        imageBase64: encoded.base64,
        filename: selected.file.name,
        mime: encoded.mime,
      };
      if (selectedCompanyId) body.companyId = selectedCompanyId;
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.status === 402 || json.code === "subscription_required") {
        window.location.href = "/upgrade";
        return;
      }
      if (res.status === 403 && json.code === "free_limit_reached") {
        setShowLimitModal(true);
        failed.push(...files.slice(index));
        break;
      }
      if (!res.ok || !json.success) throw new Error(json.error ?? "Napaka");
        sent += 1;
        URL.revokeObjectURL(selected.url);
      } catch (err) {
        failed.push(selected);
        setErrMsg(err instanceof Error ? err.message : "Napaka pri pošiljanju");
      }
    }

    setFiles(failed);
    setSendProgress({ current: 0, total: 0 });
    setStatus(failed.length === 0 ? "ok" : "err");
    if (failed.length === 0) setSubject("Račun");
    else setErrMsg(`${sent} dokumentov poslanih, ${failed.length} neuspešnih. Poskusite znova.`);

    fetch("/api/subscription").then(r => r.ok ? r.json() : null).then(sub => {
      if (sub) setSubStatus({ isFree: sub.isFree, monthlyUsage: sub.monthlyUsage, monthlyLimit: sub.monthlyLimit });
    });
  }

  const isFreeAtLimit = subStatus?.isFree && subStatus.monthlyLimit !== null && subStatus.monthlyUsage >= subStatus.monthlyLimit;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 pb-[60vh]">
      {showLimitModal && <FreeLimitModal onClose={() => setShowLimitModal(false)} />}

      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Pošlji račun</h1>
      <p className="text-gray-500 dark:text-slate-400 mb-6">
        Fotografirajte ali naložite račun (slika ali PDF) in ga pošljite z enim klikom.
      </p>

      {/* Free plan usage counter */}
      {subStatus?.isFree && subStatus.monthlyLimit !== null && (
        <div className={`mb-5 rounded-xl border px-4 py-3 ${
          isFreeAtLimit
            ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
            : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-semibold ${isFreeAtLimit ? "text-orange-800 dark:text-orange-300" : "text-blue-800 dark:text-blue-300"}`}>
              {isFreeAtLimit ? "⚠️ Mesečna omejitev dosežena" : `📊 ${subStatus.monthlyUsage}/${subStatus.monthlyLimit} računi ta mesec`}
            </span>
            <Link href="/upgrade?plan=basic" className={`text-xs font-bold hover:underline flex-shrink-0 ${isFreeAtLimit ? "text-orange-700 dark:text-orange-400" : "text-blue-600 dark:text-blue-400"}`}>
              Nadgradi →
            </Link>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isFreeAtLimit ? "bg-orange-500" : "bg-blue-500"}`}
              style={{ width: `${Math.min(100, (subStatus.monthlyUsage / subStatus.monthlyLimit) * 100)}%` }}
            />
          </div>
          {isFreeAtLimit && (
            <p className="text-xs text-orange-700 dark:text-orange-400 mt-2">
              Nadgradite na Osnovni paket za neomejeno obdelavo računov.
            </p>
          )}
        </div>
      )}

      {/* Company selector or email banner */}
      {companies.length > 0 ? (
        <div className="mb-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Podjetje</span>
            <Link href="/settings" className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              Uredi →
            </Link>
          </div>
          <div className="p-2 flex flex-col gap-1">
            {companies.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCompanyId(c.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  selectedCompanyId === c.id
                    ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
                    : "hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent"
                }`}
              >
                <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                  selectedCompanyId === c.id
                    ? "border-blue-500 bg-blue-500"
                    : "border-gray-300 dark:border-slate-500"
                }`}>
                  {selectedCompanyId === c.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.name}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{c.recipientEmail}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : recipientEmail ? (
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
          ✅ {files.length === 0 ? "Vsi dokumenti so bili poslani" : "Dokument uspešno poslan"}{sentToLabel ? ` — ${sentToLabel}` : ""}!
        </div>
      )}
      {status === "err" && (
        <div className="mb-5 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
          ❌ {errMsg}
        </div>
      )}

      {/* Preview */}
      {files.length > 0 ? (
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-700 dark:text-slate-300">Izbranih dokumentov: {files.length}/{MAX_BATCH_FILES}</p>
            <button onClick={() => clearFiles()} disabled={status === "sending"} className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-40">Odstrani vse</button>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400">Vsak dokument bo poslan v ločenem emailu.</p>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {files.map((selected) => (
              <div key={selected.id} className="relative flex items-center gap-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3">
                {isPdf(selected.file.type) ? (
                  <div className="w-11 h-11 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">📋</div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={selected.url} alt="račun" className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{selected.file.name}</p>
                  <p className="text-xs text-gray-400">{(selected.file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <button onClick={() => removeFile(selected.id)} disabled={status === "sending"} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 disabled:opacity-40 text-lg font-bold">×</button>
              </div>
            ))}
          </div>
          {files.length < MAX_BATCH_FILES && (
            <button onClick={() => fileInputRef.current?.click()} disabled={status === "sending"} className="w-full py-3 rounded-xl border border-dashed border-blue-300 text-blue-600 text-sm font-semibold hover:bg-blue-50 disabled:opacity-40">＋ Dodaj še dokumente</button>
          )}
        </div>
      ) : (
        /* Drop zone */
        <div
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("button, input")) return;
            fileInputRef.current?.click();
          }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`mb-6 rounded-2xl border-2 border-dashed transition-colors select-none cursor-pointer
            ${dragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-slate-600"
            }`}
        >
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <span className="text-5xl">📄</span>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">Povleci dokumente sem</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Klikni ali povleci do 500 dokumentov · JPG · PNG · WEBP · <strong>PDF</strong> — vsak do 10 MB</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Vsak dokument se pošlje kot ločen email.</p>
            </div>
          </div>

          {/* Two action buttons */}
          <div className="flex border-t border-gray-200 dark:border-slate-700">
            <button
              onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
              className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors rounded-bl-2xl border-r border-gray-200 dark:border-slate-700"
            >
              📷 Fotografiraj
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors rounded-br-2xl"
            >
              📁 Naloži PDF ali sliko
            </button>
          </div>

          {/* Camera input — opens directly to camera */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) addFiles([f]); e.target.value = ""; }}
          />
          {/* File input — opens file picker (gallery, files, PDFs) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files) addFiles(Array.from(e.target.files)); e.target.value = ""; }}
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
          onFocus={(e) => {
            setTimeout(() => {
              e.target.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 300);
          }}
          placeholder="Račun"
          className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <button
        onClick={handleSend}
        disabled={files.length === 0 || !hasRecipient || status === "sending" || !!isFreeAtLimit}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-base transition-colors"
      >
        {status === "sending" ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Pošiljam {sendProgress.current}/{sendProgress.total}...
          </>
        ) : isFreeAtLimit ? (
          <>📊 Mesečna omejitev dosežena</>
        ) : (
          <>📤 Pošlji {files.length === 1 ? "račun" : `${files.length} dokumentov`}</>
        )}
      </button>

      {files.length > 50 && status !== "sending" && (
        <p className="text-center text-xs text-orange-600 dark:text-orange-400 mt-3">
          Pri pošiljanju večjega števila dokumentov pustite to stran odprto do zaključka.
        </p>
      )}

      {isFreeAtLimit && (
        <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-3">
          <Link href="/upgrade?plan=basic" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
            Nadgradi na Osnovni paket
          </Link>{" "}
          za neomejeno obdelavo računov.
        </p>
      )}
    </div>
  );
}
