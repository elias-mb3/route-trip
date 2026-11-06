import { z } from 'zod';

// Formato do arquivo de viagem (viagem.json). Fonte única: o app (importar/editar) e os
// scripts (validar, schema, pacote) usam esta definição. Mudança incompatível → FORMATO + 1.

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATA = /^\d{4}-\d{2}-\d{2}$/;
const COR = /^#[0-9a-fA-F]{6}$/;
const ID = /^[a-z0-9][a-z0-9-]*$/;

import { CATEGORIAS, FORMATO, ICONES_CAIXINHA } from './constantes';
export { CATEGORIAS, FORMATO, ICONES_CAIXINHA };

const id = (oque: string) => z.string().regex(ID, `${oque}: use letras minúsculas, números e hífen (ex.: "dia-1")`);
// Só http(s): bloqueia javascript:, intent:, file: etc. vindos de um arquivo importado
const url = z.url({ protocol: /^https?$/, message: 'URL inválida (use https://...)' });

export const Local = z.strictObject({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  endereco: z.string().optional(),
});

export const Foto = z.strictObject({
  arquivo: z.string().regex(/^fotos\/[\w.-]+\.(webp|jpg|jpeg|png)$/, 'use "fotos/<nome>.webp"').optional(),
  url: url.optional().describe('origem da foto; o empacotador baixa e converte para fotos/<id-da-parada>.webp'),
  credito: z.string().optional(),
});

export const Parada = z.strictObject({
  id: id('id da parada'),
  hora: z.string().regex(HORA, 'use HH:MM (ex.: 09:30)').optional(),
  nome: z.string().min(1),
  categoria: z.enum(CATEGORIAS),
  obs: z.string().optional(),
  funcionamento: z.string().optional(),
  local: Local.optional(),
  foto: Foto.optional(),
  links: z.array(z.strictObject({ rotulo: z.string().min(1), url })).optional(),
  fontes: z.array(url).optional().describe('de onde vieram horários, endereços e coordenadas'),
});

export const Dia = z.strictObject({
  id: id('id do dia'),
  data: z.string().regex(DATA, 'use AAAA-MM-DD'),
  rotulo: z.string().min(1).describe('ex.: "Sáb 14/11"'),
  cor: z.string().regex(COR, 'use #RRGGBB').optional(),
  paradas: z.array(Parada),
});

export const SecaoChecklist = z.strictObject({
  id: id('id da seção'),
  titulo: z.string().min(1),
  itens: z.array(z.strictObject({ id: id('id do item'), texto: z.string().min(1) })),
});

export const Caixinha = z.strictObject({
  id: id('id da caixinha'),
  nome: z.string().min(1),
  icone: z.enum(ICONES_CAIXINHA),
  cor: z.string().regex(COR, 'use #RRGGBB'),
  limite: z.number().min(0),
});

export const Viagem = z.strictObject({
  formato: z.literal(FORMATO, { message: `este app lê o formato ${FORMATO}` }),
  id: id('id da viagem'),
  titulo: z.string().min(1).max(60),
  subtitulo: z.string().optional(),
  fuso: z.string().default('America/Sao_Paulo'),
  moeda: z.string().regex(/^[A-Z]{3}$/).default('BRL'),
  cores: z.strictObject({ tema: z.string().regex(COR, 'use #RRGGBB') }).default({ tema: '#E8613C' }),
  dias: z.array(Dia).min(1, 'a viagem precisa de pelo menos 1 dia'),
  checklist: z.array(SecaoChecklist).default([]),
  orcamento: z.strictObject({ caixinhas: z.array(Caixinha) }).default({ caixinhas: [] }),
  mapa: z.strictObject({
    bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).describe('[oeste, sul, leste, norte]'),
    zooms: z.tuple([z.number().int().min(1).max(19), z.number().int().min(1).max(19)]),
  }).optional(),
  contatos: z.array(z.strictObject({ nome: z.string().min(1), telefone: z.string().optional(), obs: z.string().optional() })).default([]),
  notas: z.string().optional(),
  pendencias: z.array(z.string()).default([]).describe('dúvidas que o agente não conseguiu confirmar'),
}).superRefine((v, ctx) => {
  const erro = (path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message });
  const dias = new Set<string>();
  const paradas = new Set<string>();
  v.dias.forEach((d, i) => {
    if (dias.has(d.id)) erro(['dias', i, 'id'], `id de dia repetido: "${d.id}"`);
    dias.add(d.id);
    if (i > 0 && d.data <= v.dias[i - 1].data) erro(['dias', i, 'data'], 'as datas dos dias devem ser crescentes e sem repetir');
    d.paradas.forEach((p, j) => {
      if (paradas.has(p.id)) erro(['dias', i, 'paradas', j, 'id'], `id de parada repetido na viagem: "${p.id}"`);
      paradas.add(p.id);
    });
  });
  const itens = new Set<string>();
  v.checklist.forEach((s, i) => s.itens.forEach((it, j) => {
    if (itens.has(it.id)) erro(['checklist', i, 'itens', j, 'id'], `id de item repetido: "${it.id}"`);
    itens.add(it.id);
  }));
  const cx = new Set<string>();
  v.orcamento.caixinhas.forEach((c, i) => {
    if (cx.has(c.id)) erro(['orcamento', 'caixinhas', i, 'id'], `id de caixinha repetido: "${c.id}"`);
    cx.add(c.id);
  });
  if (v.mapa) {
    const [o, s, l, n] = v.mapa.bbox;
    if (o >= l || s >= n) erro(['mapa', 'bbox'], 'bbox deve ser [oeste, sul, leste, norte] com oeste < leste e sul < norte');
    if (v.mapa.zooms[0] > v.mapa.zooms[1]) erro(['mapa', 'zooms'], 'zooms deve ser [mínimo, máximo]');
  }
});

export type Viagem = z.infer<typeof Viagem>;
export type ViagemEntrada = z.input<typeof Viagem>;
export type Dia = z.infer<typeof Dia>;
export type Parada = z.infer<typeof Parada>;
export type SecaoChecklist = z.infer<typeof SecaoChecklist>;
export type Caixinha = z.infer<typeof Caixinha>;
export type Categoria = (typeof CATEGORIAS)[number];

export type { Despesa, EstadoViagem } from './tipos';
export { estadoVazio } from './tipos';
