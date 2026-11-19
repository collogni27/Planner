import { fsrs, generatorParameters, Rating, State } from 'ts-fsrs'
import { describe, expect, it } from 'vitest'
import type { Card, Checkin, Micrometa, Revisao } from '../dados/banco'
import { estadoInicial } from './fsrs'
import { cardsLiberados, desfazerRevisoesDeHoje, formatarIntervalo, montarFila, NOVOS_POR_DIA, novosHoje, previa, responder } from './revisao'

// Sem aleatoriedade nos testes (o app usa um pequeno sorteio nos intervalos).
const f = fsrs(generatorParameters({ request_retention: 0.9, enable_fuzz: false }))
const agora = new Date('2026-11-19T12:00:00Z')
let n = 0
const id = () => `id${++n}`

function card(extra: Partial<Card> = {}): Card {
  return {
    id: id(),
    baralho_id: 'b1',
    micrometa_id: null,
    frente: 'f',
    verso: 'v',
    tags: [],
    updated_at: '',
    ...estadoInicial(agora),
    ...extra,
  }
}
const conteudo = (mid: string, area: string | null): Micrometa => ({ id: mid, objetivo_id: 'o', area_id: area, nome: mid, ordem: 1, updated_at: '' })
const checkin = (mid: string): Checkin => ({ id: id(), micrometa_id: mid, estudado_em: agora.toISOString(), nota: null, updated_at: '' })

describe('quais cards podem ser revisados', () => {
  const m1 = conteudo('m1', 'matematica')
  const m2 = conteudo('m2', 'fisica')
  const c1 = card({ micrometa_id: 'm1', tags: ['funcao'] })
  const c2 = card({ micrometa_id: 'm2', tags: ['cinematica'] })
  const c3 = card({ tags: ['geral'] })
  const outroBaralho = card({ baralho_id: 'b2' })
  const todos = [c1, c2, c3, outroBaralho]

  it('card ligado a conteúdo só entra depois do primeiro check-in; sem conteúdo entra direto', () => {
    const r = cardsLiberados(todos, 'b1', { tipo: 'tudo' }, [m1, m2], [checkin('m1')])
    expect(r.map((c) => c.id)).toEqual([c1.id, c3.id])
  })

  it('check-in apagado não libera', () => {
    const apagado = { ...checkin('m1'), deleted_at: agora.toISOString() }
    expect(cardsLiberados(todos, 'b1', { tipo: 'tudo' }, [m1], [apagado]).map((c) => c.id)).toEqual([c3.id])
  })

  it('filtra por várias áreas', () => {
    const ch = [checkin('m1'), checkin('m2')]
    expect(cardsLiberados(todos, 'b1', { tipo: 'areas', ids: ['matematica'] }, [m1, m2], ch).map((c) => c.id)).toEqual([c1.id])
    expect(cardsLiberados(todos, 'b1', { tipo: 'areas', ids: ['matematica', 'fisica'] }, [m1, m2], ch)).toHaveLength(2)
  })

  it('filtra por várias tags (qualquer uma delas)', () => {
    const ch = [checkin('m1'), checkin('m2')]
    expect(cardsLiberados(todos, 'b1', { tipo: 'tags', tags: ['funcao', 'geral'] }, [m1, m2], ch).map((c) => c.id)).toEqual([c1.id, c3.id])
  })
})

describe('fila de revisão', () => {
  const dia = 86_400_000
  it('mostra só o que venceu; em aprendizado vencido vem primeiro', () => {
    const futuro = card({ state: State.Review, due: new Date(agora.getTime() + dia).toISOString() })
    const revisao = card({ state: State.Review, due: new Date(agora.getTime() - dia).toISOString() })
    const aprendendo = card({ state: State.Learning, due: new Date(agora.getTime() - 60_000).toISOString() })
    const novo = card()
    const fila = montarFila([futuro, revisao, aprendendo, novo], agora, 0, 'x')
    expect(fila.proximo?.id).toBe(aprendendo.id)
    expect(fila.restantes).toBe(3)
  })

  it('respeita o teto de cards novos por dia', () => {
    const novos = Array.from({ length: 5 }, () => card())
    expect(montarFila(novos, agora, NOVOS_POR_DIA - 2, 'x').restantes).toBe(2)
    const cheio = montarFila(novos, agora, NOVOS_POR_DIA, 'x')
    expect(cheio.proximo).toBeNull()
    expect(cheio.novosEsperando).toBe(5)
    // "Liberar mais" aumenta o limite do dia.
    expect(montarFila(novos, agora, NOVOS_POR_DIA, 'x', NOVOS_POR_DIA + 3).restantes).toBe(3)
  })

  it('sem nada vencido, adianta card em aprendizado que volta em poucos minutos', () => {
    const daqui5 = card({ state: State.Learning, due: new Date(agora.getTime() + 5 * 60_000).toISOString() })
    expect(montarFila([daqui5], agora, 0, 'x').proximo?.id).toBe(daqui5.id)
  })

  it('no fim, avisa quando volta o próximo card em aprendizado', () => {
    const daqui1h = card({ state: State.Learning, due: new Date(agora.getTime() + 3_600_000).toISOString() })
    const fila = montarFila([daqui1h], agora, 0, 'x')
    expect(fila.proximo).toBeNull()
    expect(fila.voltaEm?.toISOString()).toBe(daqui1h.due)
  })

  it('a ordem misturada é estável no mesmo dia (reabrir o app não embaralha de novo)', () => {
    const cs = Array.from({ length: 10 }, () => card())
    expect(montarFila(cs, agora, 0, '2026-11-19').proximo?.id).toBe(montarFila([...cs].reverse(), agora, 0, '2026-11-19').proximo?.id)
  })
})

