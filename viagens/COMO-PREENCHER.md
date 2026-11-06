# Como preencher uma viagem (guia para agentes de IA)

Você vai criar `viagens/<slug>/viagem.json` para o app de viagem offline. O app só mostra o que
estiver neste arquivo; o usuário importa no celular e usa **sem internet**.

## Passo a passo
1. Crie a pasta `viagens/<slug>/` (slug: minúsculas e hífen, ex.: `paraty-2027-03`).
2. Escreva `viagem.json` seguindo `viagens/viagem.schema.json` (gerado de `src/formato/viagem.ts`).
   Exemplo completo e real: `viagens/holambra/viagem.json`.
3. Rode `./dev.sh validar viagens/<slug>` e corrija até sair `OK`. Cada erro vem como
   `caminho: mensagem` (ex.: `dias[0].paradas[2].hora: use HH:MM (ex.: 09:30)`).
4. Rode `./dev.sh pacote <slug>`: baixa o mapa offline e as fotos e gera `viagens/<slug>.viagem.zip`.
5. O usuário envia o `.viagem.zip` ao celular e importa em **Minhas viagens → Importar**.

## Regras
- **Não invente.** Coordenadas, horários de funcionamento, telefones e endereços só com fonte;
  coloque as URLs usadas em `fontes` da parada. Sem fonte: deixe o campo de fora e registre a dúvida
  em `pendencias` (array de textos no topo do arquivo).
- **ids estáveis**: ao corrigir uma viagem existente, não troque os `id` de dias, paradas, itens de
  checklist e caixinhas — o app usa os ids para manter o que o usuário já marcou.
- `id` da viagem: único e estável (ex.: `paraty-2027-03`).
- Datas `AAAA-MM-DD`, crescentes; horas `HH:MM`; cores `#RRGGBB`.
- `categoria` da parada: `passeio | refeicao | hospedagem | transporte | compras | outro`.
- `icone` da caixinha: `combustivel | passeios | restaurantes | hospedagem | carro | especial | compras | extras`.
- Fotos: prefira Wikimedia Commons (licença livre). Use `foto.url` com o link **direto da imagem**
  (upload.wikimedia.org/...) e `foto.credito` ("Autor · Licença"). O empacotador baixa e converte.
- Mapa: opcional. Sem `mapa`, o empacotador usa as paradas com `local` + ~1 km de margem, zooms 14–16.
  Viagens com cidades distantes: limite `mapa.bbox` à região principal (máx. 5000 tiles).
- Não use campos fora do schema (o validador recusa, para pegar erros de digitação).

## Esqueleto
```json
{
  "formato": 1,
  "id": "exemplo-2027-01",
  "titulo": "Exemplo",
  "subtitulo": "Cidade · 10 e 11 de janeiro",
  "dias": [
    { "id": "d1", "data": "2027-01-10", "rotulo": "Sáb 10/01", "cor": "#6B4FD8",
      "paradas": [
        { "id": "p1", "hora": "09:00", "nome": "Café", "categoria": "refeicao",
          "obs": "…", "funcionamento": "8h–12h",
          "local": { "lat": -23.0, "lng": -46.0, "endereco": "Rua …" },
          "foto": { "url": "https://upload.wikimedia.org/…jpg", "credito": "Autor · CC BY-SA 4.0" },
          "fontes": ["https://…"] }
      ] }
  ],
  "checklist": [{ "id": "bagagem", "titulo": "Bagagem", "itens": [{ "id": "bagagem-1", "texto": "Documentos" }] }],
  "orcamento": { "caixinhas": [{ "id": "restaurantes", "nome": "Restaurantes", "icone": "restaurantes", "cor": "#F59E0B", "limite": 400 }] },
  "pendencias": []
}
```
