import type { Dia, Viagem } from '../formato/tipos';

// Data e hora atuais no fuso da viagem
export function agora(fuso = 'America/Sao_Paulo') {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: fuso, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const p = (t: string) => partes.find((x) => x.type === t)?.value ?? '00';
  return { data: `${p('year')}-${p('month')}-${p('day')}`, minutos: (+p('hour') % 24) * 60 + +p('minute') };
}

// Dia de hoje dentro da viagem; antes dela, o primeiro; depois, o último
export function diaPadrao(v: Viagem): Dia {
  const { data } = agora(v.fuso);
  return v.dias.find((d) => d.data === data) ?? (data > v.dias[v.dias.length - 1].data ? v.dias[v.dias.length - 1] : v.dias[0]);
}

export const corDia = (v: Viagem, d: Dia) => d.cor ?? v.cores.tema;

export const minutos = (hora?: string) => {
  if (!hora) return 24 * 60;
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + (m || 0);
};

export const ordenarPorHora = <T extends { hora?: string }>(ps: T[]) =>
  [...ps].sort((a, b) => minutos(a.hora) - minutos(b.hora));

export const dinheiro = (v: number, moeda = 'BRL') => v.toLocaleString('pt-BR', { style: 'currency', currency: moeda });

export function contagem(v: Viagem) {
  const hoje = new Date(`${agora(v.fuso).data}T00:00:00`);
  const dia = (s: string) => Math.round((new Date(`${s}T00:00:00`).getTime() - hoje.getTime()) / 86_400_000);
  const ini = dia(v.dias[0].data), fim = dia(v.dias[v.dias.length - 1].data);
  if (ini > 1) return `Faltam ${ini} dias`;
  if (ini === 1) return 'É amanhã!';
  if (fim >= 0) return fim === 0 ? 'Último dia de viagem' : 'Boa viagem!';
  return 'Viagem concluída';
}
