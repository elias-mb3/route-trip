import { useState } from 'react';
import {
  BedDouble, Car, Check, Fuel, Gem, Plus, ShoppingBag, Sparkles, Tag, Ticket, Utensils, type LucideIcon,
} from 'lucide-react';
import { useViagem } from '../estado';
import { dinheiro } from '../lib/datas';
import { novoId } from '../lib/geo';
import Topo from '../components/Topo';
import FolhaInferior from '../components/FolhaInferior';
import type { Caixinha, Despesa } from '../formato/tipos';

// moeda da viagem ativa (definida em Orcamento)
let brl = (v: number) => dinheiro(v);

export const ICONES_CAIXINHA: Record<string, LucideIcon> = {
  combustivel: Fuel, passeios: Ticket, restaurantes: Utensils, hospedagem: BedDouble,
  carro: Car, especial: Gem, compras: ShoppingBag, extras: Sparkles,
};
const CORES_NOVA = ['#0EA5E9', '#10B981', '#F59E0B', '#6B4FD8', '#E8613C', '#EC4899', '#78716C'];

const lerValor = (t: string) => {
  // aceita "1.234,56" (pt-BR) e "1234.56"
  const n = parseFloat(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t);
  return Number.isFinite(n) ? n : 0;
};
const fmt = (n?: number) => (n ? n.toString().replace('.', ',') : '');
const soma = (ds: Despesa[]) => ds.reduce((s, d) => s + d.valor, 0);

