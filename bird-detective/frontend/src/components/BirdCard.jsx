import { useState, useEffect } from 'react';
import { getBirdEmoji, getBirdPlaceholderColor } from '../utils/helpers';
import BirdDetailModal from './BirdDetailModal';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const RARITY_STYLE = {
  LEGENDARY: { border:'legendary-border', badge:'bg-amber text-paper',    label:'text-amber', bar:'bg-amber', text:'★ Legendary!' },
  RARE:      { border:'rare-border',      badge:'bg-rust text-paper',     label:'text-rust',  bar:'bg-rust',  text:'◆ Rare find!' },
  UNCOMMON:  { border:'border-berry/50',  badge:'bg-berry/15 text-berry', label:'text-berry', bar:'bg-berry', text:'◈ Uncommon'   },
  OCCASIONAL:{ border:'border-sky/40',    badge:'bg-sky/10 text-sky',     label:'text-sky',   bar:'bg-sky',   text:'◉ Occasional' },
  COMMON:    { border:'border-cream',     badge:'bg-moss/10 text-moss',   label:'text-moss',  bar:'bg-moss',  text:'· Common'     },
};

export function BirdImage({ species, thumbnailUrl, onClick, className='w-full h-40 rounded-t-xl', style }) {
  const [imageUrl, setImageUrl] = useState(thumbnailUrl || null);
  const [error, setError]       = useState(false);
  const colors = getBirdPlaceholderColor(species);

  useEffect(() => {
    if (thumbnailUrl) { setImageUrl(thumbnailUrl); return; }
    const key = `bird-img-${species}`;
    const cached = sessionStorage.getItem(key);
    if (cached) { setImageUrl(cached === 'null' ? null : cached); return; }
    fetch(`${API_BASE}/bird-image?species=${encodeURIComponent(species)}`)
      .then(r => r.json())
      .then(d => { setImageUrl(d.imageUrl); sessionStorage.setItem(key, d.imageUrl || 'null'); })
      .catch(() => setError(true));
  }, [species, thumbnailUrl]);

  const cursorClass = onClick ? 'cursor-pointer' : '';

  if (imageUrl && !error) {
    return (
      <div className={`${className} overflow-hidden relative group ${cursorClass}`} style={style} onClick={onClick}>
        <img src={imageUrl} alt={species}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          onError={() => setError(true)}/>
        {onClick && (
          <div className="absolute inset-0 bg-ink-dark/0 group-hover:bg-ink-dark/10 transition-colors flex items-end justify-end p-2">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-paper/90 rounded-full px-2 py-0.5 font-ui text-xs text-ink-mid">
              view →
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${className} flex items-center justify-center text-5xl ${cursorClass}`}
      style={{ background:`linear-gradient(135deg, ${colors[0]}33, ${colors[1]}44)`, ...style }}
      onClick={onClick}>
      {getBirdEmoji(species)}
    </div>
  );
}

export default function BirdCard({ detection, index = 0, dateOverride }) {
  const [showModal, setShowModal] = useState(false);
  const r = RARITY_STYLE[detection.rarityLabel] || RARITY_STYLE.COMMON;

  return (
    <>
      <div className={`bird-card paper rounded-xl overflow-hidden relative ${r.border}`}
        style={{ animationDelay:`${index * 0.04}s` }}>

        {detection.rarityLabel !== 'COMMON' && (
          <div className={`absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full text-xs font-ui font-semibold shadow-sm ${r.badge}`}>
            {r.text}
          </div>
        )}
        {detection.isNewSpecies && (
          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-xs font-ui font-semibold bg-moss text-paper shadow-sm">
            First time!
          </div>
        )}

        <BirdImage species={detection.species} thumbnailUrl={detection.thumbnailUrl} onClick={() => setShowModal(true)}/>

        <div className="p-3">
          <h3 className={`font-display text-lg leading-tight cursor-pointer hover:underline ${r.label}`}
            onClick={() => setShowModal(true)}>
            {detection.species}
          </h3>
          {detection.scientificName && (
            <p className="font-ui text-sm text-ink-faint italic leading-snug mb-2">{detection.scientificName}</p>
          )}

          <div className="mb-2">
            <div className="flex justify-between text-sm text-ink-faint mb-1">
              <span>Confidence</span>
              <span className="font-mono font-semibold text-ink-mid">{Math.round(detection.confidence * 100)}%</span>
            </div>
            <div className="h-1.5 bg-cream rounded-full overflow-hidden">
              <div className={`h-full rounded-full confidence-fill ${r.bar} opacity-70`}
                style={{ width:`${Math.round(detection.confidence * 100)}%` }}/>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-ink-faint">
            <span>{detection.countToday}× today</span>
            {detection.daysThisYear > 0 && <span>{detection.daysThisYear}d this year</span>}
          </div>

          {detection.funFact && (
            <div className="mt-2 pt-2 border-t border-cream">
              <p className="font-ui text-sm text-ink-light leading-relaxed">
                {detection.funFact.length > 120
                  ? <>{detection.funFact.slice(0, 120).trimEnd()}…{' '}
                      <button onClick={() => setShowModal(true)}
                        className="text-moss hover:text-bark underline font-semibold whitespace-nowrap">
                        Read more
                      </button>
                    </>
                  : detection.funFact
                }
              </p>
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            {detection.latestHeard && (
              <p className="text-sm text-ink-faint font-mono">{detection.latestHeard}</p>
            )}
            <button onClick={() => setShowModal(true)}
              className="text-sm font-ui text-moss hover:text-bark transition-colors ml-auto underline">
              recordings →
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <BirdDetailModal detection={detection} dateOverride={dateOverride} onClose={() => setShowModal(false)}/>
      )}
    </>
  );
}
