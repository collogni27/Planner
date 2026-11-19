import { describe, expect, it } from 'vitest'
import type { Baralho, Card, Micrometa, Objetivo } from '../dados/banco'
import { estadoInicial } from './fsrs'
import {
  dividirCampos,
  gerarJson,
  gerarRegistros,
  gerarTsv,
  lerCaminho,
  lerTexto,
  paraExportacao,
  planejar,
  type Existentes,
} from './importacao'

const vazio: Existentes = { baralhos: [], objetivos: [], areas: [], micrometas: [], cards: [] }
const sequencia = () => {
  let n = 0
  return () => `id${++n}`
}
const agora = new Date('2026-11-19T12:00:00Z')

describe('leitura do texto importado', () => {
  it('lê TSV com cabeçalho, conteúdo em caminho e tags separadas por espaço', () => {
    const r = lerTexto(
      'baralho\tconteúdo\tfrente\tverso\ttags\n' +
        'ENEM – Flashcards\tENEM::Matemática::Função do 1º grau\tO que é a raiz?\tOnde f(x)=0\tfuncao basico\n',
    )
    expect(r.erros).toEqual([])
    expect(r.linhas[0]).toMatchObject({
      baralho: 'ENEM – Flashcards',
      micrometa: { objetivo: 'ENEM', area: 'Matemática', nome: 'Função do 1º grau' },
      frente: 'O que é a raiz?',
      tags: ['funcao', 'basico'],
    })
  })

  it('aceita CSV com ";" ou "," e campos entre aspas com quebra de linha', () => {
    const r = lerTexto('baralho;frente;verso\nQuestões;"Calcule:\n2+2";"4 ""quatro"""\n')
    expect(r.linhas[0].frente).toBe('Calcule:\n2+2')
    expect(r.linhas[0].verso).toBe('4 "quatro"')
    expect(r.linhas[0].micrometa).toBeNull()
    expect(lerTexto('baralho,frente,verso\nB,a,b').linhas).toHaveLength(1)
  })

  it('aceita cabeçalho com acento ou sinônimos (pergunta/resposta)', () => {
    expect(lerTexto('Baralho\tPergunta\tResposta\nB\tp\tr').linhas[0]).toMatchObject({ frente: 'p', verso: 'r' })
  })

  it('lê JSON com a lista "cards" (tags como lista ou texto)', () => {
    const r = lerTexto(JSON.stringify({ cards: [{ baralho: 'B', frente: 'f', verso: 'v', tags: ['a', 'b'] }, { baralho: 'B', frente: 'g', verso: 'w', tags: 'c d' }] }))
    expect(r.linhas.map((l) => l.tags)).toEqual([['a', 'b'], ['c', 'd']])
  })

  it('explica os erros por linha, sem descartar as linhas boas', () => {
    const r = lerTexto('baralho\tmicrometa\tfrente\tverso\nB\t\tf\t\nB\tA::B::C::D\tf\tv\n\tx\tf\tv\nB\tENEM::Funções\tf\tv')
    expect(r.erros).toHaveLength(3)
    expect(r.erros[0]).toContain('Linha 2')
    expect(r.linhas).toHaveLength(1)
    expect(r.linhas[0].micrometa).toEqual({ objetivo: 'ENEM', area: null, nome: 'Funções' })
  })

  it('pede o cabeçalho quando ele falta', () => {
    expect(lerTexto('B\tf\tv').erros[0]).toContain('cabeçalho')
  })

  it('aceita "micrometa" (nome antigo) no lugar de "conteudo"', () => {
    expect(lerTexto('baralho\tmicrometa\tfrente\tverso\nB\tA::C\tf\tv').linhas[0].micrometa).toEqual({ objetivo: 'A', area: null, nome: 'C' })
    expect(lerTexto(JSON.stringify({ cards: [{ baralho: 'B', micrometa: 'A::C', frente: 'f', verso: 'v' }] })).linhas[0].micrometa?.nome).toBe('C')
    expect(lerTexto(JSON.stringify({ cards: [{ baralho: 'B', conteudo: 'A::C', frente: 'f', verso: 'v' }] })).linhas[0].micrometa?.nome).toBe('C')
  })

  it('caminho de conteúdo: 2 ou 3 partes', () => {
    expect(lerCaminho('')).toBeNull()
    expect(lerCaminho('A::B')).toEqual({ objetivo: 'A', area: null, nome: 'B' })
    expect(lerCaminho('A')).toBe('invalido')
    expect(lerCaminho('A::::B')).toBe('invalido')
  })

  it('divide campos respeitando aspas', () => {
    expect(dividirCampos('a\t"b\tc"\r\nd\te', '\t')).toEqual([['a', 'b\tc'], ['d', 'e']])
  })
})

