import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DndContext, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Car, Check, ChevronRight, Clock, Footprints, GripVertical, NotebookPen, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useEstado } from '../estado';
import { ROTEIRO_ORIGINAL } from '../data/roteiro';
import { CORES, DATAS, ROTULOS, agoraSP, diaDeHoje, minutos } from '../lib/datas';
import { deslocamento, formatarKm } from '../lib/geo';
import { novoId } from '../lib/storage';
import { useAgora } from '../hooks/useOnline';
import Capa from '../components/Capa';
import Topo, { BotaoTopo } from '../components/Topo';
import FolhaInferior from '../components/FolhaInferior';
import type { DiaId, Parada } from '../lib/types';

const CATEGORIAS = ['Passeio', 'Refeição', 'Hospedagem', 'Transporte', 'Compras', 'Outros'];

function contagem() {
  const hoje = new Date(`${agoraSP().data}T00:00:00`);
  const dias = Math.round((new Date(`${DATAS.sab}T00:00:00`).getTime() - hoje.getTime()) / 86_400_000);
  if (dias > 1) return `Faltam ${dias} dias 💐`;
  if (dias === 1) return 'É amanhã! 💐';
  if (dias === 0) return 'Hoje é sábado de flores 🌷';
  if (dias === -1) return 'Último dia em Holambra 🌻';
  return 'Viagem concluída 💐';
}

export default function Itinerario() {
  const { roteiro, setRoteiro, notas, setNotas } = useEstado();
  const [dia, setDia] = useState<DiaId>(() => diaDeHoje() ?? 'sab');
  const [editando, setEditando] = useState(false);
  const [formulario, setFormulario] = useState<Parada | null>(null);
  useAgora();

  const paradas = roteiro[dia];
  const cor = CORES[dia];
  const setParadas = (fn: (p: Parada[]) => Parada[]) => setRoteiro((r) => ({ ...r, [dia]: fn(r[dia]) }));
  const alternar = (id: string) => setParadas((ps) => ps.map((x) => (x.id === id ? { ...x, feito: !x.feito } : x)));

  // Parada em destaque: no dia da viagem, a atual/próxima pelo relógio; fora dele, a primeira pendente
  const agora = agoraSP();
  let destaque: { parada: Parada; rotulo: string } | null = null;
  if (agora.data === DATAS[dia]) {
    const iniciadas = paradas.filter((p) => minutos(p.hora) <= agora.minutos);
    const atual = iniciadas[iniciadas.length - 1];
    const prox = paradas.find((p) => minutos(p.hora) > agora.minutos && !p.feito);
    if (atual && !atual.feito) destaque = { parada: atual, rotulo: 'Agora' };
    else if (prox) destaque = { parada: prox, rotulo: 'Próxima parada' };
  } else {
    const primeira = paradas.find((p) => !p.feito);
    if (primeira) destaque = { parada: primeira, rotulo: 'Primeira parada' };
  }
  const feitas = paradas.filter((p) => p.feito).length;

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
  );
  const aoSoltar = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setParadas((ps) => arrayMove(ps, ps.findIndex((p) => p.id === active.id), ps.findIndex((p) => p.id === over.id)));
  };

  const salvar = (p: Parada) => {
    setParadas((ps) => ps.some((x) => x.id === p.id)
      ? ps.map((x) => (x.id === p.id ? p : x))
      : [...ps, p].sort((a, b) => minutos(a.hora) - minutos(b.hora)));
    setFormulario(null);
  };

  return (
    <div>
      <Topo cor={cor} subtitulo="Holambra · 14 e 15 de novembro" titulo={contagem()}
        acao={
          <BotaoTopo onClick={() => setEditando((e) => !e)} aria-pressed={editando}>
            {editando ? <><Check size={16} /> Pronto</> : <><Pencil size={16} /> Editar</>}
          </BotaoTopo>
        }>
        <div className="flex gap-2">
          {(['sab', 'dom'] as DiaId[]).map((d) => (
            <button key={d} onClick={() => setDia(d)}
              className={`chip ${dia === d ? 'bg-white shadow' : 'bg-white/20 text-white'}`}
              style={dia === d ? { color: CORES[d] } : undefined}>
              {ROTULOS[d]}
            </button>
          ))}
          <span className="ml-auto self-center text-sm font-medium text-white/85">{feitas}/{paradas.length} feitas</span>
        </div>
      </Topo>

      {destaque && !editando && <CartaoDestaque {...destaque} dia={dia} proxima={paradas[paradas.indexOf(destaque.parada) + 1]} />}

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Linha do tempo</h2>
        {editando && <span className="text-xs text-stone-500">Arraste <GripVertical size={12} className="inline" /> para reordenar</span>}
      </div>

      <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={aoSoltar}>
        <SortableContext items={paradas.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <ol>
            {paradas.map((p, i) => (
              <ItemLinha key={p.id} parada={p} dia={dia} proxima={paradas[i + 1]} editando={editando}
                emDestaque={destaque?.parada.id === p.id}
                onAlternar={() => alternar(p.id)}
                onEditar={() => setFormulario(p)}
                onRemover={() => confirm(`Remover "${p.nome}"?`) && setParadas((ps) => ps.filter((x) => x.id !== p.id))} />
            ))}
          </ol>
        </SortableContext>
      </DndContext>

      {editando && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button onClick={() => setFormulario({ id: novoId(), hora: '12:00', nome: '', categoria: 'Passeio' })} className="botao-primario text-sm">
            <Plus size={18} /> Nova parada
          </button>
          <button onClick={() => confirm('Restaurar o roteiro original? Suas edições nos dois dias serão perdidas.') && setRoteiro(ROTEIRO_ORIGINAL)}
            className="botao-secundario text-sm">
            <RotateCcw size={18} /> Restaurar original
          </button>
        </div>
      )}

      <section className="cartao mt-6 p-4">
        <h2 className="flex items-center gap-2 font-bold"><NotebookPen size={18} className="text-stone-400" /> Notas de {ROTULOS[dia]}</h2>
        <textarea value={notas[dia]} onChange={(e) => setNotas((n) => ({ ...n, [dia]: e.target.value }))}
          rows={4} placeholder="Anotações livres… (salvas no aparelho)"
          className="campo resize-none text-sm" />
      </section>

      {formulario && <FormParada inicial={formulario} onSalvar={salvar} onFechar={() => setFormulario(null)} />}
    </div>
  );
}

