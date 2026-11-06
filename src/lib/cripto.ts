import { ACESSO } from '../data/acesso';

// PBKDF2 (SHA-256) gera 64 bytes a partir de usuário + senha:
//  - os 32 primeiros conferem o login (comparados com ACESSO.hash, gerado por scripts/definir-senha.mjs);
//  - os 32 últimos viram a chave AES-GCM que criptografa os dados. Saber o hash não revela a chave.
// Mesmos parâmetros do script: não mudar um sem o outro.
export const ITERACOES = 600_000;

const b64 = {
  de: (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)),
  para: (b: Uint8Array) => btoa(String.fromCharCode(...b)),
};
export const materialSenha = (usuario: string, senha: string) => `${usuario.trim().toLowerCase()}\n${senha}`;

export const acessoConfigurado = () => !!ACESSO.hash;

// Devolve a chave dos dados se usuário e senha conferem; senão, null.
export async function entrar(usuario: string, senha: string): Promise<CryptoKey | null> {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(materialSenha(usuario, senha)), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: b64.de(ACESSO.sal), iterations: ITERACOES }, base, 512));
  if (!iguais(bits.slice(0, 32), b64.de(ACESSO.hash))) return null;
  return crypto.subtle.importKey('raw', bits.slice(32), 'AES-GCM', false, ['encrypt', 'decrypt']);
}

function iguais(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a[i] ^ b[i];
  return dif === 0;
}

// Valor criptografado como fica gravado (IndexedDB guarda os bytes direto)
export interface Cifrado { cifrado: 1; iv: Uint8Array<ArrayBuffer>; dados: ArrayBuffer; blob?: string /* mime, se era Blob */ }
export const ehCifrado = (v: unknown): v is Cifrado => !!v && typeof v === 'object' && (v as Cifrado).cifrado === 1;

export async function cifrar(chave: CryptoKey, valor: unknown): Promise<Cifrado> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const blob = valor instanceof Blob;
  const bytes = blob ? await valor.arrayBuffer() : new TextEncoder().encode(JSON.stringify(valor));
  const dados = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, chave, bytes);
  return { cifrado: 1, iv, dados, ...(blob && { blob: valor.type }) };
}

export async function decifrar<T>(chave: CryptoKey, c: Cifrado): Promise<T> {
  const bytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: c.iv }, chave, c.dados);
  return (c.blob != null ? new Blob([bytes], { type: c.blob }) : JSON.parse(new TextDecoder().decode(bytes))) as T;
}

// localStorage só guarda texto: bytes vão em base64
export const cifradoParaTexto = (c: Cifrado) =>
  JSON.stringify({ ...c, iv: b64.para(c.iv), dados: b64.para(new Uint8Array(c.dados)) });
export function textoParaCifrado(t: string): unknown {
  const v = JSON.parse(t);
  return ehCifrado(v) ? { ...v, iv: b64.de(v.iv as unknown as string), dados: b64.de(v.dados as unknown as string).buffer } : v;
}
