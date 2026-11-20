import { describe, expect, it } from 'vitest'
import type { ConfigSono } from '../dados/banco'
import { avisosDormir, avisosSol, horariosBomDia } from './agenda'

// Sexta, 20/11/2026, 15:00 em São Paulo.
const agora = new Date('2026-11-20T18:00:00Z')
const sono: ConfigSono = {
  horarios: Array.from({ length: 7 }, (_, i) => ({ dormir: '22:30', acordar: i === 6 ? '09:00' : '06:30' })),
  metaMinutos: 480,
}
const sp = (d: Date) => d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit' })

describe('agenda dos avisos', () => {
  it('Bom dia: horário de acordar de cada dia (sábado diferente), só futuros, 7 dias', () => {
    const h = horariosBomDia(sono, agora)
    expect(h).toHaveLength(7)
    expect(sp(h[0])).toBe('sáb., 09:00') // amanhã é sábado
    expect(sp(h[1])).toBe('dom., 06:30')
    expect(h.every((d) => d > agora)).toBe(true)
  })

  it('Hora de dormir: 60 e 30 min antes e na hora, já a partir de hoje', () => {
    const a = avisosDormir(sono, agora)
    expect(a.slice(0, 3).map((x) => [sp(x.quando), x.titulo])).toEqual([
      ['sex., 21:30', 'Falta 1 hora para dormir'],
      ['sex., 22:00', 'Faltam 30 minutos para dormir'],
      ['sex., 22:30', 'Hora de dormir'],
    ])
    expect(a).toHaveLength(21)
    expect(new Set(a.map((x) => x.id)).size).toBe(21)
  })

  it('Hora de dormir: avisos de hoje que já passaram não entram', () => {
    const tarde = new Date('2026-11-21T01:10:00Z') // 22:10 de sexta
    expect(sp(avisosDormir(sono, tarde)[0].quando)).toBe('sex., 22:30')
  })

  it('Sol: +30 e +60 depois de abrir o Bom dia; nada se já tomou sol ou se não abriu', () => {
    const bomDia = '2026-11-20T09:40:00Z' // 06:40
    const cedo = new Date('2026-11-20T09:45:00Z')
    expect(avisosSol(bomDia, null, cedo).map((a) => sp(a.quando))).toEqual(['sex., 07:10', 'sex., 07:40'])
    expect(avisosSol(bomDia, '2026-11-20T09:50:00Z', cedo)).toEqual([])
    expect(avisosSol(null, null, cedo)).toEqual([])
    expect(avisosSol(bomDia, null, new Date('2026-11-20T10:20:00Z'))).toHaveLength(1) // o de +30 já passou
  })

  it('Sol: Bom dia de ontem não gera aviso hoje', () => {
    expect(avisosSol('2026-11-19T09:40:00Z', null, agora)).toEqual([])
  })
})
