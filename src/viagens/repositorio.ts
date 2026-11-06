import { createStore, del, delMany, get, keys, set, setMany } from 'idb-keyval';
import { cifrar, decifrar, ehCifrado } from '../lib/cripto';
import { chaveDados } from '../seguranca/chave';
import { estadoVazio, type EstadoViagem, type Viagem } from '../formato/tipos';

// Tudo no IndexedDB, cada valor cifrado com AES-GCM (ver src/seguranca/chave.ts).
// Nomes das chaves não têm dado sensível: índice, ativa, viagem:<id>, estado:<id>, pkg:<id>:<caminho>
const loja = createStore('viagens', 'dados');

export interface ItemIndice { id: string; titulo: string; inicio: string; fim: string; atualizada: string }

async function ler<T>(nome: string): Promise<T | undefined> {
  const v = await get(nome, loja);
  if (v === undefined) return undefined;
  if (!ehCifrado(v)) return undefined; // nunca aceita texto puro
  return decifrar<T>(await chaveDados(), v);
}
async function gravar(nome: string, valor: unknown) {
  await set(nome, await cifrar(await chaveDados(), valor), loja);
}

export const lerIndice = async () => (await ler<ItemIndice[]>('indice')) ?? [];
export const lerAtiva = () => ler<string>('ativa');
export const definirAtiva = (id: string) => gravar('ativa', id);
export const lerViagem = (id: string) => ler<Viagem>(`viagem:${id}`);
export const lerEstado = async (id: string) => ({ ...estadoVazio(), ...(await ler<EstadoViagem>(`estado:${id}`)) });
export const gravarEstado = (id: string, e: EstadoViagem) => gravar(`estado:${id}`, e);
export const lerArquivo = (id: string, caminho: string) => ler<Blob>(`pkg:${id}:${caminho}`);

const itemIndice = (v: Viagem): ItemIndice => ({
  id: v.id, titulo: v.titulo, inicio: v.dias[0].data, fim: v.dias[v.dias.length - 1].data, atualizada: new Date().toISOString(),
});

async function atualizarIndice(v: Viagem) {
  const ind = (await lerIndice()).filter((i) => i.id !== v.id);
  await gravar('indice', [...ind, itemIndice(v)].sort((a, b) => a.inicio.localeCompare(b.inicio)));
}

// Grava conteúdo editado (já validado por quem chama)
export async function gravarViagem(v: Viagem) {
  await gravar(`viagem:${v.id}`, v);
  await atualizarIndice(v);
}

// Importação atômica do ponto de vista do usuário: arquivos primeiro (cifrados), depois
// o conteúdo e por último o índice. Se falhar no meio, a viagem não aparece na lista.
// Reimportar o mesmo id substitui conteúdo e arquivos e preserva o estado do usuário.
export async function instalarViagem(v: Viagem, arquivos: Map<string, Blob>, substituirArquivos: boolean) {
  const k = await chaveDados();
  const novos: [string, unknown][] = [];
  for (const [caminho, blob] of arquivos) novos.push([`pkg:${v.id}:${caminho}`, await cifrar(k, blob)]);
  if (substituirArquivos) {
    const antigos = (await keys(loja)).filter((c) => typeof c === 'string' && c.startsWith(`pkg:${v.id}:`) && !arquivos.has(c.slice(`pkg:${v.id}:`.length)));
    await delMany(antigos, loja);
  }
  for (let i = 0; i < novos.length; i += 200) await setMany(novos.slice(i, i + 200), loja);
  await gravar(`viagem:${v.id}`, v);
  await atualizarIndice(v);
  if (!(await lerAtiva())) await definirAtiva(v.id);
}

export async function listarArquivos(id: string) {
  const pre = `pkg:${id}:`;
  return (await keys(loja)).filter((c): c is string => typeof c === 'string' && c.startsWith(pre)).map((c) => c.slice(pre.length));
}

export async function apagarViagem(id: string) {
  const todas = (await keys(loja)).filter((c) => typeof c === 'string' && c.startsWith(`pkg:${id}:`));
  const fotos = (await keys(loja)).filter((c) => typeof c === 'string' && c.startsWith(`foto:${id}:`));
  await delMany([...todas, ...fotos, `viagem:${id}`, `estado:${id}`], loja);
  const ind = (await lerIndice()).filter((i) => i.id !== id);
  await gravar('indice', ind);
  if ((await lerAtiva()) === id) {
    if (ind[0]) await definirAtiva(ind[0].id); else await del('ativa', loja);
  }
}

// Foto tirada pelo usuário para uma parada (tem prioridade sobre a do pacote)
export const lerFotoUsuario = (viagem: string, parada: string) => ler<Blob>(`foto:${viagem}:${parada}`);
export const gravarFotoUsuario = (viagem: string, parada: string, b: Blob) => gravar(`foto:${viagem}:${parada}`, b);
export const apagarFotoUsuario = (viagem: string, parada: string) => del(`foto:${viagem}:${parada}`, loja);
