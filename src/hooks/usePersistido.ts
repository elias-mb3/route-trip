import { useEffect, useRef, useState } from 'react';
import { gravar, ler } from '../lib/storage';

// Estado que carrega do IndexedDB na montagem e grava a cada mudança.
// `migrar` adapta valores gravados por versões antigas do app.
export function usePersistido<T>(chave: string, inicial: T, migrar?: (v: unknown) => T) {
  const [valor, setValor] = useState<T>(inicial);
  const [carregado, setCarregado] = useState(false);
  const primeira = useRef(true);

  useEffect(() => {
    ler<T>(chave).then((v) => {
      if (v !== undefined) setValor(migrar ? migrar(v) : v);
      setCarregado(true);
    });
  }, [chave]);

  useEffect(() => {
    if (!carregado) return;
    if (primeira.current) { primeira.current = false; return; }
    gravar(chave, valor);
  }, [chave, valor, carregado]);

  return [valor, setValor, carregado] as const;
}
