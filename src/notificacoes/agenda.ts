// Quando cada aviso toca (docs/notificacoes.md). Lógica pura, testada.
import type { ConfigSono, Habito, HabitoFeito, Tarefa } from '../dados/banco'
import { feitoNoDia, habitoValeNoDia } from '../rotina/rotina'
import { diaLocal } from '../util/data'

/** Cada aviso pode ser ligado ou desligado em Notificações → Avisos. */
export interface ConfigAvisos {
  bomDia: boolean
  sol30: boolean
  sol60: boolean
  dormir60: boolean
  dormir30: boolean
  dormir0: boolean
}

export const AVISOS_PADRAO: ConfigAvisos = {
  bomDia: true,
  sol30: true,
  sol60: true,
  dormir60: true,
  dormir30: true,
  dormir0: true,
}

/** Configuração salva (inclusive a antiga, com só "sol" e "dormir") → a atual. */
export function lerAvisos(salvo: (Partial<ConfigAvisos> & { sol?: boolean; dormir?: boolean }) | undefined): ConfigAvisos {
  const s = salvo ?? {}
  return {
    bomDia: s.bomDia ?? true,
    sol30: s.sol30 ?? s.sol ?? true,
    sol60: s.sol60 ?? s.sol ?? true,
    dormir60: s.dormir60 ?? s.dormir ?? true,
    dormir30: s.dormir30 ?? s.dormir ?? true,
    dormir0: s.dormir0 ?? s.dormir ?? true,
  }
}

/** Quantos dias à frente ficam agendados (reagendados a cada abertura do app). */
export const DIAS_AGENDADOS = 7
/** Avisos antes da hora de dormir, em minutos (60, 30 e na hora). */
export const ANTES_DE_DORMIR = [60, 30, 0]
/** Avisos de sol depois de abrir o Bom dia, em minutos. */
export const DEPOIS_DO_BOM_DIA = [30, 60]

export interface Aviso {
  id: number
  quando: Date
  titulo: string
  texto: string
  /** "sono", "bom-dia", "habito:<id>" ou "tarefa:<id>". */
  destino: string
}

/** "2026-11-20" + "22:30" → horário em São Paulo (UTC-3, sem horário de verão). */
export const emSaoPaulo = (dia: string, hhmm: string) => new Date(`${dia}T${hhmm}:00-03:00`)

