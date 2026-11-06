import { BedDouble, Car, Flower2, ShoppingBag, Sparkles, Utensils, type LucideIcon } from 'lucide-react';

// Placeholders ilustrados por categoria (sem imagens externas)
export const VISUAL: Record<string, { Icone: LucideIcon; degrade: string }> = {
  Passeio: { Icone: Flower2, degrade: 'from-rose-400 via-orange-300 to-amber-200' },
  Refeição: { Icone: Utensils, degrade: 'from-amber-500 via-amber-300 to-yellow-200' },
  Hospedagem: { Icone: BedDouble, degrade: 'from-violet-600 via-purple-400 to-fuchsia-300' },
  Transporte: { Icone: Car, degrade: 'from-sky-600 via-sky-400 to-cyan-200' },
  Compras: { Icone: ShoppingBag, degrade: 'from-pink-500 via-pink-300 to-rose-200' },
};
export const VISUAL_PADRAO = { Icone: Sparkles, degrade: 'from-stone-500 via-stone-400 to-stone-200' };
export const visual = (categoria: string) => VISUAL[categoria] ?? VISUAL_PADRAO;
