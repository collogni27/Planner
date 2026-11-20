import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { describe, expect, it } from 'vitest'
import { BancoPlanner, converterParaVinculos, idFixo, type Card, type Micrometa } from './banco'
import { estadoInicial } from '../estudos/fsrs'

const agora = '2026-11-20T12:00:00.000Z'
const conteudo = (id: string, objetivo: string, ordem = 1): Micrometa => ({ id, objetivo_id: objetivo, area_id: 'a', nome: id, ordem, updated_at: '' })
const card = (id: string, baralho: string, conteudoId: string | null): Card => ({
  id, baralho_id: baralho, micrometa_id: conteudoId, frente: 'f', verso: 'v', tags: [], updated_at: '', ...estadoInicial(new Date(agora)),
})

describe('conversão para baralhos e conteúdos compartilhados (0.3.4)', () => {
  it('identificador fixo: mesmo texto → mesmo id, com formato de UUID', () => {
    expect(idFixo('x')).toBe(idFixo('x'))
    expect(idFixo('x')).not.toBe(idFixo('y'))
    expect(idFixo('x')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('conteúdo fica no objetivo de origem, ganha o baralho da maioria dos cards, e o baralho aparece no objetivo', () => {
    const r = converterParaVinculos(
      [conteudo('m1', 'o1', 3), conteudo('m2', 'o1'), { ...conteudo('m3', 'o1'), deleted_at: agora }],
      [card('c1', 'b1', 'm1'), card('c2', 'b2', 'm1'), card('c3', 'b2', 'm1')],
      agora,
    )
    expect(r.vinculosConteudos.map((v) => [v.objetivo_id, v.micrometa_id, v.ordem])).toEqual([['o1', 'm1', 3], ['o1', 'm2', 1]])
    expect(r.micrometas.map((m) => m.baralho_id)).toEqual(['b2', null])
    expect(r.vinculosBaralhos.map((v) => [v.objetivo_id, v.baralho_id])).toEqual([['o1', 'b2']])
  })

  it('a migração do banco local converte os dados e põe tudo na fila da nuvem', async () => {
    // Banco na versão 2 (como estava na 0.3.3)
    const antigo = new Dexie('migracao-teste')
    antigo.version(1).stores({ configuracoes: 'user_id', fila: '++id, [tabela+chave]', meta: 'chave' })
    antigo.version(2).stores({ objetivos: 'id', areas: 'id, objetivo_id', micrometas: 'id, objetivo_id', checkins: 'id, micrometa_id', baralhos: 'id', cards: 'id, baralho_id, micrometa_id, due', revisoes: 'id, card_id, revisado_em' })
    await antigo.open()
    await antigo.table('micrometas').put(conteudo('m1', 'o1'))
    await antigo.table('cards').put(card('c1', 'b1', 'm1'))
    antigo.close()

    const novo = new BancoPlanner('migracao-teste')
    await novo.open()
    expect((await novo.micrometas.get('m1'))?.baralho_id).toBe('b1')
    expect(await novo.objetivo_conteudos.count()).toBe(1)
    expect(await novo.objetivo_baralhos.count()).toBe(1)
    expect((await novo.fila.toArray()).map((i) => i.tabela).sort()).toEqual(['micrometas', 'objetivo_baralhos', 'objetivo_conteudos'])
    expect((await novo.cards.get('c1'))?.frente).toBe('f') // nada se perde
  })
})
