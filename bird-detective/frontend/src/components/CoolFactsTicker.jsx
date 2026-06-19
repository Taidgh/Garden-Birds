import { useState, useEffect } from 'react';
import { COOL_FACTS } from '../utils/helpers';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function CoolFactsTicker() {
  const [facts, setFacts]     = useState(COOL_FACTS);
  const [index, setIndex]     = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/settings`)
      .then(r => r.json())
      .then(d => { if (d.facts?.length) setFacts(d.facts); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!facts.length) return;
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIndex(i => (i + 1) % facts.length); setVisible(true); }, 350);
    }, 9000);
    return () => clearInterval(t);
  }, [facts]);

  if (!facts.length) return null;

  return (
    <div className="paper rounded-xl flex items-center overflow-hidden">
      <div className="px-4 py-3 border-r border-cream flex-shrink-0 flex items-center gap-2">
        <span className="text-base">🧠</span>
        <span className="font-ui font-semibold text-moss text-sm whitespace-nowrap">Did you know?</span>
      </div>
      <div className="flex-1 px-4 py-3 overflow-hidden">
        <p className="font-ui text-sm text-ink-mid transition-all duration-350"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(6px)' }}>
          {facts[index]}
        </p>
      </div>
      <div className="flex-shrink-0 px-3 flex gap-1">
        {Array.from({ length: Math.min(facts.length, 6) }).map((_, i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === index % Math.min(facts.length,6) ? 'bg-moss' : 'bg-cream'}`}/>
        ))}
      </div>
    </div>
  );
}
