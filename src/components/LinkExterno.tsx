import type { ReactNode } from 'react';
import { WifiOff } from 'lucide-react';
import { useOnline } from '../hooks/useOnline';

// Links que dependem de internet: ficam visivelmente indisponíveis quando offline
export default function LinkExterno({ href, children, className = '' }: { href: string; children: ReactNode; className?: string }) {
  const online = useOnline();
  if (!online) {
    return (
      <span aria-disabled="true" className={`${className} cursor-not-allowed opacity-60`} title="Precisa de internet">
        <WifiOff size={16} /> Sem internet
      </span>
    );
  }
  return <a href={href} target="_blank" rel="noreferrer" className={className}>{children}</a>;
}
