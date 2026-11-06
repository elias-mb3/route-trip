// Tipos do app sem dependência de zod (import type de viagem.ts é apagado no build)
export type { Viagem, Dia, Parada, SecaoChecklist, Caixinha, Categoria } from './viagem';

// Estado do usuário: separado do conteúdo, nunca sobrescrito ao reimportar a viagem
export interface Despesa {
  id: string;
  descricao: string;
  caixinha: string;
  valor: number;
  dia: string; // id do dia ou 'antes'
  pagamento: string;
  pago: boolean;
  economia?: number; // desconto obtido (ex.: 2x1)
}
export interface EstadoViagem {
  feitas: Record<string, true>;
  checklist: Record<string, true>;
  despesas: Despesa[];
  notas: Record<string, string>; // por id do dia
}
export const estadoVazio = (): EstadoViagem => ({ feitas: {}, checklist: {}, despesas: [], notas: {} });
