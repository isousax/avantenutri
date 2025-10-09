import { useEffect, useState } from 'react';
import { useUserLocation } from './useUserLocation';

interface WeatherData {
  temperatureC: number | null;
  success: boolean;
}

interface OpenMeteoResponse {
  current?: { temperature_2m?: number };
}

// Constantes de módulo para fallback e cache
const FALLBACK = { lat: -8.063261, lon: -34.871124 } as const;
const CACHE_KEY = 'weather.open-meteo.current.v1';
const TTL_MS = 15 * 60 * 1000; // 15 minutos

/**
 * useWeather: obtém temperatura atual via Open-Meteo sem chave.
 * Usa geolocalização do usuário quando disponível; fallback para coordenadas constantes.
 */
export function useWeather() {
  const [data, setData] = useState<WeatherData>({ temperatureC: null, success: false });
  const location = useUserLocation();
  

  useEffect(() => {
    let cancelled = false;
    async function fetchWeather() {
      try {
        const lat = location.coords?.lat ?? FALLBACK.lat;
        const lon = location.coords?.lon ?? FALLBACK.lon;
        // Cache simples em sessionStorage por (lat,lon)
        try {
          const raw = sessionStorage.getItem(CACHE_KEY);
          if (raw) {
            const cached = JSON.parse(raw) as { lat: number; lon: number; ts: number; temp: number | null };
            const fresh = cached && Math.abs(cached.lat - lat) < 0.001 && Math.abs(cached.lon - lon) < 0.001 && (Date.now() - cached.ts) < TTL_MS;
            if (fresh) {
              if (!cancelled) setData({ temperatureC: cached.temp, success: Number.isFinite(cached.temp) });
              if (import.meta.env.DEV) console.log('[weather] cache hit', { lat, lon, temp: cached.temp });
              return;
            }
          }
        } catch { /* ignore cache errors */ }
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current=temperature_2m`;
  const r = await fetch(url);
  const json: OpenMeteoResponse = await r.json().catch(() => ({}) as OpenMeteoResponse);
  const temp = json.current?.temperature_2m ?? null;
        if (import.meta.env.DEV) {
          console.log('[weather] fetch', { lat, lon, url, temp });
        }
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ lat, lon, ts: Date.now(), temp }));
        } catch { /* ignore quota */ }
        if (!cancelled) setData({ temperatureC: Number.isFinite(temp) ? temp : null, success: Number.isFinite(temp) });
      } catch {
        if (!cancelled) setData({ temperatureC: null, success: false });
      }
    }
    fetchWeather();
    return () => { cancelled = true; };
  }, [location.coords?.lat, location.coords?.lon]);

  return data;
}
