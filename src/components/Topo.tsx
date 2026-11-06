import type { ReactNode } from 'react';

// Cabeçalho em degradê com cantos arredondados (padrão das referências)
export default function Topo({ titulo, subtitulo, acao, children, cor = '#E8613C' }: {
  titulo: string; subtitulo?: ReactNode; acao?: ReactNode; children?: ReactNode; cor?: string;
}) {
  return (
    <header className="relative -mx-4 mb-5 overflow-hidden rounded-b-[2rem] px-5 pb-6 text-white"
      style={{
        background: `linear-gradient(160deg, ${cor} 0%, ${cor}dd 45%, #2b1d4f 140%)`,
        paddingTop: 'calc(env(safe-area-inset-top) + 2.75rem)',
      }}>
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-16 right-16 h-32 w-32 rounded-full bg-white/10" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          {subtitulo && <p className="text-sm text-white/80">{subtitulo}</p>}
          <h1 className="mt-0.5 text-2xl font-bold leading-tight">{titulo}</h1>
        </div>
        {acao}
      </div>
      {children && <div className="relative mt-4">{children}</div>}
    </header>
  );
}

export function BotaoTopo({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props}
      className={`flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-full bg-white/20 px-3 text-sm font-medium text-white backdrop-blur active:scale-95 ${props.className ?? ''}`}>
      {children}
    </button>
  );
}
