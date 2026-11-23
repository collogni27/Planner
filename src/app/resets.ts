// Ferramentas do Modo Desenvolvedor que apagam dados (exclusão lógica: o registro
// ganha deleted_at e a exclusão chega à nuvem e aos outros aparelhos pela sincronização).
import { agoraISO, ativo, banco, type NomeTabela, type Registro } from '../dados/banco'
import { sincronizador } from '../nuvem/supabase'
import { esquecerAberturaDeHoje } from '../sono/automatica'

/** Apaga os registros ativos de uma tabela (todos, ou os que passarem no filtro). Devolve quantos. */
async function apagar<T extends Registro>(tabela: NomeTabela, filtro: (r: T) => boolean = () => true) {
  const lista = ((await banco.table(tabela).toArray()) as T[]).filter((r) => ativo(r) && filtro(r))
  const agora = agoraISO()
  await sincronizador.registrarVarios(
    tabela,
    lista.map((r) => ({ ...r, deleted_at: agora })),
  )
  return lista.length
}

const ESTUDOS: NomeTabela[] = [
  'revisoes',
  'cards',
  'checkins',
  'objetivo_conteudos',
  'objetivo_baralhos',
  'micrometas',
  'areas',
  'baralhos',
  'objetivos',
]

/** Routine Reset: hábitos e tarefas em aberto (o histórico fica: marcas e concluídas). */
export async function routineReset() {
  await apagar('projetos')
  await apagar('habitos')
  await apagar<{ concluida_em: string | null } & Registro>('tarefas', (t) => !t.concluida_em)
}

/** Routine Max Reset: hábitos, tarefas e todo o histórico deles. */
export async function routineMaxReset() {
  await apagar('projetos')
  await apagar('habitos')
  await apagar('tarefas')
  await apagar('habitos_feitos')
}

/** Revision Max Reset: todo o módulo Estudos (objetivos, baralhos, conteúdos, cards e histórico). */
export async function revisionMaxReset() {
  for (const t of ESTUDOS) await apagar(t)
}

/** Day Max Reset: todo o histórico de sono (registros diários); o próximo uso conta como o primeiro do dia. */
export async function dayMaxReset() {
  await apagar('dias')
  esquecerAberturaDeHoje()
}

/** All Max Reset: todos os dados da conta e deste aparelho, como no primeiro uso (o login continua). */
export async function allMaxReset() {
  for (const t of ['notas', 'habitos_feitos', 'tarefas', 'habitos', 'projetos', 'dias', ...ESTUDOS] as NomeTabela[])
    await apagar(t)
  const conf = await banco.configuracoes.toCollection().first()
  if (conf) await sincronizador.registrar('configuracoes', { ...conf, dados: {} })
  // Preferências deste aparelho (tela aberta, modo, rascunhos, Modo Desenvolvedor…).
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith('planner:')) localStorage.removeItem(k)
  } catch {
    // sem armazenamento: nada a limpar
  }
}
