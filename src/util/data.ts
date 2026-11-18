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
