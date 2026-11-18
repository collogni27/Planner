import { describe, expect, it } from 'vitest'
import { dataPorExtenso, horaLocal, saudacao } from './data'

describe('datas em São Paulo', () => {
  it('usa o fuso de São Paulo, não o do aparelho', () => {
    // 02:30 UTC de 15/11 = 23:30 de 14/11 em São Paulo (UTC-3).
    const d = new Date('2026-11-15T02:30:00Z')
    expect(horaLocal(d)).toBe(23)
    expect(dataPorExtenso(d)).toBe('sábado, 14 de novembro')
  })

  it('dias úteis aparecem sem "-feira"', () => {
    expect(dataPorExtenso(new Date('2026-11-18T15:00:00Z'))).toBe('quarta, 18 de novembro')
  })

  it('saudação muda com a hora', () => {
    expect(saudacao(new Date('2026-11-14T10:00:00Z'))).toBe('Bom dia') // 07:00
    expect(saudacao(new Date('2026-11-14T16:00:00Z'))).toBe('Boa tarde') // 13:00
    expect(saudacao(new Date('2026-11-14T23:00:00Z'))).toBe('Boa noite') // 20:00
  })
})
