import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

// Bottom sheet para formulários (padrão mobile)
export default function FolhaInferior({ titulo, onFechar, children }: { titulo: string; onFechar: () => void; children: ReactNode }) {
  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onFechar();
    window.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = anterior; window.removeEventListener('keydown', esc); };
  }, [onFechar]);

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/40 backdrop-blur-[2px]" onClick={onFechar}>
      <div role="dialog" aria-modal="true" aria-label={titulo} onClick={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-white px-5 pt-2"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}>
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-stone-200" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{titulo}</h2>
          <button onClick={onFechar} aria-label="Fechar" className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
