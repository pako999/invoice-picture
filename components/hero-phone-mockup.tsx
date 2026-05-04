type Props = {
  title: string;
  dropLabel: string;
  fileHint: string;
  cameraLabel: string;
  uploadLabel: string;
  subjectLabel: string;
  subjectValue: string;
  sendLabel: string;
};

export function HeroPhoneMockup({
  title,
  dropLabel,
  fileHint,
  cameraLabel,
  uploadLabel,
  subjectLabel,
  subjectValue,
  sendLabel,
}: Props) {
  return (
    <div
      role="img"
      aria-label={title}
      className="relative w-full max-w-[320px] aspect-[9/19] rounded-[2.5rem] bg-slate-900 p-2 shadow-2xl ring-1 ring-slate-800"
    >
      {/* Side buttons */}
      <span className="absolute -left-[3px] top-24 h-10 w-[3px] rounded-l bg-slate-800" aria-hidden />
      <span className="absolute -left-[3px] top-40 h-16 w-[3px] rounded-l bg-slate-800" aria-hidden />
      <span className="absolute -right-[3px] top-32 h-20 w-[3px] rounded-r bg-slate-800" aria-hidden />

      {/* Screen */}
      <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-white">
        {/* Notch */}
        <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-slate-900" aria-hidden />

        {/* Status bar — sits below the notch */}
        <div className="flex items-center justify-between px-5 pt-9 text-[10px] font-semibold text-slate-700">
          <span>9:41</span>
          <span className="flex items-center gap-1" aria-hidden>
            <span>•••</span>
            <span>100%</span>
          </span>
        </div>

        {/* App content */}
        <div className="px-4 pt-3">
          <h3 className="text-center text-base font-bold text-slate-900">{title}</h3>

          {/* Email banner */}
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-[10px] text-blue-800">
            <span>📧</span>
            <span className="truncate">uvoz@minimax.si</span>
          </div>

          {/* Drop zone */}
          <div className="mt-3 rounded-xl border-2 border-dashed border-slate-300">
            <div className="flex flex-col items-center justify-center gap-1.5 py-5">
              <span className="text-3xl">📄</span>
              <p className="text-[11px] font-semibold text-slate-700">{dropLabel}</p>
              <p className="text-[9px] text-slate-400">{fileHint}</p>
            </div>
            <div className="flex border-t border-slate-200">
              <div className="flex-1 border-r border-slate-200 py-2.5 text-center text-[10px] font-semibold text-slate-600">
                📷 {cameraLabel}
              </div>
              <div className="flex-1 py-2.5 text-center text-[10px] font-semibold text-slate-600">
                📁 {uploadLabel}
              </div>
            </div>
          </div>

          {/* Subject */}
          <div className="mt-3">
            <p className="mb-1 text-[8px] font-bold uppercase tracking-wider text-slate-400">{subjectLabel}</p>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-700">
              {subjectValue}
            </div>
          </div>

          {/* Send button */}
          <div className="mt-3 rounded-xl bg-blue-600 py-3 text-center text-[12px] font-bold text-white shadow-md">
            ✉️ {sendLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