function somarDias(dia: string, n: number) {
  const d = new Date(`${dia}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
const diaDaSemana = (dia: string) => new Date(`${dia}T12:00:00Z`).getUTCDay()

/** Horários do "Bom dia" (horário-alvo de acordar) dos próximos dias, só os futuros. */
export function horariosBomDia(sono: ConfigSono, agora: Date): Date[] {
  const hoje = diaLocal(agora)
  const r: Date[] = []
  for (let i = 0; i <= DIAS_AGENDADOS; i++) {
    const dia = somarDias(hoje, i)
    const q = emSaoPaulo(dia, sono.horarios[diaDaSemana(dia)].acordar)
    if (q > agora) r.push(q)
  }
  return r.slice(0, DIAS_AGENDADOS)
}

/** Avisos de hora de dormir (60 min antes, 30 min antes e na hora) dos próximos dias. */
export function avisosDormir(sono: ConfigSono, agora: Date, ligados: number[] = ANTES_DE_DORMIR): Aviso[] {
  const hoje = diaLocal(agora)
  const r: Aviso[] = []
  for (let i = 0; i < DIAS_AGENDADOS; i++) {
    const dia = somarDias(hoje, i)
    const alvo = emSaoPaulo(dia, sono.horarios[diaDaSemana(dia)].dormir)
    ANTES_DE_DORMIR.forEach((antes, k) => {
      const quando = new Date(alvo.getTime() - antes * 60_000)
      if (quando <= agora || !ligados.includes(antes)) return
      r.push({
        id: 20_000 + i * 10 + k,
        quando,
        titulo:
          antes === 0 ? 'Hora de dormir' : antes === 60 ? 'Falta 1 hora para dormir' : `Faltam ${antes} minutos para dormir`,
        texto: antes === 0 ? 'Boa noite.' : 'Vá encerrando o que estiver fazendo.',
        destino: 'sono',
      })
    })
  }
  return r
}

/**
 * Avisos de sol: +30 e +60 min depois de abrir o "Bom dia" de hoje, só se ainda não
 * marcou "tomei sol". Sem abrir o Bom dia, não há aviso de sol.
 */
export function avisosSol(
  bomDiaEm: string | null,
  solEm: string | null,
  agora: Date,
  ligados: number[] = DEPOIS_DO_BOM_DIA,
): Aviso[] {
  if (!bomDiaEm || solEm) return []
  if (diaLocal(new Date(bomDiaEm)) !== diaLocal(agora)) return []
  return DEPOIS_DO_BOM_DIA.map((depois, k) => ({
    id: 30_000 + k,
    quando: new Date(Date.parse(bomDiaEm) + depois * 60_000),
    titulo: 'Hora de tomar sol',
    texto: 'Alguns minutos de luz agora ajudam o resto do dia.',
    destino: 'sono' as const,
  })).filter((a, k) => a.quando > agora && ligados.includes(DEPOIS_DO_BOM_DIA[k]))
}

/** Avisos de hábitos e tarefas com horário: 15 min antes e na hora. */
export const ANTES_DO_HORARIO = [15, 0]
/** Limite de avisos de Rotina agendados de uma vez (o Android aceita ~500 no total). */
const LIMITE_ROTINA = 300

/**
 * Hábitos e tarefas com horário e "avisar" ligado, nos próximos 7 dias. O hábito de
 * hoje que já foi marcado e a tarefa concluída não avisam.
 */
export function avisosRotina(
  habitos: Habito[],
  feitos: HabitoFeito[],
  tarefas: Tarefa[],
  agora: Date,
  sono?: ConfigSono,
): Aviso[] {
  const hoje = diaLocal(agora)
  const limite = emSaoPaulo(somarDias(hoje, DIAS_AGENDADOS), '00:00')
  const lista: Omit<Aviso, 'id'>[] = []
  const adicionar = (dia: string, hhmm: string, titulo: string, destino: string) => {
    const alvo = emSaoPaulo(dia, hhmm)
    for (const antes of ANTES_DO_HORARIO) {
      const quando = new Date(alvo.getTime() - antes * 60_000)
      if (quando <= agora || quando >= limite) continue
      lista.push({ quando, titulo, texto: antes === 0 ? 'Está na hora.' : `Em ${antes} minutos.`, destino })
    }
  }
  for (const h of habitos) {
    if (h.deleted_at || !h.avisar || !h.horario) continue
    for (let i = 0; i < DIAS_AGENDADOS; i++) {
      const dia = somarDias(hoje, i)
      if (!habitoValeNoDia(h, dia) || feitoNoDia(feitos, h.id, dia)) continue
      adicionar(dia, h.horario, h.nome, `habito:${h.id}`)
    }
  }
  for (const t of tarefas) {
    if (t.deleted_at || t.concluida_em || !t.avisar || !t.horario || !t.data) continue
    adicionar(t.data, t.horario, t.nome, `tarefa:${t.id}`)
  }
  // Gatilho adiado: tarefa de um dia futuro ligada a uma tarefa já concluída antes
  // desse dia "descobre" no dia dela, no horário de acordar.
  if (sono) {
    const porId = new Map(tarefas.map((t) => [t.id, t]))
    for (const t of tarefas) {
      if (t.deleted_at || t.concluida_em || t.horario || !t.data || !t.gatilho_tarefa_id) continue
      const g = porId.get(t.gatilho_tarefa_id)
      if (!g || g.deleted_at || !g.concluida_em || diaLocal(new Date(g.concluida_em)) >= t.data) continue
      const quando = emSaoPaulo(t.data, sono.horarios[diaDaSemana(t.data)].acordar)
      if (quando > agora && quando < limite)
        lista.push({ quando, titulo: t.nome, texto: 'Hora desta tarefa.', destino: `tarefa:${t.id}` })
    }
  }
  return lista
    .sort((a, b) => a.quando.getTime() - b.quando.getTime())
    .slice(0, LIMITE_ROTINA)
    .map((a, i) => ({ ...a, id: 40_000 + i }))
}

/** Ids usados pelos avisos agendados (para cancelar só os nossos ao reagendar). */
export const ehNossoAviso = (id: number) => id >= 20_000 && id < 50_000

/** Avisos de gatilho (na hora em que o gatilho acontece): ids 50000+, nunca cancelados. */
export const idDeGatilho = (n: number) => 50_000 + (n % 10_000)
