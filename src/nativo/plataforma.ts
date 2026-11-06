import { Capacitor } from '@capacitor/core';
import { b64 } from '../lib/cripto';

export const nativo = () => Capacitor.isNativePlatform();

// Salva/compartilha um arquivo gerado pelo app. Android: grava no cache e abre o "Compartilhar".
export async function salvarArquivo(nome: string, bytes: Uint8Array, tipo: string) {
  if (nativo()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const { uri } = await Filesystem.writeFile({ path: nome, data: b64.para(bytes), directory: Directory.Cache });
    await Share.share({ title: nome, files: [uri] });
    return;
  }
  const url = URL.createObjectURL(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: tipo }));
  const a = Object.assign(document.createElement('a'), { href: url, download: nome });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// Links externos (Maps, Waze, sites): no Android abre o app/navegador do sistema, fora da WebView
export async function abrirExterno(url: string) {
  if (nativo()) {
    const { AppLauncher } = await import('@capacitor/app-launcher');
    try { await AppLauncher.openUrl({ url }); return; } catch { /* cai no window.open */ }
  }
  window.open(url, '_blank', 'noopener');
}

// Botão voltar do Android: volta no histórico; na tela inicial, minimiza
export async function configurarVoltar() {
  if (!nativo()) return;
  const { App } = await import('@capacitor/app');
  App.addListener('backButton', () => {
    if (location.hash && location.hash !== '#/' && history.length > 1) history.back();
    else App.minimizeApp();
  });
}
