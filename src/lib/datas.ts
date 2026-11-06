import type { DiaId } from './types';

export const DATAS: Record<DiaId, string> = { sab: '2026-11-14', dom: '2026-11-15' };
export const CORES: Record<DiaId, string> = { sab: '#6B4FD8', dom: '#E8613C' };
export const ROTULOS: Record<DiaId, string> = { sab: 'Sáb 14/11', dom: 'Dom 15/11' };

// Data e hora atuais no fuso de São Paulo
export function agoraSP() {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const p = (t: string) => partes.find((x) => x.type === t)?.value ?? '00';
  return { data: `${p('year')}-${p('month')}-${p('day')}`, minutos: (+p('hour') % 24) * 60 + +p('minute') };
}

export const diaDeHoje = (): DiaId | null => {
  const { data } = agoraSP();
  return data === DATAS.dom ? 'dom' : data === DATAS.sab ? 'sab' : null;
};

export const minutos = (hora: string) => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + (m || 0);
};

export const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
