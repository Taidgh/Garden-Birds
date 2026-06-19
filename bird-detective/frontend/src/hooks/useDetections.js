import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const REFRESH_INTERVAL = parseInt(import.meta.env.VITE_REFRESH_INTERVAL || '30000');

export function useDetections() {
  const [detections, setDetections] = useState([]);
  const [stats, setStats]           = useState(null);
  const [species, setSpecies]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [newDetections, setNewDetections] = useState([]);

  const fetchAll = useCallback(async (isFirst = false) => {
    try {
      const [detectionsRes, statsRes, speciesRes] = await Promise.all([
        axios.get(`${API_BASE}/detections`),
        axios.get(`${API_BASE}/stats`),
        axios.get(`${API_BASE}/species`),
      ]);
      const newData = detectionsRes.data.detections || [];
      if (!isFirst && detections.length > 0) {
        const existingIds = new Set(detections.map(d => d.id));
        const fresh = newData.filter(d => !existingIds.has(d.id));
        if (fresh.length > 0) {
          setNewDetections(fresh);
          setTimeout(() => setNewDetections([]), 5000);
        }
      }
      setDetections(newData);
      setStats(statsRes.data);
      setSpecies(speciesRes.data.species || []);
      setLastUpdated(detectionsRes.data.lastUpdated);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('API error:', err);
    } finally {
      setLoading(false);
    }
  }, [detections]);

  useEffect(() => {
    fetchAll(true);
    const interval = setInterval(() => fetchAll(false), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return { detections, stats, species, loading, error, lastUpdated, newDetections, refetch: fetchAll };
}
