export default function AnimatedBackground() {
  return (
    <div className="sketch-bg" aria-hidden="true">
      <svg width="100%" height="100%" viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.5 }}>
        <defs>
          <filter id="rough">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
        </defs>
        <rect width="1440" height="900" fill="#f5f0e8"/>
        {Array.from({ length: 28 }).map((_, i) => (
          <line key={i} x1="0" y1={40 + i * 31} x2="1440" y2={40 + i * 31}
            stroke="#ddd5bb" strokeWidth="0.6" opacity="0.5"/>
        ))}
        <line x1="90" y1="0" x2="90" y2="900" stroke="#e8c8c0" strokeWidth="1" opacity="0.6"/>
        {/* Left oak */}
        <g transform="translate(30,100)" opacity="0.25" filter="url(#rough)">
          <path d="M 60 620 L 55 480 L 65 380 L 60 280" stroke="#5c4020" strokeWidth="8" fill="none" strokeLinecap="round"/>
          <path d="M 55 500 L 25 440" stroke="#5c4020" strokeWidth="4" fill="none" strokeLinecap="round"/>
          <path d="M 62 430 L 95 370" stroke="#5c4020" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
          <ellipse cx="60" cy="240" rx="70" ry="80" fill="none" stroke="#4a6741" strokeWidth="1.8"/>
          <ellipse cx="30" cy="280" rx="50" ry="60" fill="none" stroke="#4a6741" strokeWidth="1.5"/>
          <ellipse cx="95" cy="270" rx="55" ry="65" fill="none" stroke="#4a6741" strokeWidth="1.5"/>
        </g>
        {/* Right oak */}
        <g transform="translate(1200,80)" opacity="0.25" filter="url(#rough)">
          <path d="M 80 640 L 76 500 L 84 380 L 80 250" stroke="#5c4020" strokeWidth="9" fill="none" strokeLinecap="round"/>
          <path d="M 77 480 L 40 410" stroke="#5c4020" strokeWidth="4" fill="none" strokeLinecap="round"/>
          <path d="M 82 420 L 120 360" stroke="#5c4020" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
          <ellipse cx="80" cy="200" rx="85" ry="95" fill="none" stroke="#4a6741" strokeWidth="1.8"/>
          <ellipse cx="45" cy="240" rx="60" ry="70" fill="none" stroke="#4a6741" strokeWidth="1.5"/>
          <ellipse cx="118" cy="230" rx="65" ry="75" fill="none" stroke="#4a6741" strokeWidth="1.5"/>
        </g>
        {/* Mid pines */}
        {[300, 1100].map((x, j) => (
          <g key={j} transform={`translate(${x},80)`} opacity="0.18" filter="url(#rough)">
            <path d="M 28 580 L 26 430" stroke="#5c4020" strokeWidth="6" fill="none" strokeLinecap="round"/>
            {[430,375,322,272,226,184,145,110,80].map((y,i)=>(
              <path key={i} d={`M 27 ${y} L ${27-(9-i)*7} ${y+40} L ${27+(9-i)*7} ${y+40} Z`}
                fill="none" stroke="#3d5e35" strokeWidth="1.2" strokeLinejoin="round"/>
            ))}
          </g>
        ))}
        {/* Ground line */}
        <path d="M 0 720 Q 200 715 400 722 Q 600 729 800 718 Q 1000 707 1200 720 Q 1320 728 1440 716"
          stroke="#8c7a55" strokeWidth="1.5" fill="none" opacity="0.3"/>
        {/* Static bird silhouettes */}
        <g transform="translate(600,180)" opacity="0.1">
          <path d="M 0 0 Q 6 -5 12 0 Q 18 -5 24 0" stroke="#4a3820" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </g>
        <g transform="translate(660,165)" opacity="0.08">
          <path d="M 0 0 Q 5 -4 10 0 Q 15 -4 20 0" stroke="#4a3820" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
        </g>
        {/* Botanical labels */}
        <text x="110" y="760" fontFamily="DM Sans, sans-serif" fontSize="12" fill="#8c7a55" opacity="0.25" transform="rotate(-1,110,760)">Quercus robur</text>
        <text x="1195" y="775" fontFamily="DM Sans, sans-serif" fontSize="12" fill="#8c7a55" opacity="0.2" transform="rotate(1,1195,775)">Betula pendula</text>
      </svg>
    </div>
  );
}
