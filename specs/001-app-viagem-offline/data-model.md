# Data Model

Duas camadas por viagem: **Conteúdo** (vem do JSON, editável, exportável) e **Estado do usuário** (marcações e gastos; nunca sobrescrito por importação).

## Conteúdo — `Viagem` (formato 1)
| Campo | Tipo | Regra |
|---|---|---|
| formato | `1` | obrigatório; > suportado → recusa |
| id | string slug `^[a-z0-9-]+$` | obrigatório, estável |
| titulo | string 1–60 | obrigatório |
| subtitulo | string | opcional |
| fuso | IANA tz | padrão `America/Sao_Paulo` |
| moeda | ISO 4217 | padrão `BRL` |
| cores.tema | `#RRGGBB` | padrão `#E8613C` |
| dias | `Dia[]` ≥ 1 | datas crescentes, sem repetir |
| checklist | `SecaoChecklist[]` | opcional |
| orcamento.caixinhas | `Caixinha[]` | opcional |
| mapa | `{bbox:[oeste,sul,leste,norte], zooms:[min,max]}` | opcional; o empacotador calcula |
| contatos | `{nome, telefone?, obs?}[]` | opcional |
| notas | string (markdown simples) | opcional |
| pendencias | string[] | opcional; dúvidas do agente |

**Dia**: `id` (único na viagem), `data` `YYYY-MM-DD`, `rotulo`, `cor?`, `paradas: Parada[]`.

**Parada**: `id` (único na viagem), `hora?` `HH:MM`, `nome`, `categoria` (`refeicao|passeio|transporte|hospedagem|compras|outro`), `obs?`, `funcionamento?`, `local?` `{lat, lng, endereco?}`, `foto?` `{arquivo?, url?, credito?}`, `links?` `{rotulo,url}[]`, `fontes?` url[].
Ordenação: por `hora` (sem hora → ao fim, na ordem do arquivo).

**SecaoChecklist**: `id`, `titulo`, `itens: {id, texto}[]` (ids gerados pelo app se ausentes no JSON: `<secao>-<n>`).

**Caixinha**: `id`, `nome`, `icone` (conjunto fixo do app; desconhecido → `extras`), `cor`, `limite ≥ 0`.

## Estado do usuário — `EstadoViagem` (chave `estado:<viagemId>`)
| Campo | Tipo |
|---|---|
| feitas | `Record<paradaId, true>` |
| checklist | `Record<itemId, true>` |
| despesas | `Despesa[]` — `{id, descricao, caixinha, valor, dia: diaId \| 'antes', pagamento, pago}` |
| notas | `Record<paradaId, string>` |
| fotos | `Record<paradaId, Blob>` (foto própria tem prioridade) |

## Armazenamento (IndexedDB)
- `viagens:indice` → `{id, titulo, dataInicio, atualizadaEm}[]`; `viagens:ativa` → id
- `viagem:<id>` → Viagem (conteúdo atual, inclusive edições)
- `estado:<id>` → EstadoViagem
- `pkg:<id>:tiles/z/x/y.png`, `pkg:<id>:fotos/<arq>` → Blob

## Criptografia
- Todo valor acima é gravado como `{v:1, iv: Uint8Array(12), dados: ArrayBuffer}` (AES-256-GCM). Chaves do IndexedDB (nomes) não contêm dados sensíveis.
- Chave de dados: Android Keystore (`segredo:chave-dados`); só em memória enquanto o app roda.
- Perder a chave (desinstalar/limpar dados) = dados ilegíveis; recuperação é reimportar o pacote.

## Transições
- **Importar** (id novo): valida → grava blobs → grava `viagem:<id>` → atualiza índice (última escrita; falha antes dela = nada visível).
- **Reimportar** (id existente): substitui conteúdo e pacote; estado preservado; referências a ids removidos são ignoradas na leitura (e limpas ao exportar).
- **Editar**: altera `viagem:<id>`; valida com o mesmo schema antes de salvar.
- **Exportar**: `viagem.json` (conteúdo) + opcional `estado.json`; zip inclui fotos/tiles.
- **Apagar**: remove `viagem:`, `estado:`, `pkg:<id>:*` e entrada do índice.
