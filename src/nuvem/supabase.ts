// Conexão com o Supabase (banco na nuvem + login).
// A URL e a chave pública vêm das variáveis de ambiente (.env no PC, painel do Netlify na web).
import { createClient, type Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { banco, TABELAS } from '../dados/banco'
import { criarSincronizador, type Remoto } from '../dados/sincronizacao'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const chave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const nuvemConfigurada = Boolean(url && chave)

export const supabase = nuvemConfigurada
  ? createClient(url!, chave!, {
      // A sessão fica salva no aparelho: não é preciso entrar de novo a cada vez.
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null

const remoto: Remoto = {
  async enviar(tabela, registro) {
    const { error } = await supabase!.from(tabela).upsert(registro, { onConflict: TABELAS[tabela] })
    return error ? { erro: error.message } : {}
  },
  async baixar(tabela, desde) {
    let consulta = supabase!.from(tabela).select('*').order('updated_at')
    if (desde) consulta = consulta.gte('updated_at', desde)
    const { data, error } = await consulta
    return error ? { erro: error.message } : { dados: data }
  },
}

export const sincronizador = criarSincronizador(banco, remoto)

/** Sessão atual. "carregando" só dura o instante de ler a sessão salva no aparelho. */
export function useSessao(): Session | null | 'carregando' {
  const [sessao, setSessao] = useState<Session | null | 'carregando'>(supabase ? 'carregando' : null)
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSessao(data.session))
    const { data } = supabase.auth.onAuthStateChange((_evento, s) => setSessao(s))
    return () => data.subscription.unsubscribe()
  }, [])
  return sessao
}

/** Traduz os erros mais comuns do login para mensagens simples. */
export function mensagemDeErroLogin(mensagem: string): string {
  if (/invalid login credentials/i.test(mensagem)) return 'E-mail ou senha incorretos.'
  if (/email not confirmed/i.test(mensagem)) return 'Este e-mail ainda não foi confirmado no Supabase.'
  if (/fetch|network/i.test(mensagem)) return 'Sem conexão com a internet. Tente de novo quando voltar.'
  return 'Não foi possível entrar. Tente de novo em instantes.'
}
