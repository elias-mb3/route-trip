import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.dev.viagem.app',
  appName: 'Viagem',
  webDir: 'dist',
  // Nunca logar chamadas de plugin: no build debug o Capacitor escreve no logcat o retorno
  // do SecureStorage (a chave de dados!). Com ADB ligado, qualquer um leria a chave no log.
  loggingBehavior: 'none',
  android: { backgroundColor: '#F4F5F7' },
};

export default config;
