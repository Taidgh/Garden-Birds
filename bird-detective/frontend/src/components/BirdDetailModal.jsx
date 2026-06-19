import { useState, useEffect, useCallback, useRef } from 'react';
import { getBirdEmoji } from '../utils/helpers';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function WeatherIcon({ icon }) {
  const map = {'01':'☀️','02':'🌤','03':'⛅','04':'☁️','09':'🌦','10':'🌧','11':'⛈','13':'❄️','50':'🌫'};
  return <span>{map[icon?.slice(0,2)] || '🌡'}</span>;
}

function formatDateTime(ts) {
  return new Date(ts).toLocaleString([], {
    weekday:'short', month:'short', day:'numeric',
    hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false,
  });
}

export default function BirdDetailModal({ detection, onClose, dateOverride }) {
  const [topDetection, setTopDetection] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [isPlaying, setIsPlaying]       = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (!detection?.scientificName) return;
    setLoading(true);
    const date = dateOverride || new Date().toISOString().split('T')[0];
    fetch(`${API_BASE}/species-detections?species=${encodeURIComponent(detection.scientificName)}&date=${date}`)
      .then(r => r.json())
      .then(d => {
        const list = (d.data || []).sort((a,b) => b.confidence - a.confidence);
        setTopDetection(list[0] || null);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [detection, dateOverride]);

  useEffect(() => () => { if (audioRef.current) { audioRef.current.pause(); } }, []);

  const handlePlay = useCallback(() => {
    if (!topDetection?.id) return;
    if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false); return; }
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = `${API_BASE}/audio/${topDetection.id}`;
    audioRef.current.play().catch(() => {});
    audioRef.current.onended = () => setIsPlaying(false);
    setIsPlaying(true);
  }, [topDetection, isPlaying]);

  const rLabel = detection.rarityLabel;
  const borderColor = rLabel === 'LEGENDARY' ? '#c9980a55' : rLabel === 'RARE' ? '#b85c2055' : '#d4c9a8';
  const accentClass  = rLabel === 'LEGENDARY' ? 'text-amber' : rLabel === 'RARE' ? 'text-rust' : rLabel === 'UNCOMMON' ? 'text-berry' : 'text-moss';
  const badgeClass   = rLabel === 'LEGENDARY' ? 'bg-amber/15 text-amber' : rLabel === 'RARE' ? 'bg-rust/15 text-rust' : rLabel === 'UNCOMMON' ? 'bg-berry/15 text-berry' : 'bg-moss/10 text-moss';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(44,36,22,0.5)', backdropFilter:'blur(3px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="paper rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        style={{ border:`2px solid ${borderColor}`, animation:'cardAppear 0.25s ease-out' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-cream flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-2xl text-ink-dark leading-tight">{detection.species}</h2>
            <p className="font-ui text-sm text-ink-faint italic">{detection.scientificName}</p>
          </div>
          <span className={`font-ui text-sm font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${badgeClass}`}>
            {rLabel === 'LEGENDARY' ? '★' : rLabel === 'RARE' ? '◆' : '◈'} {rLabel}
          </span>
          <button onClick={onClose}
            className="flex-shrink-0 w-8 h-8 rounded-full paper border border-cream flex items-center justify-center text-ink-mid hover:text-ink-dark transition-colors text-sm font-bold">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {detection.thumbnailUrl && (
            <img src={detection.thumbnailUrl} alt={detection.species}
              className="w-full h-auto rounded-xl object-cover" style={{ maxHeight:280 }}/>
          )}

          {detection.funFact && (
            <div className="p-3 rounded-xl bg-parchment border border-cream">
              <p className="font-ui text-sm text-ink-mid leading-relaxed">💡 {detection.funFact}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label:'Detections today', value: detection.countToday || '—' },
              { label:'Days this year',   value: detection.daysThisYear || '—' },
              { label:'Season',           value: detection.currentSeason || '—' },
            ].map(s => (
              <div key={s.label} className="paper-warm rounded-xl p-3 border border-cream">
                <p className={`font-display text-lg leading-tight capitalize ${accentClass}`}>{s.value}</p>
                <p className="font-ui text-xs text-ink-faint mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div>
            <h3 className="font-display text-base text-ink-dark mb-3">
              🎙 Best recording {dateOverride ? `(${dateOverride})` : 'today'}
            </h3>
            {loading ? (
              <div className="h-24 rounded-xl bg-cream animate-pulse"/>
            ) : error ? (
              <p className="font-ui text-sm text-rust p-3 rounded-xl bg-rust/5 border border-rust/20">Could not load recording — {error}</p>
            ) : !topDetection ? (
              <p className="font-ui text-sm text-ink-faint p-3">No recordings found.</p>
            ) : (
              <div className="paper-warm rounded-xl border border-cream p-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm text-ink-dark font-semibold">{formatDateTime(topDetection.timestamp)}</span>
                  {topDetection.source?.displayName && (
                    <span className="font-ui text-xs text-ink-faint bg-cream px-2 py-0.5 rounded-full">
                      🎤 {topDetection.source.displayName}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex justify-between text-xs text-ink-faint mb-1">
                    <span>Confidence</span>
                    <span className="font-mono font-semibold text-ink-mid">{Math.round(topDetection.confidence * 100)}%</span>
                  </div>
                  <div className="h-2 bg-cream rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-moss confidence-fill opacity-75"
                      style={{ width:`${Math.round(topDetection.confidence * 100)}%` }}/>
                  </div>
                </div>
                {topDetection.weather && (
                  <div className="flex items-center gap-3 text-sm text-ink-faint flex-wrap pt-1 border-t border-cream">
                    <span><WeatherIcon icon={topDetection.weather.weatherIcon}/> {topDetection.weather.temperature}°C</span>
                    <span>💨 {topDetection.weather.windSpeed} m/s</span>
                    <span>💧 {topDetection.weather.humidity}%</span>
                    <span>🌙 {topDetection.weather.moonPhaseName}</span>
                  </div>
                )}
                <button onClick={handlePlay}
                  className={`w-full py-2.5 rounded-xl font-ui font-semibold text-sm transition-colors flex items-center justify-center gap-2 border
                    ${isPlaying ? 'bg-moss text-paper border-moss' : 'paper border-moss text-moss hover:bg-moss hover:text-paper'}`}>
                  <span>{isPlaying ? '⏹' : '▶'}</span>
                  {isPlaying ? 'Stop' : 'Play recording'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