describe('planejamento e registros da importação', () => {
  const baralho: Baralho = { id: 'b1', nome: 'ENEM – Flashcards', ordem: 1, updated_at: '' }
  const objetivo: Objetivo = { id: 'o1', nome: 'ENEM', ordem: 1, updated_at: '' }
  const micrometa: Micrometa = { id: 'm1', objetivo_id: 'o1', area_id: null, nome: 'Funções', ordem: 1, updated_at: '' }
  const card: Card = {
    id: 'c1',
    baralho_id: 'b1',
    micrometa_id: 'm1',
    frente: 'O que é a raiz?',
    verso: 'antigo',
    tags: [],
    updated_at: '',
    ...estadoInicial(agora),
    reps: 5,
  }
  const ex: Existentes = { ...vazio, baralhos: [baralho], objetivos: [objetivo], micrometas: [micrometa], cards: [card] }

  it('detecta duplicados (mesma frente no mesmo baralho, sem ligar para maiúsculas e espaços)', () => {
    const { linhas } = lerTexto('baralho\tfrente\tverso\nenem – flashcards\to que é  a raiz?\tnovo\nOutro\tO que é a raiz?\tv')
    const p = planejar(linhas, ex)
    expect(p.duplicados.map((d) => d.cardId)).toEqual(['c1'])
    expect(p.novos).toHaveLength(1)
    expect(p.novosBaralhos).toEqual(['Outro'])
  })

  it('repetições dentro do próprio texto entram uma vez só', () => {
    const { linhas } = lerTexto('baralho\tfrente\tverso\nB\tf\tv\nB\tf\tv2')
    const p = planejar(linhas, vazio)
    expect(p.novos).toHaveLength(1)
    expect(p.repetidosNoTexto).toHaveLength(1)
  })

  it('cria baralhos, objetivos, áreas e micrometas que faltam, reaproveitando os existentes', () => {
    const { linhas } = lerTexto(
      'baralho\tmicrometa\tfrente\tverso\n' +
        'ENEM – Flashcards\tENEM::Funções\tnova pergunta\tv\n' +
        'ENEM – Questões\tENEM::Matemática::Combinatória\tq1\tv\n' +
        'ENEM – Questões\tENEM::Matemática::Combinatória\tq2\tv\n',
    )
    const r = gerarRegistros(planejar(linhas, ex), 'pular', ex, sequencia(), agora)
    expect(r.objetivos).toHaveLength(0) // ENEM já existe
    expect(r.baralhos.map((b) => b.nome)).toEqual(['ENEM – Questões'])
    expect(r.areas.map((a) => a.nome)).toEqual(['Matemática'])
    expect(r.micrometas.map((m) => m.nome)).toEqual(['Combinatória'])
    expect(r.cards).toHaveLength(3)
    expect(r.cards[0].micrometa_id).toBe('m1') // "Funções" já existia
    expect(r.cards[1].micrometa_id).toBe(r.cards[2].micrometa_id)
    expect(r.cards[0].state).toBe(0) // card novo
  })

  it('duplicados: "pular" não mexe; "atualizar" troca verso e tags e mantém o progresso', () => {
    const { linhas } = lerTexto('baralho\tfrente\tverso\ttags\nENEM – Flashcards\tO que é a raiz?\tnovo verso\tt1')
    const p = planejar(linhas, ex)
    expect(gerarRegistros(p, 'pular', ex, sequencia(), agora).cards).toHaveLength(0)
    const [atualizado] = gerarRegistros(p, 'atualizar', ex, sequencia(), agora).cards
    expect(atualizado).toMatchObject({ id: 'c1', verso: 'novo verso', tags: ['t1'], reps: 5 })
  })
})

describe('exportação', () => {
  it('TSV exportado pode ser importado de volta igual', () => {
    const ex: Existentes = {
      ...vazio,
      baralhos: [{ id: 'b', nome: 'B', ordem: 1, updated_at: '' }],
      objetivos: [{ id: 'o', nome: 'ENEM', ordem: 1, updated_at: '' }],
      areas: [{ id: 'a', objetivo_id: 'o', nome: 'Mat', ordem: 1, updated_at: '' }],
      micrometas: [{ id: 'm', objetivo_id: 'o', area_id: 'a', nome: 'F', ordem: 1, updated_at: '' }],
    }
    const card = { id: 'c', baralho_id: 'b', micrometa_id: 'm', frente: 'linha 1\nlinha\t2', verso: 'diz "oi"', tags: ['x', 'y'], updated_at: '', ...estadoInicial(agora) }
    const exportados = paraExportacao([card], ex)
    const volta = lerTexto(gerarTsv(exportados)).linhas[0]
    expect(volta).toMatchObject({ baralho: 'B', micrometa: { objetivo: 'ENEM', area: 'Mat', nome: 'F' }, frente: card.frente, verso: card.verso, tags: ['x', 'y'] })
    expect(lerTexto(gerarJson(exportados)).linhas[0].frente).toBe(card.frente)
  })
})
