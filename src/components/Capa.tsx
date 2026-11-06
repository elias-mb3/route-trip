import { useEffect, useRef, useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { apagar, gravar, ler } from '../lib/storage';
import { visual } from '../lib/visual';
import { FOTOS, fotoPadrao } from '../data/fotos';

// Foto do local guardada no IndexedDB (Blob), com URL de objeto gerenciada
export function useFoto(id: string) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    let atual: string | undefined;
    ler<Blob>(`foto:${id}`).then((b) => { if (b) setUrl((atual = URL.createObjectURL(b))); });
    return () => { if (atual) URL.revokeObjectURL(atual); };
  }, [id]);
  const definir = async (f: File) => { await gravar(`foto:${id}`, f); setUrl(URL.createObjectURL(f)); };
  const remover = async () => { await apagar(`foto:${id}`); setUrl(undefined); };
  return { url, definir, remover };
}

// Capa do local: foto do usuário, foto do local que vem com o app ou degradê + ícone da categoria. Preenche o contêiner.
export default function Capa({ id, categoria, tamanhoIcone = 28, editavel = false, className = '', posicaoBotoes = 'bottom-3 right-3' }: {
  id: string; categoria: string; tamanhoIcone?: number; editavel?: boolean; className?: string; posicaoBotoes?: string;
}) {
  const { url, definir, remover } = useFoto(id);
  const input = useRef<HTMLInputElement>(null);
  const { Icone, degrade } = visual(categoria);
  const padrao = fotoPadrao(id);
  const src = url ?? padrao;
  const credito = !url && padrao ? FOTOS[id] : undefined;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {src ? (
        <img src={src} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${degrade}`}>
          <Icone size={tamanhoIcone} className="text-white/90 drop-shadow" strokeWidth={1.75} />
        </div>
      )}
      {editavel && credito && (
        <a href={credito.fonte} target="_blank" rel="noreferrer"
          className="absolute bottom-10 left-4 max-w-[55%] truncate rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white backdrop-blur">
          Foto: {credito.autor} · {credito.licenca}
        </a>
      )}
      {editavel && (
        <div className={`absolute flex gap-2 ${posicaoBotoes}`}>
          {url && (
            <button type="button" onClick={remover} aria-label="Remover foto"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur">
              <Trash2 size={16} />
            </button>
          )}
          <button type="button" onClick={() => input.current?.click()}
            className="flex h-9 items-center gap-1.5 rounded-full bg-black/40 px-3 text-xs font-medium text-white backdrop-blur">
            <Camera size={15} /> {url ? 'Trocar foto' : 'Adicionar foto'}
          </button>
          <input ref={input} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && definir(e.target.files[0])} />
        </div>
      )}
    </div>
  );
}
