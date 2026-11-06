import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { EstadoProvider, useEstado } from './estado';
import StatusConexao from './components/StatusConexao';
import NavInferior from './components/NavInferior';
import Itinerario from './pages/Itinerario';
import Parada from './pages/Parada';
import Mapa from './pages/Mapa';
import Checklist from './pages/Checklist';
import Orcamento from './pages/Orcamento';
import MinhasViagens from './pages/MinhasViagens';
import { configurarVoltar } from './nativo/plataforma';

function Telas() {
  const { carregado, viagem } = useEstado();
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (!carregado) return <p className="pt-24 text-center text-sm text-stone-400">Carregando…</p>;
  if (!viagem) return <Routes><Route path="*" element={<MinhasViagens />} /></Routes>;
  return (
    <>
      <Routes>
        <Route path="/" element={<Itinerario />} />
        <Route path="/parada/:dia/:id" element={<Parada />} />
        <Route path="/mapa" element={<Mapa />} />
        <Route path="/checklist" element={<Checklist />} />
        <Route path="/orcamento" element={<Orcamento />} />
        <Route path="/viagens" element={<MinhasViagens />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <NavInferior />
    </>
  );
}

export default function App() {
  useEffect(() => { configurarVoltar(); }, []);
  return (
    <HashRouter>
      <EstadoProvider>
        <StatusConexao />
        <main className="mx-auto max-w-lg px-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 7rem)' }}>
          <Telas />
        </main>
      </EstadoProvider>
    </HashRouter>
  );
}