export default function Orcamento() {
  const { viagem, setViagem, estado, setEstado } = useViagem();
  brl = (v: number) => dinheiro(v, viagem.moeda);
  const { caixinhas } = viagem.orcamento;
  const { despesas } = estado;
  const setDespesas = (fn: (d: Despesa[]) => Despesa[]) => setEstado((e) => ({ ...e, despesas: fn(e.despesas) }));
  const setCaixinhas = (fn: (c: Caixinha[]) => Caixinha[]) => setViagem((v) => ({ ...v, orcamento: { ...v.orcamento, caixinhas: fn(v.orcamento.caixinhas) } }));
  const dias = [{ id: 'antes', rotulo: 'Antes' }, ...viagem.dias.map((d) => ({ id: d.id, rotulo: d.rotulo }))];
  const [aberta, setAberta] = useState<string | null>(null);
  const [caixinhaEditada, setCaixinhaEditada] = useState<Caixinha | null>(null);
  const [despesa, setDespesa] = useState<Despesa | null>(null);

  const planejado = caixinhas.reduce((s, c) => s + c.limite, 0);
  const gasto = soma(despesas);
  const economia = despesas.reduce((s, d) => s + (d.economia ?? 0), 0);
  const saldo = planejado - gasto;
  const usado = planejado ? Math.min(100, (gasto / planejado) * 100) : 0;
  const caixinhaAberta = caixinhas.find((c) => c.id === aberta);

  const salvarDespesa = (d: Despesa) => {
    setDespesas((ds) => (ds.some((x) => x.id === d.id) ? ds.map((x) => (x.id === d.id ? d : x)) : [...ds, d]));
    setDespesa(null);
  };
  const removerDespesa = (d: Despesa) => {
    if (!confirm(`Remover "${d.descricao}"?`)) return;
    setDespesas((ds) => ds.filter((x) => x.id !== d.id));
    setDespesa(null);
  };
  const salvarCaixinha = (c: Caixinha) => {
    setCaixinhas((cs) => (cs.some((x) => x.id === c.id) ? cs.map((x) => (x.id === c.id ? c : x)) : [...cs, c]));
    setCaixinhaEditada(null);
  };
  const removerCaixinha = (c: Caixinha) => {
    const n = despesas.filter((d) => d.caixinha === c.id).length;
    if (!confirm(n ? `Remover "${c.nome}" e seus ${n} gasto(s)?` : `Remover "${c.nome}"?`)) return;
    setCaixinhas((cs) => cs.filter((x) => x.id !== c.id));
    setDespesas((ds) => ds.filter((d) => d.caixinha !== c.id));
    setCaixinhaEditada(null);
    setAberta(null);
  };
  const novaDespesa = (caixinha: string) =>
    setDespesa({ id: novoId('g'), descricao: '', caixinha, valor: 0, dia: dias.find((d) => d.id !== 'antes')!.id, pagamento: '', pago: false });

  return (
    <div>
      <Topo cor="#6B4FD8" subtitulo="Saldo das caixinhas" titulo={brl(saldo)}>
        <div className="h-2 overflow-hidden rounded-full bg-white/25">
          <div className={`h-full rounded-full ${saldo < 0 ? 'bg-red-300' : 'bg-white'}`} style={{ width: `${usado}%` }} />
        </div>
        <p className="mt-2 text-sm text-white/85">
          {planejado ? <>Gasto {brl(gasto)} de {brl(planejado)} planejados</> : 'Toque numa caixinha para definir quanto vai separar'}
        </p>
      </Topo>

      <div className="mb-5 grid grid-cols-3 gap-2">
        <Resumo rotulo="Planejado" valor={brl(planejado)} />
        <Resumo rotulo="Gasto" valor={brl(gasto)} />
        <Resumo rotulo="Economia" valor={brl(economia)} cor="text-laranja" />
      </div>

      <h2 className="mb-3 text-lg font-bold">Caixinhas</h2>
      <div className="grid grid-cols-2 gap-3">
        {caixinhas.map((c) => (
          <CartaoCaixinha key={c.id} caixinha={c} gasto={soma(despesas.filter((d) => d.caixinha === c.id))} onClick={() => setAberta(c.id)} />
        ))}
        <button onClick={() => setCaixinhaEditada({ id: novoId('c'), nome: '', icone: 'extras', cor: CORES_NOVA[caixinhas.length % CORES_NOVA.length], limite: 0 })}
          className="flex min-h-[9.5rem] flex-col items-center justify-center gap-1 rounded-3xl border-2 border-dashed border-stone-300 text-sm font-semibold text-stone-500 active:scale-[0.98]">
          <Plus size={22} /> Nova caixinha
        </button>
      </div>


      {caixinhaAberta && !caixinhaEditada && !despesa && (
        <FolhaInferior titulo={caixinhaAberta.nome} onFechar={() => setAberta(null)}>
          <DetalheCaixinha caixinha={caixinhaAberta} despesas={despesas.filter((d) => d.caixinha === caixinhaAberta.id)}
            onEditar={() => setCaixinhaEditada(caixinhaAberta)} onNova={() => novaDespesa(caixinhaAberta.id)}
            dias={dias} onAbrir={setDespesa} onAlternarPago={(d) => salvarDespesa({ ...d, pago: !d.pago })} />
        </FolhaInferior>
      )}
      {caixinhaEditada && (
        <FormCaixinha inicial={caixinhaEditada} existe={caixinhas.some((c) => c.id === caixinhaEditada.id)}
          onSalvar={salvarCaixinha} onRemover={() => removerCaixinha(caixinhaEditada)} onFechar={() => setCaixinhaEditada(null)} />
      )}
      {despesa && (
        <FormDespesa inicial={despesa} caixinhas={caixinhas} dias={dias} existe={despesas.some((x) => x.id === despesa.id)}
          onSalvar={salvarDespesa} onRemover={() => removerDespesa(despesa)} onFechar={() => setDespesa(null)} />
      )}
    </div>
  );
}

