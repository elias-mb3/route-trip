import type { Parada } from '../formato/tipos';

export function distanciaKm(a: Parada, b: Parada): number | null {
  if (!a.local || !b.local) return null;
  const R = 6371;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.local.lat - a.local.lat);
  const dLng = rad(b.local.lng - a.local.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.local.lat)) * Math.cos(rad(b.local.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Estimativa simples: linha reta × 1,3. Até 1,2 km a pé (4,5 km/h); acima, carro (35 km/h + 3 min).
export function deslocamento(a: Parada, b: Parada) {
  const reta = distanciaKm(a, b);
  if (reta == null) return null;
  const km = reta * 1.3;
  const aPe = km <= 1.2;
  const min = Math.max(1, Math.round((km / (aPe ? 4.5 : 35)) * 60) + (aPe ? 0 : 3));
  return { km, min, modo: aPe ? ('pe' as const) : ('carro' as const) };
}

export const linkRota = (p: Parada) =>
  `https://www.google.com/maps/dir/?api=1&destination=${p.local!.lat},${p.local!.lng}`;

export const linkWaze = (p: Parada) =>
  `https://waze.com/ul?ll=${p.local!.lat},${p.local!.lng}&navigate=yes`;

// De carro quando a parada anterior não tem local (ex.: saída de casa) ou fica longe para ir a pé
export function vaiDeCarro(p: Parada, anterior?: Parada) {
  if (!p.local || !anterior) return false;
  if (!anterior.local) return true;
  return deslocamento(anterior, p)?.modo === 'carro';
}

export const formatarKm = (km: number) =>
  km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`;

export const novoId = (pre = 'x') => `${pre}-${Math.random().toString(36).slice(2, 8)}`;
