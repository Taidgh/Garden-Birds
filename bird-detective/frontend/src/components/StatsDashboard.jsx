import { useState, useEffect } from 'react';
import { getBirdEmoji } from '../utils/helpers';
import BirdCard, { BirdImage } from './BirdCard';
import BirdDetailModal from './BirdDetailModal';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function StatCard({ icon, label, value, color='moss', sublabel }) {
  const colors = { moss:'text-moss', amber:'text-amber', rust:'text-rust', sky:'text-sky', berry:'text-berry' };
  return (
    <div className="paper rounded-xl p-4">
      <div className="flex items-start justify-between mb-1">
        <span className="text-xl">{icon}</span>
        <span className={`text-2xl font-display ${colors[color] || 'text-moss'}`}>{value}</span>
      </div>
      <p className="font-ui text-sm font-semibold text-ink-dark">{label}</p>
      {sublabel && <p className="font-ui text-sm text-ink-faint mt-0.5">{sublabel}</p>}
    </div>
  );
}

export default function StatsDashboard({ stats }) {
  const [yesterdayData, setYesterdayData] = useState(null);
  const [modalBird, setModalBird]         = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/stats/yesterday`)
      .then(r => r.json())
      .then(d => setYesterdayData(d))
      .catch(() => {});
  }, []);

  if (!stats) return null;

  const { birdOfDay, rarestToday, mostActive, nightVisitors, uniqueSpecies,
          totalDetections, rareFinds, legendaryFinds, newSpeciesData } = stats;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon="🐦" label="Detections"  value={totalDetections} color="moss"  sublabel="Last 12 hours"/>
        <StatCard icon="🦋" label="Species"     value={uniqueSpecies}   color="sky"   sublabel="Unique birds"/>
        <StatCard icon="◆"  label="Rare finds"  value={rareFinds}       color="rust"  sublabel="Uncommon+"/>
        <StatCard icon="★"  label="Legendary"   value={legendaryFinds}  color="amber" sublabel="Top tier"/>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Bird of the Day */}
        {birdOfDay && (
          <div className="paper rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            style={{ border:'1.5px solid #c9980a44' }}
            onClick={() => setModalBird(birdOfDay)}>
            <BirdImage species={birdOfDay.species} thumbnailUrl={birdOfDay.thumbnailUrl} className="w-full rounded-t-xl" style={{ height:'20rem', objectFit:'cover' }}/>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-amber">★</span>
                <span className="font-ui font-semibold text-amber text-sm">Bird of the Day</span>
              </div>
              <p className="font-ui font-bold text-ink-dark leading-tight text-base">{birdOfDay.species}</p>
              <p className="font-ui text-sm text-amber mt-0.5">Rarity score {birdOfDay.rarityScore} · {birdOfDay.rarityLabel}</p>
            </div>
          </div>
        )}

        {/* Most Active */}
        <div className="paper rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sky">◉</span>
            <span className="font-ui font-semibold text-sky text-sm">Most Active</span>
          </div>
          <div className="space-y-2">
            {mostActive?.slice(0,5).map((item,i) => (
              <div key={item.species} className="flex items-center gap-2">
                <span className="text-ink-faint font-mono text-sm w-5">#{i+1}</span>
                <span className="font-ui text-sm flex-1 text-ink-dark truncate">{item.species}</span>
                <span className="font-mono text-sm text-ink-mid">{item.count}×</span>
              </div>
            ))}
          </div>
        </div>

        {/* Night Visitors */}
        <div className="paper rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-berry">◈</span>
            <span className="font-ui font-semibold text-berry text-sm">Night Visitors</span>
          </div>
          {nightVisitors?.length > 0 ? (
            <div className="space-y-1.5">
              {nightVisitors.slice(0,5).map(sp => (
                <div key={sp} className="flex items-center gap-2">
                  <span>{getBirdEmoji(sp)}</span>
                  <span className="font-ui text-sm text-ink-dark truncate">{sp}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-ui text-sm text-ink-faint">All quiet after dark</p>
          )}
        </div>
      </div>

      {/* First time detected */}
      {newSpeciesData?.length > 0 && (
        <div className="paper rounded-xl p-4" style={{ border:'1.5px solid #4a674144' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-ui font-semibold text-moss text-sm">🆕 First time ever detected</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {newSpeciesData.map(bird => (
              <button key={bird.id} onClick={() => setModalBird(bird)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-moss/10 hover:bg-moss/20 border border-moss/20 transition-colors">
                <span>{getBirdEmoji(bird.species)}</span>
                <span className="font-ui text-sm text-moss font-semibold">{bird.species}</span>
                <span className="font-ui text-sm text-moss/70">→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rarest today */}
      {rarestToday?.length > 0 && (
        <div className="paper rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-rust">◆</span>
            <span className="font-ui font-semibold text-rust text-sm">Rarest Visitors Today</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {rarestToday.map((bird,i) => (
              <BirdCard key={bird.id || i} detection={bird} index={i}/>
            ))}
          </div>
        </div>
      )}

      {/* Rarest yesterday */}
      {yesterdayData?.rarestYesterday?.length > 0 && (
        <div className="paper rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-stone">◆</span>
            <span className="font-ui font-semibold text-stone text-sm">
              Rarest Visitors Yesterday
              <span className="font-mono text-sm ml-2 text-ink-faint">{yesterdayStr}</span>
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {yesterdayData.rarestYesterday.map((bird,i) => (
              <BirdCard key={`y-${bird.id || i}`} detection={bird} index={i} dateOverride={yesterdayStr}/>
            ))}
          </div>
        </div>
      )}

      {modalBird && (
        <BirdDetailModal detection={modalBird} onClose={() => setModalBird(null)}/>
      )}
    </div>
  );
}
