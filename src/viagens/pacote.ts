import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from 'fflate';

// Pacote de viagem (.viagem.zip): viagem.json + fotos/* + tiles/{z}/{x}/{y}.png
const MIME: Record<string, string> = { png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg' };
export const mime = (caminho: string) => MIME[caminho.split('.').pop()!.toLowerCase()] ?? 'application/octet-stream';
const aceito = (c: string) => /^(fotos\/[\w.-]+|tiles\/\d+\/\d+\/\d+\.png)$/.test(c);

export const ehZip = (b: Uint8Array) => b[0] === 0x50 && b[1] === 0x4b;

export function abrirPacote(bytes: Uint8Array): { json: unknown; arquivos: Map<string, Blob> } {
  if (!ehZip(bytes)) return { json: JSON.parse(new TextDecoder().decode(bytes)), arquivos: new Map() };
  const z = unzipSync(bytes);
  const nome = Object.keys(z).find((n) => n === 'viagem.json' || n.endsWith('/viagem.json'));
  if (!nome) throw new Error('o pacote não tem viagem.json');
  const raiz = nome.slice(0, -'viagem.json'.length);
  const arquivos = new Map<string, Blob>();
  for (const [n, dados] of Object.entries(z)) {
    const c = n.slice(raiz.length);
    if (n.startsWith(raiz) && aceito(c)) arquivos.set(c, new Blob([dados as Uint8Array<ArrayBuffer>], { type: mime(c) }));
  }
  return { json: JSON.parse(strFromU8(z[nome])), arquivos };
}

export function montarPacote(json: unknown, arquivos: Map<string, Uint8Array>): Uint8Array {
  const z: Zippable = { 'viagem.json': [strToU8(JSON.stringify(json, null, 2)), { level: 6 }] };
  for (const [c, b] of arquivos) z[c] = [b, { level: 0 }]; // imagens já são comprimidas
  return zipSync(z);
}
