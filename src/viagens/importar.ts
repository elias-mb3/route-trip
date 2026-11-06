import { validarViagem, type ErroCampo } from '../formato/validar';
import { abrirPacote } from './pacote';
import { instalarViagem, lerViagem } from './repositorio';
import type { Viagem } from '../formato/tipos';

export type ResultadoImportacao =
  | { ok: true; viagem: Viagem; arquivos: number; atualizou: boolean }
  | { ok: false; erros: ErroCampo[] };

// Lê .viagem.zip ou .json, valida e instala. Nada é gravado se o arquivo for inválido.
export async function importarArquivo(bytes: Uint8Array): Promise<ResultadoImportacao> {
  let aberto;
  try { aberto = abrirPacote(bytes); } catch (e) {
    return { ok: false, erros: [{ caminho: '(arquivo)', mensagem: `não é um .json nem um .viagem.zip válido (${(e as Error).message})` }] };
  }
  const r = validarViagem(aberto.json);
  if (!r.ok) return r;
  const faltando = r.viagem.dias.flatMap((d) => d.paradas)
    .filter((p) => p.foto?.arquivo && aberto.arquivos.size && !aberto.arquivos.has(p.foto.arquivo))
    .map((p) => ({ caminho: `parada ${p.id}`, mensagem: `foto ${p.foto!.arquivo} não está no pacote` }));
  if (faltando.length) return { ok: false, erros: faltando };
  const atualizou = !!(await lerViagem(r.viagem.id));
  // JSON avulso (sem pacote) mantém fotos/tiles já instalados da mesma viagem
  await instalarViagem(r.viagem, aberto.arquivos, aberto.arquivos.size > 0);
  return { ok: true, viagem: r.viagem, arquivos: aberto.arquivos.size, atualizou };
}
