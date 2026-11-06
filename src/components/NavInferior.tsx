import { NavLink } from 'react-router-dom';
import { CalendarClock, Map, ListChecks, Wallet } from 'lucide-react';

const ABAS = [
  { to: '/', rotulo: 'Roteiro', Icone: CalendarClock },
  { to: '/mapa', rotulo: 'Mapa', Icone: Map },
  { to: '/checklist', rotulo: 'Checklist', Icone: ListChecks },
  { to: '/orcamento', rotulo: 'Orçamento', Icone: Wallet },
];

export default function NavInferior() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[1000] px-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}>
      <div className="mx-auto grid max-w-md grid-cols-4 rounded-[1.75rem] bg-white/95 p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] ring-1 ring-black/5 backdrop-blur">
        {ABAS.map(({ to, rotulo, Icone }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) => `flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-medium transition-colors
              ${isActive ? 'bg-laranja/10 text-laranja' : 'text-stone-400 active:bg-stone-100'}`}>
            {({ isActive }) => (<><Icone size={22} strokeWidth={isActive ? 2.4 : 2} />{rotulo}</>)}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
