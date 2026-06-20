import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function authHeader(token) {
  return { 'Authorization': `Basic ${token}`, 'Content-Type': 'application/json' };
}

function Toast({ message, type }) {
  if (!message) return null;
  return (
    <div className={`fixed top-5 right-5 z-50 paper rounded-xl px-4 py-3 shadow-lg border font-ui text-sm
      ${type === 'error' ? 'border-rust/50 text-rust' : 'border-moss/50 text-moss'}`}>
      {type === 'error' ? '✕ ' : '✓ '}{message}
    </div>
  );
}

function Section({ title, icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="paper rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-5 py-3 border-b border-cream bg-parchment hover:bg-cream/60 transition-colors text-left"
      >
        <span>{icon}</span>
        <h2 className="font-display text-xl text-ink-dark flex-1">{title}</h2>
        <span className="text-ink-faint text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
}

// ── Login ─────────────────────────────────────────────────────
function LoginForm({ onLogin }) {
  const [user, setUser]       = useState('');
  const [pass, setPass]       = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    const token = btoa(`${user}:${pass}`);
    try {
      const res = await fetch(`${API_BASE}/admin/login`, { method: 'POST', headers: authHeader(token) });
      if (res.ok) { onLogin(token); }
      else { setError('Invalid username or password'); }
    } catch { setError('Could not connect to server'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f5f0e8' }}>
      <div className="paper rounded-2xl p-8 w-full max-w-sm shadow-lg">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🔐</div>
          <h1 className="font-display text-2xl text-ink-dark">Admin Login</h1>
          <p className="font-ui text-sm text-ink-faint mt-1">My Kid's Garden</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-ui text-sm text-ink-mid block mb-1">Username</label>
            <input type="text" value={user} onChange={e => setUser(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-cream bg-parchment font-ui text-sm text-ink-dark focus:outline-none focus:border-moss"
              autoComplete="username" />
          </div>
          <div>
            <label className="font-ui text-sm text-ink-mid block mb-1">Password</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-cream bg-parchment font-ui text-sm text-ink-dark focus:outline-none focus:border-moss"
              autoComplete="current-password" />
          </div>
          {error && <p className="font-ui text-sm text-rust">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg bg-moss text-paper font-ui font-semibold text-sm hover:bg-bark transition-colors disabled:opacity-50">
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Site Title ────────────────────────────────────────────────
function TitleSection({ token, showToast, currentTitle }) {
  const [input, setInput] = useState(currentTitle || '');

  useEffect(() => { setInput(currentTitle || ''); }, [currentTitle]);

  const save = async () => {
    const res = await fetch(`${API_BASE}/admin/settings/title`, {
      method: 'PUT', headers: authHeader(token), body: JSON.stringify({ siteTitle: input }),
    });
    if (res.ok) showToast('Title updated! Reload the main page to see it.');
    else showToast('Failed to save title', 'error');
  };

  return (
    <Section title="Site Title" icon="✏️">
      <p className="font-ui text-sm text-ink-mid mb-4">
        The name displayed in the header and browser tab.
      </p>
      <div className="flex gap-2">
        <input
          type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); }}
          placeholder="e.g. Ruairí's Garden"
          className="flex-1 px-3 py-2 rounded-lg border border-cream bg-parchment font-ui text-sm text-ink-dark focus:outline-none focus:border-moss"
        />
        <button onClick={save} disabled={!input.trim() || input === currentTitle}
          className="px-4 py-2 rounded-lg bg-moss text-paper font-ui font-semibold text-sm hover:bg-bark transition-colors disabled:opacity-40">
          Save
        </button>
      </div>
      <p className="font-ui text-xs text-ink-faint mt-2">Current: <span className="font-semibold text-ink-mid">{currentTitle}</span></p>
    </Section>
  );
}

// ── BirdNET-Go URL ────────────────────────────────────────────
function BirdnetSection({ token, showToast, currentUrl }) {
  const [input, setInput] = useState(currentUrl || '');

  useEffect(() => { setInput(currentUrl || ''); }, [currentUrl]);

  const save = async () => {
    const res = await fetch(`${API_BASE}/admin/settings/birdnet`, {
      method: 'PUT', headers: authHeader(token), body: JSON.stringify({ birdnetUrl: input }),
    });
    if (res.ok) showToast('BirdNET-Go URL saved. Restart the backend container to apply.');
    else showToast('Failed to save URL', 'error');
  };

  return (
    <Section title="BirdNET-Go URL" icon="📡">
      <p className="font-ui text-sm text-ink-mid mb-4">
        The base URL of your BirdNET-Go installation. Changes require a backend restart to take effect.
      </p>
      <div className="mb-3">
        <label className="font-ui text-sm text-ink-mid block mb-1">Current URL</label>
        <p className="font-mono text-sm text-ink-faint bg-parchment px-3 py-2 rounded-lg border border-cream break-all">{currentUrl || '—'}</p>
      </div>
      <div className="mb-4">
        <label className="font-ui text-sm text-ink-mid block mb-1">New URL</label>
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          placeholder="http://192.168.1.70:8080"
          className="w-full px-3 py-2 rounded-lg border border-cream bg-parchment font-mono text-sm text-ink-dark focus:outline-none focus:border-moss" />
        <p className="font-ui text-xs text-ink-faint mt-1">No trailing slash. Include port if needed.</p>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={!input.trim() || input === currentUrl}
          className="px-5 py-2 rounded-lg bg-moss text-paper font-ui font-semibold text-sm hover:bg-bark transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          Save URL
        </button>
        <p className="font-ui text-xs text-amber">⚠ Requires backend container restart</p>
      </div>
    </Section>
  );
}

// ── Ticker Facts ──────────────────────────────────────────────
function TickerFactsSection({ token, showToast }) {
  const [facts, setFacts]     = useState([]);
  const [newFact, setNewFact] = useState('');
  const [editIdx, setEditIdx] = useState(null);
  const [editVal, setEditVal] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/settings`)
      .then(r => r.json())
      .then(d => setFacts(d.facts || []))
      .catch(() => {});
  }, []);

  const addFact = async () => {
    if (!newFact.trim()) return;
    const res = await fetch(`${API_BASE}/admin/settings/facts`, {
      method: 'POST', headers: authHeader(token), body: JSON.stringify({ fact: newFact.trim() }),
    });
    if (res.ok) { const d = await res.json(); setFacts(d.facts); setNewFact(''); showToast('Fact added!'); }
    else showToast('Failed to add fact', 'error');
  };

  const deleteFact = async idx => {
    const res = await fetch(`${API_BASE}/admin/settings/facts/${idx}`, {
      method: 'DELETE', headers: authHeader(token),
    });
    if (res.ok) { const d = await res.json(); setFacts(d.facts); showToast('Fact removed'); }
  };

  const saveEdit = async () => {
    const updated = [...facts]; updated[editIdx] = editVal.trim();
    const res = await fetch(`${API_BASE}/admin/settings/facts`, {
      method: 'PUT', headers: authHeader(token), body: JSON.stringify({ facts: updated }),
    });
    if (res.ok) { setFacts(updated); setEditIdx(null); showToast('Fact updated'); }
  };

  return (
    <Section title="Ticker Facts" icon="🧠">
      <p className="font-ui text-sm text-ink-mid mb-4">
        These rotate in the "Did you know?" ticker on the main page.
      </p>

      <div className="flex gap-2 mb-5">
        <input type="text" value={newFact} onChange={e => setNewFact(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addFact(); }}
          placeholder="Add a new bird fact…"
          className="flex-1 px-3 py-2 rounded-lg border border-cream bg-parchment font-ui text-sm text-ink-dark focus:outline-none focus:border-moss" />
        <button onClick={addFact} disabled={!newFact.trim()}
          className="px-4 py-2 rounded-lg bg-moss text-paper font-ui font-semibold text-sm hover:bg-bark transition-colors disabled:opacity-40">
          Add
        </button>
      </div>

      <div className="space-y-2">
        {facts.length === 0 && <p className="font-ui text-sm text-ink-faint text-center py-4">No facts yet — add one above!</p>}
        {facts.map((fact, i) => (
          <div key={i} className="flex items-start gap-2 p-3 rounded-lg paper-warm border border-cream group">
            <span className="font-mono text-sm text-ink-faint w-6 flex-shrink-0 mt-0.5">{i + 1}.</span>
            {editIdx === i ? (
              <div className="flex-1 flex gap-2">
                <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditIdx(null); }}
                  className="flex-1 px-2 py-1 rounded border border-moss bg-paper font-ui text-sm focus:outline-none" />
                <button onClick={saveEdit} className="text-xs text-moss font-semibold px-2">Save</button>
                <button onClick={() => setEditIdx(null)} className="text-xs text-ink-faint px-2">Cancel</button>
              </div>
            ) : (
              <span className="flex-1 font-ui text-sm text-ink-dark">{fact}</span>
            )}
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => { setEditIdx(i); setEditVal(fact); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-ink-faint hover:text-moss px-1.5 py-1 rounded">✏</button>
              <button onClick={() => deleteFact(i)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-ink-faint hover:text-rust px-1.5 py-1 rounded">✕</button>
            </div>
          </div>
        ))}
      </div>
      <p className="font-ui text-sm text-ink-faint mt-3">{facts.length} fact{facts.length !== 1 ? 's' : ''} total</p>
    </Section>
  );
}

// ── Bird Facts (species-specific) ─────────────────────────────
function BirdFactsSection({ token, showToast }) {
  const [birdFacts, setBirdFacts] = useState({});
  const [newSpecies, setNewSpecies] = useState('');
  const [newFact, setNewFact]     = useState('');
  const [editSpecies, setEditSpecies] = useState(null);
  const [editVal, setEditVal]     = useState('');
  const [search, setSearch]       = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/admin/settings/birdfacts`, {
      headers: authHeader(token),
    })
      .then(r => r.json())
      .then(d => setBirdFacts(d.birdFacts || {}))
      .catch(() => {});
  }, [token]);

  const addOrUpdate = async (species, fact) => {
    const res = await fetch(`${API_BASE}/admin/settings/birdfacts/${encodeURIComponent(species)}`, {
      method: 'PUT', headers: authHeader(token), body: JSON.stringify({ fact }),
    });
    if (res.ok) {
      setBirdFacts(prev => ({ ...prev, [species]: fact }));
      showToast(`Fact saved for ${species}`);
      return true;
    }
    showToast('Failed to save', 'error');
    return false;
  };

  const deleteFact = async species => {
    const res = await fetch(`${API_BASE}/admin/settings/birdfacts/${encodeURIComponent(species)}`, {
      method: 'DELETE', headers: authHeader(token),
    });
    if (res.ok) {
      setBirdFacts(prev => { const n = { ...prev }; delete n[species]; return n; });
      showToast(`Removed fact for ${species}`);
    }
  };

  const handleAdd = async () => {
    if (!newSpecies.trim() || !newFact.trim()) return;
    const ok = await addOrUpdate(newSpecies.trim(), newFact.trim());
    if (ok) { setNewSpecies(''); setNewFact(''); }
  };

  const handleSaveEdit = async () => {
    if (!editVal.trim()) return;
    const ok = await addOrUpdate(editSpecies, editVal.trim());
    if (ok) setEditSpecies(null);
  };

  const entries = Object.entries(birdFacts)
    .filter(([sp]) => !search || sp.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <Section title="Bird Facts (Species Cards)" icon="🐦" defaultOpen={false}>
      <p className="font-ui text-sm text-ink-mid mb-4">
        Species-specific facts shown on individual bird cards. These override the built-in defaults.
        Leave a species without an entry to use the built-in fact (or show nothing if no built-in exists).
      </p>

      {/* Add new */}
      <div className="space-y-2 mb-5 p-4 rounded-xl bg-parchment border border-cream">
        <p className="font-ui text-sm font-semibold text-ink-mid">Add / update a fact</p>
        <input type="text" value={newSpecies} onChange={e => setNewSpecies(e.target.value)}
          placeholder="Species name e.g. European Robin"
          className="w-full px-3 py-2 rounded-lg border border-cream bg-paper font-ui text-sm text-ink-dark focus:outline-none focus:border-moss" />
        <div className="flex gap-2">
          <input type="text" value={newFact} onChange={e => setNewFact(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            placeholder="The fun fact to show on the card…"
            className="flex-1 px-3 py-2 rounded-lg border border-cream bg-paper font-ui text-sm text-ink-dark focus:outline-none focus:border-moss" />
          <button onClick={handleAdd} disabled={!newSpecies.trim() || !newFact.trim()}
            className="px-4 py-2 rounded-lg bg-moss text-paper font-ui font-semibold text-sm hover:bg-bark transition-colors disabled:opacity-40">
            Save
          </button>
        </div>
      </div>

      {/* Search */}
      {Object.keys(birdFacts).length > 6 && (
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search species…"
          className="w-full px-3 py-2 rounded-lg border border-cream bg-parchment font-ui text-sm text-ink-dark focus:outline-none focus:border-moss mb-3" />
      )}

      {/* List */}
      <div className="space-y-2">
        {entries.length === 0 && (
          <p className="font-ui text-sm text-ink-faint text-center py-4">
            {search ? 'No matching species' : 'No custom facts yet — built-in facts are used by default'}
          </p>
        )}
        {entries.map(([species, fact]) => (
          <div key={species} className="rounded-lg paper-warm border border-cream p-3 group">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-ui text-sm font-semibold text-ink-dark">{species}</p>
                {editSpecies === species ? (
                  <div className="flex gap-2 mt-1">
                    <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditSpecies(null); }}
                      className="flex-1 px-2 py-1 rounded border border-moss bg-paper font-ui text-sm focus:outline-none" />
                    <button onClick={handleSaveEdit} className="text-xs text-moss font-semibold px-2">Save</button>
                    <button onClick={() => setEditSpecies(null)} className="text-xs text-ink-faint px-2">Cancel</button>
                  </div>
                ) : (
                  <p className="font-ui text-sm text-ink-light mt-0.5">{fact}</p>
                )}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => { setEditSpecies(species); setEditVal(fact); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-ink-faint hover:text-moss px-1.5 py-1 rounded">✏</button>
                <button onClick={() => deleteFact(species)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-ink-faint hover:text-rust px-1.5 py-1 rounded">✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="font-ui text-sm text-ink-faint mt-3">{Object.keys(birdFacts).length} custom override{Object.keys(birdFacts).length !== 1 ? 's' : ''}</p>
    </Section>
  );
}

// ── Popup / Birthday ─────────────────────────────────────────
function PopupSection({ token, showToast }) {
  const [enabled,   setEnabled]   = useState(false);
  const [date,      setDate]      = useState('');
  const [title,     setTitle]     = useState('');
  const [message,   setMessage]   = useState('');
  const [imageUrl,  setImageUrl]  = useState('');
  const [loaded,    setLoaded]    = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/popup`)
      .then(r => r.json())
      .then(d => {
        setEnabled(d.enabled || false);
        setDate(d.date || '');
        setTitle(d.title || '');
        setMessage(d.message || '');
        setImageUrl(d.imageUrl || '');
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const save = async () => {
    const res = await fetch(`${API_BASE}/admin/settings/popup`, {
      method: 'PUT',
      headers: authHeader(token),
      body: JSON.stringify({ enabled, date, title, message, imageUrl }),
    });
    if (res.ok) showToast('Popup settings saved!');
    else showToast('Failed to save popup', 'error');
  };

  if (!loaded) return null;

  return (
    <Section title="Birthday Popup" icon="🎂">
      <p className="font-ui text-sm text-ink-mid mb-4">
        Shows a celebration popup on a specific date. Appears once per browser session on the matching day.
      </p>

      {/* Enable toggle */}
      <div className="flex items-center gap-3 mb-5 p-3 rounded-lg bg-parchment border border-cream">
        <button
          onClick={() => setEnabled(e => !e)}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0
            ${enabled ? 'bg-moss' : 'bg-cream border border-ink-faint/30'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-paper shadow transition-transform
            ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
        <span className="font-ui text-sm font-semibold text-ink-dark">
          {enabled ? 'Popup enabled' : 'Popup disabled'}
        </span>
      </div>

      <div className="space-y-4">
        {/* Date */}
        <div>
          <label className="font-ui text-sm text-ink-mid block mb-1">
            Date <span className="text-ink-faint">(DD-MM format)</span>
          </label>
          <input type="text" value={date} onChange={e => setDate(e.target.value)}
            placeholder="e.g. 15-06 for June 15th"
            maxLength={5}
            className="w-full px-3 py-2 rounded-lg border border-cream bg-parchment font-mono text-sm text-ink-dark focus:outline-none focus:border-moss" />
          <p className="font-ui text-xs text-ink-faint mt-1">The popup will only appear on this day each year.</p>
        </div>

        {/* Title */}
        <div>
          <label className="font-ui text-sm text-ink-mid block mb-1">Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Happy Birthday Ruairí! 🎂"
            className="w-full px-3 py-2 rounded-lg border border-cream bg-parchment font-ui text-sm text-ink-dark focus:outline-none focus:border-moss" />
        </div>

        {/* Message */}
        <div>
          <label className="font-ui text-sm text-ink-mid block mb-1">Message</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Write a birthday message here…"
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-cream bg-parchment font-ui text-sm text-ink-dark focus:outline-none focus:border-moss resize-none" />
        </div>

        {/* Image URL */}
        <div>
          <label className="font-ui text-sm text-ink-mid block mb-1">Image URL <span className="text-ink-faint">(optional)</span></label>
          <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
            placeholder="https://example.com/birthday-photo.jpg"
            className="w-full px-3 py-2 rounded-lg border border-cream bg-parchment font-ui text-sm text-ink-dark focus:outline-none focus:border-moss" />
          <p className="font-ui text-xs text-ink-faint mt-1">Use a public image URL or a photo hosted anywhere online.</p>
          {imageUrl && (
            <img src={imageUrl} alt="Preview"
              className="mt-2 rounded-lg max-h-32 object-cover border border-cream"
              onError={e => { e.target.style.display = 'none'; }} />
          )}
        </div>
      </div>

      {/* Preview */}
      {(title || message) && (
        <div className="mt-4 p-4 rounded-xl bg-amber/10 border border-amber/30">
          <p className="font-ui text-xs text-ink-faint mb-2 font-semibold">PREVIEW</p>
          <p className="font-display text-xl text-amber">{title || 'Happy Birthday!'}</p>
          {message && <p className="font-ui text-sm text-ink-mid mt-1 whitespace-pre-wrap">{message}</p>}
          {date && <p className="font-ui text-xs text-ink-faint mt-2">Shows on: {date} each year · {enabled ? '✓ enabled' : '✗ disabled'}</p>}
        </div>
      )}

      <button onClick={save}
        className="mt-5 px-5 py-2 rounded-lg bg-moss text-paper font-ui font-semibold text-sm hover:bg-bark transition-colors">
        Save popup settings
      </button>
    </Section>
  );
}


function AdminPanel({ token, onLogout }) {
  const [settings, setSettings] = useState({});
  const [toast, setToast]       = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 3500);
  };

  useEffect(() => {
    fetch(`${API_BASE}/settings`)
      .then(r => r.json())
      .then(d => setSettings(d))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#f5f0e8' }}>
      <Toast message={toast.message} type={toast.type} />

      {/* Header */}
      <div className="paper border-b border-cream sticky top-0 z-40">
        <div className="container mx-auto px-4 max-w-3xl py-3 flex items-center gap-3">
          <span className="text-xl">🛠</span>
          <div>
            <h1 className="font-display text-xl text-ink-dark leading-none">Admin Panel</h1>
            <p className="font-ui text-sm text-ink-faint">{settings.siteTitle || 'Garden Birds'}</p>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <a href="/" className="font-ui text-sm text-moss hover:underline">← Back to site</a>
            <button onClick={onLogout} className="font-ui text-sm text-ink-faint hover:text-rust transition-colors">Log out</button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-3xl py-8 space-y-4">
        <TitleSection    token={token} showToast={showToast} currentTitle={settings.siteTitle} />
        <BirdnetSection  token={token} showToast={showToast} currentUrl={settings.birdnetUrl} />
        <PopupSection    token={token} showToast={showToast} />
        <TickerFactsSection token={token} showToast={showToast} />
        <BirdFactsSection   token={token} showToast={showToast} />
      </div>
    </div>
  );
}

// ── Entry point ───────────────────────────────────────────────
export default function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem('admin-token') || '');
  const handleLogin  = t => { setToken(t); sessionStorage.setItem('admin-token', t); };
  const handleLogout = () => { setToken(''); sessionStorage.removeItem('admin-token'); };
  if (!token) return <LoginForm onLogin={handleLogin} />;
  return <AdminPanel token={token} onLogout={handleLogout} />;
}
