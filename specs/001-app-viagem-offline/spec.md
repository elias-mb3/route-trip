# Feature Specification: App de Viagem Offline, Genérico e Configurável por IA

**Feature Branch**: `001-app-viagem-offline`

**Created**: 2026-11-06

**Status**: Draft

**Input**: User description: "Portar o app de viagem para Android da maneira mais simples, desenvolvendo e simulando tudo no computador e instalando via APK. App pessoal, sem clientes. Leve, funcionar offline, genérico para outras viagens, configurável por IA (agentes como o Claude Code preenchem um JSON que é importado no app) e editável pela interface. Entrega hoje; primeira viagem: Holambra, 14–15/11/2026."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar a viagem sem internet no celular (Priority: P1)

O viajante abre o app no celular em modo avião e vê o roteiro dia a dia (horários, paradas,
observações, horário de funcionamento), o detalhe de cada parada com foto, o mapa da região
com as paradas marcadas, o checklist e o orçamento.

**Why this priority**: É o motivo do app existir: a viagem a Holambra tem sinal ruim. Sozinha
já entrega valor, com a viagem de Holambra embutida.

**Independent Test**: Instalar o app, ativar o modo avião, fechar e reabrir o app e navegar por
todas as telas; nada pode ficar em branco ou cinza dentro da área da viagem.

**Acceptance Scenarios**:

1. **Given** o app instalado com uma viagem ativa e o celular em modo avião, **When** o usuário abre o app, **Then** o roteiro do dia atual (ou do primeiro dia, antes da viagem) aparece em até 2 s.
2. **Given** o mapa aberto offline, **When** o usuário arrasta e dá zoom dentro da área da viagem, **Then** o fundo do mapa aparece sem áreas cinzas e as paradas ficam marcadas.
3. **Given** uma parada com endereço ou coordenadas, **When** o usuário toca em "Ir" sem internet, **Then** o app avisa que é preciso internet e não trava.

---

### User Story 2 - Criar uma viagem com IA e importar no app (Priority: P1)

O usuário pede a um agente de IA que monte uma viagem. O agente escreve um arquivo de viagem
seguindo um formato documentado e roda um validador que aponta erros de forma corrigível.
Uma ferramenta no computador transforma o arquivo num pacote com mapa offline e fotos.
O usuário envia o pacote ao celular e importa no app.

**Why this priority**: É o que torna o app reutilizável em outras viagens, que é o objetivo
declarado.

**Independent Test**: A partir de uma descrição de viagem fictícia, um agente gera o arquivo,
o validador passa, o pacote é gerado e importado no app (no navegador do PC e no celular), e
a viagem aparece completa offline.

**Acceptance Scenarios**:

1. **Given** um arquivo de viagem válido, **When** o usuário o importa, **Then** a viagem aparece na lista "Minhas viagens" e pode ser ativada.
2. **Given** um arquivo inválido (campo obrigatório ausente, hora fora do padrão, id duplicado), **When** o validador ou o app o processa, **Then** a mensagem aponta o campo e o motivo, e nenhum dado existente é alterado.
3. **Given** uma viagem já importada com paradas marcadas como feitas e gastos lançados, **When** o usuário importa uma versão corrigida da mesma viagem, **Then** o conteúdo é atualizado e as marcações e os gastos das paradas que continuam existindo são preservados.
4. **Given** apenas o arquivo de dados, sem pacote de mapa e fotos, **When** importado, **Then** a viagem funciona, com o mapa mostrando os marcadores sobre um fundo neutro e as paradas sem foto usando um degradê.

---

### User Story 3 - Editar a viagem pela interface (Priority: P2)

Durante o planejamento ou a viagem, o usuário cria, edita, reordena e remove dias, paradas,
itens de checklist, caixinhas de orçamento e gastos direto no app, e pode exportar a viagem
editada no mesmo formato do arquivo de entrada para a IA continuar o trabalho.

