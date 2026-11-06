import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { acessoConfigurado, entrar } from '../lib/cripto';

// Tela de entrada: confere usuário e senha e devolve a chave que abre os dados
export default function Login({ onEntrar }: { onEntrar: (chave: CryptoKey, lembrar: boolean) => void }) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [ver, setVer] = useState(false);
  const [lembrar, setLembrar] = useState(true);
  const [estado, setEstado] = useState<'livre' | 'conferindo' | 'erro'>('livre');

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEstado('conferindo');
    const chave = await entrar(usuario, senha);
    if (chave) onEntrar(chave, lembrar);
    else { setEstado('erro'); setSenha(''); }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(160deg, #6B4FD8 0%, #E8613C 120%)' }}>
      <div className="mb-8 text-center text-white">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 backdrop-blur"><Lock size={28} /></div>
        <h1 className="text-2xl font-bold">Holambra 14–15/11</h1>
        <p className="mt-1 text-sm text-white/80">Entre para ver a viagem 💐</p>
      </div>

      {!acessoConfigurado() ? (
        <p className="cartao w-full max-w-sm p-5 text-sm text-stone-600">
          Acesso ainda não configurado. No terminal do projeto, rode <code className="font-mono font-semibold">npm run senha</code>.
        </p>
      ) : (
        <form onSubmit={enviar} className="cartao w-full max-w-sm space-y-3 p-5">
          <label className="block text-xs font-medium text-stone-500">Usuário
            <input autoFocus autoComplete="username" autoCapitalize="none" value={usuario} onChange={(e) => setUsuario(e.target.value)} className="campo" required />
          </label>
          <label className="block text-xs font-medium text-stone-500">Senha
            <div className="relative">
              <input type={ver ? 'text' : 'password'} autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} className="campo pr-12" required />
              <button type="button" onClick={() => setVer(!ver)} aria-label={ver ? 'Esconder senha' : 'Mostrar senha'}
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-stone-400 mt-0.5">
                {ver ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-600">
            <input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} className="h-4 w-4 accent-laranja" />
            Manter conectado neste aparelho
          </label>
          {estado === 'erro' && <p className="text-sm font-medium text-red-600">Usuário ou senha incorretos.</p>}
          <button disabled={estado === 'conferindo'} className="botao-primario w-full disabled:opacity-60">
            {estado === 'conferindo' ? 'Conferindo…' : 'Entrar'}
          </button>
        </form>
      )}
    </div>
  );
}
