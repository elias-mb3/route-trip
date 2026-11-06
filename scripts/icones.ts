// Gera todos os ícones (PWA + Android) e splash a partir de assets/logo/*.svg.
// Uso: ./dev.sh icones
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const L = 'assets/logo/';
const fundo = readFileSync(L + 'fundo.svg', 'utf8');
const carro = readFileSync(L + 'carro.svg', 'utf8');
const corpo = (svg: string) => svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

// Ícone completo (mapa + carro); `raio` arredonda os cantos (0 = quadrado, 54 = círculo)
const completo = (raio: number) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108">
  <defs><clipPath id="r"><rect width="108" height="108" rx="${raio}"/></clipPath></defs>
  <g clip-path="url(#r)">${corpo(fundo)}${corpo(carro)}</g></svg>`;
writeFileSync(L + 'logo.svg', completo(24) + '\n');

const png = (svg: string, px: number, saida: string) =>
  sharp(Buffer.from(svg), { density: (72 * px) / 108 * 4 }).resize(px, px).png().toFile(saida);

// Ícone adaptativo: o launcher mostra só o miolo (~72 de 108) → carro menor para o mapa aparecer
const menor = (svg: string, f = 0.72) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108">
  <g transform="translate(54 54) scale(${f}) translate(-54 -54)">${corpo(svg)}</g></svg>`;

const RES = 'android/app/src/main/res/';
const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 } as const;

await Promise.all([
  png(completo(24), 512, 'public/icons/icon-512.png'),
  png(completo(24), 192, 'public/icons/icon-192.png'),
  png(completo(0), 180, 'public/icons/apple-touch-icon.png'),
  ...Object.entries(dens).flatMap(([d, f]) => [
    png(completo(24), 48 * f, `${RES}mipmap-${d}/ic_launcher.png`),
    png(completo(54), 48 * f, `${RES}mipmap-${d}/ic_launcher_round.png`),
    png(fundo, 108 * f, `${RES}mipmap-${d}/ic_launcher_background.png`),
    png(menor(carro), 108 * f, `${RES}mipmap-${d}/ic_launcher_foreground.png`),
    png(menor(readFileSync(L + 'monocromatico.svg', 'utf8')), 108 * f, `${RES}mipmap-${d}/ic_launcher_monochrome.png`),
  ]),
]);
writeFileSync('public/icons/icon.svg', completo(24) + '\n');

// Splash: fundo do app com o ícone no centro, nos mesmos tamanhos dos splash existentes
const splashes = ['drawable/splash.png', ...['land', 'port'].flatMap((o) => Object.keys(dens).map((d) => `drawable-${o}-${d}/splash.png`))];
for (const s of splashes) {
  const { width: w = 480, height: h = 800 } = await sharp(RES + s).metadata();
  const lado = Math.round(Math.min(w, h) * 0.4);
  const icone = await sharp(Buffer.from(completo(24)), { density: 600 }).resize(lado, lado).png().toBuffer();
  await sharp({ create: { width: w, height: h, channels: 4, background: '#F4F5F7' } })
    .composite([{ input: icone, gravity: 'center' }]).png().toFile(RES + s + '.tmp');
  writeFileSync(RES + s, readFileSync(RES + s + '.tmp'));
  (await import('node:fs')).rmSync(RES + s + '.tmp');
}
console.log('ícones e splash gerados');
