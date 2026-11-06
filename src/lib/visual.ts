import { BedDouble, Car, Flower2, ShoppingBag, Sparkles, Utensils, type LucideIcon } from 'lucide-react';
import type { Categoria } from '../formato/tipos';

// Placeholders ilustrados por categoria (sem imagens externas)
export const VISUAL: Record<Categoria, { Icone: LucideIcon; degrade: string; rotulo: string }> = {
  passeio: { Icone: Flower2, degrade: 'from-rose-400 via-orange-300 to-amber-200', rotulo: 'Passeio' },
  refeicao: { Icone: Utensils, degrade: 'from-amber-500 via-amber-300 to-yellow-200', rotulo: 'Refeição' },
  hospedagem: { Icone: BedDouble, degrade: 'from-violet-600 via-purple-400 to-fuchsia-300', rotulo: 'Hospedagem' },
  transporte: { Icone: Car, degrade: 'from-sky-600 via-sky-400 to-cyan-200', rotulo: 'Transporte' },
  compras: { Icone: ShoppingBag, degrade: 'from-pink-500 via-pink-300 to-rose-200', rotulo: 'Compras' },
  outro: { Icone: Sparkles, degrade: 'from-stone-500 via-stone-400 to-stone-200', rotulo: 'Outro' },
};
export const visual = (c: string) => VISUAL[c as Categoria] ?? VISUAL.outro;