describe('integração com o FSRS', () => {
  it('card novo: Errei volta em minutos, Fácil em dias; a prévia bate com a resposta', () => {
    const c = card()
    const p = previa(c, agora, f)
    expect(p[Rating.Again].getTime()).toBeLessThan(p[Rating.Good].getTime())
    expect(p[Rating.Good].getTime()).toBeLessThan(p[Rating.Easy].getTime())
    const { card: depois, revisao } = responder(c, Rating.Easy, agora, 4200, id, f)
    expect(depois.due).toBe(p[Rating.Easy].toISOString())
    expect(depois.reps).toBe(1)
    expect(depois.last_review).toBe(agora.toISOString())
    expect(revisao).toMatchObject({ card_id: c.id, nota: Rating.Easy, state: State.New, duracao_ms: 4200 })
  })

  it('errar um card já aprendido conta um lapso e ele volta logo', () => {
    let c = card()
    c = responder(c, Rating.Easy, agora, null, id, f).card
    const depois = new Date(c.due)
    const r = responder(c, Rating.Again, depois, null, id, f)
    expect(r.card.lapses).toBe(1)
    expect(r.card.state).toBe(State.Relearning)
    expect(Date.parse(r.card.due) - depois.getTime()).toBeLessThan(86_400_000)
  })

  it('conta os novos respondidos hoje', () => {
    const inicio = new Date('2026-11-19T03:00:00Z')
    const rev = (state: number, quando: string): Revisao => ({
      id: id(), card_id: 'c', nota: 3, revisado_em: quando, state, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, duracao_ms: null, updated_at: '',
    })
    expect(novosHoje([rev(State.New, agora.toISOString()), rev(State.Review, agora.toISOString()), rev(State.New, '2026-11-18T12:00:00Z')], inicio)).toBe(1)
  })
})

describe('intervalo nos botões', () => {
  const mais = (ms: number) => new Date(agora.getTime() + ms)
  it('formata de minutos a anos', () => {
    expect(formatarIntervalo(agora, mais(60_000))).toBe('1min')
    expect(formatarIntervalo(agora, mais(10 * 60_000))).toBe('10min')
    expect(formatarIntervalo(agora, mais(3 * 3_600_000))).toBe('3h')
    expect(formatarIntervalo(agora, mais(4 * 86_400_000))).toBe('4d')
    expect(formatarIntervalo(agora, mais(60 * 86_400_000))).toBe('2 meses')
    expect(formatarIntervalo(agora, mais(548 * 86_400_000))).toBe('1,5 anos')
    expect(formatarIntervalo(agora, mais(365 * 86_400_000))).toBe('1 ano')
  })
})

describe('Modo Desenvolvedor: desfazer as revisões de hoje', () => {
  it('o card volta exatamente ao estado de antes da primeira resposta de hoje', () => {
    const original = card()
    const r1 = responder(original, Rating.Good, agora, null, id, f)
    const depois = new Date(r1.card.due)
    const r2 = responder(r1.card, Rating.Good, depois, null, id, f)
    const { cards, revisoes } = desfazerRevisoesDeHoje([r2.card], [r1.revisao, r2.revisao], [])
    expect(cards[0]).toMatchObject({ state: State.New, reps: 0, lapses: 0, stability: 0, last_review: null, due: agora.toISOString() })
    expect(revisoes.every((r) => r.deleted_at)).toBe(true)
  })

  it('card já em revisão: mantém o estado anterior e a data da última revisão de antes de hoje', () => {
    let c = card()
    const ontem = new Date(agora.getTime() - 86_400_000 * 10)
    const antiga = responder(c, Rating.Easy, ontem, null, id, f)
    c = antiga.card
    const hoje = responder(c, Rating.Again, agora, null, id, f)
    const { cards } = desfazerRevisoesDeHoje([hoje.card], [hoje.revisao], [antiga.revisao])
    expect(cards[0]).toMatchObject({ state: State.Review, stability: c.stability, reps: c.reps, lapses: 0, last_review: ontem.toISOString() })
  })
})
