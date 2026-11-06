# Análise de segurança — v1.1.0 (2026-11-06)

Escopo: código do app (`src/`), projeto Android (`android/`), dependências (`package-lock.json`),
scripts e containers de desenvolvimento. Feita antes de ligar o ADB no Galaxy A35.

## Código malicioso

Não foi encontrado nenhum.

- **Código do app**:
  - Não usa `eval`, `new Function`, `innerHTML` nem `dangerouslySetInnerHTML`.
  - O único `fetch` é local, do exemplo embutido.
  - Não tem analytics, CDN nem chamadas de rede.
- **Android**:
  - Só a `MainActivity` padrão do Capacitor; não há código nativo próprio.
  - Os componentes exportados são o launcher e o `ProfileInstallReceiver` do androidx, que está protegido pela permissão `DUMP`.
  - O FileProvider não é exportado.
- **Dependências**:
  - As 621 entradas do lockfile vêm de `registry.npmjs.org` e têm hash `integrity`.
  - O único script de instalação é o `postinstall` do esbuild, que baixa o binário oficial e só roda no container.
- **Repositório e histórico**: não há keystore, senha nem `.env` versionados.
- **Gradle**: usa só `google()` e `mavenCentral()`; o wrapper vem de `services.gradle.org`.

## Vulnerabilidades corrigidas na 1.1.0

| # | Gravidade | Problema | Correção |
|---|---|---|---|
| 1 | **Alta** | Build debug: o Capacitor logava no logcat o retorno do SecureStorage, **inclusive a chave de dados**. Com o ADB ligado, `adb logcat` revelaria a chave. | `loggingBehavior: 'none'` em `capacitor.config.ts`. Verificado no emulador. |
| 2 | Média | Links de um JSON importado aceitavam `javascript:`, `intent:` e `file:`, que abririam activities arbitrárias ou executariam script. | Schema só aceita `http(s)` e `abrirExterno` ignora o resto. Teste em `tests/formato.test.ts`. |
| 3 | Média | O noVNC (porta 6080) escutava em todas as interfaces e sem senha: qualquer um na rede local controlava o emulador. Vite dev/preview também ficavam expostos na rede. | Tudo em `127.0.0.1`. |
| 4 | Defesa | A permissão `INTERNET` era desnecessária. | Removida. Agora nem uma dependência comprometida consegue mandar dados para fora. |

## Riscos aceitos ou pendentes

- **O APK de debug é `debuggable`.** Com ADB autorizado, `run-as` e o `chrome://inspect` dão acesso à WebView, que tem os dados decifrados em memória.
  - Durante os testes isso é aceitável.
  - Para uso na viagem: **desligue a Depuração USB/sem fio depois dos testes**.
  - A release Demo deve sair como build `release` assinado, que não é debuggable e não tem inspeção da WebView.
- **Autorizar o ADB só para este PC.** Revogue as autorizações em Opções do desenvolvedor depois dos testes.
- **npm audit encontrou 13 alertas.**
  - Só `react-router` (moderado) vai para o app. Os dois alertas afetam SSR e redirecionamento via `<Link>` com destino controlado por terceiros, e não se aplicam aqui: usamos `HashRouter` e só rotas internas.
  - A correção exige a v7, que é major; fica para uma próxima release.
  - Os outros 12 (vite, vitest, tinypool, esbuild etc.) são ferramentas de dev que rodam em container e não entram no APK.
- **Arquivo exportado fica no cache privado do app depois de "Compartilhar".**
  - Ele não sai do app, mas está em texto puro.
  - Pendente: apagar depois do envio.
- **Zip muito grande pode travar a importação** (DoS local). O arquivo é escolhido pelo próprio usuário, então o risco é baixo.
