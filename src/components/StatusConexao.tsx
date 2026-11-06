import { useEffect, useState } from 'react';
import { CheckCircle2, CloudOff, Wifi } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useOnline } from '../hooks/useOnline';

// Pílula fixa no topo + aviso quando o app termina de ser salvo para uso offline
export default function StatusConexao() {
  const online = useOnline();
  const { offlineReady: [pronto, setPronto] } = useRegisterSW({ immediate: true });
  const [controlado, setControlado] = useState(() => !!navigator.serviceWorker?.controller);
  const [mudou, setMudou] = useState(false);

  useEffect(() => {
    const sw = navigator.serviceWorker;
    const aoMudar = () => setControlado(true);
    sw?.addEventListener('controllerchange', aoMudar);
    return () => sw?.removeEventListener('controllerchange', aoMudar);
  }, []);

  // Destaca a pílula por alguns segundos quando a conexão muda
  useEffect(() => {
    setMudou(true);
    const t = setTimeout(() => setMudou(false), 4000);
    return () => clearTimeout(t);
  }, [online]);

  useEffect(() => {
    if (!pronto) return;
    const t = setTimeout(() => setPronto(false), 5000);
    return () => clearTimeout(t);
  }, [pronto, setPronto]);

  const texto = online ? (controlado || pronto ? 'Online · pronto offline' : 'Online') : 'Offline – tudo salvo no aparelho';

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 z-[1500] flex justify-center"
        style={{ top: 'calc(env(safe-area-inset-top) + 0.5rem)' }}>
        <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold shadow-sm backdrop-blur transition-all duration-300
          ${online ? 'bg-white/80 text-emerald-700' : 'bg-stone-900/85 text-white'} ${mudou ? 'scale-105' : ''}`}>
          {online ? <Wifi size={12} /> : <CloudOff size={12} />}
          {texto}
        </div>
      </div>
      {pronto && (
        <div role="status" className="fixed inset-x-4 z-[1500] mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-stone-900 p-4 text-sm text-white shadow-xl"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 6rem)' }}>
          <CheckCircle2 className="shrink-0 text-emerald-400" />
          <div><strong>Pronto para usar offline.</strong><br /><span className="text-white/70">Pode viajar sem sinal: roteiro, mapa e dados estão no aparelho.</span></div>
        </div>
      )}
    </>
  );
}
