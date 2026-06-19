import { useState, useMemo, useEffect } from 'react';
import AnimatedBackground  from './components/AnimatedBackground';
import HeroSection         from './components/HeroSection';
import BirdCard            from './components/BirdCard';
import LiveFeed            from './components/LiveFeed';
import StatsDashboard      from './components/StatsDashboard';
import CoolFactsTicker     from './components/CoolFactsTicker';
import NewBirdAlert        from './components/NewBirdAlert';
import BirthdayPopup       from './components/BirthdayPopup';
import { useDetections }   from './hooks/useDetections';

function SectionHeader({ icon, title, subtitle, color='moss' }) {
  const colors = { moss:'text-moss', amber:'text-amber', rust:'text-rust', sky:'text-sky' };
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <h2 className={`font-display text-2xl md:text-3xl ${colors[color] || 'text-moss'}`}>{title}</h2>
      </div>
      {subtitle && <p className="font-ui text-sm text-ink-faint mt-0.5 ml-8">{subtitle}</p>}
      <hr className="sketch-divider mt-3"/>
    </div>
  );
}

function FilterBar({ activeFilter, onFilter }) {
  const filters = [
    { id:'all',       label:'All birds'  },
    { id:'legendary', label:'★ Legendary' },
    { id:'rare',      label:'◆ Rare'     },
    { id:'uncommon',  label:'◈ Uncommon' },
    { id:'night',     label:'🌙 Night'    },
  ];
  return (
    <div className="flex gap-2 flex-wrap mb-5">
      {filters.map(f => (
        <button key={f.id} onClick={() => onFilter(f.id)}
          className={`px-3 py-1.5 rounded-full font-ui text-sm transition-colors border
            ${activeFilter === f.id
              ? 'bg-moss text-paper border-moss font-semibold'
              : 'paper text-ink-mid border-cream hover:border-moss/40'}`}>
          {f.label}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const { detections, stats, species, loading, error, lastUpdated, newDetections, refetch } = useDetections();
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rarity');
  const [siteTitle, setSiteTitle] = useState("Ruairí's Garden");

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        if (d.siteTitle) {
          setSiteTitle(d.siteTitle);
          document.title = `${d.siteTitle} 🐦`;
        }
      })
      .catch(() => {});
  }, []);

  const uniqueDetections = useMemo(() => species.map(s => ({
    id: s.speciesCode,
    species: s.species,
    scientificName: s.scientificName,
    confidence: s.highConfidence ? 0.9 : 0.65,
    timestamp: (() => {
      if (s.latestHeard) {
        const d = new Date();
        const [h, m, sec] = s.latestHeard.split(':');
        d.setHours(parseInt(h), parseInt(m), parseInt(sec || 0));
        return d.toISOString();
      }
      return new Date().toISOString();
    })(),
    thumbnailUrl:   s.thumbnailUrl,
    rarityScore:    s.rarityScore,
    rarityLabel:    s.rarityLabel,
    rarityColor:    s.rarityColor,
    isRare:         s.isRare,
    isLegendary:    s.isLegendary,
    countToday:     s.count,
    funFact:        s.funFact,
    isNewSpecies:   s.isNewSpecies,
    highConfidence: s.highConfidence,
    hourlyCounts:   s.hourlyCounts,
    daysThisYear:   s.daysThisYear,
    latestHeard:    s.latestHeard,
    currentSeason:  s.currentSeason,
  })), [species]);

  const filtered = useMemo(() => {
    let list = uniqueDetections;
    if (activeFilter === 'legendary') list = list.filter(d => d.rarityLabel === 'LEGENDARY');
    else if (activeFilter === 'rare')     list = list.filter(d => ['LEGENDARY','RARE'].includes(d.rarityLabel));
    else if (activeFilter === 'uncommon') list = list.filter(d => ['LEGENDARY','RARE','UNCOMMON'].includes(d.rarityLabel));
    else if (activeFilter === 'night')    list = list.filter(d => {
      const c = d.hourlyCounts || [];
      return c.slice(20).some(v => v > 0) || c.slice(0,6).some(v => v > 0);
    });
    if (sortBy === 'time')       list = [...list].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    else if (sortBy === 'count') list = [...list].sort((a,b) => b.countToday - a.countToday);
    else                         list = [...list].sort((a,b) => b.rarityScore - a.rarityScore);
    return list;
  }, [uniqueDetections, activeFilter, sortBy]);

  const rareDetections = useMemo(() =>
    uniqueDetections.filter(d => d.rarityScore >= 40).sort((a,b) => b.rarityScore - a.rarityScore).slice(0,6)
  , [uniqueDetections]);

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground/>

      <div className="relative z-10">
        <div className="container mx-auto px-4 max-w-7xl">

          <HeroSection stats={stats} lastUpdated={lastUpdated} onRefresh={refetch} loading={loading} siteTitle={siteTitle}/>

          <div className="mb-8">
            <CoolFactsTicker/>
          </div>

          {/* Stats — primary section at top */}
          <section className="mb-10">
            <SectionHeader icon="📊" title="Wildlife Report" subtitle="Your backyard bird intelligence" color="sky"/>
            <StatsDashboard stats={stats}/>
          </section>


          {/* Last 12 hours + live feed side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            <div className="lg:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-end gap-2 mb-0">
                <SectionHeader icon="🕐" title="Last 12 Hours"
                  subtitle={`${uniqueDetections.length} species detected today`}/>
                <div className="flex gap-2 ml-auto mb-5">
                  {[{id:'rarity',label:'Rarest'},{id:'time',label:'Newest'},{id:'count',label:'Most seen'}].map(s => (
                    <button key={s.id} onClick={() => setSortBy(s.id)}
                      className={`px-3 py-1 rounded-full font-ui text-sm border transition-colors
                        ${sortBy === s.id ? 'bg-moss text-paper border-moss font-semibold' : 'paper text-ink-mid border-cream hover:border-moss/40'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <FilterBar activeFilter={activeFilter} onFilter={setActiveFilter}/>

              {loading && species.length === 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_,i) => (
                    <div key={i} className="paper rounded-xl h-56 animate-pulse" style={{ animationDelay:`${i*0.07}s`}}/>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-ink-faint">
                  <div className="text-4xl mb-3">🔭</div>
                  <p className="font-ui text-base">No birds found with this filter.</p>
                  <p className="font-ui text-sm mt-1">Try "All birds" to see everything!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filtered.map((d,i) => (
                    <BirdCard key={d.id} detection={d} index={i}
                      isNew={newDetections.some(n => n.species === d.species)}/>
                  ))}
                </div>
              )}
            </div>

            {/* Live feed sidebar */}
            <div>
              <SectionHeader icon="⚡" title="Live Feed" subtitle="Detections rolling in…"/>
              <LiveFeed detections={detections} newDetections={newDetections}/>
            </div>
          </div>

          <footer className="border-t border-cream py-8 text-center">
            <div className="flex justify-center items-center gap-3 mb-2">
              <img src="https://raw.githubusercontent.com/birdnet-team/BirdNET-Analyzer-Sierra/refs/heads/main/gui/img/birdnet_logo.png"
                alt="BirdNET" className="h-7 object-contain opacity-40"
                onError={e => { e.target.style.display = 'none'; }}/>
              <span className="font-ui text-ink-faint text-base">{siteTitle}</span>
            </div>
            <p className="font-ui text-sm text-ink-faint">
              Powered by BirdNET-Go · Real-time AI bird identification · <a href="https://taidgh.com" target="_blank" rel="noopener" className="text-moss hover:underline">Taidgh.com</a>
            </p>
            <div className="mt-3 flex justify-center gap-4">
              <a href="/species" className="font-ui text-sm text-moss hover:underline">🦋 All Species</a>
              <a href="/admin" className="font-ui text-sm text-ink-faint hover:text-ink-mid">⚙ Admin</a>
            </div>
          </footer>
        </div>
      </div>

      <NewBirdAlert newDetections={newDetections}/>
      <BirthdayPopup />

      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 paper border-rust/40 text-rust px-4 py-2 rounded-full font-ui text-sm shadow">
          ⚠ Connection issue — retrying…
        </div>
      )}
    </div>
  );
}
