# Implementation Plan: App de Viagem Offline, Genérico e Configurável por IA

**Branch**: `001-app-viagem-offline` | **Date**: 2026-11-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-app-viagem-offline/spec.md`

## Summary

Transformar o PWA de Holambra num app Android (Capacitor) que lê viagens de um `viagem.json`
validado por schema zod, importa pacotes `.viagem.zip` (dados + tiles + fotos) para o IndexedDB,
permite editar tudo pela interface e exportar no mesmo formato. Todo o tooling roda em
containers; desenvolvimento e simulação no Chrome; APK no fim. Entrega: hoje (2026-11-06).

## Technical Context

**Language/Version**: TypeScript 5.6, Node 22 (só em container)

**Primary Dependencies**: React 18, Vite 5, Tailwind 3, Leaflet/react-leaflet, idb-keyval, lucide-react; novas: Capacitor 8.6 (core, android, cli, app, app-launcher, filesystem, share), `fflate` 0.8, `zod` 4; dev: `vitest`, `sharp` (só container)

**Storage**: IndexedDB (conteúdo, estado, blobs de tiles/fotos)

**Testing**: Vitest (formato, validador, merge, import/export), Playwright MCP (smoke 384×832 offline), checklist manual no A35

**Target Platform**: Android 14+ (Galaxy A35) via WebView; Chrome desktop para simulação

**Project Type**: mobile-app (web empacotado) + CLI de validação/empacotamento

**Performance Goals**: abertura a frio ≤ 2 s; importar pacote de 10 MB ≤ 10 s

**Constraints**: 100% offline; APK ≤ 15 MB; JS inicial ≤ 500 KB; nada instalado no host

**Scale/Scope**: 1 usuário, poucas viagens, ~2–15 dias, ~5–15 paradas/dia; ~10 telas

## Constitution Check

| Princípio | Como o plano cumpre | Status |
|---|---|---|
| I Offline-First | Tiles/fotos em IndexedDB, sem SW/rede no APK, links externos sinalizados | ✅ |
| II Leve | +fflate (8 KB) e zod (import dinâmico); remove criptografia e login | ✅ |
| III Genérico | `src/data/roteiro.ts` sai; Holambra vira `viagens/holambra/viagem.json`; dias N | ✅ |
| IV Configurável por IA | zod → JSON Schema, `COMO-PREENCHER.md`, `./dev.sh validar` | ✅ |
| V Editável pela UI | Formulários para viagem/dia/parada/checklist/caixinha; exportar ida-e-volta | ✅ |
| Containers only | `dev.sh` + `Containerfile.android` | ✅ |

Re-check pós-design: sem violações. Complexity Tracking vazio.

## Project Structure

### Documentation (this feature)

```text
specs/001-app-viagem-offline/
├── plan.md  research.md  data-model.md  quickstart.md
├── contracts/ (viagem-json.md, cli.md)
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── formato/            # viagem.ts (zod), validar.ts, migracao (Holambra legado)
├── viagens/            # repositorio.ts (IndexedDB), importar.ts, exportar.ts, pacote.ts (fflate)
├── estado.tsx          # ViagemContext: viagem ativa + EstadoViagem
├── nativo/             # plataforma.ts (Capacitor: voltar, abrir link, compartilhar arquivo)
├── components/         # existentes + TileLayerIDB, formulários de edição
├── pages/              # Itinerario, Parada, Mapa, Checklist, Orcamento + MinhasViagens, EditarParada, EditarViagem
└── lib/                # geo, datas (genéricas)
scripts/
├── validar.mjs  pacote.mjs  schema.mjs  baixar-tiles.mjs (reaproveitado)
viagens/
├── COMO-PREENCHER.md  viagem.schema.json
└── holambra/viagem.json (+ fotos/)
tests/                  # vitest: formato, import/export, merge de estado
android/                # gerado por `cap add android`
Containerfile.android   dev.sh
```

**Structure Decision**: projeto único (web + Capacitor). Removidos: `src/data/*`, `Login.tsx`, `cripto.ts`, `acesso.ts`, `backup.ts` (substituído por exportar viagem), `definir-senha.mjs`.

## Ordem de execução (hoje)

1. **Bloco A — Fundação (≈1,5 h)**: formato zod + validador CLI + holambra.json + testes.
2. **Bloco B — App genérico (≈2 h)**: repositório IndexedDB, ViagemContext, telas lendo a viagem ativa, remover login. Holambra embutida como viagem de exemplo no primeiro uso.
3. **Bloco C — Importar/Exportar (≈1,5 h)**: Minhas viagens, pacote zip, TileLayer IDB.
4. **Bloco D — Edição (≈1,5 h)**: formulários de viagem/dia/parada/checklist/caixinha.
5. **Bloco E — Android (≈1,5 h, paralelo ao C/D)**: Containerfile.android, Capacitor, adaptações nativas, APK.
6. **Bloco F — Validação (≈1 h)**: quickstart completo, APK no A35.

Cada bloco termina com build verde e commit. Se o tempo estourar, D é o corte (P2): o app sai com consulta + importação, e a edição vem depois.

## Complexity Tracking

Sem violações.
