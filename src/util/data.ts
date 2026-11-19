// Datas sempre no fuso de São Paulo, independente do fuso do aparelho.
export const FUSO = 'America/Sao_Paulo'

/** Ex.: "sábado, 14 de novembro" ou "quarta, 18 de novembro" (sem "-feira", para caber numa linha). */
export function dataPorExtenso(agora: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: FUSO,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
    .format(agora)
    .replace('-feira', '')
}

/** Hora (0–23) em São Paulo. */
export function horaLocal(agora: Date): number {
  const h = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, hour: 'numeric', hourCycle: 'h23' }).format(agora)
  return Number(h)
}

/** Saudação conforme a hora: até 11h59 "Bom dia", até 17h59 "Boa tarde", depois "Boa noite". */
export function saudacao(agora: Date): string {
  const h = horaLocal(agora)
  if (h >= 4 && h < 12) return 'Bom dia'
  if (h >= 12 && h < 18) return 'Boa tarde'
  return 'Boa noite'
}

/** "2026-11-19": o dia em São Paulo (também serve de semente para a ordem da revisão). */
export function diaLocal(agora: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit' }).format(agora)
}

/** 00:00 do dia em São Paulo (UTC-3; o Brasil não tem horário de verão desde 2019). */
export function inicioDoDia(agora: Date): Date {
  return new Date(`${diaLocal(agora)}T00:00:00-03:00`)
}

/** "14:20" em São Paulo. */
export function horaMinuto(d: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit' }).format(d)
}
