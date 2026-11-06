import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { estadoVazio, type EstadoViagem, type Viagem } from './formato/tipos';
import * as repo from './viagens/repositorio';

type Atualizar<T> = (fn: (atual: T) => T) => void;
interface Contexto {
  viagem: Viagem | null;
  estado: EstadoViagem;
  indice: repo.ItemIndice[];
  carregado: boolean;
  setViagem: Atualizar<Viagem>;
  setEstado: Atualizar<EstadoViagem>;
  ativar: (id: string) => Promise<void>;
  recarregar: () => Promise<void>;
}

const Ctx = createContext<Contexto | null>(null);

// Primeiro uso: instala a viagem de exemplo que vem com o app (public/exemplo)
async function semear() {
  try {
    const r = await fetch('exemplo/holambra.viagem.zip');
    if (r.ok) await (await import('./viagens/importar')).importarArquivo(new Uint8Array(await r.arrayBuffer()));
  } catch { /* sem exemplo: começa vazio */ }
}

export function EstadoProvider({ children }: { children: ReactNode }) {
  const [viagem, setV] = useState<Viagem | null>(null);
  const [estado, setE] = useState<EstadoViagem>(estadoVazio());
  const [indice, setIndice] = useState<repo.ItemIndice[]>([]);
  const [carregado, setCarregado] = useState(false);

  const recarregar = useCallback(async () => {
    let ind = await repo.lerIndice();
    if (!ind.length && !localStorage.getItem('viagem:semeado')) {
      await semear();
      try { localStorage.setItem('viagem:semeado', '1'); } catch { /* ignora */ }
      ind = await repo.lerIndice();
    }
    let ativa = await repo.lerAtiva();
    if (!ind.some((i) => i.id === ativa)) ativa = ind[0]?.id;
    const v = ativa ? await repo.lerViagem(ativa) : undefined;
    setIndice(ind);
    setV(v ?? null);
    setE(v ? await repo.lerEstado(v.id) : estadoVazio());
    setCarregado(true);
  }, []);

  useEffect(() => { recarregar(); }, [recarregar]);

  // Refs com o valor atual: as atualizações gravam fora do updater do React (sem efeito duplo)
  const vRef = useRef<Viagem | null>(null);
  const eRef = useRef<EstadoViagem>(estadoVazio());
  vRef.current = viagem;
  eRef.current = estado;

  const setViagem: Atualizar<Viagem> = useCallback((fn) => {
    const atual = vRef.current;
    if (!atual) return;
    const nova = fn(atual);
    vRef.current = nova;
    setV(nova);
    // Valida com o schema (carregado sob demanda) antes de gravar; se inválida, desfaz
    import('./formato/validar').then(async ({ validarViagem, errosEmTexto }) => {
      const r = validarViagem(nova);
      if (!r.ok) {
        alert(`Não foi possível salvar:\n${errosEmTexto(r.erros)}`);
        if (vRef.current === nova) { vRef.current = atual; setV(atual); }
        return;
      }
      await repo.gravarViagem(r.viagem);
      setIndice(await repo.lerIndice());
    });
  }, []);

  const setEstado: Atualizar<EstadoViagem> = useCallback((fn) => {
    const v = vRef.current;
    if (!v) return;
    const novo = fn(eRef.current);
    eRef.current = novo;
    setE(novo);
    repo.gravarEstado(v.id, novo);
  }, []);

  const ativar = useCallback(async (id: string) => { await repo.definirAtiva(id); await recarregar(); }, [recarregar]);

  return (
    <Ctx.Provider value={{ viagem, estado, indice, carregado, setViagem, setEstado, ativar, recarregar }}>
      {children}
    </Ctx.Provider>
  );
}

export const useEstado = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useEstado fora do EstadoProvider');
  return c;
};

// Para telas que só existem com uma viagem ativa (App.tsx garante)
export const useViagem = () => {
  const c = useEstado();
  if (!c.viagem) throw new Error('sem viagem ativa');
  return { ...c, viagem: c.viagem };
};
