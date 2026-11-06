# Changelog

Versão única em `package.json` (o APK lê dela: `versionCode = MAJOR*10000 + MINOR*100 + PATCH`).
Cada release vira uma tag git `vX.Y.Z`. As releases sobem (1.1, 1.2, …) até a **Demo**, que é
uma release com número normal e nome "Demo" na tag e aqui.

Para lançar: subir `version` em `package.json` (e nas linhas 3 e 9 de `package-lock.json`),
registrar aqui, `./dev.sh apk`, commit e `git tag -a vX.Y.Z`.

## [1.2.0] - 2026-11-06

- Holambra: removidos itens pessoais (observação do hotel, 2 itens do
  checklist e a caixinha). Ficam só os lugares do roteiro.
- Ícone de caixinha renomeado para `especial` (formato genérico).
- `./dev.sh celular IP:PORTA [--viagem]`: instala no celular pela Depuração sem fio.

## [1.1.0] - 2026-11-06 — Segurança antes do ADB no A35

Relatório completo em [SEGURANCA.md](SEGURANCA.md).

- **Chave de dados vazava no logcat**: o Capacitor (build debug) logava o retorno do
  SecureStorage. Corrigido com `loggingBehavior: 'none'`; verificado que o log não tem mais a chave.
- **Sem permissão INTERNET**: o app não consegue enviar dados para fora. Links continuam
  abrindo no Maps, no Waze e no navegador.
- **Links só http(s)**: o schema e o `abrirExterno` recusam `javascript:`, `intent:`, `file:` etc.
  Um teste novo cobre isso.
- **Servidores de dev só em 127.0.0.1**: Vite dev/preview e noVNC (antes o emulador ficava
  controlável por qualquer um na rede local, sem senha).
- Versão aparece no app (rodapé de "Minhas viagens") e no APK (`versionName`).

## [1.0.0] - 2026-11-06

- App genérico lido de `viagem.json` (schema zod, validador, empacotador, guia para IA).
- Dados cifrados em repouso (AES-256-GCM, chave no Android Keystore), backup desligado.
- Importar/exportar, Minhas viagens, edição de paradas, checklist e orçamento.
- APK via Capacitor em container; emulador no PC via noVNC.
