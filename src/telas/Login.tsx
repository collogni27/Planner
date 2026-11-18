import { useState, type FormEvent } from 'react'
import { Mascote } from '../mascote/Mascote'
import type { Modo } from '../estado/preferencias'
import { mensagemDeErroLogin, supabase } from '../nuvem/supabase'

/** Tela de entrada. Só existe um usuário; novos cadastros ficam desativados no Supabase. */
export function Login({ modo }: { modo: Modo }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [entrando, setEntrando] = useState(false)

  async function entrar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setEntrando(true)
    const { error } = await supabase!.auth.signInWithPassword({ email: email.trim(), password: senha })
    setEntrando(false)
    if (error) setErro(mensagemDeErroLogin(error.message))
  }

  return (
    <div className="login">
      <div className="login-marca">
        <Mascote modo={modo} largura={75} animacoes={['aceno', 'ocioso_piscar']} rotulo="Mascote do Planner" />
        <h1 className="login-nome">Planner</h1>
      </div>

      <form className="card login-form" onSubmit={entrar}>
        <label className="campo">
          <span className="campo-rotulo">E-mail</span>
          <input
            className="campo-entrada"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="campo">
          <span className="campo-rotulo">Senha</span>
          <input
            className="campo-entrada"
            type="password"
            autoComplete="current-password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </label>
        {erro && (
          <p className="login-erro" role="alert">
            {erro}
          </p>
        )}
        <button className="botao-principal" type="submit" disabled={entrando}>
          {entrando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
