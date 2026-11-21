// Lógica da Rotina (docs/modulos/rotina.md), sem banco nem tela. Testada em rotina.test.ts.
import type { DadosTarefa, Habito, HabitoFeito, Tarefa } from '../dados/banco'
import { idFixo } from '../dados/ids'
import { horarioEmMinutos } from '../sono/sono'
import { diaLocal } from '../util/data'

export const idDaNota = (dia: string) => idFixo(`nota:${dia}`)
export const idDoFeito = (habitoId: string, dia: string) => idFixo(`habito:${habitoId}:${dia}`)

// ---------- Datas ----------

export function somarDias(dia: string, n: number) {
  const d = new Date(`${dia}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
export const diaDaSemana = (dia: string) => new Date(`${dia}T12:00:00Z`).getUTCDay()

/** "2026-11-20" + "22:30" → horário em São Paulo (UTC-3, sem horário de verão). */
export const emSaoPaulo = (dia: string, hhmm: string) => new Date(`${dia}T${hhmm}:00-03:00`)

/** "22/11", "22/11/26", "22/11/2026", "22.11" → "2026-11-22" (null se inválido). Sem ano: o ano de `hoje`. */
export function lerData(texto: string, hoje: string): string | null {
  const m = texto.trim().match(/^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2}|\d{4}))?$/)
  if (!m) return null
  const dia = Number(m[1])
  const mes = Number(m[2])
  let ano = m[3] ? Number(m[3]) : Number(hoje.slice(0, 4))
  if (ano < 100) ano += 2000
  const iso = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
  const d = new Date(`${iso}T12:00:00Z`)
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso) return null
  return iso
}

/** "2026-11-22" → "22/11/2026". */
export const dataBr = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`

// ---------- Hábitos ----------

export const DIARIAMENTE = [0, 1, 2, 3, 4, 5, 6]
export const FINS_DE_SEMANA = [0, 6]
export const DIAS_DE_SEMANA = [1, 2, 3, 4, 5]
export const LETRAS_DIAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

export type TipoDias = 'diariamente' | 'fins' | 'semana' | 'personalizado'

const iguais = (a: number[], b: number[]) => a.length === b.length && [...a].sort().every((x, i) => x === [...b].sort()[i])

export function tipoDosDias(dias: number[]): TipoDias {
  if (iguais(dias, DIARIAMENTE)) return 'diariamente'
  if (iguais(dias, FINS_DE_SEMANA)) return 'fins'
  if (iguais(dias, DIAS_DE_SEMANA)) return 'semana'
  return 'personalizado'
}

const NOMES_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

/** "Diariamente", "Fins de semana", "Dias de semana" ou "seg, qua, sex". */
export function textoDosDias(dias: number[]): string {
  const t = tipoDosDias(dias)
  if (t === 'diariamente') return 'Diariamente'
  if (t === 'fins') return 'Fins de semana'
  if (t === 'semana') return 'Dias de semana'
  return [...dias]
    .sort()
    .map((d) => NOMES_CURTOS[d])
    .join(', ')
}

export const habitoValeNoDia = (h: Habito, dia: string) => h.dias.includes(diaDaSemana(dia))

/**
 * Ordem padrão: primeiro os que têm horário (pela hora), depois os outros pela data de
 * criação. Se o usuário arrumou a ordem à mão, vale a ordem dele (novos vão para o fim,
 * na ordem padrão).
 */
export function ordenarHabitos(habitos: Habito[]): Habito[] {
  const criado = (h: Habito) => h.created_at ?? h.updated_at ?? ''
  const padrao = (a: Habito, b: Habito) => {
    if (a.horario && b.horario)
      return horarioEmMinutos(a.horario) - horarioEmMinutos(b.horario) || criado(a).localeCompare(criado(b))
    if (a.horario) return -1
    if (b.horario) return 1
    return criado(a).localeCompare(criado(b)) || a.nome.localeCompare(b.nome)
  }
  return [...habitos].sort((a, b) => {
    if (a.ordem !== null && b.ordem !== null) return a.ordem - b.ordem
    if (a.ordem !== null) return -1
    if (b.ordem !== null) return 1
    return padrao(a, b)
  })
}

export const feitoNoDia = (feitos: HabitoFeito[], habitoId: string, dia: string) =>
  feitos.some((f) => f.habito_id === habitoId && f.dia === dia && f.feito && !f.deleted_at)

// ---------- Tarefas ----------

export const tarefaVazia = (): DadosTarefa => ({
  nome: '',
  descricao: null,
  data: null,
  horario: null,
  avisar: false,
  gatilho_texto: null,
  gatilho_tarefa_id: null,
  gatilho_habito_id: null,
})

/**
 * Amarela: não concluída e já passou do horário (com data e horário) ou já passou do
 * dia (com data, sem horário). Sem data, nunca fica amarela.
 */
export function tarefaAtrasada(t: Tarefa, agora: Date): boolean {
  if (t.concluida_em || !t.data) return false
  if (t.horario) return agora >= emSaoPaulo(t.data, t.horario)
  return diaLocal(agora) > t.data
}

/** Concluída hoje: continua aparecendo marcada na lista do dia (para poder desfazer). */
const concluidaHoje = (t: Tarefa, hoje: string) => !!t.concluida_em && diaLocal(new Date(t.concluida_em)) === hoje

const porHorario = (a: Tarefa, b: Tarefa) =>
  (a.data ?? '9999').localeCompare(b.data ?? '9999') ||
  (a.horario ?? '99:99').localeCompare(b.horario ?? '99:99') ||
  (a.created_at ?? '').localeCompare(b.created_at ?? '')

export interface GrupoAgenda {
  titulo: string
  chave: string
  tarefas: Tarefa[]
}

/**
 * Agenda: "Pendentes" (dias passados não concluídos) no topo, depois um grupo por dia
 * (hoje, amanhã, …) e "Sem data". Concluídas de outros dias saem da lista.
 */
export function agruparAgenda(tarefas: Tarefa[], agora: Date): GrupoAgenda[] {
  const hoje = diaLocal(agora)
  const visiveis = tarefas.filter((t) => !t.deleted_at && (!t.concluida_em || concluidaHoje(t, hoje))).sort(porHorario)
  const grupos: GrupoAgenda[] = []
  const pendentes = visiveis.filter((t) => !t.concluida_em && t.data && t.data < hoje)
  if (pendentes.length) grupos.push({ titulo: 'Pendentes', chave: 'pendentes', tarefas: pendentes })
  const porDia = new Map<string, Tarefa[]>()
  for (const t of visiveis) {
    if (!t.data || pendentes.includes(t)) continue
    const dia = t.data < hoje ? hoje : t.data // concluída hoje de um dia passado: fica em "Hoje"
    porDia.set(dia, [...(porDia.get(dia) ?? []), t])
  }
  for (const [dia, lista] of [...porDia].sort((a, b) => a[0].localeCompare(b[0]))) {
    grupos.push({ titulo: tituloDoDia(dia, hoje), chave: dia, tarefas: lista })
  }
  const semData = visiveis.filter((t) => !t.data)
  if (semData.length) grupos.push({ titulo: 'Sem data', chave: 'sem-data', tarefas: semData })
  return grupos
}

/** Bloco da Rotina: só hoje e amanhã (e as pendentes, que são de hoje em diante). */
export function tarefasDoBloco(tarefas: Tarefa[], agora: Date): GrupoAgenda[] {
  const amanha = somarDias(diaLocal(agora), 1)
  return agruparAgenda(tarefas, agora).filter((g) => g.chave === 'pendentes' || (g.chave !== 'sem-data' && g.chave <= amanha))
}

const NOMES_DIA = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', weekday: 'short', day: '2-digit', month: '2-digit' })

export function tituloDoDia(dia: string, hoje: string) {
  if (dia === hoje) return 'Hoje'
  if (dia === somarDias(hoje, 1)) return 'Amanhã'
  return NOMES_DIA.format(new Date(`${dia}T12:00:00Z`)).replace('.', '')
}

/**
 * Ao concluir uma tarefa com próximo passo: a nova tarefa, com as configurações
 * definidas antes. Se a data dela já passou, fica para hoje.
 */
export function criarProximoPasso(t: Tarefa, id: string, agora: Date): Tarefa | null {
  if (!t.proximo) return null
  const hoje = diaLocal(agora)
  const p = t.proximo
  return {
    ...p,
    id,
    data: p.data && p.data < hoje ? hoje : p.data,
    gatilho_tarefa_id: p.gatilho_tarefa_id === t.id ? null : p.gatilho_tarefa_id,
    proximo: null,
    proximo_criado_id: null,
    concluida_em: null,
    updated_at: '',
  }
}

// ---------- Gatilhos (aviso na hora em que o gatilho acontece) ----------

export interface AvisoGatilho {
  titulo: string
  texto: string
  destino: string
}

/** Concluí a tarefa `t`: avisa os hábitos de hoje (ainda não feitos) e as tarefas ligadas a ela. */
export function gatilhosDaTarefa(
  t: Tarefa,
  habitos: Habito[],
  feitos: HabitoFeito[],
  tarefas: Tarefa[],
  hoje: string,
): AvisoGatilho[] {
  const r: AvisoGatilho[] = []
  for (const h of habitos) {
    if (h.deleted_at || h.gatilho_tarefa_id !== t.id || h.horario) continue
    if (!habitoValeNoDia(h, hoje) || feitoNoDia(feitos, h.id, hoje)) continue
    r.push({ titulo: h.nome, texto: 'Hora deste hábito.', destino: `habito:${h.id}` })
  }
  for (const o of tarefas) {
    if (o.deleted_at || o.concluida_em || o.horario || o.gatilho_tarefa_id !== t.id) continue
    r.push({ titulo: o.nome, texto: 'Hora desta tarefa.', destino: `tarefa:${o.id}` })
  }
  return r
}

/** Marquei o hábito `h` como feito: avisa as tarefas ligadas a ele. */
export function gatilhosDoHabito(h: Habito, tarefas: Tarefa[]): AvisoGatilho[] {
  return tarefas
    .filter((o) => !o.deleted_at && !o.concluida_em && !o.horario && o.gatilho_habito_id === h.id)
    .map((o) => ({ titulo: o.nome, texto: 'Hora desta tarefa.', destino: `tarefa:${o.id}` }))
}
