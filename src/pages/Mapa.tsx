import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapContainer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ChevronRight, ExternalLink, LocateFixed } from 'lucide-react';
import { useViagem } from '../estado';
import { corDia } from '../lib/datas';
import { linkRota } from '../lib/geo';
import Capa from '../components/Capa';
import LinkExterno from '../components/LinkExterno';
import TileLayerIDB from '../components/TileLayerIDB';
import type { Parada } from '../formato/tipos';

type Ponto = Parada & { dia: string; cor: string; rotuloDia: string; n: number; lat: number; lng: number };

const chave = (p: Ponto) => `${p.dia}-${p.id}`;
// Cor de "terreno" do OSM: enquanto um tile carrega, o buraco não aparece cinza
const FUNDO_MAPA = '#f2efe9';

const icone = (n: number, cor: string, ativo: boolean) =>
  L.divIcon({
    className: '',
    iconSize: ativo ? [40, 40] : [30, 30],
    iconAnchor: ativo ? [20, 20] : [15, 15],
    html: `<div style="background:${cor};width:100%;height:100%;border-radius:50%;color:#fff;font:700 ${ativo ? 15 : 13}px system-ui;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 8px #0004;transition:all .2s">${n}</div>`,
  });

export default function Mapa() {
  const { viagem } = useViagem();
  const [params, setParams] = useSearchParams();
  const filtro = params.get('dia') ?? 'todos';
  // Área do pacote de tiles: o mapa não sai dela. Sem pacote, enquadra as paradas.
  const area = useMemo(() => {
    if (!viagem.mapa) return undefined;
    const [o, s, l, n] = viagem.mapa.bbox;
    return L.latLngBounds([s, o], [n, l]);
  }, [viagem.mapa]);
  const zooms = viagem.mapa?.zooms ?? [3, 16];
  const foco = params.get('foco');

  const pontos = useMemo(() => {
    const dias = filtro === 'todos' ? viagem.dias : viagem.dias.filter((d) => d.id === filtro);
    return dias.flatMap((d) => d.paradas.filter((p) => p.local)
      .map((p, i): Ponto => ({ ...p, dia: d.id, cor: corDia(viagem, d), rotuloDia: d.rotulo, n: i + 1, lat: p.local!.lat, lng: p.local!.lng })));
  }, [viagem, filtro]);
  const centro = pontos[0] ?? (area ? { lat: area.getCenter().lat, lng: area.getCenter().lng } : { lat: -15.8, lng: -47.9 });

  const [ativo, setAtivo] = useState<string | null>(null);
  useEffect(() => {
    const alvo = pontos.find((p) => p.id === foco);
    setAtivo(alvo ? chave(alvo) : null);
  }, [pontos, foco]);

  const carrossel = useRef<HTMLDivElement>(null);
  const selecionar = (p: Ponto) => {
    setAtivo(chave(p));
    carrossel.current?.querySelector(`[data-chave="${chave(p)}"]`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  return (
    <div className="fixed inset-0" style={{ background: FUNDO_MAPA }}>
      <LimiteErro fallback={<ListaLocais pontos={pontos} />}>
        <MapContainer center={[centro.lat, centro.lng]} zoom={zooms[0] + 0.5} minZoom={zooms[0]} maxZoom={zooms[1] + 1} zoomControl={false}
          zoomSnap={0.25} zoomDelta={0.5} maxBounds={area} maxBoundsViscosity={1} bounceAtZoomLimits={false} inertia={false}
          className="h-full w-full" style={{ background: FUNDO_MAPA }}>
          <TileLayerIDB viagemId={viagem.id} bounds={area} maxNativeZoom={zooms[1]} />
          {viagem.dias.map((d) => {
            const ps = pontos.filter((p) => p.dia === d.id);
            return ps.length > 1 && <Polyline key={d.id} positions={ps.map((p) => [p.lat, p.lng])} pathOptions={{ color: corDia(viagem, d), weight: 4, dashArray: '6 8' }} />;
          })}
          {pontos.map((p) => (
            <Marker key={chave(p)} position={[p.lat, p.lng]} icon={icone(p.n, p.cor, ativo === chave(p))}
              zIndexOffset={ativo === chave(p) ? 1000 : 0} eventHandlers={{ click: () => selecionar(p) }} />
          ))}
          <Controlador pontos={pontos} area={area} ativo={pontos.find((p) => chave(p) === ativo)} />
        </MapContainer>

        {/* filtros flutuando no topo */}
        <div className="sem-barra absolute inset-x-0 z-[1000] flex justify-center gap-2 overflow-x-auto px-4" style={{ top: 'calc(env(safe-area-inset-top) + 2.75rem)' }}>
          {viagem.dias.length > 1 && [{ id: 'todos', rotulo: 'Todos', cor: '#292524' }, ...viagem.dias.map((d) => ({ id: d.id, rotulo: d.rotulo, cor: corDia(viagem, d) }))].map((f) => (
            <button key={f.id} onClick={() => setParams({ dia: f.id })}
              className={`chip shrink-0 shadow-md ${filtro === f.id ? 'text-white' : 'bg-white text-stone-600'}`}
              style={filtro === f.id ? { background: f.cor } : undefined}>
              {f.rotulo}
            </button>
          ))}
        </div>

        {/* carrossel de paradas acima da navegação */}
        <div ref={carrossel} className="sem-barra absolute inset-x-0 z-[1000] flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 6rem)' }}>
          {pontos.map((p) => (
            <div role="button" tabIndex={0} key={chave(p)} data-chave={chave(p)} onClick={() => setAtivo(chave(p))}
              className={`cartao flex w-[78%] max-w-xs shrink-0 snap-center items-center gap-3 p-2.5 text-left transition ${ativo === chave(p) ? 'ring-2' : ''}`}
              style={ativo === chave(p) ? { boxShadow: `0 0 0 2px ${p.cor}` } : undefined}>
              <Capa parada={p} tamanhoIcone={20} className="h-14 w-14 shrink-0 rounded-2xl" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold" style={{ color: p.cor }}>{p.n} · {p.rotuloDia}{p.hora && ` · ${p.hora}`}</p>
                <p className="line-clamp-2 font-semibold leading-tight">{p.nome}</p>
                {p.obs && <p className="truncate text-xs text-stone-500">{p.obs}</p>}
              </div>
              <Link to={`/parada/${p.dia}/${p.id}`} onClick={(e) => e.stopPropagation()} aria-label="Detalhes"
                className="flex h-10 w-8 items-center justify-center text-stone-400"><ChevronRight size={20} /></Link>
            </div>
          ))}
        </div>
      </LimiteErro>
    </div>
  );
}

function Controlador({ pontos, area, ativo }: { pontos: Ponto[]; area?: L.LatLngBounds; ativo?: Ponto }) {
  const map = useMap();
  const enquadrar = () => {
    if (pontos.length) map.fitBounds(pontos.map((p) => [p.lat, p.lng]), { paddingTopLeft: [24, 100], paddingBottomRight: [24, 190], maxZoom: 16 });
  };
  // Zoom mínimo = o menor que ainda deixa a tela inteira dentro da área baixada (sem fundo cinza)
  useEffect(() => {
    if (!area) return;
    const limitar = () => map.setMinZoom(map.getBoundsZoom(area, true));
    limitar();
    map.on('resize', limitar);
    return () => { map.off('resize', limitar); };
  }, [map, area]);
  useEffect(() => { enquadrar(); }, [map, pontos]);
  useEffect(() => {
    if (ativo) map.flyTo([ativo.lat, ativo.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [map, ativo]);
  return (
    <button onClick={enquadrar} aria-label="Ver todas as paradas"
      className="absolute right-4 z-[1000] flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md active:scale-95"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 12rem)' }}>
      <LocateFixed size={20} />
    </button>
  );
}

class LimiteErro extends Component<{ fallback: ReactNode; children: ReactNode }, { erro: boolean }> {
  state = { erro: false };
  static getDerivedStateFromError() { return { erro: true }; }
  render() { return this.state.erro ? this.props.fallback : this.props.children; }
}

function ListaLocais({ pontos }: { pontos: Ponto[] }) {
  return (
    <div className="h-full space-y-3 overflow-y-auto bg-fundo px-4 pb-32" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3rem)' }}>
      <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">O mapa não pôde ser carregado. Lista dos locais:</p>
      {pontos.map((p) => (
        <div key={chave(p)} className="cartao p-4">
          <p className="text-xs font-bold" style={{ color: p.cor }}>{p.rotuloDia}{p.hora && ` · ${p.hora}`}</p>
          <p className="font-semibold">{p.n}. {p.nome}</p>
          <p className="font-mono text-xs text-stone-500">{p.lat.toFixed(5)}, {p.lng.toFixed(5)}</p>
          <LinkExterno href={linkRota(p)} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700">
            <ExternalLink size={14} /> Abrir no Google Maps (requer internet)
          </LinkExterno>
        </div>
      ))}
    </div>
  );
}
