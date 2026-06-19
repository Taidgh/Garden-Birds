import { formatTimeAgo } from '../utils/helpers';

export default function HeroSection({ stats, lastUpdated, onRefresh, loading, siteTitle }) {
  const title = siteTitle || "Ruairí's Garden";
  // Split title into two parts for display — last word gets moss colour
  const words = title.trim().split(' ');
  const lastWord = words.pop();
  const firstPart = words.join(' ');

  return (
    <div className="relative py-8 md:py-10">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-6">
        <img
          src="https://raw.githubusercontent.com/birdnet-team/BirdNET-Analyzer-Sierra/refs/heads/main/gui/img/birdnet_logo.png"
          alt="BirdNET Logo"
          className="h-14 md:h-16 object-contain flex-shrink-0"
          onError={e => { e.target.style.display = 'none'; }}
        />
        <div className="text-center sm:text-left">
          <h1 className="font-display text-4xl md:text-5xl text-ink-dark leading-none">
            {firstPart && <span>{firstPart} </span>}
            <span className="text-moss">{lastWord}</span>
          </h1>
          <p className="font-ui text-base text-ink-light mt-1">
            Rare bird alerts from the backyard — updated live
          </p>
        </div>
      </div>

      {stats && (
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { icon: '🟢', value: stats.totalDetections, label: 'detections today', color: 'text-moss' },
            { icon: '★',  value: stats.legendaryFinds,  label: 'legendary',        color: 'text-amber' },
            { icon: '◆',  value: stats.rareFinds,       label: 'rare finds',       color: 'text-rust' },
            { icon: '◉',  value: stats.uniqueSpecies,   label: 'species',          color: 'text-sky' },
          ].map(s => (
            <div key={s.label} className="paper px-3 py-1.5 rounded-full flex items-center gap-2">
              <span className={`text-sm ${s.color}`}>{s.icon}</span>
              <span className="font-ui text-sm text-ink-mid">
                <span className={`font-bold ${s.color}`}>{s.value}</span> {s.label}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        {lastUpdated && (
          <span className="font-ui text-sm text-ink-faint">Updated {formatTimeAgo(lastUpdated)}</span>
        )}
        <button onClick={onRefresh} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full paper text-moss text-sm font-ui font-semibold hover:bg-moss hover:text-paper transition-colors disabled:opacity-50">
          <span className={loading ? 'animate-spin inline-block' : ''}>↺</span>
          {loading ? 'Scanning…' : 'Refresh'}
        </button>
        <a href="/species"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full paper text-ink-mid text-sm font-ui font-semibold hover:bg-moss hover:text-paper transition-colors">
          🦋 All Species
        </a>
      </div>
    </div>
  );
}
