import { fsrs, generatorParameters, Rating, State } from 'ts-fsrs'
import { describe, expect, it } from 'vitest'
import type { Card, Checkin, Micrometa, Revisao } from '../dados/banco'
import { acerto, carga, cardsPorTag, cardsProblema, forca, maturidade, precisamReforco, resumirConteudo } from './estatisticas'
import { estadoInicial } from './fsrs'
import { responder } from './revisao'

const f = fsrs(generatorParameters({ request_retention: 0.9, enable_fuzz: false }))
const agora = new Date('2026-11-19T12:00:00Z')
const dia = 86_400_000
let n = 0
const id = () => `id${++n}`
const card = (extra: Partial<Card> = {}): Card => ({
  id: id(), baralho_id: 'b', micrometa_id: null, frente: 'f', verso: 'v', tags: [], updated_at: '', ...estadoInicial(agora), ...extra,
})
const conteudo: Micrometa = { id: 'm1', objetivo_id: 'o', area_id: null, nome: 'Funções', ordem: 1, updated_at: '' }
const checkin: Checkin = { id: 'k', micrometa_id: 'm1', estudado_em: agora.toISOString(), nota: null, updated_at: '' }
const rev = (cardId: string, nota: number, state = State.Review, quando = agora): Revisao => ({
  id: id(), card_id: cardId, nota, revisado_em: quando.toISOString(), state, stability: 1, difficulty: 5, elapsed_days: 1, scheduled_days: 1, duracao_ms: null, updated_at: '',
})

describe('acompanhamento', () => {
  it('situação: a estudar → estudado → em consolidação → dominado', () => {
    const novo = card({ micrometa_id: 'm1' })
    expect(resumirConteudo(conteudo, [novo], [], [], agora).situacao).toBe('a-estudar')
    expect(resumirConteudo(conteudo, [novo], [checkin], [], agora).situacao).toBe('estudado')
    const jovem = card({ micrometa_id: 'm1', state: State.Review, scheduled_days: 3, stability: 3, last_review: agora.toISOString() })
    expect(resumirConteudo(conteudo, [jovem], [checkin], [], agora).situacao).toBe('em-consolidacao')
    const maduro = { ...jovem, id: id(), scheduled_days: 30, stability: 30 }
    expect(resumirConteudo(conteudo, [maduro], [checkin], [], agora).situacao).toBe('dominado')
  })

  it('força: média da chance de lembrar dos cards já revisados', () => {
    const c = responder(card(), Rating.Easy, agora, null, id, f).card
    expect(forca([c], agora)).toBe(100) // acabou de revisar
    expect(forca([c], new Date(Date.parse(c.due)))).toBe(90) // no dia de voltar: ~90%
    expect(forca([card()], agora)).toBeNull()
  })

  it('acerto: só respostas de cards já aprendidos, nos últimos 30 dias', () => {
    const r = [rev('a', 3), rev('a', 1), rev('a', 4), rev('a', 3), rev('b', 1, State.New), rev('c', 1, State.Review, new Date(agora.getTime() - 40 * dia))]
    expect(acerto(r, agora)).toEqual({ valor: 75, respostas: 4 })
  })

  it('precisa de reforço: acerto abaixo de 80% com pelo menos 5 respostas', () => {
    const c = card({ micrometa_id: 'm1' })
    const erros = [rev(c.id, 1), rev(c.id, 1), rev(c.id, 3), rev(c.id, 3), rev(c.id, 3)]
    const resumo = resumirConteudo(conteudo, [c], [checkin], erros, agora)
    expect(resumo.acerto).toBe(60)
    expect(precisamReforco([resumo])).toHaveLength(1)
    expect(precisamReforco([resumirConteudo(conteudo, [c], [checkin], erros.slice(0, 2), agora)])).toHaveLength(0)
  })

  it('cards-problema: errados 4 vezes ou mais', () => {
    expect(cardsProblema([card({ lapses: 4 }), card({ lapses: 1 })])).toHaveLength(1)
  })

  it('carga dos próximos dias conta atrasados em hoje e respeita o check-in', () => {
    const inicio = new Date('2026-11-19T03:00:00Z')
    const r = (dias: number, extra: Partial<Card> = {}) => card({ state: State.Review, due: new Date(inicio.getTime() + dias * dia + 3600_000).toISOString(), ...extra })
    const c = carga([r(-2), r(0), r(1), r(1), r(9), card(), r(0, { micrometa_id: 'sem-checkin' })], [], inicio)
    expect(c).toEqual([2, 2, 0, 0, 0, 0, 0])
  })

  it('maturidade e tags', () => {
    const cs = [card({ tags: ['a'] }), card({ state: State.Review, scheduled_days: 5, tags: ['a', 'b'] }), card({ state: State.Review, scheduled_days: 40 })]
    expect(maturidade(cs)).toEqual({ novos: 1, jovens: 1, maduros: 1 })
    expect(cardsPorTag(cs)).toEqual([{ tag: 'a', cards: 2 }, { tag: 'b', cards: 1 }])
  })
})
