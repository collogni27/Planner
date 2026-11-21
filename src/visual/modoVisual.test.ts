import { describe, expect, it } from 'vitest'
import { inicioValido, minutosAgora, modoDoHorario } from './modoVisual'

const m = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3))
const tres = { claro: '07:00', escuro: '19:00', foco: '22:00' }

describe('Modo Visual Variável', () => {
  it('vale o último modo que começou', () => {
    expect(modoDoHorario(tres, m('08:30'))).toBe('claro')
    expect(modoDoHorario(tres, m('19:00'))).toBe('escuro')
    expect(modoDoHorario(tres, m('23:10'))).toBe('foco')
  })

  it('de madrugada, continua o último modo do dia anterior', () => {
    expect(modoDoHorario(tres, m('03:00'))).toBe('foco')
  })

  it('funciona com só 2 modos', () => {
    const dois = { claro: '06:30', escuro: '20:00', foco: null }
    expect(modoDoHorario(dois, m('12:00'))).toBe('claro')
    expect(modoDoHorario(dois, m('01:00'))).toBe('escuro')
  })

  it('validação: no máximo 1 desligado e horários diferentes', () => {
    expect(inicioValido(tres)).toBe(true)
    expect(inicioValido({ claro: '07:00', escuro: null, foco: null })).toBe(false)
    expect(inicioValido({ claro: '07:00', escuro: '07:00', foco: '22:00' })).toBe(false)
  })

  it('minutos de agora em São Paulo', () => {
    expect(minutosAgora(new Date('2026-11-21T01:30:00Z'))).toBe(m('22:30'))
  })
})
