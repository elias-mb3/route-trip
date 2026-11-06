// Uso: ./dev.sh validar viagens/<slug>  (ou caminho de um viagem.json / .viagem.zip)
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { validarViagem, errosEmTexto } from '../src/formato/validar';
import { abrirPacote } from '../src/viagens/pacote';

const alvo = process.argv[2];
if (!alvo) { console.error('uso: validar <pasta-da-viagem | viagem.json | .viagem.zip>'); process.exit(2); }
const arq = statSync(alvo).isDirectory() ? join(alvo, 'viagem.json') : alvo;
let json: unknown;
try { json = abrirPacote(new Uint8Array(readFileSync(arq))).json; } catch (e) {
  console.error(`(arquivo): JSON inválido — ${(e as Error).message}`); process.exit(1);
}
const r = validarViagem(json);
if (!r.ok) { console.error(errosEmTexto(r.erros)); console.error(`\n${r.erros.length} erro(s) em ${arq}`); process.exit(1); }
const v = r.viagem;
const paradas = v.dias.flatMap((d) => d.paradas);
console.log(`OK ${v.titulo}: ${v.dias.length} dia(s), ${paradas.length} parada(s), ${paradas.filter((p) => p.local).length} com local, ${v.checklist.reduce((s, c) => s + c.itens.length, 0)} itens de checklist, ${v.orcamento.caixinhas.length} caixinha(s)`);
if (v.pendencias.length) console.log(`Pendências:\n- ${v.pendencias.join('\n- ')}`);
