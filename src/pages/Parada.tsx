import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Car, Check, Clock, MapPin, Navigation, Tag, type LucideIcon } from 'lucide-react';
import { useEstado } from '../estado';
import { CORES, ROTULOS } from '../lib/datas';
import { deslocamento, formatarKm, linkRota, linkWaze, vaiDeCarro } from '../lib/geo';
import { visual } from '../lib/visual';
import Capa from '../components/Capa';
import LinkExterno from '../components/LinkExterno';
import type { DiaId } from '../lib/types';

export default function Parada() {
  const { dia, id } = useParams() as { dia: DiaId; id: string };
  const navigate = useNavigate();
  const { roteiro, setRoteiro } = useEstado();
  const paradas = roteiro[dia] ?? [];
  const i = paradas.findIndex((p) => p.id === id);
  const p = paradas[i];

  if (!p) {
    return (
      <div className="pt-24 text-center">
        <p className="text-stone-500">Parada não encontrada.</p>
        <Link to="/" className="mt-4 inline-block font-semibold text-laranja">Voltar ao roteiro</Link>
      </div>
    );
  }

  const cor = CORES[dia];
  const proxima = paradas[i + 1];
  const desl = proxima ? deslocamento(p, proxima) : null;
  const temCoord = p.lat != null && p.lng != null;
  const deCarro = vaiDeCarro(p, paradas[i - 1]);
  const { Icone } = visual(p.categoria);
  const alternar = () => setRoteiro((r) => ({ ...r, [dia]: r[dia].map((x) => (x.id === id ? { ...x, feito: !x.feito } : x)) }));

  return (
    <div className="-mx-4">
      <div className="relative">
        <Capa id={p.id} categoria={p.categoria} tamanhoIcone={72} editavel posicaoBotoes="bottom-12 right-4" className="h-80 w-full" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/40 to-transparent" />
        <button onClick={() => (history.length > 1 ? navigate(-1) : navigate('/'))} aria-label="Voltar"
          className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow active:scale-95"
          style={{ top: 'calc(env(safe-area-inset-top) + 2.5rem)' }}>
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="relative -mt-8 space-y-5 rounded-t-[2rem] bg-fundo px-4 pt-6">
        <div>
          <span className="text-sm font-bold" style={{ color: cor }}>{ROTULOS[dia]} · {p.hora}</span>
          <h1 className="text-2xl font-bold leading-tight">{p.nome}</h1>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Info Icone={Clock} rotulo="Horário" valor={p.hora} />
          <Info Icone={Icone} rotulo="Categoria" valor={p.categoria} />
          <Info Icone={Tag} rotulo="Funciona" valor={p.funcionamento ?? '—'} />
        </div>

        {p.obs && (
          <section className="cartao p-4">
            <h2 className="mb-1 text-sm font-bold">Observações</h2>
            <p className="text-stone-600">{p.obs}</p>
          </section>
        )}

        {proxima && (
          <Link to={`/parada/${dia}/${proxima.id}`} replace className="cartao flex items-center gap-3 p-3 active:scale-[0.99]">
            <Capa id={proxima.id} categoria={proxima.categoria} tamanhoIcone={20} className="h-12 w-12 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-stone-500">Depois · {proxima.hora}</p>
              <p className="truncate font-semibold">{proxima.nome}</p>
            </div>
            {desl && <span className="shrink-0 text-xs font-medium text-stone-500">~{desl.min} min<br />{formatarKm(desl.km)}</span>}
          </Link>
        )}

        {temCoord && (
          <section className="cartao p-4">
            <h2 className="mb-1 flex items-center gap-1.5 text-sm font-bold"><MapPin size={16} /> Localização</h2>
            <p className="font-mono text-xs text-stone-500">{p.lat!.toFixed(5)}, {p.lng!.toFixed(5)}</p>
            <Link to={`/mapa?dia=${dia}&foco=${p.id}`} className="mt-2 inline-block text-sm font-semibold" style={{ color: cor }}>
              Ver no mapa offline →
            </Link>
          </section>
        )}
        <div className="h-40" />
      </div>

      {/* barra de ações fixa, acima da navegação */}
      <div className="fixed inset-x-0 z-[1001] px-4" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5.75rem)' }}>
        <div className="mx-auto flex max-w-md gap-2 rounded-3xl bg-white/95 p-2 shadow-[0_8px_30px_rgba(0,0,0,0.12)] ring-1 ring-black/5 backdrop-blur">
          <button onClick={alternar} aria-pressed={!!p.feito}
            className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-2xl py-3.5 font-semibold active:scale-[0.98] ${p.feito ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-700'}`}>
            <Check size={18} strokeWidth={3} /> {p.feito ? 'Feito' : deCarro ? 'Marcar' : 'Marcar feito'}
          </button>
          {temCoord && (
            <LinkExterno href={linkRota(p)} className="botao-primario flex-1 whitespace-nowrap">
              <Navigation size={18} /> {deCarro ? 'Maps' : 'Como chegar'}
            </LinkExterno>
          )}
          {deCarro && (
            <LinkExterno href={linkWaze(p)} aria-label="Abrir rota no Waze"
              className="flex items-center justify-center gap-1.5 flex-1 whitespace-nowrap rounded-2xl bg-sky-500 px-4 py-3.5 font-semibold text-white active:scale-[0.98]">
              <Car size={18} /> Waze
            </LinkExterno>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ Icone, rotulo, valor }: { Icone: LucideIcon; rotulo: string; valor: string }) {
  return (
    <div className="cartao flex flex-col items-center gap-1 px-2 py-3 text-center">
      <span className="text-stone-400"><Icone size={20} /></span>
      <span className="text-[10px] uppercase tracking-wide text-stone-400">{rotulo}</span>
      <span className="line-clamp-2 text-xs font-semibold leading-tight">{valor}</span>
    </div>
  );
}
