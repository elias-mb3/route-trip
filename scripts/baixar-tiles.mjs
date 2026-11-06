// Baixa os tiles do OpenStreetMap da região de Holambra para public/tiles/{z}/{x}/{y}.png
// Política de uso: https://operations.osmfoundation.org/policies/tiles/
// - User-Agent identificado, uma requisição por vez, ~200ms entre requisições,
//   não baixa de novo o que já existe.
// Uso: node scripts/baixar-tiles.mjs
import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'tiles');
const BBOX = { latMin: -22.665, latMax: -22.585, lngMin: -47.10, lngMax: -47.025 }; // igual a AREA_TILES em src/pages/Mapa.tsx
const ZOOMS = [14, 15, 16];
const ATRASO_MS = 200;
const USER_AGENT = 'HolambraViagemPWA/1.0 (uso pessoal, download unico; contato: cepima2452@ofags.com)';

const lng2x = (lng, z) => Math.floor(((lng + 180) / 360) * 2 ** z);
const lat2y = (lat, z) => {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
};
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const existe = (p) => access(p).then(() => true, () => false);

const fila = [];
for (const z of ZOOMS) {
  const [x0, x1] = [lng2x(BBOX.lngMin, z), lng2x(BBOX.lngMax, z)];
  const [y0, y1] = [lat2y(BBOX.latMax, z), lat2y(BBOX.latMin, z)];
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) fila.push({ z, x, y });
}
console.log(`${fila.length} tiles na região (zooms ${ZOOMS.join(', ')}).`);

let baixados = 0, pulados = 0, falhas = 0;
for (const [i, { z, x, y }] of fila.entries()) {
  const destino = join(RAIZ, String(z), String(x), `${y}.png`);
  if (await existe(destino)) { pulados++; continue; }
  try {
    const res = await fetch(`https://tile.openstreetmap.org/${z}/${x}/${y}.png`, {
      headers: { 'User-Agent': USER_AGENT, Referer: 'https://localhost/' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await mkdir(dirname(destino), { recursive: true });
    await writeFile(destino, Buffer.from(await res.arrayBuffer()));
    baixados++;
    process.stdout.write(`\r[${i + 1}/${fila.length}] ${z}/${x}/${y}   `);
  } catch (e) {
    falhas++;
    console.warn(`\nFalha em ${z}/${x}/${y}: ${e.message}`);
  }
  await esperar(ATRASO_MS);
}
console.log(`\nPronto: ${baixados} baixados, ${pulados} já existiam, ${falhas} falhas.`);
console.log('Dados © colaboradores do OpenStreetMap (ODbL).');
