import { useState } from 'react';
import { Briefcase, Car, Check, ClipboardList, Pencil, Plus, Trash2, X, type LucideIcon } from 'lucide-react';
import { useViagem } from '../estado';
import { novoId } from '../lib/geo';
import Topo from '../components/Topo';
import type { SecaoChecklist } from '../formato/tipos';

type Item = SecaoChecklist['itens'][number];

const ICONES: LucideIcon[] = [ClipboardList, Briefcase, Car];

export default function Checklist() {
  const { viagem, setViagem, estado, setEstado } = useViagem();
  const marcado = (id: string) => !!estado.checklist[id];
  const alterarSecao = (sid: string, fn: (s: SecaoChecklist) => SecaoChecklist | null) =>
    setViagem((v) => ({ ...v, checklist: v.checklist.flatMap((s) => (s.id === sid ? (fn(s) ?? []) : [s])) }));
  const alternar = (id: string) => setEstado((e) => {
    const checklist = { ...e.checklist };
    if (checklist[id]) delete checklist[id]; else checklist[id] = true;
    return { ...e, checklist };
  });

  const todos = viagem.checklist.flatMap((s) => s.itens);
  const feitos = todos.filter((i) => marcado(i.id)).length;
  const pct = todos.length ? Math.round((feitos / todos.length) * 100) : 0;
  const novaSecao = () => {
    const titulo = prompt('Nome da nova seção (ex.: Bagagem)')?.trim();
    if (titulo) setViagem((v) => ({ ...v, checklist: [...v.checklist, { id: novoId('s'), titulo, itens: [] }] }));
  };

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
        {viagem.checklist.map((s, i) => (
          <Secao key={s.id} secao={s} Icone={ICONES[i % ICONES.length]} marcado={marcado} alternar={alternar}
            alterar={(fn) => alterarSecao(s.id, fn)} />
        ))}
        <button onClick={novaSecao} className="flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-stone-300 py-4 text-sm font-semibold text-stone-500 active:scale-[0.98]">
          <Plus size={18} /> Nova seção
        </button>
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

function Secao({ secao, Icone, marcado, alternar, alterar }: {
  secao: SecaoChecklist; Icone: LucideIcon; marcado: (id: string) => boolean; alternar: (id: string) => void;
  alterar: (fn: (s: SecaoChecklist) => SecaoChecklist | null) => void;
}) {
  const [novo, setNovo] = useState('');
  const itens = secao.itens;
  const feitos = itens.filter((i) => marcado(i.id)).length;
  const completo = itens.length > 0 && feitos === itens.length;
  const setItens = (fn: (i: Item[]) => Item[]) => alterar((s) => ({ ...s, itens: fn(s.itens) }));
  const renomear = () => {
    const titulo = prompt('Nome da seção (vazio = remover a seção)', secao.titulo);
    if (titulo === null) return;
    if (!titulo.trim()) { if (confirm(`Remover a seção "${secao.titulo}" e seus itens?`)) alterar(() => null); return; }
    alterar((s) => ({ ...s, titulo: titulo.trim() }));
  };

  return (
    <section className="cartao p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><Icone size={20} /></span>
        <button onClick={renomear} className="flex-1 text-left font-bold">{secao.titulo}</button>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${completo ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-500'}`}>
          {feitos}/{itens.length}
        </span>
      </div>
      <ul className="mt-2">
        {itens.map((item) => (
          <Linha key={item.id} item={item} feito={marcado(item.id)} onAlternar={() => alternar(item.id)}
            onTexto={(texto) => setItens((is) => is.map((i) => (i.id === item.id ? { ...i, texto } : i)))}
            onRemover={() => setItens((is) => is.filter((i) => i.id !== item.id))} />
        ))}
      </ul>
      <form className="mt-2 flex gap-2" onSubmit={(e) => {
        e.preventDefault();
        if (!novo.trim()) return;
        setItens((is) => [...is, { id: novoId('i'), texto: novo.trim() }]);
        setNovo('');
      }}>
        <input value={novo} onChange={(e) => setNovo(e.target.value)} placeholder="Adicionar item…" className="campo mt-0 py-2.5 text-sm" />
        <button aria-label="Adicionar" className="flex w-12 shrink-0 items-center justify-center rounded-2xl bg-stone-900 text-white active:scale-95"><Plus size={18} /></button>
      </form>
    </section>
  );
}

function Linha({ item, feito, onAlternar, onTexto, onRemover }: {
  item: Item; feito: boolean; onAlternar: () => void; onTexto: (t: string) => void; onRemover: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(item.texto);

  if (editando) {
    return (
      <li className="flex items-center gap-1 py-1.5">
        <input autoFocus value={texto} onChange={(e) => setTexto(e.target.value)} className="campo mt-0 py-2 text-sm" />
        <button aria-label="Salvar" onClick={() => { if (texto.trim()) onTexto(texto.trim()); setEditando(false); }}
          className="flex h-10 w-10 items-center justify-center text-emerald-600"><Check size={18} /></button>
        <button aria-label="Cancelar" onClick={() => { setTexto(item.texto); setEditando(false); }}
          className="flex h-10 w-10 items-center justify-center text-stone-400"><X size={18} /></button>
      </li>
    );
  }
  return (
    <li className="group flex items-center gap-1">
      <button onClick={onAlternar} aria-pressed={feito}
        className="flex min-h-12 flex-1 items-center gap-3 py-1 text-left active:opacity-70">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${feito ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-stone-300 text-transparent'}`}>
          <Check size={15} strokeWidth={3} />
        </span>
        <span className={`text-[15px] ${feito ? 'text-stone-400 line-through' : ''}`}>{item.texto}</span>
      </button>
      <button aria-label="Editar" onClick={() => setEditando(true)} className="flex h-10 w-9 items-center justify-center text-stone-300 active:text-stone-600"><Pencil size={15} /></button>
      <button aria-label="Remover" onClick={() => confirm(`Remover "${item.texto}"?`) && onRemover()} className="flex h-10 w-9 items-center justify-center text-stone-300 active:text-stone-600"><Trash2 size={15} /></button>
    </li>
  );
}
