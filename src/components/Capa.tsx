import { useEffect, useRef, useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { useViagem } from '../estado';
import { apagarFotoUsuario, gravarFotoUsuario, lerArquivo, lerFotoUsuario } from '../viagens/repositorio';
import { visual } from '../lib/visual';
import type { Parada } from '../formato/tipos';

// Blob cifrado → URL de objeto, revogada ao desmontar
function useBlobUrl(carregar: () => Promise<Blob | undefined>, deps: unknown[]) {
  const [url, setUrl] = useState<string>();
  const [versao, setVersao] = useState(0);
  useEffect(() => {
    let atual: string | undefined, vivo = true;
    setUrl(undefined);
    carregar().then((b) => { if (b && vivo) setUrl((atual = URL.createObjectURL(b))); }).catch(() => {});
    return () => { vivo = false; if (atual) URL.revokeObjectURL(atual); };
  }, [...deps, versao]);
  return [url, () => setVersao((v) => v + 1)] as const;
}

// Capa da parada: foto do usuário → foto do pacote → degradê + ícone da categoria. Preenche o contêiner.
export default function Capa({ parada: p, tamanhoIcone = 28, editavel = false, className = '', posicaoBotoes = 'bottom-3 right-3' }: {
  parada: Parada; tamanhoIcone?: number; editavel?: boolean; className?: string; posicaoBotoes?: string;
}) {
  const { viagem } = useViagem();
  const [propria, recarregar] = useBlobUrl(() => lerFotoUsuario(viagem.id, p.id), [viagem.id, p.id]);
  const [pacote] = useBlobUrl(async () => (p.foto?.arquivo ? lerArquivo(viagem.id, p.foto.arquivo) : undefined), [viagem.id, p.foto?.arquivo]);
  const input = useRef<HTMLInputElement>(null);
  const { Icone, degrade } = visual(p.categoria);
  const src = propria ?? pacote;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {src ? (
        <img src={src} alt="" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${degrade}`}>
          <Icone size={tamanhoIcone} className="text-white/90 drop-shadow" strokeWidth={1.75} />
        </div>
      )}
      {editavel && !propria && pacote && p.foto?.credito && (
        <span className="absolute bottom-10 left-4 max-w-[55%] truncate rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white backdrop-blur">
          Foto: {p.foto.credito}
        </span>
      )}
      {editavel && (
        <div className={`absolute flex gap-2 ${posicaoBotoes}`}>
          {propria && (
            <button type="button" onClick={async () => { await apagarFotoUsuario(viagem.id, p.id); recarregar(); }} aria-label="Remover foto"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur">
              <Trash2 size={16} />
            </button>
          )}
          <button type="button" onClick={() => input.current?.click()}
            className="flex h-9 items-center gap-1.5 rounded-full bg-black/40 px-3 text-xs font-medium text-white backdrop-blur">
            <Camera size={15} /> {propria ? 'Trocar foto' : 'Sua foto'}
          </button>
          <input ref={input} type="file" accept="image/*" hidden
            onChange={async (e) => { const f = e.target.files?.[0]; if (f) { await gravarFotoUsuario(viagem.id, p.id, f); recarregar(); } }} />
        </div>
      )}
    </div>
  );
}
