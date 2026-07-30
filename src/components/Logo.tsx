export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-[38px] h-[38px] sm:w-[58px] sm:h-[58px] flex items-center justify-center">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id="decisionlab-blue"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#60A5FA" />
            </linearGradient>

            <filter
              id="blueGlow"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter
              id="whiteGlow"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* OUTER D FRAME */}
          <path
            d="M 26 16 H 55 C 76 16 88 31 88 50 C 88 69 76 84 55 84 H 26 Z"
            stroke="url(#decisionlab-blue)"
            strokeWidth="11.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter="url(#blueGlow)"
          />

          {/* INNER WHITE L */}
          <path
            d="M 47 12 V 52 H 93"
            stroke="#FFFFFF"
            strokeWidth="9.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#whiteGlow)"
          />
        </svg>
      </div>

      <div className="leading-none">
        <h1 className="text-white font-semibold text-[28px] sm:text-[44px] tracking-tight">
          Decision<span className="text-[#60A5FA]">Lab</span>
        </h1>

        <p className="mt-1 text-[#93A4B5] text-[9px] uppercase tracking-[0.25em] sm:tracking-[0.45em] font-medium">
          ANALYZE · VALIDATE · GROW
        </p>
      </div>
    </div>
  );
}
