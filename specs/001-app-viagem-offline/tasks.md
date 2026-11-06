# Tasks: App de Viagem Offline, Genérico e Configurável por IA

**Input**: Design documents from `/specs/001-app-viagem-offline/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Vitest para formato/import/export (pedidos pela constituição: validador confiável para IA); Playwright smoke no fim.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência)
- Todo comando Node/Gradle roda via `./dev.sh` (container). Nada no host.

## Phase 1: Setup

- [x] T001 Instalar deps no container: `fflate`, `zod`, `@aparajita/capacitor-secure-storage`, `@capacitor/{core,app,app-launcher,filesystem,share}`, dev `@capacitor/cli`, `vitest`, `sharp` em package.json
- [x] T002 [P] Adicionar subcomandos `validar`, `pacote`, `schema`, `test`, `apk`, `adb`, `imagem-android` em dev.sh
- [x] T003 [P] Confirmar requisitos do Capacitor 8 (JDK, compileSdk, minSdk) via context7 e tags reais da imagem base; criar Containerfile.android (Debian, JDK, cmdline-tools, licenças) com volumes de cache Gradle e keystore `~/.android-keys`
- [x] T004 [P] Script `test` (vitest) e `build:android` (`vite build --mode android`, PWA desligado) em package.json e vite.config.ts

## Phase 2: Foundational (bloqueia todas as histórias)

- [ ] T005 Definir schema zod do formato 1 (Viagem, Dia, Parada, SecaoChecklist, Caixinha) com `strict` e `superRefine` (ids únicos, HH:MM, datas crescentes) em src/formato/viagem.ts
- [ ] T006 Tipos TS derivados + `EstadoViagem` em src/formato/tipos.ts
- [ ] T007 [P] Formatar erros como `caminho: mensagem` em pt-BR em src/formato/validar.ts
- [ ] T008 [P] Testes do formato (válido mínimo, hora inválida, id duplicado, campo desconhecido, formato futuro) em tests/formato.test.ts
- [ ] T009 Converter Holambra (roteiro.ts + fotos.ts + caixinhas) para viagens/holambra/viagem.json e copiar fotos para viagens/holambra/fotos/
- [ ] T010 [P] CLI scripts/validar.mjs e scripts/schema.mjs (gera viagens/viagem.schema.json)
- [ ] T011a Cofre de chave: gerar/ler chave de dados no Android Keystore (`@aparajita/capacitor-secure-storage`), fallback dev no navegador, em src/seguranca/chave.ts
- [ ] T011b Simplificar src/lib/cripto.ts para só AES-256-GCM (`cifrar`/`decifrar` com chave em memória) + testes em tests/cripto.test.ts
- [ ] T011 Repositório IndexedDB (índice, ativa, viagem, estado, blobs `pkg:`) com escrita atômica e **todo valor cifrado** em src/viagens/repositorio.ts
- [ ] T012 ViagemContext (viagem ativa + estado + ações) substituindo src/estado.tsx; remover Login, acesso, backup, definir-senha, src/data/*
- [ ] T013 Generalizar src/lib/datas.ts e src/lib/types.ts para N dias (sem `sab|dom`); dia padrão = hoje dentro do período

**Checkpoint**: `./dev.sh validar viagens/holambra` OK; `./dev.sh test` verde.

## Phase 3: US1 — Consultar offline (P1) 🎯 MVP

**Goal**: telas lendo a viagem ativa, tudo offline. **Independent Test**: quickstart passo 4 com Holambra embutida.

- [ ] T014 [US1] Semear Holambra no primeiro uso (import do JSON embutido) em src/viagens/exemplo.ts
- [ ] T015 [P] [US1] Itinerario: abas de dias dinâmicas (cor/rotulo do JSON), ordenação por hora em src/pages/Itinerario.tsx
- [ ] T016 [P] [US1] Parada: foto (estado → pacote → degradê), links, fontes, "precisa de internet" em src/pages/Parada.tsx e src/components/Capa.tsx
- [ ] T017 [P] [US1] TileLayer que lê blobs `pkg:<id>:tiles` (fallback fundo neutro) e bbox/zooms da viagem em src/components/TileLayerIDB.tsx e src/pages/Mapa.tsx
- [ ] T018 [P] [US1] Checklist por seções dinâmicas em src/pages/Checklist.tsx
- [ ] T019 [US1] Build web sem dependências de rede; smoke Playwright offline 384×832

## Phase 4: US2 — Criar com IA e importar (P1)

**Independent Test**: quickstart passos 1–3, 6, 8.

- [ ] T020 [P] [US2] Guia para agentes (regras, exemplo, fluxo validar→pacote) em viagens/COMO-PREENCHER.md
- [ ] T021 [P] [US2] scripts/pacote.mjs: valida, calcula bbox (+1 km), baixa tiles (reusa baixar-tiles.mjs), baixa/converte fotos (sharp webp 720), limite MB, gera `<slug>.viagem.zip`
- [ ] T022 [US2] Importar `.zip`/`.json` (fflate, import dinâmico do zod, atômico, preserva estado no reimport) em src/viagens/importar.ts
- [ ] T023 [P] [US2] Testes de import (zip, json avulso, inválido não altera nada, reimport preserva estado) em tests/importar.test.ts
- [ ] T024 [US2] Tela Minhas viagens (listar, ativar, importar, apagar) + rota em src/pages/MinhasViagens.tsx e src/App.tsx

## Phase 5: US5 — APK no Android (P1)

**Independent Test**: quickstart passo 7.

- [x] T025 [US5] (adiantada na fase 1) `npx cap init` + `cap add android` (appId `br.dev.viagem.app`, nome "Viagem") em capacitor.config.ts e android/
- [ ] T026 [P] [US5] Ponte nativa: botão voltar, abrir Maps/Waze via app-launcher, salvar/compartilhar arquivo em src/nativo/plataforma.ts
- [ ] T027 [P] [US5] Ícone e splash com `@capacitor/assets` a partir de public/icons/icon-512.png; safe areas
- [ ] T027b [US5] `android:allowBackup="false"` e `fullBackupContent` em android/app/src/main/AndroidManifest.xml; teste: `adb backup`/leitura do IndexedDB não revela texto da viagem
- [ ] T028 [US5] `./dev.sh apk` gera viagem-debug.apk assinado com a keystore persistida; conferir tamanho ≤ 15 MB

## Phase 6: US3 — Editar pela interface (P2)

**Independent Test**: quickstart passo 5.

- [ ] T029 [P] [US3] Formulário de parada (criar/editar/remover, foto da câmera/galeria) em src/pages/EditarParada.tsx
- [ ] T030 [P] [US3] Editar viagem e dias (título, cores, datas, adicionar/remover dia) em src/pages/EditarViagem.tsx
- [ ] T031 [P] [US3] Edição de seções/itens do checklist em src/pages/Checklist.tsx
- [ ] T032 [US3] Exportar viagem (json ou zip com fotos/tiles, estado opcional; texto puro só após confirmação, opção cifrada com senha digitada na hora) em src/viagens/exportar.ts + botão em MinhasViagens
- [ ] T033 [P] [US3] Teste ida-e-volta exportar→importar em tests/exportar.test.ts

## Phase 7: US4 — Orçamento (P2)

- [ ] T034 [US4] Orcamento lendo caixinhas da viagem e gastos do estado; dias dinâmicos + "antes"; CRUD de caixinhas em src/pages/Orcamento.tsx

## Phase 8: Polish

- [ ] T035 [P] README: fluxo IA → validar → pacote → importar; comandos dev.sh
- [ ] T036 Rodar quickstart.md inteiro no Chrome e no A35; registrar resultado
- [ ] T037 Commit final + atualizar memória/handoff

## Dependencies

Setup → Foundational → US1 → (US2 ∥ US5) → US3 → US4 → Polish. US5 depende só de US1 (APK com Holambra embutida já é entregável). US4 pode ir junto com US3.

## Parallel Examples

- Foundational: T007, T008, T010 juntos após T005.
- US1: T015, T016, T017, T018 juntos.
- US2 ∥ US5: T020/T021/T023 em paralelo com T025–T027.

## Implementation Strategy

1. MVP = Setup + Foundational + US1 + US5 → APK com Holambra offline (garante a viagem de 14/11).
2. + US2 → genérico e configurável por IA.
3. + US3/US4 → editável. Corte se faltar tempo: US3 (P2).
