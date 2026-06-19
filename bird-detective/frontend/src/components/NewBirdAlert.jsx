import { useEffect, useState } from 'react';
import { getBirdEmoji } from '../utils/helpers';

export default function NewBirdAlert({ newDetections }) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    if (!newDetections?.length) return;
    const rarest = [...newDetections].sort((a,b) => b.rarityScore - a.rarityScore)[0];
    setCurrent(rarest);
    setVisible(true);
    if (rarest.isRare || rarest.isLegendary) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const freqs = rarest.isLegendary ? [523,659,784] : [440,554];
        freqs.forEach((f,i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.value = f; osc.type = 'sine';
          gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.18);
          gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + i * 0.18 + 0.05);
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.18 + 0.35);
          osc.start(ctx.currentTime + i * 0.18);
          osc.stop(ctx.currentTime + i * 0.18 + 0.4);
        });
      } catch {}
    }
    const t = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(t);
  }, [newDetections]);

  if (!visible || !current) return null;

  const isLegendary = current.rarityLabel === 'LEGENDARY';
  const isRare      = current.rarityLabel === 'RARE';
  const borderColor = isLegendary ? 'border-amber' : isRare ? 'border-rust' : 'border-moss';
  const labelColor  = isLegendary ? 'text-amber'   : isRare ? 'text-rust'   : 'text-moss';
  const dotColor    = isLegendary ? 'bg-amber'      : isRare ? 'bg-rust'     : 'bg-moss';
  const headerText  = isLegendary ? '★ Legendary bird!' : isRare ? '◆ Rare find!' : '🐦 New detection';

  return (
    <div className="fixed bottom-6 right-6 z-50 achievement-appear max-w-xs">
      <div className={`paper rounded-xl p-4 border-2 ${borderColor} shadow-lg`}>
        <div className="flex items-center gap-2 mb-2">
          <span className={`w-2 h-2 rounded-full ${dotColor} dot-pulse`}/>
          <span className={`font-ui font-bold text-sm ${labelColor}`}>{headerText}</span>
          <button onClick={() => setVisible(false)} className="ml-auto text-ink-faint hover:text-ink-mid text-xs">✕</button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getBirdEmoji(current.species)}</span>
          <div>
            <p className="font-ui font-bold text-ink-dark">{current.species}</p>
            <p className={`font-ui text-sm ${labelColor}`}>{current.rarityLabel} · {Math.round(current.confidence * 100)}% confidence</p>
          </div>
        </div>
      </div>
    </div>
  );
}
