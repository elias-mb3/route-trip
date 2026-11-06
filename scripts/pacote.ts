// Gera viagens/<slug>.viagem.zip: valida, calcula a área do mapa, baixa tiles e fotos (com cache
// em viagens/<slug>/tiles e viagens/<slug>/fotos) e empacota.
// Uso: ./dev.sh pacote <slug> [--zooms 14-16] [--max-mb 50] [--saida caminho.zip]
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import sharp from 'sharp';
import { validarViagem, errosEmTexto } from '../src/formato/validar';
import { montarPacote } from '../src/viagens/pacote';

const args = process.argv.slice(2);
const opt = (n: string) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const slug = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
if (!slug) { console.error('uso: pacote <slug> [--zooms 14-16] [--max-mb 50] [--saida arquivo.zip]'); process.exit(2); }
const pasta = join('viagens', slug);
const UA = 'ViagemAppPessoal/1.0 (uso pessoal, download unico; contato: cepima2452@ofags.com)';
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

const r = validarViagem(JSON.parse(readFileSync(join(pasta, 'viagem.json'), 'utf8')));
if (!r.ok) { console.error(errosEmTexto(r.erros)); process.exit(1); }
const v = r.viagem;
const paradas = v.dias.flatMap((d) => d.paradas);

// Área do mapa: a informada ou as paradas com local + ~1 km de margem
if (!v.mapa) {
  const pts = paradas.filter((p) => p.local).map((p) => p.local!);
  if (pts.length) {
    const m = 0.01;
    v.mapa = {
      bbox: [Math.min(...pts.map((p) => p.lng)) - m, Math.min(...pts.map((p) => p.lat)) - m, Math.max(...pts.map((p) => p.lng)) + m, Math.max(...pts.map((p) => p.lat)) + m],
      zooms: [14, 16],
    };
  }
}
const zo = opt('zooms');
if (zo && v.mapa) v.mapa.zooms = zo.split('-').map(Number) as [number, number];

const arquivos = new Map<string, Uint8Array>();

// Fotos: usa fotos/<arquivo> se existir; senão baixa foto.url e converte para webp 720px
for (const p of paradas) {
  if (!p.foto) continue;
  const arq = p.foto.arquivo ?? `fotos/${p.id}.webp`;
  const local = join(pasta, arq);
  if (!existsSync(local)) {
    if (!p.foto.url) { console.warn(`! ${p.id}: ${arq} não existe e não há foto.url — sem foto`); delete p.foto.arquivo; continue; }
    try {
      const res = await fetch(p.foto.url, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      mkdirSync(dirname(local), { recursive: true });
      writeFileSync(local, await sharp(Buffer.from(await res.arrayBuffer())).resize(720, 480, { fit: 'cover' }).webp({ quality: 70 }).toBuffer());
      console.log(`foto ${p.id} baixada`);
    } catch (e) { console.warn(`! ${p.id}: falha ao baixar foto (${(e as Error).message})`); delete p.foto.arquivo; continue; }
  }
  p.foto.arquivo = arq;
  arquivos.set(arq, readFileSync(local));
}

// Tiles OSM (política: UA identificado, 1 por vez, ~200 ms, sem baixar de novo)
if (v.mapa) {
  const [o, s, l, n] = v.mapa.bbox;
  const x = (lng: number, z: number) => Math.floor(((lng + 180) / 360) * 2 ** z);
  const y = (lat: number, z: number) => { const r = (lat * Math.PI) / 180; return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z); };
  const fila: [number, number, number][] = [];
  for (let z = v.mapa.zooms[0]; z <= v.mapa.zooms[1]; z++)
    for (let i = x(o, z); i <= x(l, z); i++) for (let j = y(n, z); j <= y(s, z); j++) fila.push([z, i, j]);
  if (fila.length > 5000) { console.error(`área grande demais: ${fila.length} tiles (máx. 5000). Reduza mapa.bbox ou --zooms.`); process.exit(1); }
  let baixados = 0;
  for (const [z, i, j] of fila) {
    const c = `tiles/${z}/${i}/${j}.png`;
    const local = join(pasta, c);
    if (!existsSync(local)) {
      const res = await fetch(`https://tile.openstreetmap.org/${z}/${i}/${j}.png`, { headers: { 'User-Agent': UA } });
      if (!res.ok) { console.warn(`! tile ${c}: HTTP ${res.status}`); continue; }
      mkdirSync(dirname(local), { recursive: true });
      writeFileSync(local, Buffer.from(await res.arrayBuffer()));
      baixados++;
      process.stdout.write(`\rtiles: ${baixados} baixados`);
      await esperar(200);
    }
    arquivos.set(c, readFileSync(local));
  }
  console.log(`${fila.length} tiles (${baixados} novos) · © colaboradores do OpenStreetMap (ODbL)`);
}

const zip = montarPacote(v, arquivos);
const mb = zip.length / 1048576;
const max = Number(opt('max-mb') ?? 50);
if (mb > max) { console.error(`pacote com ${mb.toFixed(1)} MB passa do limite de ${max} MB`); process.exit(1); }
const saida = opt('saida') ?? join('viagens', `${slug}.viagem.zip`);
mkdirSync(dirname(saida), { recursive: true });
writeFileSync(saida, zip);
console.log(`OK ${saida}: ${mb.toFixed(1)} MB, ${arquivos.size} arquivos`);
