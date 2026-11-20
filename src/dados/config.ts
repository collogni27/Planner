// Configurações do usuário (tabela configuracoes, uma linha com os dados em JSON).
import { useLiveQuery } from 'dexie-react-hooks'
import { sincronizador, supabase } from '../nuvem/supabase'
import { banco, type Configuracoes } from './banco'

export const useConfiguracao = () =>
  useLiveQuery(async () => (await banco.configuracoes.toCollection().first())?.dados ?? ({} as Configuracoes['dados']))

/** Junta os campos novos aos que já existem e grava (sincroniza com a nuvem). */
export async function salvarConfiguracao(campos: Partial<Configuracoes['dados']>) {
  const conf = await banco.configuracoes.toCollection().first()
  const userId = conf?.user_id ?? (await supabase?.auth.getSession())?.data.session?.user.id
  if (!userId) return
  await sincronizador.registrar('configuracoes', { user_id: userId, dados: { ...conf?.dados, ...campos }, updated_at: '' })
  void sincronizador.sincronizar()
}
