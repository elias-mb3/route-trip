import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { get, createStore, keys } from 'idb-keyval';
import { importarArquivo } from '../src/viagens/importar';
import * as repo from '../src/viagens/repositorio';
import { montarPacote, abrirPacote } from '../src/viagens/pacote';

const json = readFileSync('viagens/holambra/viagem.json');
const zip = new Uint8Array(readFileSync('public/exemplo/holambra.viagem.zip'));

describe('importação', () => {
  it('JSON inválido não grava nada', async () => {
    const r = await importarArquivo(new TextEncoder().encode('{"formato":1}'));
    expect(r.ok).toBe(false);
    expect(await repo.lerIndice()).toEqual([]);
  });

  it('importa o pacote, guarda tudo cifrado e lê de volta', async () => {
    const r = await importarArquivo(zip);
    expect(r.ok).toBe(true);
    const ind = await repo.lerIndice();
    expect(ind.map((i) => i.id)).toEqual(['holambra-2026-11']);
    expect((await repo.lerViagem('holambra-2026-11'))?.dias[0].paradas[2].nome).toBe('Moinho Povos Unidos');
    const tile = await repo.lerArquivo('holambra-2026-11', 'tiles/14/6048/9247.png');
    expect(tile?.size).toBeGreaterThan(0);
    // nada em texto puro no armazenamento
    const loja = createStore('viagens', 'dados');
    for (const k of await keys(loja)) {
      const v = await get(k, loja);
      expect(v.cifrado, String(k)).toBe(1);
      expect(new TextDecoder().decode(v.dados)).not.toContain('Moinho');
    }
  });

  it('reimportar preserva marcações e gastos', async () => {
    const id = 'holambra-2026-11';
    await repo.gravarEstado(id, { feitas: { s3: true }, checklist: { 'bagagem-1': true }, notas: {}, despesas: [{ id: 'g1', descricao: 'Pedágio', caixinha: 'combustivel', valor: 20, dia: 'sab', pagamento: '', pago: true }] });
    const v = JSON.parse(new TextDecoder().decode(json));
    v.dias[0].paradas[2].nome = 'Moinho (corrigido)';
    const r = await importarArquivo(new TextEncoder().encode(JSON.stringify(v)));
    expect(r.ok && r.atualizou).toBe(true);
    expect((await repo.lerViagem(id))?.dias[0].paradas[2].nome).toBe('Moinho (corrigido)');
    const e = await repo.lerEstado(id);
    expect(e.feitas.s3).toBe(true);
    expect(e.despesas[0].valor).toBe(20);
    // JSON avulso mantém mapa/fotos já instalados
    expect((await repo.listarArquivos(id)).length).toBe(360);
  });

  it('exportar → importar é ida e volta sem perda', async () => {
    const v = await repo.lerViagem('holambra-2026-11');
    const { json: volta } = abrirPacote(montarPacote(v, new Map()));
    expect(volta).toEqual(v);
  });
});
