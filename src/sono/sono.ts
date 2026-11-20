// Lógica do sono (docs/modulos/sono.md e tela-diaria.md), sem banco nem tela.
import type { ConfigSono, Dia } from '../dados/banco'
import { idFixo } from '../dados/ids'

export const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export const CONFIG_SONO_PADRAO: ConfigSono = {
  horarios: Array.from({ length: 7 }, () => ({ dormir: '23:00', acordar: '07:00' })),
  metaMinutos: 8 * 60,
}

/** Id do registro de um dia: calculado da data (celular e PC chegam ao mesmo). */
export const idDoDia = (dia: string) => idFixo(`dia:${dia}`)

export function diaVazio(dia: string): Dia {
  return {
    id: idDoDia(dia),
    dia,
    peso_kg: null,
    sono_minutos: null,
    qualidade: null,
    dormiu_no_horario: null,
    acordou_no_horario: null,
    sol_em: null,
    bom_dia_em: null,
    updated_at: '',
  }
}

/** "22:30", "2230", "22h30", "7" → "HH:MM" (ou null se inválido). */
export function lerHorario(texto: string): string | null {
  const t = texto.trim().toLowerCase().replace('h', ':')
  const m = /^(\d{1,2})(?::?(\d{2}))?$/.exec(t)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2] ?? 0)
  if (h > 23 || min > 59) return null
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

export const horarioEmMinutos = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5))

/** A hora de dormir é sempre antes da meia-noite (entre 18:00 e 23:59). */
export const dormirValido = (hhmm: string) => horarioEmMinutos(hhmm) >= 18 * 60

/** 432 → "7h12"; 480 → "8h". */
export function textoDuracao(minutos: number): string {
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}

/** "72,4" ou "72.4" → 72.4 (entre 20 e 300 kg); vazio → null; inválido → undefined. */
export function lerPeso(texto: string): number | null | undefined {
  const t = texto.trim().replace(',', '.')
  if (!t) return null
  const n = Number(t)
  if (!Number.isFinite(n) || n < 20 || n > 300) return undefined
  return Math.round(n * 10) / 10
}

/** Número inteiro dentro do intervalo; vazio → null; inválido → undefined. */
export function lerInteiro(texto: string, min: number, max: number): number | null | undefined {
  const t = texto.trim()
  if (!t) return null
  if (!/^\d+$/.test(t)) return undefined
  const n = Number(t)
  return n < min || n > max ? undefined : n
}

export const formatarPeso = (kg: number) => kg.toFixed(1).replace('.', ',')

/** A tela diária já foi respondida neste dia? */
export const diaPreenchido = (d: Dia | undefined | null) =>
  !!d && (d.sono_minutos !== null || d.qualidade !== null || d.peso_kg !== null || d.dormiu_no_horario != null || d.acordou_no_horario != null)

/** "Dormi ao menos a meta?" sai do tempo de sono (null se não informado). */
export const dormiuMeta = (d: Dia, metaMinutos: number) => (d.sono_minutos === null ? null : d.sono_minutos >= metaMinutos)

export interface ResumoSono {
  diasComRegistro: number
  mediaMinutos: number | null
  metaAtingida: number
  comTempo: number
  mediaQualidade: number | null
  /** Dias em que dormiu / acordou no horário, entre os dias em que respondeu. */
  dormiuNoHorario: number
  respondeuDormir: number
  acordouNoHorario: number
  respondeuAcordar: number
  sol: number
}

/** Resumo dos últimos `dias` dias até `hoje` (inclusive), contando só dias com registro. */
export function resumirSono(registros: Dia[], metaMinutos: number, hoje: string, dias = 28): ResumoSono {
  const inicio = new Date(`${hoje}T12:00:00Z`)
  inicio.setUTCDate(inicio.getUTCDate() - (dias - 1))
  const desde = inicio.toISOString().slice(0, 10)
  const janela = registros.filter((d) => !d.deleted_at && d.dia >= desde && d.dia <= hoje)
  const tempos = janela.map((d) => d.sono_minutos).filter((v): v is number => v !== null)
  const qualidades = janela.map((d) => d.qualidade).filter((v): v is number => v !== null)
  const media = (l: number[]) => (l.length ? Math.round(l.reduce((a, b) => a + b, 0) / l.length) : null)
  return {
    diasComRegistro: janela.filter(diaPreenchido).length,
    mediaMinutos: media(tempos),
    metaAtingida: tempos.filter((t) => t >= metaMinutos).length,
    comTempo: tempos.length,
    mediaQualidade: media(qualidades),
    dormiuNoHorario: janela.filter((d) => d.dormiu_no_horario === true).length,
    respondeuDormir: janela.filter((d) => d.dormiu_no_horario != null).length,
    acordouNoHorario: janela.filter((d) => d.acordou_no_horario === true).length,
    respondeuAcordar: janela.filter((d) => d.acordou_no_horario != null).length,
    sol: janela.filter((d) => d.sol_em).length,
  }
}
