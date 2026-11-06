import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DndContext, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Car, Check, ChevronRight, Clock, Footprints, GripVertical, Luggage, NotebookPen, Pencil, Plus, Trash2 } from 'lucide-react';
import { useViagem } from '../estado';
import { agora, contagem, corDia, diaPadrao, minutos, ordenarPorHora } from '../lib/datas';
import { deslocamento, formatarKm, novoId } from '../lib/geo';
import { CATEGORIAS } from '../formato/constantes';
import type { Dia, Parada } from '../formato/tipos';
import { visual } from '../lib/visual';
import { useAgora } from '../hooks/useOnline';
import Capa from '../components/Capa';
import Topo, { BotaoTopo } from '../components/Topo';
import FolhaInferior from '../components/FolhaInferior';

export default function Itinerario() {
  const { viagem, setViagem, estado, setEstado } = useViagem();
  const [diaId, setDiaId] = useState(() => diaPadrao(viagem).id);
  const [editando, setEditando] = useState(false);
  const [formulario, setFormulario] = useState<Parada | null>(null);
  useAgora();

  const dia = viagem.dias.find((d) => d.id === diaId) ?? viagem.dias[0];
  const paradas = dia.paradas;
  const cor = corDia(viagem, dia);
  const feita = (p: Parada) => !!estado.feitas[p.id];
  const setParadas = (fn: (p: Parada[]) => Parada[]) =>
    setViagem((v) => ({ ...v, dias: v.dias.map((d) => (d.id === dia.id ? { ...d, paradas: fn(d.paradas) } : d)) }));
  const alternar = (id: string) => setEstado((e) => {
    const feitas = { ...e.feitas };
    if (feitas[id]) delete feitas[id]; else feitas[id] = true;
    return { ...e, feitas };
  });

  // Destaque: no dia, a atual/próxima pelo relógio; fora dele, a primeira pendente
  const ag = agora(viagem.fuso);
  let destaque: { parada: Parada; rotulo: string } | null = null;
  if (ag.data === dia.data) {
    const iniciadas = paradas.filter((p) => p.hora && minutos(p.hora) <= ag.minutos);
    const atual = iniciadas[iniciadas.length - 1];
    const prox = paradas.find((p) => p.hora && minutos(p.hora) > ag.minutos && !feita(p));
    if (atual && !feita(atual)) destaque = { parada: atual, rotulo: 'Agora' };
    else if (prox) destaque = { parada: prox, rotulo: 'Próxima parada' };
  } else {
    const primeira = paradas.find((p) => !feita(p));
    if (primeira) destaque = { parada: primeira, rotulo: 'Primeira parada' };
  }
  const feitas = paradas.filter(feita).length;

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
  );
  const aoSoltar = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setParadas((ps) => arrayMove(ps, ps.findIndex((p) => p.id === active.id), ps.findIndex((p) => p.id === over.id)));
  };

  const salvar = (p: Parada, destino: string) => {
    setViagem((v) => ({
      ...v,
      dias: v.dias.map((d) => {
        const sem = d.paradas.filter((x) => x.id !== p.id);
        if (d.id !== destino) return { ...d, paradas: sem };
        const i = d.paradas.findIndex((x) => x.id === p.id);
        return { ...d, paradas: i >= 0 ? d.paradas.map((x) => (x.id === p.id ? p : x)) : ordenarPorHora([...sem, p]) };
      }),
    }));
    setFormulario(null);
  };

  return (
    <div>
      <Topo cor={cor} subtitulo={viagem.subtitulo ?? viagem.titulo} titulo={contagem(viagem)}
        acao={
          <div className="flex gap-2">
            <Link to="/viagens" aria-label="Minhas viagens" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur active:scale-95"><Luggage size={18} /></Link>
            <BotaoTopo onClick={() => setEditando((e) => !e)} aria-pressed={editando}>
              {editando ? <><Check size={16} /> Pronto</> : <><Pencil size={16} /> Editar</>}
            </BotaoTopo>
          </div>
        }>
        <div className="flex items-center gap-2">
          <div className="sem-barra -ml-1 flex gap-2 overflow-x-auto pl-1">
            {viagem.dias.map((d) => (
              <button key={d.id} onClick={() => setDiaId(d.id)}
                className={`chip shrink-0 ${dia.id === d.id ? 'bg-white shadow' : 'bg-white/20 text-white'}`}
                style={dia.id === d.id ? { color: corDia(viagem, d) } : undefined}>
                {d.rotulo}
              </button>
            ))}
          </div>
          <span className="ml-auto shrink-0 self-center text-sm font-medium text-white/85">{feitas}/{paradas.length} feitas</span>
        </div>
      </Topo>

      {destaque && !editando && <CartaoDestaque {...destaque} dia={dia} cor={cor} proxima={paradas[paradas.indexOf(destaque.parada) + 1]} />}

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Linha do tempo</h2>
        {editando && <span className="text-xs text-stone-500">Arraste <GripVertical size={12} className="inline" /> para reordenar</span>}
      </div>

      {paradas.length === 0 && <p className="cartao p-4 text-center text-sm text-stone-500">Nenhuma parada neste dia.</p>}
      <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={aoSoltar}>
        <SortableContext items={paradas.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <ol>
            {paradas.map((p, i) => (
              <ItemLinha key={p.id} parada={p} dia={dia} cor={cor} feita={feita(p)} proxima={paradas[i + 1]} editando={editando}
                emDestaque={destaque?.parada.id === p.id}
                onAlternar={() => alternar(p.id)}
                onEditar={() => setFormulario(p)}
                onRemover={() => confirm(`Remover "${p.nome}"?`) && setParadas((ps) => ps.filter((x) => x.id !== p.id))} />
            ))}
          </ol>
        </SortableContext>
      </DndContext>

      {editando && (
        <button onClick={() => setFormulario({ id: novoId('p'), hora: '12:00', nome: '', categoria: 'passeio' })} className="botao-primario mt-2 w-full text-sm">
          <Plus size={18} /> Nova parada
        </button>
      )}

      <section className="cartao mt-6 p-4">
        <h2 className="flex items-center gap-2 font-bold"><NotebookPen size={18} className="text-stone-400" /> Notas de {dia.rotulo}</h2>
        <textarea value={estado.notas[dia.id] ?? ''} onChange={(e) => setEstado((s) => ({ ...s, notas: { ...s.notas, [dia.id]: e.target.value } }))}
          rows={4} placeholder="Anotações livres… (salvas no aparelho, cifradas)"
          className="campo resize-none text-sm" />
      </section>

      {formulario && <FormParada inicial={formulario} dias={viagem.dias} diaInicial={dia.id} onSalvar={salvar} onFechar={() => setFormulario(null)} />}
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

function CartaoDestaque({ parada: p, rotulo, dia, cor, proxima }: { parada: Parada; rotulo: string; dia: Dia; cor: string; proxima?: Parada }) {
  return (
    <Link to={`/parada/${dia.id}/${p.id}`} className="relative mb-6 block h-48 overflow-hidden rounded-3xl shadow-lg active:scale-[0.99]">
      <div className="absolute inset-0"><Capa parada={p} tamanhoIcone={56} className="h-full w-full" /></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
      <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold" style={{ color: cor }}>{rotulo}</span>
      <div className="absolute inset-x-4 bottom-4 text-white">
        <p className="text-sm font-semibold text-white/85">{p.hora}{p.funcionamento && ` · ${p.funcionamento}`}</p>
        <h3 className="text-xl font-bold leading-tight">{p.nome}</h3>
        {proxima && <p className="mt-1 text-xs text-white/80">Depois: {proxima.nome}{deslocamento(p, proxima) && <> · <Deslocamento de={p} para={proxima} /></>}</p>}
      </div>
      <ChevronRight className="absolute bottom-5 right-4 text-white/80" />
    </Link>
  );
}

function ItemLinha({ parada: p, dia, cor, feita, proxima, editando, emDestaque, onAlternar, onEditar, onRemover }: {
  parada: Parada; dia: Dia; cor: string; feita: boolean; proxima?: Parada; editando: boolean; emDestaque: boolean;
  onAlternar: () => void; onEditar: () => void; onRemover: () => void;
}) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: p.id, disabled: !editando });

  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative pl-14 ${isDragging ? 'z-10' : ''}`}>
      <div className="absolute left-0 top-0 flex h-full w-11 flex-col items-center">
        <span className="pt-4 text-xs font-bold tabular-nums" style={{ color: feita ? '#a8a29e' : cor }}>{p.hora ?? '—'}</span>
        <span className="mt-1 w-0.5 flex-1 rounded-full" style={{ background: proxima ? `${cor}30` : 'transparent' }} />
      </div>

      <article onClick={() => !editando && navigate(`/parada/${dia.id}/${p.id}`)}
        className={`cartao flex items-center gap-3 p-2.5 pr-2 transition ${isDragging ? 'shadow-xl' : ''} ${!editando ? 'cursor-pointer active:scale-[0.99]' : ''} ${feita ? 'opacity-55' : ''}`}
        style={emDestaque ? { boxShadow: `0 0 0 2px ${cor}` } : undefined}>
        <Capa parada={p} tamanhoIcone={22} className="h-14 w-14 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <h3 className={`line-clamp-2 font-semibold leading-tight ${feita ? 'line-through' : ''}`}>{p.nome}</h3>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-stone-500">
            {visual(p.categoria).rotulo}{p.funcionamento && <><span>·</span><Clock size={11} />{p.funcionamento}</>}
          </p>
        </div>
        {editando ? (
          <div className="flex items-center">
            <button onClick={onEditar} aria-label="Editar" className="flex h-10 w-9 items-center justify-center text-stone-500"><Pencil size={17} /></button>
            <button onClick={onRemover} aria-label="Remover" className="flex h-10 w-9 items-center justify-center text-stone-500"><Trash2 size={17} /></button>
            <button {...attributes} {...listeners} aria-label="Arrastar" className="flex h-10 w-9 touch-none items-center justify-center text-stone-400"><GripVertical size={20} /></button>
          </div>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); onAlternar(); }} aria-label={feita ? 'Desmarcar' : 'Marcar como feito'} aria-pressed={feita}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-90 ${feita ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-stone-200 text-transparent'}`}>
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

