import { cifradoParaTexto, cifrar, decifrar, ehCifrado, textoParaCifrado } from './cripto';
import { chaveAtual, gravar, ler } from './storage';
import { migrarOrcamento } from '../data/roteiro';
import type { Orcamento } from './types';

// Backup do orçamento em arquivo .json criptografado com a mesma chave do login:
// só abre em um aparelho onde se entrou com o mesmo usuário e senha.
const TIPO = 'holambra-orcamento';

export interface Versao { em: string; orcamento: Orcamento }
const HISTORICO = 'orcamento-historico';
const MAX_VERSOES = 30;

const carimbo = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}h${p(d.getMinutes())}`;
};

export async function exportarOrcamento(orcamento: Orcamento): Promise<'compartilhado' | 'baixado' | 'cancelado'> {
  const chave = chaveAtual();
  if (!chave) throw new Error('Entre no app antes de exportar.');
  const conteudo = JSON.stringify({ tipo: TIPO, versao: 1, em: new Date().toISOString(), dados: JSON.parse(cifradoParaTexto(await cifrar(chave, orcamento))) });
  const nome = `orcamento-holambra_${carimbo()}.json`;
  const arquivo = new File([conteudo], nome, { type: 'application/json' });

  // No celular abre a folha de compartilhar (WhatsApp, Drive, e-mail…); senão baixa o arquivo
  if (navigator.canShare?.({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo], title: 'Backup do orçamento' });
      return 'compartilhado';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelado';
    }
  }
  const url = URL.createObjectURL(arquivo);
  const a = Object.assign(document.createElement('a'), { href: url, download: nome });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'baixado';
}

export async function importarOrcamento(arquivo: File): Promise<{ orcamento: Orcamento; em: string }> {
  const chave = chaveAtual();
  if (!chave) throw new Error('Entre no app antes de importar.');
  let j: { tipo?: string; em?: string; dados?: unknown };
  try { j = JSON.parse(await arquivo.text()); } catch { throw new Error('Arquivo inválido.'); }
  if (j.tipo !== TIPO) throw new Error('Este arquivo não é um backup do orçamento.');
  const c = textoParaCifrado(JSON.stringify(j.dados));
  if (!ehCifrado(c)) throw new Error('Arquivo inválido.');
  try {
    return { orcamento: migrarOrcamento(await decifrar(chave, c)), em: j.em ?? '' };
  } catch {
    throw new Error('Não foi possível abrir: o backup foi feito com outro usuário ou senha.');
  }
}

// Histórico automático no próprio aparelho: guarda as últimas versões para desfazer erros
export const lerHistorico = async () => (await ler<Versao[]>(HISTORICO)) ?? [];

export async function registrarVersao(orcamento: Orcamento) {
  const h = await lerHistorico();
  if (h[0] && JSON.stringify(h[0].orcamento) === JSON.stringify(orcamento)) return;
  await gravar(HISTORICO, [{ em: new Date().toISOString(), orcamento }, ...h].slice(0, MAX_VERSOES));
}
