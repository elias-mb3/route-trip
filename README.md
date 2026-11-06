# Viagem

App Android pessoal para consultar viagens **100% offline**. O roteiro, o mapa, as fotos, o checklist e o orçamento ficam no celular, com os dados cifrados (AES-256-GCM, chave guardada no Android Keystore).

Cada viagem é um `viagem.json`. Um agente de IA preenche o arquivo, o validador confere, o empacotador junta o mapa offline e as fotos, e o pacote é importado no app.

Todo o desenvolvimento roda em containers Podman via `./dev.sh`. Nada é instalado no host.

## Fluxo de uma viagem nova

1. Peça a um agente de IA para preencher `viagens/<slug>/viagem.json`, seguindo o guia [viagens/COMO-PREENCHER.md](viagens/COMO-PREENCHER.md).
2. Confira o arquivo com `./dev.sh validar viagens/<slug>`. O validador aponta o caminho de cada erro.
3. Gere o pacote com `./dev.sh pacote <slug>`. Ele cria o `<slug>.viagem.zip` com o mapa offline e as fotos.
4. Envie o zip para o celular e importe no app em **Minhas viagens → Importar**.

## Comandos

| Comando | O que faz |
|---|---|
| `./dev.sh dev` | App no navegador em http://localhost:5173 |
| `./dev.sh test` | Testes (vitest) |
| `./dev.sh apk` | Gera o `viagem-debug.apk` |
| `./dev.sh emulador` / `instalar` | Liga o emulador Android (tela em http://localhost:6080/vnc.html) e instala o APK nele |
| `./dev.sh celular IP:PORTA [--viagem]` | Instala no celular pela Depuração sem fio (o celular precisa estar pareado) |
| `./dev.sh icones` | Regera os ícones e o splash a partir de `assets/logo/*.svg` |
| `./dev.sh gh …` / `push` | GitHub CLI em container / `git push` com as tags |

Na primeira vez, gere as imagens: `./dev.sh imagem`, `imagem-android`, `imagem-emulador`, `imagem-novnc` e `imagem-gh`.

## Documentação

- [CHANGELOG.md](CHANGELOG.md): versões. A versão vem do `package.json` e cada release tem uma tag `vX.Y.Z`.
- [SEGURANCA.md](SEGURANCA.md): análise de segurança.
- [specs/001-app-viagem-offline/](specs/001-app-viagem-offline/): PRD, plano e tarefas (spec-kit).
