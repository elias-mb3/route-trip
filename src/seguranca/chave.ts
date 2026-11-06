import { Capacitor } from '@capacitor/core';
import { get, set } from 'idb-keyval';
import { b64, importarChave } from '../lib/cripto';

// Chave de dados (AES-256) do app, sem senha:
// - Android: 32 bytes aleatórios guardados pelo plugin secure-storage, que os cifra com uma
//   chave do Android Keystore (hardware). Os dados ficam no IndexedDB, cifrados com ela;
//   copiar o armazenamento do app não basta para lê-los.
// - Navegador (desenvolvimento): CryptoKey não extraível no IndexedDB. Protege menos; só para simular.
const NOME = 'chave-dados-v1';
let cache: Promise<CryptoKey> | null = null;

export const chaveDados = () => (cache ??= carregar());

async function carregar(): Promise<CryptoKey> {
  if (Capacitor.isNativePlatform()) {
    const { SecureStorage } = await import('@aparajita/capacitor-secure-storage');
    let t = await SecureStorage.getItem(NOME);
    if (!t) {
      t = b64.para(crypto.getRandomValues(new Uint8Array(32)));
      await SecureStorage.setItem(NOME, t);
    }
    return importarChave(b64.de(t));
  }
  const salva = await get<CryptoKey>(`seguranca:${NOME}`);
  if (salva) return salva;
  const k = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  await set(`seguranca:${NOME}`, k);
  return k;
}

export const modoSeguro = () => Capacitor.isNativePlatform();
