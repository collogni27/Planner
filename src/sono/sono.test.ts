import { describe, expect, it } from 'vitest'
import { diaPreenchido, diaVazio, dormirValido, dormiuMeta, idDoDia, lerHorario, lerInteiro, lerPeso, resumirSono, textoDuracao } from './sono'

describe('sono', () => {
  it('lê horários em vários formatos', () => {
    expect(lerHorario('22:30')).toBe('22:30')
    expect(lerHorario('2230')).toBe('22:30')
    expect(lerHorario('7')).toBe('07:00')
    expect(lerHorario('6h45')).toBe('06:45')
    expect(lerHorario('24:00')).toBeNull()
    expect(lerHorario('abc')).toBeNull()
  })

  it('hora de dormir é sempre antes da meia-noite', () => {
    expect(dormirValido('23:30')).toBe(true)
    expect(dormirValido('00:30')).toBe(false)
  })

  it('duração, peso e números', () => {
    expect(textoDuracao(432)).toBe('7h12')
    expect(textoDuracao(480)).toBe('8h')
    expect(lerPeso('72,4')).toBe(72.4)
    expect(lerPeso('')).toBeNull()
    expect(lerPeso('5')).toBeUndefined()
    expect(lerInteiro('82', 0, 99)).toBe(82)
    expect(lerInteiro('100', 0, 99)).toBeUndefined()
  })

  it('id do dia é fixo pela data', () => {
    expect(idDoDia('2026-11-20')).toBe(idDoDia('2026-11-20'))
    expect(idDoDia('2026-11-20')).not.toBe(idDoDia('2026-11-21'))
  })

  it('meta e dia preenchido', () => {
    const d = { ...diaVazio('2026-11-20'), sono_minutos: 470 }
    expect(dormiuMeta(d, 480)).toBe(false)
    expect(dormiuMeta(diaVazio('x'), 480)).toBeNull()
    expect(diaPreenchido(d)).toBe(true)
    expect(diaPreenchido(diaVazio('x'))).toBe(false)
  })

  it('resumo considera só a janela de dias', () => {
    const r = resumirSono(
      [
        { ...diaVazio('2026-11-20'), sono_minutos: 500, qualidade: 80, dormiu_no_horario: true, acordou_no_horario: false },
        { ...diaVazio('2026-11-19'), sono_minutos: 420, qualidade: 60, sol_em: 'x', dormiu_no_horario: false },
        { ...diaVazio('2026-10-01'), sono_minutos: 600 },
      ],
      480,
      '2026-11-20',
    )
    expect(r).toMatchObject({ diasComRegistro: 2, mediaMinutos: 460, metaAtingida: 1, comTempo: 2, mediaQualidade: 70, dormiuNoHorario: 1, respondeuDormir: 2, acordouNoHorario: 0, respondeuAcordar: 1, sol: 1 })
  })
})
