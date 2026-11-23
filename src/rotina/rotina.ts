// Lógica da Rotina (docs/modulos/rotina.md), sem banco nem tela. Testada em rotina.test.ts.
import type { DadosTarefa, Habito, HabitoFeito, Projeto, Tarefa } from '../dados/banco'
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

/** Hábito com horário, de hoje, ainda não marcado e cujo horário já passou: fica amarelo. */
export function habitoAtrasado(h: Habito, feitos: HabitoFeito[], agora: Date): boolean {
  const hoje = diaLocal(agora)
  if (!h.horario || !habitoValeNoDia(h, hoje) || feitoNoDia(feitos, h.id, hoje)) return false
  return agora >= emSaoPaulo(hoje, h.horario)
}

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
  prioridade: 1,
  projeto_ids: [],
})

/** Importante/urgente → nível 1 a 4 (matriz de Eisenhower). */
export const nivelDePrioridade = (importante: boolean, urgente: boolean) => 1 + (importante ? 2 : 0) + (urgente ? 1 : 0)
export const ehImportante = (nivel: number) => nivel >= 3
export const ehUrgente = (nivel: number) => nivel === 2 || nivel === 4

/** Registros antigos (antes da 0.6.0) não têm os campos novos. */
export const completarTarefa = (t: Tarefa): Tarefa => ({
  ...t,
  prioridade: t.prioridade ?? 1,
  fixada: t.fixada ?? false,
  nao_planejada: t.nao_planejada ?? false,
  projeto_ids: t.projeto_ids ?? [],
  proximo: t.proximo ? { ...t.proximo, prioridade: t.proximo.prioridade ?? 1, projeto_ids: t.proximo.projeto_ids ?? [] } : null,
})
export const completarHabito = (h: Habito): Habito => ({
  ...h,
  gatilho_habito_id: h.gatilho_habito_id ?? null,
  projeto_ids: h.projeto_ids ?? [],
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

// ---------- Ordem da Agenda ----------

export interface ConfigAgenda {
  ordem: 'ocorrencia' | 'prioridade'
  sentido: 'crescente' | 'decrescente'
}
export const AGENDA_PADRAO: ConfigAgenda = { ordem: 'ocorrencia', sentido: 'crescente' }

/** Compara textos com os vazios sempre no fim (em qualquer sentido). */
const comVaziosNoFim = (a: string | null, b: string | null, sinal: number) => {
  if (a === b) return 0
  if (a === null) return 1
  if (b === null) return -1
  return sinal * a.localeCompare(b)
}

/** Ocorrência: dia e horário mais próximos primeiro (sem data/sem horário no fim). */
const porOcorrencia = (a: Tarefa, b: Tarefa, sinal = 1) =>
  comVaziosNoFim(a.data, b.data, sinal) || comVaziosNoFim(a.horario, b.horario, sinal)
const porCriacao = (a: Tarefa, b: Tarefa) => (a.created_at ?? '').localeCompare(b.created_at ?? '')

/** Ordena conforme a configuração. Empates: por ocorrência, a maior prioridade antes; por prioridade, o horário mais próximo antes. */
export function ordenarTarefas(lista: Tarefa[], config: ConfigAgenda): Tarefa[] {
  const sinal = config.sentido === 'crescente' ? 1 : -1
  return [...lista].sort((a, b) =>
    config.ordem === 'ocorrencia'
      ? porOcorrencia(a, b, sinal) || b.prioridade - a.prioridade || porCriacao(a, b)
      : sinal * (a.prioridade - b.prioridade) || porOcorrencia(a, b) || porCriacao(a, b),
  )
}

export interface GrupoAgenda {
  /** Vazio = sem título (lista única, na ordem por prioridade). */
  titulo: string
  chave: string
  tarefas: Tarefa[]
}

/**
 * Agenda: "Fixadas" no topo. Por ocorrência: "Pendentes" (dias passados não concluídos),
 * um grupo por dia (hoje, amanhã, …) e "Sem data". Por prioridade: uma lista só.
 * Concluídas de outros dias saem da lista.
 */
export function agruparAgenda(tarefas: Tarefa[], agora: Date, config: ConfigAgenda = AGENDA_PADRAO): GrupoAgenda[] {
  const hoje = diaLocal(agora)
  const visiveis = tarefas.filter((t) => !t.deleted_at && (!t.concluida_em || concluidaHoje(t, hoje)))
  const grupos: GrupoAgenda[] = []
  const fixadas = visiveis.filter((t) => t.fixada)
  if (fixadas.length) grupos.push({ titulo: 'Fixadas', chave: 'fixadas', tarefas: ordenarTarefas(fixadas, config) })
  const resto = visiveis.filter((t) => !t.fixada)
  if (config.ordem === 'prioridade') {
    if (resto.length) grupos.push({ titulo: '', chave: 'todas', tarefas: ordenarTarefas(resto, config) })
    return grupos
  }
  const pendentes = resto.filter((t) => !t.concluida_em && t.data && t.data < hoje)
  if (pendentes.length) grupos.push({ titulo: 'Pendentes', chave: 'pendentes', tarefas: ordenarTarefas(pendentes, config) })
  const porDia = new Map<string, Tarefa[]>()
  for (const t of resto) {
    if (!t.data || pendentes.includes(t)) continue
    const dia = t.data < hoje ? hoje : t.data // concluída hoje de um dia passado: fica em "Hoje"
    porDia.set(dia, [...(porDia.get(dia) ?? []), t])
  }
  const dias = [...porDia].sort((a, b) => a[0].localeCompare(b[0]))
  if (config.sentido === 'decrescente') dias.reverse()
  for (const [dia, lista] of dias)
    grupos.push({ titulo: tituloDoDia(dia, hoje), chave: dia, tarefas: ordenarTarefas(lista, config) })
  const semData = resto.filter((t) => !t.data)
  if (semData.length) grupos.push({ titulo: 'Sem data', chave: 'sem-data', tarefas: ordenarTarefas(semData, config) })
  return grupos
}

/** Bloco da Rotina: fixadas, pendentes, hoje e amanhã. */
export function tarefasDoBloco(tarefas: Tarefa[], agora: Date, config: ConfigAgenda = AGENDA_PADRAO): GrupoAgenda[] {
  const amanha = somarDias(diaLocal(agora), 1)
  return agruparAgenda(
    tarefas.filter((t) => t.fixada || (t.data && t.data <= amanha)),
    agora,
    config,
  )
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
    prioridade: p.prioridade ?? 1,
    projeto_ids: p.projeto_ids ?? [],
    fixada: false,
    nao_planejada: false,
    proximo: null,
    proximo_criado_id: null,
    concluida_em: null,
    updated_at: '',
  }
}

// ---------- Gatilhos ----------
// Um gatilho só "acontece" para a tarefa/hábito ligado no dia dele: o hábito precisa
// valer hoje (e não estar feito); a tarefa precisa ser de hoje, de antes ou sem data.
// Tarefa de outro dia ligada a uma tarefa concluída avisa no dia dela (ver agenda.ts).

export interface AvisoGatilho {
  titulo: string
  texto: string
  destino: string
}

const avisoHabito = (h: Habito, texto = 'Hora deste hábito.'): AvisoGatilho => ({
  titulo: h.nome,
  texto,
  destino: `habito:${h.id}`,
})
const avisoTarefa = (t: Tarefa, texto = 'Hora desta tarefa.'): AvisoGatilho => ({
  titulo: t.nome,
  texto,
  destino: `tarefa:${t.id}`,
})

const habitoEsperaHoje = (h: Habito, feitos: HabitoFeito[], hoje: string) =>
  !h.deleted_at && !h.horario && habitoValeNoDia(h, hoje) && !feitoNoDia(feitos, h.id, hoje)
const tarefaEsperaHoje = (t: Tarefa, hoje: string) =>
  !t.deleted_at && !t.concluida_em && !t.horario && (!t.data || t.data <= hoje)

/** Concluí a tarefa `t` hoje: avisa os hábitos e tarefas ligados a ela que são de hoje. */
export function gatilhosDaTarefa(
  t: Tarefa,
  habitos: Habito[],
  feitos: HabitoFeito[],
  tarefas: Tarefa[],
  hoje: string,
): AvisoGatilho[] {
  return [
    ...habitos.filter((h) => h.gatilho_tarefa_id === t.id && habitoEsperaHoje(h, feitos, hoje)).map((h) => avisoHabito(h)),
    ...tarefas.filter((o) => o.gatilho_tarefa_id === t.id && tarefaEsperaHoje(o, hoje)).map((o) => avisoTarefa(o)),
  ]
}

/** Marquei o hábito `h` hoje: avisa os hábitos e tarefas ligados a ele que são de hoje. */
export function gatilhosDoHabito(
  h: Habito,
  habitos: Habito[],
  feitos: HabitoFeito[],
  tarefas: Tarefa[],
  hoje: string,
): AvisoGatilho[] {
  return [
    ...habitos
      .filter((o) => o.id !== h.id && o.gatilho_habito_id === h.id && habitoEsperaHoje(o, feitos, hoje))
      .map((o) => avisoHabito(o)),
    ...tarefas.filter((o) => o.gatilho_habito_id === h.id && tarefaEsperaHoje(o, hoje)).map((o) => avisoTarefa(o)),
  ]
}

/** Gatilho vazio: "texto" sem nada escrito (o vínculo deixou de existir). */
const semVinculo = { gatilho_texto: '', gatilho_tarefa_id: null, gatilho_habito_id: null }
const ligadoA = (q: { gatilho_tarefa_id: string | null; gatilho_habito_id?: string | null }, id: string) =>
  q.gatilho_tarefa_id === id || q.gatilho_habito_id === id

/**
 * Apaguei a tarefa/hábito `id`: o que estava ligado a ele fica sem vínculo e avisa
 * na hora (qualquer dia), dizendo que está sem gatilho agora.
 */
export function desligarDe(id: string, habitos: Habito[], tarefas: Tarefa[]) {
  const texto = 'Está sem gatilho vinculado agora.'
  const hs = habitos.filter((h) => !h.deleted_at && ligadoA(h, id))
  const ts = tarefas.filter((t) => !t.deleted_at && !t.concluida_em && ligadoA(t, id))
  // Próximos passos ainda não criados que apontam para ele: só perdem o vínculo.
  const modelos = tarefas.filter(
    (t) => !t.deleted_at && !ts.includes(t) && t.proximo && !t.proximo_criado_id && ligadoA(t.proximo, id),
  )
  return {
    habitos: hs.map((h) => ({ ...h, ...semVinculo })),
    tarefas: [
      ...ts.map((t) => ({
        ...t,
        ...semVinculo,
        proximo: t.proximo && ligadoA(t.proximo, id) ? { ...t.proximo, ...semVinculo } : t.proximo,
      })),
      ...modelos.map((t) => ({ ...t, proximo: { ...t.proximo!, ...semVinculo } })),
    ],
    avisos: [...hs.map((h) => avisoHabito(h, texto)), ...ts.map((t) => avisoTarefa(t, texto))],
  }
}

/**
 * Hábito ligado a uma tarefa: quando a tarefa "some" (concluída num dia que já passou,
 * ou apagada), o hábito fica sem vínculo (gatilho em texto, vazio).
 */
export function vinculosVencidos(habitos: Habito[], tarefas: Tarefa[], hoje: string): Habito[] {
  const porId = new Map(tarefas.map((t) => [t.id, t]))
  return habitos
    .filter((h) => {
      const t = !h.deleted_at && h.gatilho_tarefa_id ? porId.get(h.gatilho_tarefa_id) : undefined
      return !!t && (!!t.deleted_at || (!!t.concluida_em && diaLocal(new Date(t.concluida_em)) < hoje))
    })
    .map((h) => ({ ...h, ...semVinculo }))
}

// ---------- Projetos ----------

/** Ordem: encerramento previsto mais próximo primeiro; sem data no fim (por nome). */
export function ordenarProjetos(projetos: Projeto[]): Projeto[] {
  return [...projetos].sort(
    (a, b) =>
      comVaziosNoFim(a.encerramento, b.encerramento, 1) ||
      (a.created_at ?? '').localeCompare(b.created_at ?? '') ||
      a.nome.localeCompare(b.nome),
  )
}

export const tarefasDoProjeto = (id: string, tarefas: Tarefa[]) =>
  tarefas.filter((t) => !t.deleted_at && (t.projeto_ids ?? []).includes(id))
export const habitosDoProjeto = (id: string, habitos: Habito[]) =>
  habitos.filter((h) => !h.deleted_at && (h.projeto_ids ?? []).includes(id))

/** Porcentagem concluída (para cima, sem casas). Sem tarefas ligadas ou todas concluídas: 100%. */
export function progressoDoProjeto(id: string, tarefas: Tarefa[]): number {
  const lista = tarefasDoProjeto(id, tarefas)
  if (lista.length === 0) return 100
  return Math.ceil((lista.filter((t) => t.concluida_em).length / lista.length) * 100)
}