export function FormParada({ inicial, dias, diaInicial, onSalvar, onFechar }: {
  inicial: Parada; dias: Dia[]; diaInicial: string; onSalvar: (p: Parada, dia: string) => void; onFechar: () => void;
}) {
  const [p, setP] = useState(inicial);
  const [dia, setDia] = useState(diaInicial);
  const [coord, setCoord] = useState({ lat: inicial.local?.lat.toString() ?? '', lng: inicial.local?.lng.toString() ?? '', endereco: inicial.local?.endereco ?? '' });
  const texto = (k: 'nome' | 'obs' | 'funcionamento') => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setP({ ...p, [k]: e.target.value || undefined });
  const num = (t: string) => { const n = parseFloat(t.replace(',', '.')); return Number.isFinite(n) ? n : undefined; };

  return (
    <FolhaInferior titulo={inicial.nome ? 'Editar parada' : 'Nova parada'} onFechar={onFechar}>
      <form className="space-y-3" onSubmit={(e) => {
        e.preventDefault();
        if (!p.nome?.trim()) return;
        const lat = num(coord.lat), lng = num(coord.lng);
        onSalvar({ ...p, nome: p.nome.trim(), local: lat != null && lng != null ? { lat, lng, ...(coord.endereco && { endereco: coord.endereco }) } : undefined }, dia);
      }}>
        <label className="block text-xs font-medium text-stone-500">Nome<input required value={p.nome ?? ''} onChange={texto('nome')} className="campo" /></label>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-medium text-stone-500">Horário<input type="time" value={p.hora ?? ''} onChange={(e) => setP({ ...p, hora: e.target.value || undefined })} className="campo" /></label>
          <label className="text-xs font-medium text-stone-500">Categoria
            <select value={p.categoria} onChange={(e) => setP({ ...p, categoria: e.target.value as Parada['categoria'] })} className="campo">
              {CATEGORIAS.map((c) => <option key={c} value={c}>{visual(c).rotulo}</option>)}
            </select>
          </label>
        </div>
        {dias.length > 1 && (
          <label className="block text-xs font-medium text-stone-500">Dia
            <select value={dia} onChange={(e) => setDia(e.target.value)} className="campo">
              {dias.map((d) => <option key={d.id} value={d.id}>{d.rotulo}</option>)}
            </select>
          </label>
        )}
        <label className="block text-xs font-medium text-stone-500">Funcionamento<input value={p.funcionamento ?? ''} onChange={texto('funcionamento')} placeholder="ex.: 9h–17h" className="campo" /></label>
        <label className="block text-xs font-medium text-stone-500">Observações<textarea rows={2} value={p.obs ?? ''} onChange={texto('obs')} className="campo resize-none" /></label>
        <label className="block text-xs font-medium text-stone-500">Endereço<input value={coord.endereco} onChange={(e) => setCoord({ ...coord, endereco: e.target.value })} className="campo" /></label>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-medium text-stone-500">Latitude<input inputMode="decimal" value={coord.lat} onChange={(e) => setCoord({ ...coord, lat: e.target.value })} placeholder="-22.62" className="campo" /></label>
          <label className="text-xs font-medium text-stone-500">Longitude<input inputMode="decimal" value={coord.lng} onChange={(e) => setCoord({ ...coord, lng: e.target.value })} placeholder="-47.06" className="campo" /></label>
        </div>
        <button className="botao-primario w-full">Salvar</button>
      </form>
    </FolhaInferior>
  );
}