function IconeCaixinha({ caixinha, tamanho = 'h-11 w-11' }: { caixinha: Caixinha; tamanho?: string }) {
  const Icone = ICONES_CAIXINHA[caixinha.icone] ?? Sparkles;
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-2xl ${tamanho}`} style={{ background: `${caixinha.cor}1f`, color: caixinha.cor }}>
      <Icone size={20} />
    </span>
  );
}

function Barra({ cor, gasto, limite }: { cor: string; gasto: number; limite: number }) {
  const passou = limite > 0 && gasto > limite;
  const pct = limite ? Math.min(100, (gasto / limite) * 100) : gasto ? 100 : 0;
  return (
    <div className="h-2 overflow-hidden rounded-full bg-stone-100">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: passou ? '#EF4444' : cor }} />
    </div>
  );
}

function Restante({ gasto, limite }: { gasto: number; limite: number }) {
  if (!limite) return <span className="text-stone-400">Definir valor</span>;
  const r = limite - gasto;
  return r >= 0
    ? <span className="text-emerald-600">Sobram {brl(r)}</span>
    : <span className="font-semibold text-red-600">Passou {brl(-r)}</span>;
}

function CartaoCaixinha({ caixinha, gasto, onClick }: { caixinha: Caixinha; gasto: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className="cartao flex min-h-[9.5rem] flex-col gap-2 p-3.5 text-left active:scale-[0.98]">
      <IconeCaixinha caixinha={caixinha} />
      <p className="line-clamp-2 text-sm font-semibold leading-tight">{caixinha.nome}</p>
      <div className="mt-auto space-y-1.5">
        <p className="text-xs tabular-nums text-stone-500">
          <span className="text-base font-bold text-stone-900">{brl(gasto)}</span>{caixinha.limite > 0 && <> / {brl(caixinha.limite)}</>}
        </p>
        <Barra cor={caixinha.cor} gasto={gasto} limite={caixinha.limite} />
        <p className="text-[11px]"><Restante gasto={gasto} limite={caixinha.limite} /></p>
      </div>
    </button>
  );
}

function DetalheCaixinha({ caixinha, despesas, dias, onEditar, onNova, onAbrir, onAlternarPago }: {
  caixinha: Caixinha; despesas: Despesa[]; dias: { id: string; rotulo: string }[]; onEditar: () => void; onNova: () => void;
  onAbrir: (d: Despesa) => void; onAlternarPago: (d: Despesa) => void;
}) {
  const gasto = soma(despesas);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <IconeCaixinha caixinha={caixinha} tamanho="h-14 w-14" />
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-bold tabular-nums">{brl(gasto)}</p>
          <p className="text-sm text-stone-500">{caixinha.limite ? <>de {brl(caixinha.limite)} planejados</> : 'Sem valor planejado'}</p>
        </div>
        <button onClick={onEditar} className="chip bg-stone-100 text-stone-600">Editar</button>
      </div>
      <div className="space-y-1.5">
        <Barra cor={caixinha.cor} gasto={gasto} limite={caixinha.limite} />
        <p className="text-xs"><Restante gasto={gasto} limite={caixinha.limite} /></p>
      </div>

      <div className="space-y-2">
        {despesas.length === 0 && <p className="rounded-2xl bg-stone-50 p-4 text-center text-sm text-stone-500">Nenhum gasto nesta caixinha ainda.</p>}
        {despesas.map((d) => (
          <div key={d.id} className="flex items-center gap-3 rounded-2xl bg-stone-50 p-2.5">
            <button onClick={() => onAlternarPago(d)} aria-pressed={d.pago} aria-label={d.pago ? 'Marcar como não pago' : 'Marcar como pago'}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition active:scale-90 ${d.pago ? 'bg-emerald-500 text-white' : 'bg-white text-stone-500'}`}>
              {d.pago ? <Check size={18} strokeWidth={3} /> : (dias.find((x) => x.id === d.dia)?.rotulo ?? d.dia).slice(0, 3)}
            </button>
            <button onClick={() => onAbrir(d)} className="min-w-0 flex-1 text-left">
              <p className="truncate font-semibold">{d.descricao}</p>
              <p className="flex items-center gap-1 truncate text-xs text-stone-500">
                {d.pago ? 'pago' : 'a pagar'}{d.pagamento && ` · ${d.pagamento}`}
                {!!d.economia && <span className="ml-1 inline-flex items-center gap-0.5 font-semibold text-laranja"><Tag size={11} />−{brl(d.economia)}</span>}
              </p>
            </button>
            <button onClick={() => onAbrir(d)} className="shrink-0 font-bold tabular-nums">{brl(d.valor)}</button>
          </div>
        ))}
      </div>
      <button onClick={onNova} className="botao-primario w-full"><Plus size={18} /> Adicionar gasto</button>
    </div>
  );
}

