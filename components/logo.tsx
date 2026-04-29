export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      {/* Background pill */}
      <rect width="32" height="32" rx="9" fill="url(#logoGrad)" />
      {/* Receipt shape */}
      <rect x="9" y="6" width="14" height="17" rx="2" fill="white" fillOpacity="0.15" />
      <rect x="9" y="6" width="14" height="17" rx="2" stroke="white" strokeWidth="1.5" strokeOpacity="0.9" />
      {/* Receipt lines */}
      <line x1="12" y1="11" x2="20" y2="11" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.9" />
      <line x1="12" y1="14.5" x2="20" y2="14.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.9" />
      <line x1="12" y1="18" x2="17" y2="18" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.9" />
      {/* Camera circle badge */}
      <circle cx="22" cy="24" r="6" fill="#2563EB" stroke="#1D4ED8" strokeWidth="1" />
      <circle cx="22" cy="24" r="5" fill="#1E40AF" />
      <circle cx="22" cy="24" r="2.5" fill="white" fillOpacity="0.9" />
      <circle cx="23.5" cy="22.5" r="0.8" fill="white" />
    </svg>
  );
}

export function LogoWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Logo size={28} />
      <span className="font-extrabold text-gray-900 dark:text-white tracking-tight">
        Slikaj<span className="text-blue-600 dark:text-blue-400">Račun</span>
      </span>
    </span>
  );
}
