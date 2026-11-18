// Geometria do mascote, gerada a partir de docs/mascote/mascote.json
// (a fonte de verdade). Nunca desenhar o mascote de outra forma.
import dados from '../../docs/mascote/mascote.json'

export type NomeQuadro = keyof typeof dados.quadros
export type NomeAnimacao = keyof typeof dados.animacoes

export const LARGURA = dados.grade.largura
export const ALTURA = dados.grade.altura

export interface Animacao {
  quadros: NomeQuadro[]
  duracoes_ms: number[]
  repetir: boolean
}

export const animacoes = dados.animacoes as Record<NomeAnimacao, Animacao>

/**
 * Converte um quadro (linhas de texto) em dois "paths" SVG:
 * - corpo: TODAS as células preenchidas (B e E), sem buracos;
 * - olhos: só as células E, desenhadas por cima do corpo.
 * Assim o fundo nunca aparece no lugar do olho (regra do piscar).
 */
export function pathsDoQuadro(linhas: readonly string[]): { corpo: string; olhos: string } {
  const corpo: string[] = []
  const olhos: string[] = []
  linhas.forEach((linha, y) => {
    corpo.push(...trechos(linha, y, (c) => c !== '.'))
    olhos.push(...trechos(linha, y, (c) => c === 'E'))
  })
  return { corpo: corpo.join(' '), olhos: olhos.join(' ') }
}

// Junta células vizinhas da mesma linha num único retângulo.
function trechos(linha: string, y: number, preenche: (c: string) => boolean): string[] {
  const saida: string[] = []
  let inicio = -1
  for (let x = 0; x <= linha.length; x++) {
    const cheio = x < linha.length && preenche(linha[x])
    if (cheio && inicio < 0) inicio = x
    if (!cheio && inicio >= 0) {
      const w = x - inicio
      saida.push(`M${inicio} ${y}h${w}v1h-${w}z`)
      inicio = -1
    }
  }
  return saida
}

// Pré-calcula os paths de todos os quadros uma vez só.
export const quadros = Object.fromEntries(
  Object.entries(dados.quadros).map(([nome, linhas]) => [nome, pathsDoQuadro(linhas)]),
) as Record<NomeQuadro, { corpo: string; olhos: string }>
