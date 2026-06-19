import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const DEFAULTS = {
  siteTitle: "Ruairí's Garden",
  facts: [],
  birdFacts: {},
};

export function useSiteSettings() {
  const [siteSettings, setSiteSettings] = useState(DEFAULTS);

  useEffect(() => {
    fetch(`${API_BASE}/settings`)
      .then(r => r.json())
      .then(d => setSiteSettings({ ...DEFAULTS, ...d }))
      .catch(() => {});
  }, []);

  return siteSettings;
}
