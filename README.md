# Holambra 14–15/11 — PWA offline

```bash
npm install
npm run tiles      # baixa os tiles do OSM para public/tiles (uma vez, ~alguns minutos)
npm run build      # gera dist/ com o service worker pré-cacheando tudo (inclusive os tiles)
npm run preview    # testa no celular pela rede local
```

Antes de rodar `npm run tiles`, troque `SEU_EMAIL_AQUI` no User-Agent de `scripts/baixar-tiles.mjs`.
Publique a pasta `dist/` em qualquer hospedagem estática com HTTPS (Netlify, GitHub Pages, Vercel),
abra uma vez no celular com internet e use "Adicionar à tela inicial".

A primeira versão (HTML único) ficou em `legacy/index-v1.html`.

## Com Podman (sem instalar Node)

```bash
./dev.sh imagem    # cria a imagem holambra-dev (node:22-alpine + dependências)
./dev.sh dev       # servidor de desenvolvimento em http://localhost:5173
./dev.sh tiles     # baixa os tiles para public/tiles
./dev.sh preview   # build de produção + preview em http://localhost:4173 (testa o offline)
./dev.sh install   # após mudar o package.json
./dev.sh shell     # terminal dentro do container
```

## VS Code (Dev Container)

Com a extensão **Dev Containers** e `"dev.containers.dockerPath": "podman"` nas configurações,
abra a pasta e use **"Reopen in Container"**. O `npm install` roda sozinho; depois, no terminal
integrado: `npm run dev -- --host` (porta 5173).
