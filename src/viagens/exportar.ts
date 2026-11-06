import { strToU8 } from 'fflate';
import type { EstadoViagem, Viagem } from '../formato/tipos';
import { montarPacote } from './pacote';
import { lerArquivo, listarArquivos } from './repositorio';
import { salvarArquivo } from '../nativo/plataforma';

const carimbo = () => new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '').replace(/^(\d{8})(\d{4})$/, '$1-$2');

// Exporta no mesmo formato da importação (ida e volta sem perda). Sai em TEXTO PURO:
// quem chama deve confirmar com o usuário antes.
export async function exportarViagem(v: Viagem, opcoes: { completo: boolean; estado?: EstadoViagem }) {
  if (!opcoes.completo && !opcoes.estado) {
    await salvarArquivo(`${v.id}_${carimbo()}.json`, strToU8(JSON.stringify(v, null, 2)), 'application/json');
    return;
  }
  const arquivos = new Map<string, Uint8Array>();
  if (opcoes.completo) {
    for (const c of await listarArquivos(v.id)) {
      const b = await lerArquivo(v.id, c);
      if (b) arquivos.set(c, new Uint8Array(await b.arrayBuffer()));
    }
  }
  if (opcoes.estado) arquivos.set('estado.json', strToU8(JSON.stringify(opcoes.estado, null, 2)));
  await salvarArquivo(`${v.id}_${carimbo()}.viagem.zip`, montarPacote(v, arquivos), 'application/zip');
}
