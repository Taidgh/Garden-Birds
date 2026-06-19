import { useState, useEffect, useMemo } from 'react';
import { getBirdEmoji, getBirdPlaceholderColor } from '../utils/helpers';
import BirdDetailModal from './BirdDetailModal';
import AnimatedBackground from './AnimatedBackground';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const RARITY_STYLE = {
  LEGENDARY: { border: 'legendary-border', badge: 'bg-amber text-paper',    label: 'text-amber', bar: 'bg-amber'  },
  RARE:      { border: 'rare-border',      badge: 'bg-rust text-paper',     label: 'text-rust',  bar: 'bg-rust'   },
  UNCOMMON:  { border: 'border-berry/50',  badge: 'bg-berry/15 text-berry', label: 'text-berry', bar: 'bg-berry'  },
  OCCASIONAL:{ border: 'border-sky/40',    badge: 'bg-sky/10 text-sky',     label: 'text-sky',   bar: 'bg-sky'    },
  COMMON:    { border: 'border-cream',     badge: 'bg-moss/10 text-moss',   label: 'text-moss',  bar: 'bg-moss'   },
};

function SpeciesImage({ species, scientificName, thumbnailUrl }) {
  const [imageUrl, setImageUrl]   = useState(thumbnailUrl || null);
  const [loaded, setLoaded]       = useState(false);
  const [error, setError]         = useState(false);
  const colors = getBirdPlaceholderColor(species);

  useEffect(() => {
    if (thumbnailUrl) { setImageUrl(thumbnailUrl); return; }
    if (!scientificName) return;
    const key = `thumb-${scientificName}`;
    const cached = sessionStorage.getItem(key);
    if (cached) { setImageUrl(cached === 'null' ? null : cached); return; }
    fetch(`${API_BASE}/thumbnail/${encodeURIComponent(scientificName.trim())}`)
      .then(r => r.ok ? (sessionStorage.setItem(key, `/api/thumbnail/${encodeURIComponent(scientificName.trim())}`), setImageUrl(`/api/thumbnail/${encodeURIComponent(scientificName.trim())}`)) : setError(true))
      .catch(() => setError(true));
  }, [species, scientificName, thumbnailUrl]);

  if (imageUrl && !error) {
    return (
      <div className="w-full h-36 overflow-hidden rounded-t-xl relative">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center text-4xl"
            style={{ background: `linear-gradient(135deg, ${colors[0]}33, ${colors[1]}44)` }}>
            {getBirdEmoji(species)}
          </div>
        )}
        <img src={imageUrl} alt={species}
          className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)} />
      </div>
    );
  }

  return (
    <div className="w-full h-36 rounded-t-xl flex items-center justify-center text-5xl"
      style={{ background: `linear-gradient(135deg, ${colors[0]}33, ${colors[1]}44)` }}>
      {getBirdEmoji(species)}
    </div>
  );
}

