import type { Parada } from './types';

export function distanciaKm(a: Parada, b: Parada): number | null {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null;
  const R = 6371;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Estimativa simples: distância em linha reta × 1,3 (fator de rota).
// Até 1,2 km: a pé a 4,5 km/h. Acima disso: carro a 35 km/h na cidade.
export function deslocamento(a: Parada, b: Parada) {
  const reta = distanciaKm(a, b);
  if (reta == null) return null;
  const km = reta * 1.3;
  const aPe = km <= 1.2;
  const min = Math.max(1, Math.round((km / (aPe ? 4.5 : 35)) * 60) + (aPe ? 0 : 3));
  return { km, min, modo: aPe ? ('pe' as const) : ('carro' as const) };
}

export const linkRota = (p: Parada) =>
  `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;

export const linkWaze = (p: Parada) =>
  `https://waze.com/ul?ll=${p.lat},${p.lng}&navigate=yes`;

// Chega-se de carro quando a parada anterior não tem coordenadas (ex.: saída de Osasco)
// ou fica longe demais para ir a pé. A primeira parada do dia já é o ponto de partida.
export function vaiDeCarro(p: Parada, anterior?: Parada) {
  if (p.lat == null || p.lng == null || !anterior) return false;
  if (anterior.lat == null || anterior.lng == null) return true;
  return deslocamento(anterior, p)?.modo === 'carro';
}

export const formatarKm = (km: number) =>
  km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`;
