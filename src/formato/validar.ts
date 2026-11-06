import type { z } from 'zod';
import { FORMATO, Viagem } from './viagem';

export interface ErroCampo { caminho: string; mensagem: string }
export type Resultado = { ok: true; viagem: Viagem } | { ok: false; erros: ErroCampo[] };

// dias[0].paradas[2].hora
const caminho = (p: readonly PropertyKey[]) =>
  p.reduce<string>((s, k) => (typeof k === 'number' ? `${s}[${k}]` : s ? `${s}.${String(k)}` : String(k)), '') || '(raiz)';

function mensagem(i: z.core.$ZodIssue): string {
  if (i.code === 'unrecognized_keys') return `campo(s) desconhecido(s): ${i.keys.join(', ')} — confira a grafia no viagem.schema.json`;
  if (i.code === 'invalid_type' && i.input === undefined) return 'campo obrigatório ausente';
  if (i.code === 'invalid_value' && 'values' in i) return `${i.message}; valores aceitos: ${i.values.join(', ')}`;
  return i.message;
}

export function validarViagem(dado: unknown): Resultado {
  if (dado && typeof dado === 'object' && typeof (dado as { formato?: unknown }).formato === 'number'
    && (dado as { formato: number }).formato > FORMATO) {
    return { ok: false, erros: [{ caminho: 'formato', mensagem: `arquivo no formato ${(dado as { formato: number }).formato}, mas este app lê até o ${FORMATO}: atualize o app` }] };
  }
  const r = Viagem.safeParse(dado);
  if (r.success) return { ok: true, viagem: r.data };
  return { ok: false, erros: r.error.issues.map((i) => ({ caminho: caminho(i.path), mensagem: mensagem(i) })) };
}

export const errosEmTexto = (erros: ErroCampo[]) => erros.map((e) => `${e.caminho}: ${e.mensagem}`).join('\n');