**Why this priority**: Os planos mudam durante a viagem, e a edição fecha o ciclo entre IA e
usuário. O app continua útil sem ela (P1), por isso é P2.

**Independent Test**: Editar uma parada e um gasto offline, fechar o app, reabrir e conferir;
exportar, reimportar o arquivo exportado num app limpo e obter a mesma viagem.

**Acceptance Scenarios**:

1. **Given** uma viagem ativa, **When** o usuário altera o horário de uma parada, **Then** o roteiro é reordenado por horário e a alteração persiste após reiniciar o celular.
2. **Given** uma viagem editada, **When** o usuário exporta, **Then** o arquivo gerado passa no validador e, ao ser reimportado, reproduz a viagem sem perdas.
3. **Given** uma nova viagem criada do zero pela interface, **When** o usuário adiciona um dia e uma parada, **Then** ela funciona como uma importada.

---

### User Story 4 - Controlar o orçamento por caixinhas (Priority: P2)

O usuário vê as caixinhas de orçamento (limite, gasto, saldo) e lança gastos ligados a uma
caixinha e a um dia, offline.

**Why this priority**: Já existe e é usado, mas é secundário ao roteiro.

**Independent Test**: Lançar 3 gastos em caixinhas diferentes offline e conferir os totais e
o saldo.

**Acceptance Scenarios**:

1. **Given** uma caixinha com limite de R$ 400, **When** são lançados R$ 450 de gastos nela, **Then** ela mostra "Passou R$ 50" em destaque.

---

### User Story 5 - Instalar e atualizar o app no Android sem perder dados (Priority: P1)

O usuário gera o instalador no computador (sem instalar ferramentas na máquina) e o instala no
celular. Versões novas instalam por cima, preservando viagens e edições.

**Why this priority**: Sem isso o app não chega ao celular.

**Independent Test**: Instalar a versão 1, importar uma viagem, instalar a versão 2 por cima e
conferir que a viagem continua lá.

**Acceptance Scenarios**:

1. **Given** um computador só com o gerenciador de containers, **When** o usuário roda um único comando de build, **Then** o instalador é gerado.
2. **Given** o app instalado com dados, **When** uma versão nova é instalada por cima, **Then** todos os dados permanecem.

---

### Edge Cases

- Importar uma viagem cujo `id` já existe → atualizar, preservando o estado do usuário (ver US2-3).
- Paradas sem horário ou sem coordenadas → aparecem no roteiro; ficam fora do mapa e sem "Ir".
- Viagem com 1 dia ou com 10+ dias, ou dias sem paradas → layout funciona.
- Pacote muito grande (área de mapa extensa) → o empacotador avisa o tamanho e recusa acima do limite configurado (padrão 50 MB).
- Arquivo de formato futuro (versão do formato maior que a suportada) → recusar com uma mensagem clara.
- Armazenamento cheio ao importar → falha sem deixar a viagem pela metade.
- Botão voltar do Android → volta de tela; na tela inicial, minimiza.
- Data do celular fora do período da viagem → mostrar o primeiro dia (antes) ou o último (depois).

## Requirements *(mandatory)*

### Functional Requirements

**Consulta offline**
- **FR-001**: O app MUST exibir roteiro por dia, detalhe da parada, mapa, checklist e orçamento sem conexão de rede.
- **FR-002**: O app MUST indicar quais ações dependem de internet (abrir rota no Google Maps/Waze, links externos).
- **FR-003**: O mapa MUST usar imagens de mapa locais do pacote da viagem, restritas à área e aos níveis de zoom empacotados.

