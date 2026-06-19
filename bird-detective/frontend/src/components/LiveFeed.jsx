import { useState, useEffect, useRef } from 'react';
import { formatTimeAgo, getBirdEmoji } from '../utils/helpers';

const RARITY_DOT = { LEGENDARY:'bg-amber', RARE:'bg-rust', UNCOMMON:'bg-berry', OCCASIONAL:'bg-sky', COMMON:'bg-moss' };

export default function LiveFeed({ detections, newDetections }) {
  const [items, setItems] = useState([]);
  const feedRef = useRef(null);

  useEffect(() => { setItems(detections.slice(0, 40)); }, [detections]);

  useEffect(() => {
    if (newDetections.length > 0 && feedRef.current) feedRef.current.scrollTo({ top:0, behavior:'smooth' });
  }, [newDetections]);

  return (
    <div className="paper rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-cream">
        <span className="w-2 h-2 rounded-full bg-moss dot-pulse"/>
        <span className="font-display text-moss text-lg">Live Detections</span>
        <span className="ml-auto font-ui text-sm text-ink-faint">Last 12 hours</span>
      </div>
      <div ref={feedRef} className="overflow-y-auto no-scrollbar" style={{ maxHeight:480 }}>
        {items.length === 0 ? (
          <div className="p-8 text-center text-ink-faint">
            <div className="text-3xl mb-2">{getBirdEmoji('robin')}</div>
            <p className="font-ui text-sm">No detections yet — stay patient!</p>
          </div>
        ) : (
          <div className="divide-y divide-cream">
            {items.map(d => {
              const isNew = newDetections.some(n => n.id === d.id);
              return (
                <div key={d.id}
                  className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${isNew ? 'live-item bg-moss/5' : 'hover:bg-parchment/60'}`}>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${RARITY_DOT[d.rarityLabel] || 'bg-moss'}`}/>
                  <span className="text-lg flex-shrink-0">{getBirdEmoji(d.species)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-ui font-semibold text-sm text-ink-dark truncate">{d.species}</p>
                    <p className="font-mono text-xs text-ink-faint">{Math.round(d.confidence * 100)}% · {formatTimeAgo(d.timestamp)}</p>
                  </div>
                  {d.rarityLabel !== 'COMMON' && (
                    <span className="font-ui text-sm text-ink-light flex-shrink-0">
                      {d.rarityLabel === 'LEGENDARY' ? '★' : d.rarityLabel === 'RARE' ? '◆' : '◈'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
