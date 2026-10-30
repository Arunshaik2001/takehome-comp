/** Brand mark: posted CTC (light band) vs estimated take-home (solid band). */
export function LogoMark({
  className = "h-10 w-10",
  title = "Takehome Comp",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <rect width="48" height="48" rx="12" fill="url(#takehome-logo-grad)" />
      <rect
        x="12"
        y="13"
        width="24"
        height="7"
        rx="2"
        fill="white"
        fillOpacity="0.38"
      />
      <rect x="12" y="23" width="24" height="14" rx="2.5" fill="white" />
      <path
        d="M20 29.5h8M22 33h4"
        stroke="#059669"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient
          id="takehome-logo-grad"
          x1="10"
          y1="6"
          x2="40"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#34d399" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function LogoWordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark className="h-11 w-11 shrink-0 shadow-sm shadow-emerald-900/10 dark:shadow-none" />
      <div className="min-w-0 leading-tight">
        <p className="text-base font-semibold tracking-tight text-stone-900 dark:text-stone-50 sm:text-lg">
          Takehome Comp
        </p>
        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400/90">
          Net pay estimates
        </p>
      </div>
    </div>
  );
}
