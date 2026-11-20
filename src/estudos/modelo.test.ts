import { describe, expect, it } from 'vitest'
import type { Baralho, Checkin, Micrometa, ObjetivoBaralho, ObjetivoConteudo } from '../dados/banco'
import { conteudosForaDoObjetivo, gruposDoObjetivo, objetivosDoConteudo, proximoAEstudar, type Vinculos } from './modelo'

const b = (id: string): Baralho => ({ id, nome: id, ordem: 1, updated_at: '' })
const c = (id: string, baralho: string | null): Micrometa => ({ id, objetivo_id: 'x', area_id: null, baralho_id: baralho, nome: id, ordem: 0, updated_at: '' })
const vb = (o: string, bid: string, ordem: number): ObjetivoBaralho => ({ id: `${o}${bid}`, objetivo_id: o, baralho_id: bid, ordem, updated_at: '' })
const vc = (o: string, mid: string, ordem: number): ObjetivoConteudo => ({ id: `${o}${mid}`, objetivo_id: o, micrometa_id: mid, ordem, updated_at: '' })

// TJSP e UNIVESP compartilham "crase" (Português); "funcao" é só da UNIVESP.
const baralhos = [b('portugues'), b('matematica')]
const conteudos = [c('crase', 'portugues'), c('funcao', 'matematica'), c('regencia', 'portugues'), c('solto', null)]
const v: Vinculos = {
  baralhos: [vb('tjsp', 'portugues', 1), vb('univesp', 'matematica', 1), vb('univesp', 'portugues', 2)],
  conteudos: [vc('tjsp', 'crase', 2), vc('tjsp', 'regencia', 1), vc('univesp', 'crase', 1), vc('univesp', 'funcao', 1), vc('univesp', 'solto', 1)],
}

describe('modelo de baralhos e conteúdos compartilhados', () => {
  it('cada objetivo mostra seus baralhos, e em cada um só os conteúdos daquele objetivo', () => {
    const tjsp = gruposDoObjetivo('tjsp', conteudos, baralhos, v)
    expect(tjsp.map((g) => [g.baralho?.id, g.itens.map((i) => i.conteudo.id)])).toEqual([['portugues', ['regencia', 'crase']]])
    const univesp = gruposDoObjetivo('univesp', conteudos, baralhos, v)
    expect(univesp.map((g) => [g.baralho?.id ?? null, g.itens.map((i) => i.conteudo.id)])).toEqual([
      [null, ['solto']],
      ['matematica', ['funcao']],
      ['portugues', ['crase']], // "regencia" é do TJSP e não aparece aqui
    ])
  })

  it('conteúdo compartilhado aparece nos dois objetivos', () => {
    expect(objetivosDoConteudo('crase', v).sort()).toEqual(['tjsp', 'univesp'])
  })

  it('próximo a estudar segue a fila do objetivo e pula o que já tem check-in', () => {
    const checkin: Checkin = { id: 'k', micrometa_id: 'regencia', estudado_em: '', nota: null, updated_at: '' }
    expect(proximoAEstudar(gruposDoObjetivo('tjsp', conteudos, baralhos, v), [checkin])?.id).toBe('crase')
  })

  it('vínculo apagado deixa de valer', () => {
    const semCrase = { ...v, conteudos: v.conteudos.map((x) => (x.id === 'tjspcrase' ? { ...x, deleted_at: 'agora' } : x)) }
    expect(objetivosDoConteudo('crase', semCrase)).toEqual(['univesp'])
    expect(conteudosForaDoObjetivo('tjsp', conteudos, semCrase).map((x) => x.id)).toEqual(['crase', 'funcao', 'solto'])
  })
})
