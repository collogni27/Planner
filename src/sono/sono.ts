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
  !!d &&
  (d.sono_minutos !== null ||
    d.qualidade !== null ||
    d.peso_kg !== null ||
    d.dormiu_no_horario != null ||
    d.acordou_no_horario != null)

/** "Dormi ao menos a meta?" sai do tempo de sono (null se não informado). */
export const dormiuMeta = (d: Dia, metaMinutos: number) => (d.sono_minutos === null ? null : d.sono_minutos >= metaMinutos)

export interface ResumoSono {
  diasComRegistro: number
  mediaMinutos: number | null
  metaAtingida: number
  comTempo: number
  /** Dias em que dormiu / acordou no horário, entre os dias em que respondeu. */
  dormiuNoHorario: number
  respondeuDormir: number
  acordouNoHorario: number
  respondeuAcordar: number
  sol: number
}

/** "2026-11-20" → a data N dias antes (N negativo = depois). */
export function diasAntes(dia: string, n: number) {
  const d = new Date(`${dia}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

/** Domingo da semana do dia (semana de domingo a sábado). */
export const inicioDaSemana = (dia: string) => diasAntes(dia, new Date(`${dia}T12:00:00Z`).getUTCDay())

/**
 * Início das "últimas 4 semanas": 4 semanas inteiras de domingo a sábado, a atual e as
 * 3 anteriores. Quando começa uma semana nova, a mais antiga sai inteira.
 */
export const inicioDas4Semanas = (hoje: string) => diasAntes(inicioDaSemana(hoje), 21)

/** Resumo das últimas 4 semanas (domingo a sábado) até `hoje`, contando só dias com registro. */
export function resumirSono(registros: Dia[], metaMinutos: number, hoje: string): ResumoSono {
  const desde = inicioDas4Semanas(hoje)
  const janela = registros.filter((d) => !d.deleted_at && d.dia >= desde && d.dia <= hoje)
  const tempos = janela.map((d) => d.sono_minutos).filter((v): v is number => v !== null)
  const media = (l: number[]) => (l.length ? Math.round(l.reduce((a, b) => a + b, 0) / l.length) : null)
  return {
    diasComRegistro: janela.filter(diaPreenchido).length,
    mediaMinutos: media(tempos),
    metaAtingida: tempos.filter((t) => t >= metaMinutos).length,
    comTempo: tempos.length,
    dormiuNoHorario: janela.filter((d) => d.dormiu_no_horario === true).length,
    respondeuDormir: janela.filter((d) => d.dormiu_no_horario != null).length,
    acordouNoHorario: janela.filter((d) => d.acordou_no_horario === true).length,
    respondeuAcordar: janela.filter((d) => d.acordou_no_horario != null).length,
    sol: janela.filter((d) => d.sol_em).length,
  }
}

export interface PesoDaSemana {
  rotulo: string
  /** Média dos pesos registrados na semana, arredondada para cima com uma casa (null = sem registro). */
  media: number | null
}

const ROTULOS_SEMANAS = ['Há 3 semanas', 'Há 2 semanas', 'Há 1 semana', 'Semana atual']

/** Evolução do peso: média de cada uma das 4 semanas (da mais antiga à atual). */
export function pesoPorSemana(registros: Dia[], hoje: string): PesoDaSemana[] {
  const atual = inicioDaSemana(hoje)
  return ROTULOS_SEMANAS.map((rotulo, i) => {
    const de = diasAntes(atual, (3 - i) * 7)
    const ate = diasAntes(de, -6)
    const pesos = registros
      .filter((d) => !d.deleted_at && d.peso_kg !== null && d.dia >= de && d.dia <= ate)
      .map((d) => d.peso_kg!)
    if (pesos.length === 0) return { rotulo, media: null }
    const media = pesos.reduce((a, b) => a + b, 0) / pesos.length
    // Para cima, com uma casa (o "- 1e-9" evita 72.0 virar 72.1 por erro de ponto flutuante).
    return { rotulo, media: Math.ceil(media * 10 - 1e-9) / 10 }
  })
}