function Deslocamento({ de, para }: { de: Parada; para?: Parada }) {
  const d = para ? deslocamento(de, para) : null;
  if (!d) return null;
  return (
    <span className="inline-flex items-center gap-1">
      {d.modo === 'pe' ? <Footprints size={13} /> : <Car size={13} />}
      ~{d.min} min · {formatarKm(d.km)} {d.modo === 'pe' ? 'a pé' : 'de carro'}
    </span>
  );
}

function CartaoDestaque({ parada: p, rotulo, dia, proxima }: { parada: Parada; rotulo: string; dia: DiaId; proxima?: Parada }) {
  return (
    <Link to={`/parada/${dia}/${p.id}`} className="relative mb-6 block h-48 overflow-hidden rounded-3xl shadow-lg active:scale-[0.99]">
      <div className="absolute inset-0"><Capa id={p.id} categoria={p.categoria} tamanhoIcone={56} className="h-full w-full" /></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
      <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold" style={{ color: CORES[dia] }}>{rotulo}</span>
      <div className="absolute inset-x-4 bottom-4 text-white">
        <p className="text-sm font-semibold text-white/85">{p.hora}{p.funcionamento && ` · ${p.funcionamento}`}</p>
        <h3 className="text-xl font-bold leading-tight">{p.nome}</h3>
        {proxima && <p className="mt-1 text-xs text-white/80">Depois: {proxima.nome}{deslocamento(p, proxima) && <> · <Deslocamento de={p} para={proxima} /></>}</p>}
      </div>
      <ChevronRight className="absolute bottom-5 right-4 text-white/80" />
    </Link>
  );
}

