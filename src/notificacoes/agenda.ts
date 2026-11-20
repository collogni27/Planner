// Quando cada aviso toca (docs/notificacoes.md). Lógica pura, testada.
import type { ConfigSono } from '../dados/banco'
import { diaLocal } from '../util/data'

export interface ConfigAvisos {
  bomDia: boolean
  sol: boolean
  dormir: boolean
}

export const AVISOS_PADRAO: ConfigAvisos = { bomDia: true, sol: true, dormir: true }

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
  destino: 'sono' | 'bom-dia'
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
export function avisosDormir(sono: ConfigSono, agora: Date): Aviso[] {
  const hoje = diaLocal(agora)
  const r: Aviso[] = []
  for (let i = 0; i < DIAS_AGENDADOS; i++) {
    const dia = somarDias(hoje, i)
    const alvo = emSaoPaulo(dia, sono.horarios[diaDaSemana(dia)].dormir)
    ANTES_DE_DORMIR.forEach((antes, k) => {
      const quando = new Date(alvo.getTime() - antes * 60_000)
      if (quando <= agora) return
      r.push({
        id: 20_000 + i * 10 + k,
        quando,
        titulo: antes === 0 ? 'Hora de dormir' : antes === 60 ? 'Falta 1 hora para dormir' : `Faltam ${antes} minutos para dormir`,
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
export function avisosSol(bomDiaEm: string | null, solEm: string | null, agora: Date): Aviso[] {
  if (!bomDiaEm || solEm) return []
  if (diaLocal(new Date(bomDiaEm)) !== diaLocal(agora)) return []
  return DEPOIS_DO_BOM_DIA.map((depois, k) => ({
    id: 30_000 + k,
    quando: new Date(Date.parse(bomDiaEm) + depois * 60_000),
    titulo: 'Hora de tomar sol',
    texto: 'Alguns minutos de luz agora ajudam o resto do dia.',
    destino: 'sono' as const,
  })).filter((a) => a.quando > agora)
}

/** Ids usados pelos avisos comuns (para cancelar só os nossos ao reagendar). */
export const ehNossoAviso = (id: number) => id >= 20_000 && id < 40_000
