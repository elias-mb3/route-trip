import { useState } from 'react';
import { Briefcase, Car, Check, ClipboardList, Pencil, Plus, Trash2, X, type LucideIcon } from 'lucide-react';
import { useEstado } from '../estado';
import { TITULOS_CHECKLIST } from '../data/roteiro';
import { novoId } from '../lib/storage';
import Topo from '../components/Topo';
import type { ItemChecklist, SecaoChecklist } from '../lib/types';

const ICONES: Record<SecaoChecklist, LucideIcon> = { antes: ClipboardList, bagagem: Briefcase, dia: Car };

export default function Checklist() {
  const { checklist, setChecklist } = useEstado();
  const alterar = (s: SecaoChecklist, fn: (itens: ItemChecklist[]) => ItemChecklist[]) =>
    setChecklist((c) => ({ ...c, [s]: fn(c[s]) }));

  const todos = Object.values(checklist).flat();
  const feitos = todos.filter((i) => i.feito).length;
  const pct = todos.length ? Math.round((feitos / todos.length) * 100) : 0;

  return (
    <div>
      <Topo cor="#0F9D76" subtitulo="Tudo pronto para a viagem?" titulo="Checklist">
        <div className="flex items-center gap-4 rounded-2xl bg-white/15 p-3 backdrop-blur">
          <Anel pct={pct} />
          <div>
            <p className="text-lg font-bold">{feitos} de {todos.length} itens</p>
            <p className="text-sm text-white/80">{pct === 100 ? 'Tudo certo! 🎉' : 'Continue marcando conforme for resolvendo'}</p>
          </div>
        </div>
      </Topo>
      <div className="space-y-4">
        {(Object.keys(TITULOS_CHECKLIST) as SecaoChecklist[]).map((s) => (
          <Secao key={s} titulo={TITULOS_CHECKLIST[s]} Icone={ICONES[s]} itens={checklist[s]} alterar={(fn) => alterar(s, fn)} />
        ))}
      </div>
    </div>
  );
}

function Anel({ pct }: { pct: number }) {
  const r = 22, c = 2 * Math.PI * r;
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0 -rotate-90">
      <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="6" />
      <circle cx="28" cy="28" r={r} fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} style={{ transition: 'stroke-dashoffset .4s' }} />
      <text x="28" y="28" fill="#fff" fontSize="13" fontWeight="700" textAnchor="middle" dominantBaseline="central" transform="rotate(90 28 28)">{pct}%</text>
    </svg>
  );
}

function Secao({ titulo, Icone, itens, alterar }: {
  titulo: string; Icone: LucideIcon; itens: ItemChecklist[]; alterar: (fn: (i: ItemChecklist[]) => ItemChecklist[]) => void;
}) {
  const [novo, setNovo] = useState('');
  const feitos = itens.filter((i) => i.feito).length;
  const completo = itens.length > 0 && feitos === itens.length;

  return (
    <section className="cartao p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><Icone size={20} /></span>
        <h2 className="flex-1 font-bold">{titulo}</h2>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${completo ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-500'}`}>
          {feitos}/{itens.length}
        </span>
      </div>
      <ul className="mt-2">
        {itens.map((item) => (
          <Linha key={item.id} item={item}
            onMudar={(m) => alterar((is) => is.map((i) => (i.id === item.id ? { ...i, ...m } : i)))}
            onRemover={() => alterar((is) => is.filter((i) => i.id !== item.id))} />
        ))}
      </ul>
      <form className="mt-2 flex gap-2" onSubmit={(e) => {
        e.preventDefault();
        if (!novo.trim()) return;
        alterar((is) => [...is, { id: novoId(), texto: novo.trim(), feito: false }]);
        setNovo('');
      }}>
        <input value={novo} onChange={(e) => setNovo(e.target.value)} placeholder="Adicionar item…" className="campo mt-0 py-2.5 text-sm" />
        <button aria-label="Adicionar" className="flex w-12 shrink-0 items-center justify-center rounded-2xl bg-stone-900 text-white active:scale-95"><Plus size={18} /></button>
      </form>
    </section>
  );
}

function Linha({ item, onMudar, onRemover }: {
  item: ItemChecklist; onMudar: (m: Partial<ItemChecklist>) => void; onRemover: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(item.texto);

  if (editando) {
    return (
      <li className="flex items-center gap-1 py-1.5">
        <input autoFocus value={texto} onChange={(e) => setTexto(e.target.value)} className="campo mt-0 py-2 text-sm" />
        <button aria-label="Salvar" onClick={() => { if (texto.trim()) onMudar({ texto: texto.trim() }); setEditando(false); }}
          className="flex h-10 w-10 items-center justify-center text-emerald-600"><Check size={18} /></button>
        <button aria-label="Cancelar" onClick={() => { setTexto(item.texto); setEditando(false); }}
          className="flex h-10 w-10 items-center justify-center text-stone-400"><X size={18} /></button>
      </li>
    );
  }
  return (
    <li className="group flex items-center gap-1">
      <button onClick={() => onMudar({ feito: !item.feito })} aria-pressed={item.feito}
        className="flex min-h-12 flex-1 items-center gap-3 py-1 text-left active:opacity-70">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${item.feito ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-stone-300 text-transparent'}`}>
          <Check size={15} strokeWidth={3} />
        </span>
        <span className={`text-[15px] ${item.feito ? 'text-stone-400 line-through' : ''}`}>{item.texto}</span>
      </button>
      <button aria-label="Editar" onClick={() => setEditando(true)} className="flex h-10 w-9 items-center justify-center text-stone-300 active:text-stone-600"><Pencil size={15} /></button>
      <button aria-label="Remover" onClick={() => confirm(`Remover "${item.texto}"?`) && onRemover()} className="flex h-10 w-9 items-center justify-center text-stone-300 active:text-stone-600"><Trash2 size={15} /></button>
    </li>
  );
}
