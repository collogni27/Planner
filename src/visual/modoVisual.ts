// Modo Visual (claro/escuro/foco): fixo ou variável por horário. Lógica pura, testada.
import type { Modo } from '../estado/preferencias'
import { horaLocal } from '../util/data'

export interface ConfigModoVisual {
  tipo: 'fixo' | 'variavel'
  /** Horário de início ("HH:MM") de cada modo no Modo Variável; null = modo desligado. */
  inicio: Record<Modo, string | null>
}

export const MODO_VISUAL_PADRAO: ConfigModoVisual = {
  tipo: 'fixo',
  inicio: { claro: '07:00', escuro: '19:00', foco: '22:00' },
}

const emMinutos = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5))

/** Minutos desde a meia-noite, em São Paulo. */
export function minutosAgora(agora: Date): number {
  const min = Number(new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', minute: 'numeric' }).format(agora))
  return horaLocal(agora) * 60 + min
}

/**
 * Modo que vale agora: o último que começou (cada modo continua até outro começar
 * "por cima"). Antes do primeiro início do dia, vale o último do dia anterior.
 */
export function modoDoHorario(inicio: ConfigModoVisual['inicio'], minutos: number): Modo | null {
  const ligados = (Object.entries(inicio) as [Modo, string | null][])
    .filter((e): e is [Modo, string] => !!e[1])
    .map(([modo, h]) => ({ modo, min: emMinutos(h) }))
    .sort((a, b) => a.min - b.min)
  if (ligados.length === 0) return null
  const jaComecaram = ligados.filter((l) => l.min <= minutos)
  return (jaComecaram.length ? jaComecaram[jaComecaram.length - 1] : ligados[ligados.length - 1]).modo
}

/** Pelo menos 2 modos ligados (no máximo 1 desligado) e horários diferentes. */
export function inicioValido(inicio: ConfigModoVisual['inicio']): boolean {
  const h = Object.values(inicio).filter((x): x is string => !!x)
  return h.length >= 2 && new Set(h).size === h.length
}
