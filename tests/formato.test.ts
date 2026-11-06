import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { validarViagem } from '../src/formato/validar';

const minima = () => ({
  formato: 1, id: 'exemplo-2026', titulo: 'Exemplo',
  dias: [{ id: 'd1', data: '2026-12-01', rotulo: 'Terça', paradas: [{ id: 'p1', hora: '09:00', nome: 'Café', categoria: 'refeicao' }] }],
});
const erros = (v: unknown) => { const r = validarViagem(v); return r.ok ? [] : r.erros.map((e) => `${e.caminho}: ${e.mensagem}`); };

describe('formato da viagem', () => {
  it('aceita o exemplo mínimo e aplica padrões', () => {
    const r = validarViagem(minima());
    expect(r.ok).toBe(true);
    if (r.ok) { expect(r.viagem.moeda).toBe('BRL'); expect(r.viagem.checklist).toEqual([]); }
  });
  it('aceita o Holambra', () => {
    expect(erros(JSON.parse(readFileSync('viagens/holambra/viagem.json', 'utf8')))).toEqual([]);
  });
  it('aponta hora inválida com caminho', () => {
    const v = minima(); v.dias[0].paradas[0].hora = '9h';
    expect(erros(v)).toEqual(['dias[0].paradas[0].hora: use HH:MM (ex.: 09:30)']);
  });
  it('rejeita id de parada repetido', () => {
    const v = minima(); v.dias[0].paradas.push({ ...v.dias[0].paradas[0] });
    expect(erros(v)[0]).toMatch(/dias\[0\]\.paradas\[1\]\.id: id de parada repetido/);
  });
  it('rejeita campo desconhecido (erro de digitação do agente)', () => {
    const v = { ...minima(), titlo: 'x' };
    expect(erros(v)[0]).toMatch(/campo\(s\) desconhecido\(s\): titlo/);
  });
  it('rejeita formato futuro com mensagem clara', () => {
    expect(erros({ ...minima(), formato: 2 })[0]).toMatch(/formato: .*atualize o app/);
  });
  it('aponta campo obrigatório ausente', () => {
    const v = minima() as Record<string, unknown>; delete v.titulo;
    expect(erros(v)).toEqual(['titulo: campo obrigatório ausente']);
  });
});
