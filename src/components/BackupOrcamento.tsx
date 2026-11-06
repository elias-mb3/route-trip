import { useEffect, useRef, useState } from 'react';
import { Download, History, Upload } from 'lucide-react';
import { useEstado } from '../estado';
import { brl } from '../lib/datas';
import { exportarOrcamento, importarOrcamento, lerHistorico, registrarVersao, type Versao } from '../lib/backup';
import FolhaInferior from './FolhaInferior';
import type { Orcamento } from '../lib/types';

const ULTIMO = 'holambra-backup:ultimo'; // só a data, sem dados: fica fora da criptografia
const dataHora = (iso: string) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '?';
const resumo = (o: Orcamento) => `${o.despesas.length} gasto(s) · ${brl(o.despesas.reduce((s, d) => s + d.valor, 0))}`;

// Exportar/importar o orçamento e voltar a versões anteriores salvas automaticamente
export default function BackupOrcamento() {
  const { orcamento, setOrcamento, carregado } = useEstado();
  const entrada = useRef<HTMLInputElement>(null);
  const [ultimo, setUltimo] = useState(() => { try { return localStorage.getItem(ULTIMO) ?? ''; } catch { return ''; } });
  const [aviso, setAviso] = useState('');
  const [versoes, setVersoes] = useState<Versao[] | null>(null);

  // Guarda uma versão alguns segundos depois de cada mudança
  useEffect(() => {
    if (!carregado) return;
    const t = setTimeout(() => registrarVersao(orcamento), 4000);
    return () => clearTimeout(t);
  }, [orcamento, carregado]);

  const avisar = (t: string) => { setAviso(t); setTimeout(() => setAviso(''), 4000); };

  const exportar = async () => {
    try {
      const r = await exportarOrcamento(orcamento);
      if (r === 'cancelado') return;
      const agora = new Date().toISOString();
      try { localStorage.setItem(ULTIMO, agora); } catch { /* ignora */ }
      setUltimo(agora);
      avisar(r === 'baixado' ? 'Backup salvo em Downloads.' : 'Backup compartilhado.');
    } catch (e) { avisar((e as Error).message); }
  };

  const substituir = async (novo: Orcamento, origem: string) => {
    if (!confirm(`Substituir o orçamento atual (${resumo(orcamento)}) pelo ${origem} (${resumo(novo)})?\n\nO atual fica guardado em "Versões".`)) return;
    await registrarVersao(orcamento);
    setOrcamento(novo);
    setVersoes(null);
    avisar('Orçamento restaurado.');
  };

  const importar = async (arquivo?: File) => {
    if (entrada.current) entrada.current.value = '';
    if (!arquivo) return;
    try {
      const { orcamento: novo, em } = await importarOrcamento(arquivo);
      await substituir(novo, `backup de ${dataHora(em)}`);
    } catch (e) { avisar((e as Error).message); }
  };

  return (
    <section className="cartao mt-6 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-bold">Backup</h2>
        <span className="text-xs text-stone-500">{ultimo ? `Último: ${dataHora(ultimo)}` : 'Nenhum backup feito'}</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Botao onClick={exportar} Icone={Upload} rotulo="Exportar" />
        <Botao onClick={() => entrada.current?.click()} Icone={Download} rotulo="Importar" />
        <Botao onClick={async () => setVersoes(await lerHistorico())} Icone={History} rotulo="Versões" />
      </div>
      <input ref={entrada} type="file" accept="application/json,.json" hidden onChange={(e) => importar(e.target.files?.[0])} />
      {aviso && <p className="mt-3 text-sm font-medium text-stone-700">{aviso}</p>}
      <p className="mt-2 text-xs text-stone-500">O arquivo é criptografado e só abre com o mesmo usuário e senha.</p>

      {versoes && (
        <FolhaInferior titulo="Versões anteriores" onFechar={() => setVersoes(null)}>
          {versoes.length === 0 ? <p className="text-sm text-stone-500">Nenhuma versão salva ainda.</p> : (
            <ul className="space-y-2">
              {versoes.map((v) => (
                <li key={v.em}>
                  <button onClick={() => substituir(v.orcamento, `versão de ${dataHora(v.em)}`)}
                    className="flex w-full items-center justify-between gap-2 rounded-2xl bg-stone-100 px-4 py-3 text-left active:scale-[0.98]">
                    <span className="font-semibold">{dataHora(v.em)}</span>
                    <span className="text-xs text-stone-500">{resumo(v.orcamento)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </FolhaInferior>
      )}
    </section>
  );
}

function Botao({ onClick, Icone, rotulo }: { onClick: () => void; Icone: typeof Upload; rotulo: string }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 rounded-2xl bg-stone-100 py-3 text-sm font-semibold text-stone-700 active:scale-[0.98]">
      <Icone size={20} /> {rotulo}
    </button>
  );
}
