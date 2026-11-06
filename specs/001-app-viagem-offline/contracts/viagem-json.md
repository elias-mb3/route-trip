# Contrato: arquivo de viagem (`viagem.json`, formato 1)

Fonte da verdade: `src/formato/viagem.ts` (zod). Gerado: `viagens/viagem.schema.json`. Campos em [data-model.md](../data-model.md).

Exemplo mínimo válido:
```json
{
  "formato": 1,
  "id": "exemplo-2026",
  "titulo": "Exemplo",
  "dias": [
    { "id": "d1", "data": "2026-12-01", "rotulo": "Terça",
      "paradas": [ { "id": "p1", "hora": "09:00", "nome": "Café", "categoria": "refeicao" } ] }
  ]
}
```

Garantias:
- Exportar → importar é identidade (ordem de chaves livre).
- Campos desconhecidos são rejeitados (`strict`) para pegar erros de digitação do agente.
- Erro: `{ caminho: "dias[0].paradas[2].hora", mensagem: "use HH:MM (ex.: 09:30)" }`.

# Contrato: pacote (`<slug>.viagem.zip`)
```
viagem.json            obrigatório
fotos/<arquivo>.webp   referenciado por parada.foto.arquivo
tiles/<z>/<x>/<y>.png  dentro de mapa.bbox/zooms
```
