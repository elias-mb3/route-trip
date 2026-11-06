# Contrato: comandos (sempre via container, `./dev.sh <cmd>`)

| Comando | Entrada | Saída | Exit |
|---|---|---|---|
| `validar <dir-ou-json>` | `viagens/<slug>/viagem.json` | erros `caminho: mensagem` (1 por linha) ou `OK <titulo>: N dias, M paradas` | 0 ok / 1 inválido |
| `pacote <slug> [--zooms 14-16] [--max-mb 50]` | `viagens/<slug>/` | `viagens/<slug>.viagem.zip` + resumo (tiles, fotos, MB) | 0 / 1 |
| `schema` | — | `viagens/viagem.schema.json` | 0 |
| `apk` | código | `./viagem-debug.apk` | 0 / 1 |
| `adb <args>` | — | repassa ao adb (rede do host) | do adb |
| `dev` | — | servidor em `http://localhost:5173` | — |
