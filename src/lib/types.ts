export type DiaId = 'sab' | 'dom';

export interface Parada {
  id: string;
  hora: string; // "HH:MM"
  nome: string;
  categoria: string;
  funcionamento?: string;
  obs?: string;
  lat?: number;
  lng?: number;
  feito?: boolean;
}

export type Roteiro = Record<DiaId, Parada[]>;

export interface ItemChecklist {
  id: string;
  texto: string;
  feito: boolean;
}

export type SecaoChecklist = 'antes' | 'bagagem' | 'dia';
export type Checklist = Record<SecaoChecklist, ItemChecklist[]>;

// Orçamento em caixinhas: cada uma tem um valor planejado e recebe os gastos
export interface Caixinha {
  id: string;
  nome: string;
  icone: string; // chave de ICONES_CAIXINHA em src/pages/Orcamento.tsx
  cor: string;
  limite: number;
}

export interface Despesa {
  id: string;
  descricao: string;
  caixinha: string; // id da Caixinha
  valor: number;
  dia: 'Antes' | 'Sáb' | 'Dom';
  pagamento: string;
  pago: boolean;
  economiaPrime?: number; // valor economizado com o 2x1
}

export interface Orcamento {
  caixinhas: Caixinha[];
  despesas: Despesa[];
}