function ItemLinha({ parada: p, dia, proxima, editando, emDestaque, onAlternar, onEditar, onRemover }: {
  parada: Parada; dia: DiaId; proxima?: Parada; editando: boolean; emDestaque: boolean;
  onAlternar: () => void; onEditar: () => void; onRemover: () => void;
}) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: p.id, disabled: !editando });
  const cor = CORES[dia];

  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative pl-14 ${isDragging ? 'z-10' : ''}`}>
      {/* coluna de horário + trilho */}
      <div className="absolute left-0 top-0 flex h-full w-11 flex-col items-center">
        <span className="pt-4 text-xs font-bold tabular-nums" style={{ color: p.feito ? '#a8a29e' : cor }}>{p.hora}</span>
        <span className="mt-1 w-0.5 flex-1 rounded-full" style={{ background: proxima ? `${cor}30` : 'transparent' }} />
      </div>

      <article onClick={() => !editando && navigate(`/parada/${dia}/${p.id}`)}
        className={`cartao flex items-center gap-3 p-2.5 pr-2 transition ${isDragging ? 'shadow-xl' : ''} ${!editando ? 'cursor-pointer active:scale-[0.99]' : ''} ${p.feito ? 'opacity-55' : ''}`}
        style={emDestaque ? { boxShadow: `0 0 0 2px ${cor}` } : undefined}>
        <Capa id={p.id} categoria={p.categoria} tamanhoIcone={22} className="h-14 w-14 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <h3 className={`line-clamp-2 font-semibold leading-tight ${p.feito ? 'line-through' : ''}`}>{p.nome}</h3>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-stone-500">
            {p.categoria}{p.funcionamento && <><span>·</span><Clock size={11} />{p.funcionamento}</>}
          </p>
        </div>
        {editando ? (
          <div className="flex items-center">
            <button onClick={onEditar} aria-label="Editar" className="flex h-10 w-9 items-center justify-center text-stone-500"><Pencil size={17} /></button>
            <button onClick={onRemover} aria-label="Remover" className="flex h-10 w-9 items-center justify-center text-stone-500"><Trash2 size={17} /></button>
            <button {...attributes} {...listeners} aria-label="Arrastar" className="flex h-10 w-9 touch-none items-center justify-center text-stone-400"><GripVertical size={20} /></button>
          </div>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); onAlternar(); }} aria-label={p.feito ? 'Desmarcar' : 'Marcar como feito'} aria-pressed={!!p.feito}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-90 ${p.feito ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-stone-200 text-transparent'}`}>
            <Check size={20} strokeWidth={3} />
          </button>
        )}
      </article>

      <div className="flex h-8 items-center pl-2 text-[11px] font-medium text-stone-400">
        <Deslocamento de={p} para={proxima} />
      </div>
    </li>
  );
}

function FormParada({ inicial, onSalvar, onFechar }: { inicial: Parada; onSalvar: (p: Parada) => void; onFechar: () => void }) {
  const [p, setP] = useState(inicial);
  const [coord, setCoord] = useState({ lat: inicial.lat?.toString() ?? '', lng: inicial.lng?.toString() ?? '' });
  const campo = (k: keyof Parada) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setP({ ...p, [k]: e.target.value });
  const paraNum = (t: string) => {
    const n = parseFloat(t.replace(',', '.'));
    return Number.isFinite(n) ? n : undefined;
  };

  return (
    <FolhaInferior titulo={inicial.nome ? 'Editar parada' : 'Nova parada'} onFechar={onFechar}>
      <form className="space-y-3" onSubmit={(e) => {
        e.preventDefault();
        if (p.nome.trim()) onSalvar({ ...p, lat: paraNum(coord.lat), lng: paraNum(coord.lng) });
      }}>
        <label className="block text-xs font-medium text-stone-500">Nome<input required value={p.nome} onChange={campo('nome')} className="campo" /></label>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-medium text-stone-500">Horário<input type="time" required value={p.hora} onChange={campo('hora')} className="campo" /></label>
          <label className="text-xs font-medium text-stone-500">Categoria
            <select value={p.categoria} onChange={campo('categoria')} className="campo">
              {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        </div>
        <label className="block text-xs font-medium text-stone-500">Funcionamento<input value={p.funcionamento ?? ''} onChange={campo('funcionamento')} placeholder="ex.: 9h–17h" className="campo" /></label>
        <label className="block text-xs font-medium text-stone-500">Observações<input value={p.obs ?? ''} onChange={campo('obs')} className="campo" /></label>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-medium text-stone-500">Latitude<input inputMode="decimal" value={coord.lat} onChange={(e) => setCoord({ ...coord, lat: e.target.value })} placeholder="-22.62" className="campo" /></label>
          <label className="text-xs font-medium text-stone-500">Longitude<input inputMode="decimal" value={coord.lng} onChange={(e) => setCoord({ ...coord, lng: e.target.value })} placeholder="-47.06" className="campo" /></label>
        </div>
        <button className="botao-primario w-full">Salvar</button>
      </form>
    </FolhaInferior>
  );
}
