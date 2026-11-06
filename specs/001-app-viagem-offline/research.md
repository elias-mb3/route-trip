# Research: App de Viagem Offline

Versões consultadas no npm em 2026-11-06 (container `node:22-slim`).

## R1. Empacotamento Android
- **Decision**: Capacitor 8.6 (`@capacitor/core`, `@capacitor/android`, `@capacitor/cli`) sobre o React/Vite existente.
- **Rationale**: reaproveita 100% das telas; WebView Chromium = mesma engine da simulação no Chrome; APK pequeno.
- **Alternatives**: Kotlin/Compose ou React Native (reescrita, inviável hoje); TWA/PWA instalado (depende de HTTPS hospedado e cache do navegador, que o Android pode limpar).
- **Requisitos a confirmar em T003 (context7/docs Capacitor 8)**: JDK 21, `compileSdk`/`targetSdk` 36, `minSdk` 24, Node ≥ 22.

## R2. Build sem instalar nada no host
- **Decision**: `Containerfile.android` em base Debian/glibc (ex.: `eclipse-temurin:21-jdk` ou `node:22-bookworm` + JDK, tag verificada no registry na hora) + Android cmdline-tools; volumes nomeados para `~/.gradle` e `~/.android`; keystore em `~/.android-keys` montada `:Z`.
- **Rationale**: `aapt2` não roda em musl (Alpine); cache do Gradle evita baixar ~1 GB por build.
- **Alternatives**: Android Studio Flatpak (instala no host — viola constituição).

## R3. Pacote da viagem
- **Decision**: `.viagem.zip` (`viagem.json` + `tiles/{z}/{x}/{y}.png` + `fotos/*.webp`), lido no app com `fflate` 0.8 (~8 KB gz, `unzipSync`).
- **Rationale**: o agente de IA só escreve texto; o script faz download e otimização de forma reproduzível; um arquivo só para enviar pelo Quick Share.
- **Alternatives**: imagens em base64 dentro do JSON (infla 33 %, ilegível para o agente); JSZip (mais pesado).

## R4. Armazenamento no app
- **Decision**: conteúdo e estado em IndexedDB (`idb-keyval`, já usado). Tiles e fotos como Blobs no IndexedDB, chave `pkg:<viagemId>:<caminho>`, servidos ao Leaflet por um `TileLayer` customizado (`createTile` → `URL.createObjectURL`).
- **Rationale**: o mesmo código roda no navegador (simulação) e no APK; WebView do Capacitor não sofre limpeza de storage como navegador; ~350 tiles = ~4 MB, trivial para IndexedDB.
- **Alternatives**: `@capacitor/filesystem` + `convertFileSrc` (dois caminhos de código; fica como otimização futura se pacotes passarem de ~100 MB).

## R5. Validação
- **Decision**: `zod` 4 como fonte única do formato; `z.toJSONSchema()` gera `viagem.schema.json`; o mesmo módulo é usado pelo app (import) e pelo CLI (`npm run validar`). Checagens semânticas extras (ids únicos, hora `HH:MM`, datas dentro do período, coordenadas dentro do bbox) via `superRefine`.
- **Rationale**: uma definição, dois consumidores, mensagens com caminho do campo (`dias[0].paradas[2].hora`).
- **Alternatives**: ajv + schema escrito à mão (duplicação com tipos TS).
- **Peso**: zod 4 entra no bundle só na tela de importar (import dinâmico) para respeitar o princípio II.

## R6. Tiles e fotos
- **Decision**: reaproveitar `scripts/baixar-tiles.mjs` (OSM, sequencial, ~200 ms, User-Agent de contato já aprovado); bbox = paradas + margem de 1 km, zoom 14–16 (padrão), limite 50 MB. Fotos: baixar `foto.url` e converter para webp 720 px com `sharp` (só no container de dev).
- **Alternatives**: MBTiles/vector tiles (mais leve em área grande, mas exige renderizador — complexidade desnecessária).

## R7. Sem login, com criptografia em repouso
- **Decision**: remover login (`Login.tsx`, `acesso.ts`, `definir-senha.mjs`, PBKDF2). Manter AES-256-GCM via WebCrypto (`cripto.ts`/`storage.ts` reaproveitados): toda chave do IndexedDB (`viagem:`, `estado:`, `pkg:`) guarda `{iv, dados}` cifrado. A chave de dados (32 bytes aleatórios) é gerada no 1º uso e guardada no **Android Keystore** via `@aparajita/capacitor-secure-storage` 8.0.1; na abertura é lida e importada como `CryptoKey` não extraível só em memória. No navegador (dev) o fallback é uma CryptoKey não extraível no IndexedDB, marcada como "modo dev".
- **Rationale**: o sandbox do Android já isola apps sem root; a cifra protege contra root/malware com acesso ao armazenamento, backup adb e extração física. Sem senha, nada para o usuário lembrar.
- **Também**: `android:allowBackup="false"` e `fullBackupContent=false` no manifest; export em texto puro só com confirmação; opção de export cifrado (mesma chave não serve fora do aparelho → export cifrado usa senha digitada na hora, PBKDF2 já existente).
- **Custo**: AES-GCM em ~350 tiles de ~12 KB é < 1 s no A35; tiles decifrados sob demanda.
- **Alternatives**: SQLCipher (plugin pesado, troca o storage); só confiar no sandbox (usuário pediu cifra); chave derivada de PIN (volta a ser login).

## R8. Adaptações de WebView
- **Decision**: `@capacitor/app` (botão voltar), `@capacitor/app-launcher` (Maps/Waze), `@capacitor/filesystem` + `@capacitor/share` (exportar), `<input type=file accept>` para importar e foto (plano B: `@capacitor/camera` 8.2), `@capacitor/assets` 4.0 para ícone/splash. Sem service worker no build Android.

## R9. Testes
- **Decision**: Vitest para schema/validador/merge de estado (rodando no devcontainer); Playwright MCP para smoke em 384×832 com rede bloqueada; checklist manual no A35.
