<!--
Sync Impact Report
- Version: 1.0.0 → 1.1.0 (MINOR: princípio VI Dados Cifrados em Repouso)
- Princípios adicionados: I Offline-First, II Leve, III Genérico, IV Configurável por IA, V Editável pela Interface
- Seções adicionadas: Restrições Técnicas, Fluxo de Desenvolvimento
- TODOs: nenhum
-->
# Viagem App Constitution

## Core Principles

### I. Offline-First (INEGOCIÁVEL)
Depois de instalado e com uma viagem importada, o app MUST funcionar 100% sem internet:
roteiro, mapa (tiles locais), fotos, checklist, orçamento e edição. Nenhuma tela pode depender
de rede para renderizar. Recursos online (links para Google Maps/Waze, sites) MUST ser
sinalizados como "precisa de internet" e falhar sem quebrar o app. Sem backend, sem CDN,
sem fontes remotas, sem analytics.

### II. Leve
APK alvo ≤ 15 MB sem viagens; bundle JS inicial ≤ 500 KB (minificado). Cada dependência nova
MUST justificar seu peso; preferir APIs da plataforma. Abertura a frio no Galaxy A35 ≤ 2 s.
Tiles e fotos pertencem ao pacote da viagem, nunca ao APK.

### III. Genérico
Nenhum dado de uma viagem específica (nomes, datas, coordenadas, cores, categorias) pode estar
fixo no código. Toda viagem é descrita por um `viagem.json` versionado por schema. Número de
dias, paradas, seções de checklist e caixinhas de orçamento são variáveis. O app MUST suportar
várias viagens instaladas e uma ativa.

### IV. Configurável por IA
O formato da viagem MUST ser um JSON documentado por JSON Schema (`viagem.schema.json`),
com guia para agentes (`viagens/COMO-PREENCHER.md`) e validação por linha de comando
(`npm run validar`) com mensagens que um agente consiga corrigir sozinho. Importar um JSON
inválido MUST mostrar o erro e nunca corromper dados existentes.

### V. Editável pela Interface
Tudo que o JSON define MUST poder ser criado, editado e removido pela interface (viagem, dias,
paradas, checklist, caixinhas, gastos). O app MUST exportar a viagem editada no mesmo formato do
JSON de entrada (ida e volta sem perda), para que a IA possa continuar editando.

### VI. Dados Cifrados em Repouso
Sem login, mas todo dado da viagem gravado no aparelho (conteúdo, estado, gastos, notas, fotos,
tiles) MUST estar cifrado com AES-256-GCM. A chave de dados é gerada no primeiro uso e guardada
apenas no Android Keystore (hardware, nunca em texto no armazenamento do app). Backup automático
do Android MUST ficar desligado. Arquivos exportados para a IA saem em texto puro só por ação
explícita do usuário, com aviso. Motivo: um app malicioso ou extração do armazenamento não pode
ler a viagem.

## Restrições Técnicas

- Stack: React + TypeScript + Vite + Tailwind + Leaflet, empacotado como APK com Capacitor.
  O mesmo build roda no navegador para desenvolvimento e simulação.
- Persistência local (IndexedDB e, no Android, Filesystem do Capacitor).
- Ferramentas de desenvolvimento (Node, JDK, Android SDK, Python) rodam **somente em
  containers Podman**; nada é instalado na máquina host.
- Uso pessoal: sem Play Store, sem contas, sem login (proteção pelos dados cifrados, princípio VI). APK assinado com chave persistida fora
  do repositório.
- Idioma pt-BR; fuso e moeda definidos por viagem.

## Fluxo de Desenvolvimento

- Spec-kit: constitution → spec → plan → tasks → implement, artefatos em `specs/`.
- Desenvolvimento e testes no navegador (viewport 384×832) com Playwright; o celular real
  entra só para validar o APK.
- Gate de cada entrega: `npm run build` sem erros, `npm run validar` passando nos exemplos,
  smoke test Playwright offline, APK gerado.

## Governance

Esta constituição prevalece sobre outras práticas do projeto. Emendas exigem atualizar este
arquivo com versão semântica (MAJOR remove/redefine princípio, MINOR adiciona, PATCH esclarece)
e registrar o motivo no Sync Impact Report. Todo plano (`/speckit-plan`) MUST passar pelo
Constitution Check; violações exigem justificativa na tabela de complexidade.

**Version**: 1.1.0 | **Ratified**: 2026-11-06 | **Last Amended**: 2026-11-06
