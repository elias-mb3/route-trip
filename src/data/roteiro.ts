import type { Caixinha, Roteiro, Checklist, Orcamento } from '../lib/types';

// Roteiro original (veio da primeira versão do app, legacy/index-v1.html)
export const ROTEIRO_ORIGINAL: Roteiro = {
  sab: [
    { id: 's1', hora: '06:45', nome: 'Café da manhã reforçado', categoria: 'Refeição', obs: 'Em casa · separar lanches' },
    { id: 's2', hora: '08:00', nome: 'Retirada do carro – Localiza', categoria: 'Transporte', obs: 'Osasco' },
    { id: 's3', hora: '10:30', nome: 'Moinho Povos Unidos', categoria: 'Passeio', obs: 'Estacionar e seguir a pé · 2x1 Prime', lat: -22.6232484, lng: -47.0602314 },
    { id: 's4', hora: '11:45', nome: 'Guarda-chuvas e Boulevard', categoria: 'Passeio', obs: 'A pé · fotos e lojinhas', lat: -22.6278163, lng: -47.058702 },
    { id: 's5', hora: '12:10', nome: 'Deck do Amor', categoria: 'Passeio', obs: 'A pé · cadeados e lago', lat: -22.6314432, lng: -47.0577998 },
    { id: 's6', hora: '12:30', nome: 'Dona Maura Gastronomia', categoria: 'Refeição', funcionamento: 'Sábado até 16h', obs: 'Almoço com Prime', lat: -22.6339155, lng: -47.0498621 },
    { id: 's7', hora: '14:00', nome: 'Passeio pelo centro', categoria: 'Passeio', obs: 'Voltar ao carro' },
    { id: 's8', hora: '15:15', nome: 'Royal Tulip Holambra', categoria: 'Hospedagem', obs: 'Check-in · jantar 20h', lat: -22.6245803, lng: -47.0757293 },
  ],
  dom: [
    { id: 'd1', hora: '08:00', nome: 'Café da manhã – Royal Tulip', categoria: 'Refeição', funcionamento: 'Check-out 11h', obs: 'Piscina e jardins', lat: -22.6245803, lng: -47.0757293 },
    { id: 'd2', hora: '11:15', nome: 'Macena Flores', categoria: 'Passeio', funcionamento: '9h–17h', obs: '2x1 Prime', lat: -22.613718, lng: -47.0510292 },
    { id: 'd3', hora: '13:00', nome: 'Restaurante Lago do Holandês', categoria: 'Refeição', funcionamento: 'Domingo até 16h30', obs: 'Almoço', lat: -22.6364421, lng: -47.0514755 },
    { id: 'd4', hora: '14:45', nome: 'Parque Van Gogh', categoria: 'Passeio', funcionamento: 'Até 18h', obs: 'Ao lado do restaurante', lat: -22.6378139, lng: -47.0522573 },
    { id: 'd5', hora: '16:00', nome: 'Volta para Osasco', categoria: 'Transporte', obs: 'Devolver o carro na Localiza' },
  ],
};

const itens = (textos: string[], pre: string) => textos.map((texto, i) => ({ id: `${pre}${i}`, texto, feito: false }));

export const CHECKLIST_ORIGINAL: Checklist = {
  antes: itens([
    'Confirmar reserva com o hotel',
    'Reservar jantar de sábado no hotel',
    'Incluir café da manhã de domingo',
    'Separar vouchers Prime (Moinho, Dona Maura, Macena)',
    'Confirmar horário de devolução do carro',
    'Baixar este app e abrir uma vez com internet',
  ], 'a'),
  bagagem: itens([
    'Óculos de sol',
    'Documentos e CNH',
    'Carregador e power bank',
    'Protetor solar e boné',
    'Roupa para o jantar',
  ], 'b'),
  dia: itens([
    'Abastecer o carro',
    'Conferir pneus',
    'Lanches e água no carro',
    'Celular carregado',
  ], 'c'),
};

export const CAIXINHAS_ORIGINAIS: Caixinha[] = [
  { id: 'combustivel', nome: 'Combustível e pedágio', icone: 'combustivel', cor: '#0EA5E9', limite: 0 },
  { id: 'passeios', nome: 'Pontos turísticos', icone: 'passeios', cor: '#10B981', limite: 0 },
  { id: 'restaurantes', nome: 'Restaurantes', icone: 'restaurantes', cor: '#F59E0B', limite: 0 },
  { id: 'hospedagem', nome: 'Hospedagem', icone: 'hospedagem', cor: '#6B4FD8', limite: 0 },
  { id: 'carro', nome: 'Aluguel do carro', icone: 'carro', cor: '#0369A1', limite: 0 },
  { id: 'especial', nome: 'Especial', icone: 'especial', cor: '#E8613C', limite: 0 },
  { id: 'lembrancinhas', nome: 'Lembrancinhas', icone: 'compras', cor: '#EC4899', limite: 0 },
  { id: 'extras', nome: 'Extras', icone: 'extras', cor: '#78716C', limite: 0 },
];

export const ORCAMENTO_ORIGINAL: Orcamento = { caixinhas: CAIXINHAS_ORIGINAIS, despesas: [] };

// Converte o orçamento da versão antiga (total + despesas por categoria) para caixinhas
const CAIXINHA_DA_CATEGORIA: Record<string, string> = {
  Transporte: 'combustivel', Hospedagem: 'hospedagem', Alimentação: 'restaurantes', Ingressos: 'passeios',
  Compras: 'lembrancinhas', 'Especial': 'especial', Outros: 'extras',
};
export function migrarOrcamento(o: any): Orcamento {
  if (Array.isArray(o?.caixinhas)) return o;
  return {
    caixinhas: CAIXINHAS_ORIGINAIS,
    despesas: (o?.despesas ?? []).map((d: any) => ({
      id: d.id, descricao: d.descricao, caixinha: CAIXINHA_DA_CATEGORIA[d.categoria] ?? 'extras',
      valor: d.real || d.previsto || 0, dia: d.dia, pagamento: d.pagamento ?? '', pago: !!d.pago, economiaPrime: d.economiaPrime,
    })),
  };
}

export const TITULOS_CHECKLIST = { antes: 'Antes da viagem', bagagem: 'Bagagem', dia: 'Dia da viagem' } as const;
