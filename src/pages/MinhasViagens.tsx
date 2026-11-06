import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Download, FileJson, Lock, Plus, Trash2, Upload } from 'lucide-react';
import { useEstado } from '../estado';
const importarArquivo = async (b: Uint8Array) => (await import('../viagens/importar')).importarArquivo(b);
const exportarViagem: typeof import('../viagens/exportar').exportarViagem = async (...a) => (await import('../viagens/exportar')).exportarViagem(...a);
import { apagarViagem, instalarViagem } from '../viagens/repositorio';
import { modoSeguro } from '../seguranca/chave';
import { novoId } from '../lib/geo';
import { agora } from '../lib/datas';
import Topo from '../components/Topo';
import FolhaInferior from '../components/FolhaInferior';

const dataBR = (s: string) => s.split('-').reverse().slice(0, 2).join('/');

export default function MinhasViagens() {
  const { viagem, estado, indice, ativar, recarregar } = useEstado();
  const input = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [exportando, setExportando] = useState(false);

  const importar = async (f: File) => {
    setOcupado(true); setMsg(null);
    try {
      const r = await importarArquivo(new Uint8Array(await f.arrayBuffer()));
      if (r.ok) {
        await ativar(r.viagem.id);
        setMsg({ ok: true, texto: `${r.atualizou ? 'Atualizada' : 'Importada'}: ${r.viagem.titulo}${r.arquivos ? ` (${r.arquivos} arquivos de mapa/fotos)` : ''}. Suas marcações e gastos foram mantidos.` });
      } else {
        setMsg({ ok: false, texto: r.erros.slice(0, 8).map((e) => `${e.caminho}: ${e.mensagem}`).join('\n') + (r.erros.length > 8 ? `\n… e mais ${r.erros.length - 8}` : '') });
      }
    } catch (e) {
      setMsg({ ok: false, texto: `Falha ao importar: ${(e as Error).message}` });
    } finally { setOcupado(false); }
  };

  const criar = async () => {
    const titulo = prompt('Nome da nova viagem')?.trim();
    if (!titulo) return;
    const hoje = agora().data;
    const id = `${titulo.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'viagem'}-${novoId('').slice(1)}`;
    await instalarViagem({
      formato: 1, id, titulo, fuso: 'America/Sao_Paulo', moeda: 'BRL', cores: { tema: '#E8613C' },
      dias: [{ id: 'dia-1', data: hoje, rotulo: 'Dia 1', paradas: [] }],
      checklist: [], orcamento: { caixinhas: [] }, contatos: [], pendencias: [],
    }, new Map(), false);
    await ativar(id);
  };

  const apagar = async (id: string, titulo: string) => {
    if (!confirm(`Apagar "${titulo}" deste aparelho? Marcações, gastos e fotos dela também serão apagados.`)) return;
    await apagarViagem(id);
    await recarregar();
  };

  return (
    <div>
      <Topo cor="#292524" subtitulo={modoSeguro() ? <span className="inline-flex items-center gap-1"><Lock size={12} /> Dados cifrados neste aparelho</span> : 'Modo navegador (desenvolvimento)'} titulo="Minhas viagens"
        acao={viagem ? <Link to="/" aria-label="Voltar" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white"><ArrowLeft size={18} /></Link> : undefined} />

      <div className="space-y-3">
        {indice.map((i) => (
          <div key={i.id} className={`cartao flex items-center gap-3 p-3 ${viagem?.id === i.id ? 'ring-2 ring-laranja' : ''}`}>
            <button onClick={() => ativar(i.id)} className="min-w-0 flex-1 text-left">
              <p className="truncate font-semibold">{i.titulo}</p>
              <p className="text-xs text-stone-500">{dataBR(i.inicio)}{i.fim !== i.inicio && ` – ${dataBR(i.fim)}`}{viagem?.id === i.id && ' · ativa'}</p>
            </button>
            {viagem?.id === i.id && <Check className="text-laranja" size={20} />}
            <button onClick={() => apagar(i.id, i.titulo)} aria-label={`Apagar ${i.titulo}`} className="flex h-10 w-10 items-center justify-center text-stone-400"><Trash2 size={18} /></button>
          </div>
        ))}
        {!indice.length && <p className="cartao p-4 text-center text-sm text-stone-500">Nenhuma viagem ainda. Importe um arquivo gerado pela IA ou crie uma.</p>}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button disabled={ocupado} onClick={() => input.current?.click()} className="botao-primario text-sm"><Upload size={18} /> {ocupado ? 'Importando…' : 'Importar'}</button>
        <button onClick={criar} className="botao-secundario text-sm"><Plus size={18} /> Nova viagem</button>
        <input ref={input} type="file" accept=".zip,.json,application/zip,application/json,application/octet-stream" hidden
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) importar(f); }} />
      </div>
      {viagem && (
        <button onClick={() => setExportando(true)} className="botao-secundario mt-2 w-full text-sm"><Download size={18} /> Exportar “{viagem.titulo}”</button>
      )}

      {msg && <pre className={`mt-4 whitespace-pre-wrap rounded-2xl p-4 text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>{msg.texto}</pre>}

      <p className="mt-6 text-xs leading-relaxed text-stone-500">
        <FileJson size={14} className="mr-1 inline" />
        Aceita <b>.viagem.zip</b> (com mapa offline e fotos, gerado por <code>./dev.sh pacote</code>) ou <b>viagem.json</b> avulso.
        Reimportar a mesma viagem atualiza o conteúdo e mantém o que você marcou.
      </p>

      <p className="mt-6 text-center text-xs text-stone-400">Viagem v{__VERSAO__}</p>

      {exportando && viagem && (
        <FolhaInferior titulo="Exportar viagem" onFechar={() => setExportando(false)}>
          <p className="mb-3 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">
            O arquivo exportado sai <b>sem criptografia</b> (é o formato que a IA lê). Guarde ou envie só para quem você confia.
          </p>
          <div className="space-y-2">
            <button onClick={async () => { await exportarViagem(viagem, { completo: false }); setExportando(false); }} className="botao-secundario w-full text-sm">
              Só o roteiro (viagem.json, para a IA editar)
            </button>
            <button onClick={async () => { await exportarViagem(viagem, { completo: true }); setExportando(false); }} className="botao-secundario w-full text-sm">
              Pacote completo (com mapa e fotos)
            </button>
            <button onClick={async () => { await exportarViagem(viagem, { completo: true, estado }); setExportando(false); }} className="botao-secundario w-full text-sm">
              Pacote + minhas marcações e gastos
            </button>
          </div>
        </FolhaInferior>
      )}
    </div>
  );
}
