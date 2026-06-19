import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function BirthdayPopup() {
  const [popup, setPopup]     = useState(null);
  const [visible, setVisible] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/popup`)
      .then(r => r.json())
      .then(data => {
        if (!data.enabled || !data.date) return;

        // Check today matches the configured date (DD-MM format)
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const todayDDMM = `${dd}-${mm}`;

        if (todayDDMM !== data.date) return;

        // Only show once per day per browser session
        const shownKey = `popup-shown-${data.date}-${today.getFullYear()}`;
        if (sessionStorage.getItem(shownKey)) return;

        sessionStorage.setItem(shownKey, '1');

        // 5 second delay before showing
        setTimeout(() => {
          setPopup(data);
          setVisible(true);
        }, 5000);
      })
      .catch(() => {});
  }, []);

  if (!visible || !popup) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(44,36,22,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) setVisible(false); }}
    >
      <div
        className="paper rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
        style={{ border: '2px solid #c9980a55', animation: 'cardAppear 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        {/* Image */}
        {popup.imageUrl && !imgError && (
          <div className="w-full" style={{ maxHeight: '280px', overflow: 'hidden' }}>
            <img
              src={popup.imageUrl}
              alt="Celebration"
              className="w-full h-auto object-cover"
              style={{ maxHeight: '280px' }}
              onError={() => setImgError(true)}
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6 text-center">
          {/* Sparkles */}
          <div className="text-3xl mb-3 flex justify-center gap-2">
            <span style={{ animation: 'sparkle 1.5s ease-in-out infinite', animationDelay: '0s' }}>🎂</span>
            <span style={{ animation: 'sparkle 1.5s ease-in-out infinite', animationDelay: '0.3s' }}>🎉</span>
            <span style={{ animation: 'sparkle 1.5s ease-in-out infinite', animationDelay: '0.6s' }}>🐦</span>
            <span style={{ animation: 'sparkle 1.5s ease-in-out infinite', animationDelay: '0.9s' }}>🎉</span>
            <span style={{ animation: 'sparkle 1.5s ease-in-out infinite', animationDelay: '1.2s' }}>🎂</span>
          </div>

          <h2 className="font-display text-3xl text-amber mb-3">
            {popup.title || 'Happy Birthday!'}
          </h2>

          {popup.message && (
            <p className="font-ui text-base text-ink-mid leading-relaxed mb-5 whitespace-pre-wrap">
              {popup.message}
            </p>
          )}

          <button
            onClick={() => setVisible(false)}
            className="px-8 py-2.5 rounded-full bg-moss text-paper font-ui font-semibold text-sm hover:bg-bark transition-colors"
          >
            Continue to see today's birds 🐦
          </button>
        </div>

        {/* Confetti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          {['🎈','⭐','🌟','✨','🎊','💛','🎈','⭐'].map((s, i) => (
            <span key={i} className="absolute text-lg"
              style={{
                left: `${10 + i * 11}%`,
                top: '-15px',
                animation: `confettiFall ${0.8 + i * 0.15}s ease-in ${i * 0.12}s forwards`,
              }}>
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
