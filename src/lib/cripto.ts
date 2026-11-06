// AES-256-GCM sobre WebCrypto. A chave vem de src/seguranca/chave.ts (Android Keystore).
// Valor gravado: bytes direto no IndexedDB (sem base64).
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

export const b64 = {
  de: (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)),
  para: (b: Uint8Array) => { let s = ''; for (const x of b) s += String.fromCharCode(x); return btoa(s); },
};

export const importarChave = (bruta: Uint8Array<ArrayBuffer>) =>
  crypto.subtle.importKey('raw', bruta, 'AES-GCM', false, ['encrypt', 'decrypt']);