function SpeciesCard({ bird, index, onOpen }) {
  const r = RARITY_STYLE[bird.rarityLabel] || RARITY_STYLE.COMMON;

  return (
    <div
      className={`bird-card paper rounded-xl overflow-hidden cursor-pointer relative ${r.border}`}
      style={{ animationDelay: `${index * 0.03}s` }}
      onClick={() => onOpen(bird)}
    >
      {bird.rarityLabel !== 'COMMON' && (
        <div className={`absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full text-xs font-ui font-semibold shadow-sm ${r.badge}`}>
          {bird.rarityLabel === 'LEGENDARY' ? '★' : bird.rarityLabel === 'RARE' ? '◆' : '◈'} {bird.rarityLabel}
        </div>
      )}

      <SpeciesImage species={bird.species} scientificName={bird.scientificName} thumbnailUrl={bird.thumbnailUrl} />

      <div className="p-3">
        <h3 className={`font-display text-base leading-tight ${r.label}`}>{bird.species}</h3>
        <p className="font-ui text-xs text-ink-faint italic mb-2">{bird.scientificName}</p>

        {/* Avg confidence bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-ink-faint mb-1">
            <span>Avg confidence</span>
            <span className="font-mono font-semibold text-ink-mid">{Math.round((bird.avgConfidence || 0) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-cream rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${r.bar} opacity-70`}
              style={{ width: `${Math.round((bird.avgConfidence || 0) * 100)}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-2 text-xs text-ink-faint mb-2">
          <span>🔢 {bird.totalDetections?.toLocaleString()} detections</span>
          <span>📅 {bird.daysDetected} days</span>
        </div>

        {bird.firstSeen && (
          <p className="text-xs text-ink-faint font-mono">
            First: {new Date(bird.firstSeen).toLocaleDateString('en-IE', { day:'numeric', month:'short', year:'numeric' })}
          </p>
        )}

        {bird.funFact && (
          <div className="mt-2 pt-2 border-t border-cream">
            <p className="font-ui text-xs text-ink-light leading-relaxed">
              {bird.funFact.length > 100 ? bird.funFact.slice(0, 100).trimEnd() + '…' : bird.funFact}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AllSpeciesPage({ siteTitle }) {
  const [species, setSpecies]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState('');
  const [sortBy, setSortBy]       = useState('detections');
  const [filterRarity, setFilterRarity] = useState('all');
  const [modalBird, setModalBird] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/species-summary`)
      .then(r => r.json())
      .then(d => { setSpecies(d.species || []); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    let list = species;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => s.species.toLowerCase().includes(q) || s.scientificName.toLowerCase().includes(q));
    }

    if (filterRarity !== 'all') {
      const map = { legendary: ['LEGENDARY'], rare: ['LEGENDARY','RARE'], uncommon: ['LEGENDARY','RARE','UNCOMMON'] };
      list = list.filter(s => (map[filterRarity] || []).includes(s.rarityLabel));
    }

    switch (sortBy) {
      case 'detections': return [...list].sort((a,b) => (b.totalDetections||0) - (a.totalDetections||0));
      case 'rarity':     return [...list].sort((a,b) => (b.rarityScore||0) - (a.rarityScore||0));
      case 'days':       return [...list].sort((a,b) => (b.daysDetected||0) - (a.daysDetected||0));
      case 'alpha':      return [...list].sort((a,b) => a.species.localeCompare(b.species));
      default:           return list;
    }
  }, [species, search, sortBy, filterRarity]);

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <div className="relative z-10">
        <div className="container mx-auto px-4 max-w-7xl">

          {/* Header */}
          <div className="py-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <a href="/" className="font-ui text-sm text-moss hover:underline">← {siteTitle || 'Home'}</a>
              </div>
              <h1 className="font-display text-4xl text-ink-dark">
                All <span className="text-moss">Species</span>
              </h1>
              <p className="font-ui text-sm text-ink-faint mt-1">
                Every bird ever detected — {species.length} species total
              </p>
            </div>
            <img
              src="https://raw.githubusercontent.com/birdnet-team/BirdNET-Analyzer-Sierra/refs/heads/main/gui/img/birdnet_logo.png"
              alt="BirdNET" className="h-12 object-contain opacity-50"
              onError={e => { e.target.style.display = 'none'; }} />
          </div>

          {/* Controls */}
          <div className="paper rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search species or scientific name…"
              className="flex-1 px-3 py-2 rounded-lg border border-cream bg-parchment font-ui text-sm text-ink-dark focus:outline-none focus:border-moss"
            />

            {/* Rarity filter */}
            <select value={filterRarity} onChange={e => setFilterRarity(e.target.value)}
              className="px-3 py-2 rounded-lg border border-cream bg-parchment font-ui text-sm text-ink-dark focus:outline-none focus:border-moss">
              <option value="all">All rarities</option>
              <option value="legendary">★ Legendary</option>
              <option value="rare">◆ Rare+</option>
              <option value="uncommon">◈ Uncommon+</option>
            </select>

            {/* Sort */}
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-lg border border-cream bg-parchment font-ui text-sm text-ink-dark focus:outline-none focus:border-moss">
              <option value="detections">Most detected</option>
              <option value="rarity">Rarest first</option>
              <option value="days">Most days</option>
              <option value="alpha">A–Z</option>
            </select>
          </div>

          {/* Count */}
          <p className="font-ui text-sm text-ink-faint mb-4">
            Showing {filtered.length} of {species.length} species
          </p>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="paper rounded-xl h-64 animate-pulse" style={{ animationDelay: `${i * 0.05}s` }} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-20 text-rust">
              <div className="text-4xl mb-3">⚠</div>
              <p className="font-ui text-base">Failed to load species: {error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-ink-faint">
              <div className="text-4xl mb-3">🔭</div>
              <p className="font-ui text-base">No species found matching "{search}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 pb-12">
              {filtered.map((bird, i) => (
                <SpeciesCard key={bird.speciesCode || bird.species} bird={bird} index={i} onOpen={setModalBird} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalBird && (
        <BirdDetailModal detection={modalBird} onClose={() => setModalBird(null)} />
      )}
    </div>
  );
}
