import { describe, expect, it } from 'vitest'
import dados from '../../docs/mascote/mascote.json'
import { pathsDoQuadro, quadros } from './mascote'

describe('mascote', () => {
  it('todos os quadros respeitam a grade 25x19', () => {
    for (const linhas of Object.values(dados.quadros)) {
      expect(linhas).toHaveLength(dados.grade.altura)
      for (const linha of linhas) expect(linha).toHaveLength(dados.grade.largura)
    }
  })

  it('o corpo cobre também as células dos olhos (o fundo nunca aparece no olho)', () => {
    const { corpo, olhos } = pathsDoQuadro(['.BEB.'])
    expect(corpo).toBe('M1 0h3v1h-3z')
    expect(olhos).toBe('M2 0h1v1h-1z')
  })

  it('gera o mesmo desenho do SVG de referência para o quadro padrão', () => {
    // Retângulos de 1 linha, como em docs/mascote/mascote-padrao.svg (olhos: 4 linhas x 2 olhos).
    expect(quadros.padrao.olhos.split('z').filter(Boolean)).toHaveLength(8)
    expect(quadros.padrao.corpo).toContain('M0 8h25v1h-25z')
  })

  it('no quadro piscar, cada olho vira uma linha só, na base', () => {
    const linhasComOlho = dados.quadros.piscar.filter((l) => l.includes('E'))
    expect(linhasComOlho).toHaveLength(1)
    expect(dados.quadros.piscar.indexOf(linhasComOlho[0])).toBe(5)
  })
})
