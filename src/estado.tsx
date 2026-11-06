import { createContext, useContext, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import { usePersistido } from './hooks/usePersistido';
import { CHECKLIST_ORIGINAL, ORCAMENTO_ORIGINAL, ROTEIRO_ORIGINAL, migrarOrcamento } from './data/roteiro';
import type { Checklist, DiaId, Orcamento, Roteiro } from './lib/types';

type Set<T> = Dispatch<SetStateAction<T>>;
interface Estado {
  roteiro: Roteiro; setRoteiro: Set<Roteiro>;
  notas: Record<DiaId, string>; setNotas: Set<Record<DiaId, string>>;
  checklist: Checklist; setChecklist: Set<Checklist>;
  orcamento: Orcamento; setOrcamento: Set<Orcamento>;
  carregado: boolean;
}

const Ctx = createContext<Estado | null>(null);

export function EstadoProvider({ children }: { children: ReactNode }) {
  const [roteiro, setRoteiro, c1] = usePersistido<Roteiro>('roteiro', ROTEIRO_ORIGINAL);
  const [notas, setNotas, c2] = usePersistido<Record<DiaId, string>>('notas', { sab: '', dom: '' });
  const [checklist, setChecklist, c3] = usePersistido<Checklist>('checklist', CHECKLIST_ORIGINAL);
  const [orcamento, setOrcamento, c4] = usePersistido<Orcamento>('orcamento', ORCAMENTO_ORIGINAL, migrarOrcamento);
  return (
    <Ctx.Provider value={{ roteiro, setRoteiro, notas, setNotas, checklist, setChecklist, orcamento, setOrcamento, carregado: c1 && c2 && c3 && c4 }}>
      {children}
    </Ctx.Provider>
  );
}

export const useEstado = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useEstado fora do EstadoProvider');
  return c;
};