function Resumo({ rotulo, valor, cor = '' }: { rotulo: string; valor: string; cor?: string }) {
  return (
    <div className="cartao p-3">
      <div className="text-[11px] text-stone-500">{rotulo}</div>
      <div className={`truncate text-sm font-bold tabular-nums ${cor}`}>{valor}</div>
    </div>
  );
}

function CampoValor({ valor, onChange, autoFocus }: { valor: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  return (
    <div className="mt-1 flex items-center gap-2 rounded-2xl bg-stone-100 px-4 py-3 text-2xl font-bold">
      <span className="text-stone-400">R$</span>
      <input autoFocus={autoFocus} inputMode="decimal" value={valor} onChange={(e) => onChange(e.target.value)} placeholder="0,00" className="w-full bg-transparent outline-none" />
    </div>
  );
}

const rotulo = 'block text-xs font-medium text-stone-500';

function FormCaixinha({ inicial, existe, onSalvar, onRemover, onFechar }: {
  inicial: Caixinha; existe: boolean; onSalvar: (c: Caixinha) => void; onRemover: () => void; onFechar: () => void;
}) {
  const [c, setC] = useState(inicial);
  const [limite, setLimite] = useState(fmt(inicial.limite));
  return (
    <FolhaInferior titulo={existe ? 'Editar caixinha' : 'Nova caixinha'} onFechar={onFechar}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (c.nome.trim()) onSalvar({ ...c, limite: lerValor(limite), icone: c.icone as Caixinha['icone'] }); }}>
        <label className={rotulo}>Valor planejado<CampoValor valor={limite} onChange={setLimite} autoFocus={existe} /></label>
        <label className={rotulo}>Nome<input required autoFocus={!existe} value={c.nome} onChange={(e) => setC({ ...c, nome: e.target.value })} className="campo" /></label>
        <div>
          <span className={rotulo}>Ícone</span>
          <div className="mt-1 grid grid-cols-8 gap-1">
            {Object.entries(ICONES_CAIXINHA).map(([chave, Icone]) => (
              <button type="button" key={chave} onClick={() => setC({ ...c, icone: chave as Caixinha['icone'] })} aria-label={chave}
                className={`flex aspect-square items-center justify-center rounded-xl ${c.icone === chave ? 'text-white' : 'bg-stone-100 text-stone-500'}`}
                style={c.icone === chave ? { background: c.cor } : undefined}>
                <Icone size={18} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className={rotulo}>Cor</span>
          <div className="mt-1 flex gap-2">
            {CORES_NOVA.map((cor) => (
              <button type="button" key={cor} onClick={() => setC({ ...c, cor })} aria-label={cor}
                className={`h-9 w-9 rounded-full ${c.cor === cor ? 'ring-2 ring-stone-900 ring-offset-2' : ''}`} style={{ background: cor }} />
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          {existe && <button type="button" onClick={onRemover} className="botao-secundario flex-1 text-red-600">Remover</button>}
          <button className="botao-primario flex-[2]">Salvar</button>
        </div>
      </form>
    </FolhaInferior>
  );
}

function FormDespesa({ inicial, caixinhas, dias, existe, onSalvar, onRemover, onFechar }: {
  inicial: Despesa; caixinhas: Caixinha[]; dias: { id: string; rotulo: string }[]; existe: boolean; onSalvar: (d: Despesa) => void; onRemover: () => void; onFechar: () => void;
}) {
  const [d, setD] = useState(inicial);
  const [txt, setTxt] = useState({ valor: fmt(inicial.valor), prime: fmt(inicial.economia) });
  const valor = lerValor(txt.valor);

  return (
    <FolhaInferior titulo={existe ? 'Editar gasto' : 'Novo gasto'} onFechar={onFechar}>
      <form className="space-y-3" onSubmit={(e) => {
        e.preventDefault();
        if (!d.descricao.trim()) return;
        onSalvar({ ...d, valor, economia: lerValor(txt.prime) || undefined });
      }}>
        <label className={rotulo}>Valor<CampoValor valor={txt.valor} onChange={(v) => setTxt({ ...txt, valor: v })} autoFocus={!existe} /></label>
        <label className={rotulo}>Descrição<input required value={d.descricao} onChange={(e) => setD({ ...d, descricao: e.target.value })} placeholder="Ex.: pedágio Bandeirantes" className="campo" /></label>

        <div>
          <span className={rotulo}>Caixinha</span>
          <div className="sem-barra -mx-5 mt-1 flex gap-2 overflow-x-auto px-5">
            {caixinhas.map((c) => (
              <button type="button" key={c.id} onClick={() => setD({ ...d, caixinha: c.id })}
                className={`chip text-xs ${d.caixinha === c.id ? 'text-white' : 'bg-stone-100 text-stone-600'}`}
                style={d.caixinha === c.id ? { background: c.cor } : undefined}>{c.nome}</button>
            ))}
          </div>
        </div>

        <div>
          <span className={rotulo}>Dia</span>
          <div className="sem-barra mt-1 flex gap-1 overflow-x-auto rounded-2xl bg-stone-100 p-1">
            {dias.map((x) => (
              <button type="button" key={x.id} onClick={() => setD({ ...d, dia: x.id })}
                className={`shrink-0 grow rounded-xl px-3 py-2 text-sm font-semibold ${d.dia === x.id ? 'bg-white shadow-sm' : 'text-stone-500'}`}>{x.rotulo}</button>
            ))}
          </div>
        </div>

        <label className={rotulo}>Forma de pagamento<input value={d.pagamento} onChange={(e) => setD({ ...d, pagamento: e.target.value })} placeholder="Pix, crédito, dinheiro…" className="campo" /></label>

        <div className="rounded-2xl bg-orange-50 p-3">
          <span className="block text-xs font-semibold text-orange-900">Desconto obtido (ex.: 2x1) – economia</span>
          <div className="flex gap-2">
            <input inputMode="decimal" value={txt.prime} onChange={(e) => setTxt({ ...txt, prime: e.target.value })} placeholder="opcional" className="campo bg-white" />
            <button type="button" disabled={!valor} onClick={() => setTxt({ ...txt, prime: fmt(valor) })}
              className="mt-1 shrink-0 rounded-2xl bg-laranja px-3 text-xs font-bold text-white disabled:opacity-40">2x1</button>
          </div>
          {lerValor(txt.prime) > 0 && <p className="mt-1.5 text-xs text-orange-800">Você economiza {brl(lerValor(txt.prime))} neste gasto.</p>}
        </div>

        <button type="button" onClick={() => setD({ ...d, pago: !d.pago })} aria-pressed={d.pago}
          className="flex w-full items-center gap-3 rounded-2xl bg-stone-100 px-4 py-3 text-left font-medium">
          <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${d.pago ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-stone-300 text-transparent'}`}><Check size={14} strokeWidth={3} /></span>
          Já pago
        </button>

        <div className="flex gap-2 pt-1">
          {existe && <button type="button" onClick={onRemover} className="botao-secundario flex-1 text-red-600">Remover</button>}
          <button className="botao-primario flex-[2]">Salvar</button>
        </div>
      </form>
    </FolhaInferior>
  );
}
