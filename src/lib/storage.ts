import { get, set, del, keys } from 'idb-keyval';
import { ACESSO } from '../data/acesso';
import { cifradoParaTexto, cifrar, decifrar, ehCifrado, textoParaCifrado } from './cripto';

// IndexedDB via idb-keyval; se falhar (modo privado, navegador antigo), usa localStorage.
// Todo valor é gravado criptografado com a chave do login (ver src/lib/cripto.ts).
const PREFIXO = 'holambra:';
// A chave do login fica guardada como CryptoKey não exportável: o navegador usa, mas ninguém lê os bytes
const CHAVE_SALVA = 'holambra-acesso:chave';

let chave: CryptoKey | null = null;

// Guardada junto com o hash do login: se a senha for trocada (`npm run senha`), a chave antiga é descartada
export async function chaveSalva(): Promise<CryptoKey | null> {
  try {
    const s = await get<{ chave: CryptoKey; hash: string }>(CHAVE_SALVA);
    if (s?.hash === ACESSO.hash) return s.chave;
    if (s) await del(CHAVE_SALVA);
  } catch { /* ignora */ }
  return null;
}

// Ativa a chave e criptografa o que ainda estiver em texto puro (dados de antes do login existir)
export async function usarChave(k: CryptoKey, lembrar: boolean) {
  chave = k;
  if (lembrar) { try { await set(CHAVE_SALVA, { chave: k, hash: ACESSO.hash }); } catch { /* sem IndexedDB: pede login a cada abertura */ } }
  try {
    for (const c of await keys()) {
      if (typeof c !== 'string' || !c.startsWith(PREFIXO)) continue;
      const v = await get(c);
      if (!ehCifrado(v)) await set(c, await cifrar(k, v));
    }
  } catch { /* ignora */ }
  try {
    for (const c of Object.keys(localStorage).filter((x) => x.startsWith(PREFIXO))) {
      const v = textoParaCifrado(localStorage.getItem(c)!);
      if (!ehCifrado(v)) localStorage.setItem(c, cifradoParaTexto(await cifrar(k, v)));
    }
  } catch { /* ignora */ }
}

export async function sair() {
  chave = null;
  try { await del(CHAVE_SALVA); } catch { /* ignora */ }
}

async function abrir<T>(v: unknown): Promise<T | undefined> {
  if (v === undefined || v === null) return undefined;
  if (!ehCifrado(v)) return v as T;
  if (!chave) return undefined;
  try { return await decifrar<T>(chave, v); } catch { return undefined; }
}

export async function ler<T>(nome: string): Promise<T | undefined> {
  try {
    return await abrir<T>(await get(PREFIXO + nome));
  } catch {
    try {
      const t = localStorage.getItem(PREFIXO + nome);
      return t ? await abrir<T>(textoParaCifrado(t)) : undefined;
    } catch {
      return undefined;
    }
  }
}

export async function gravar<T>(nome: string, valor: T): Promise<void> {
  if (!chave) return; // nunca grava em texto puro
  const c = await cifrar(chave, valor);
  try {
    await set(PREFIXO + nome, c);
  } catch {
    try {
      localStorage.setItem(PREFIXO + nome, cifradoParaTexto(c));
    } catch {
      /* sem armazenamento disponível */
    }
  }
}

export async function apagar(nome: string): Promise<void> {
  try { await del(PREFIXO + nome); } catch { /* ignora */ }
  try { localStorage.removeItem(PREFIXO + nome); } catch { /* ignora */ }
}

export const novoId = () => Math.random().toString(36).slice(2, 10);

// Chave do login ativo (para backups exportados, ver src/lib/backup.ts)
export const chaveAtual = () => chave;