**Formato e importação**
- **FR-010**: Toda viagem MUST ser descrita por um arquivo de dados com formato versionado e documentado por schema formal: metadados (id, título, fuso, moeda, cores), dias (data, rótulo, cor), paradas (id, hora, nome, categoria, observações, funcionamento, localização, foto, links, fontes), checklist por seções, caixinhas de orçamento e notas.
- **FR-011**: MUST existir um validador de linha de comando com mensagens que indiquem o caminho do campo e o motivo do erro.
- **FR-012**: MUST existir um guia de preenchimento para agentes de IA (regras: não inventar dados sem fonte, ids estáveis, registrar pendências).
- **FR-013**: MUST existir uma ferramenta que gere um pacote único (dados + mapa offline + fotos otimizadas) a partir do arquivo de dados.
- **FR-014**: O app MUST importar tanto o pacote quanto o arquivo de dados avulso, validando antes de gravar, de forma atômica.
- **FR-015**: O app MUST manter várias viagens e permitir escolher a ativa e apagar viagens.
- **FR-016**: O estado do usuário (paradas feitas, checklist marcado, gastos, notas, fotos próprias) MUST ser guardado separado do conteúdo e preservado na reimportação.

**Edição**
- **FR-020**: O usuário MUST poder criar, editar e remover viagem, dias, paradas, seções e itens de checklist, caixinhas e gastos pela interface.
- **FR-021**: O usuário MUST poder exportar a viagem (conteúdo e, opcionalmente, o estado) no mesmo formato aceito pela importação.
- **FR-022**: O usuário MUST poder trocar a foto de uma parada por uma da câmera ou da galeria.

**Plataforma**
- **FR-030**: O mesmo app MUST rodar no navegador do computador para desenvolvimento e simulação, e como app Android instalável.
- **FR-031**: Todas as ferramentas de build MUST rodar em containers, sem instalar nada no host.
- **FR-032**: Atualizações do app MUST preservar os dados (assinatura estável).
- **FR-033**: A viagem de Holambra MUST vir como exemplo e passar no validador.

### Key Entities

- **Viagem**: id estável, título, subtítulo, fuso, moeda, cores, versão do formato; contém dias, checklist, orçamento e notas.
- **Dia**: id, data, rótulo, cor; lista ordenada de paradas.
- **Parada**: id estável, hora, nome, categoria, observações, funcionamento, localização (lat/lng/endereço), foto (arquivo, crédito), links, fontes.
- **Seção de checklist / Item**: título; texto do item.
- **Caixinha**: id, nome, ícone, cor, limite.
- **Gasto**: descrição, caixinha, valor, dia (ou "antes"), forma de pagamento, pago. Pertence ao estado do usuário.
- **Pacote de viagem**: arquivo de dados + imagens do mapa + fotos.
- **Estado do usuário**: por viagem; paradas feitas, itens marcados, gastos, notas, fotos próprias.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em modo avião, 100% das telas abrem com conteúdo; abertura a frio em ≤ 2 s no Galaxy A35.
- **SC-002**: Um agente de IA, só com o guia e o validador, produz um arquivo de viagem válido de 2 dias em uma sessão, sem intervenção manual no formato.
- **SC-003**: Ida e volta (exportar → importar) reproduz 100% do conteúdo e do estado.
- **SC-004**: Instalador ≤ 15 MB sem viagens; pacote de Holambra ≤ 10 MB.
- **SC-005**: Do arquivo de dados ao app no celular em ≤ 5 minutos (validar, empacotar, enviar, importar).
- **SC-006**: Nenhuma ferramenta instalada no host além do gerenciador de containers já existente.

## Assumptions

- Uso pessoal em um ou dois celulares Android (Galaxy A35, Android 14+); sem iOS, loja, contas ou sincronização entre aparelhos.
- Sem login nem criptografia: o celular já tem bloqueio de tela (decisão padrão; os dados da versão PWA não são migrados, porque o orçamento ainda estava vazio).
- O orçamento continua: caixinhas definidas no arquivo de dados; gastos lançados no app.
- Imagens de mapa vêm do OpenStreetMap, baixadas uma vez no computador com uso educado do serviço.
- Instalação do APK por transferência direta (Quick Share/cabo) ou por depuração sem fio.
- O app atual (React, telas prontas) é a base; a versão PWA deixa de ser alvo principal.
