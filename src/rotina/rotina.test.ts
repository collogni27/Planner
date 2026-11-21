import { describe, expect, it } from 'vitest'
import type { Habito, HabitoFeito, Tarefa } from '../dados/banco'
import { avisosRotina } from '../notificacoes/agenda'
import {
  agruparAgenda,
  criarProximoPasso,
  gatilhosDaTarefa,
  gatilhosDoHabito,
  lerData,
  ordenarHabitos,
  tarefaAtrasada,
  tarefasDoBloco,
  tarefaVazia,
  textoDosDias,
} from './rotina'

// Sexta, 20/11/2026, 15:00 em São Paulo.
const agora = new Date('2026-11-20T18:00:00Z')
const sp = (d: Date) =>
  d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit' })

const habito = (id: string, campos: Partial<Habito> = {}): Habito => ({
  id,
  nome: id,
  descricao: null,
  dias: [0, 1, 2, 3, 4, 5, 6],
  horario: null,
  avisar: false,
  gatilho_texto: null,
  gatilho_tarefa_id: null,
  ordem: null,
  created_at: '2026-11-01T00:00:00Z',
  updated_at: '',
  ...campos,
})

const tarefa = (id: string, campos: Partial<Tarefa> = {}): Tarefa => ({
  ...tarefaVazia(),
  id,
  nome: id,
  proximo: null,
  proximo_criado_id: null,
  concluida_em: null,
  updated_at: '',
  ...campos,
})

const feito = (habito_id: string, dia: string): HabitoFeito => ({
  id: `${habito_id}${dia}`,
  habito_id,
  dia,
  feito: true,
  updated_at: '',
})

describe('hábitos', () => {
  it('ordem padrão: com horário primeiro (pela hora), depois por data de criação', () => {
    const lista = [
      habito('sem1', { created_at: '2026-11-02T00:00:00Z' }),
      habito('noite', { horario: '21:00' }),
      habito('sem0', { created_at: '2026-11-01T00:00:00Z' }),
      habito('manha', { horario: '07:00' }),
    ]
    expect(ordenarHabitos(lista).map((h) => h.id)).toEqual(['manha', 'noite', 'sem0', 'sem1'])
  })

  it('ordem escolhida à mão vale; os sem ordem vão para o fim', () => {
    const lista = [habito('a', { ordem: 2 }), habito('b', { ordem: 1 }), habito('c', { horario: '06:00' })]
    expect(ordenarHabitos(lista).map((h) => h.id)).toEqual(['b', 'a', 'c'])
  })

  it('texto dos dias', () => {
    expect(textoDosDias([0, 1, 2, 3, 4, 5, 6])).toBe('Diariamente')
    expect(textoDosDias([6, 0])).toBe('Fins de semana')
    expect(textoDosDias([1, 2, 3, 4, 5])).toBe('Dias de semana')
    expect(textoDosDias([5, 1, 3])).toBe('seg, qua, sex')
  })
})

describe('tarefas', () => {
  it('lê datas digitadas', () => {
    expect(lerData('22/11', '2026-11-20')).toBe('2026-11-22')
    expect(lerData('5/1/27', '2026-11-20')).toBe('2027-01-05')
    expect(lerData('31/02/2026', '2026-11-20')).toBeNull()
    expect(lerData('amanhã', '2026-11-20')).toBeNull()
  })

  it('amarela: passou do horário; ou passou do dia (sem horário); sem data nunca', () => {
    expect(tarefaAtrasada(tarefa('a', { data: '2026-11-20', horario: '14:59' }), agora)).toBe(true)
    expect(tarefaAtrasada(tarefa('b', { data: '2026-11-20', horario: '15:01' }), agora)).toBe(false)
    expect(tarefaAtrasada(tarefa('c', { data: '2026-11-20' }), agora)).toBe(false)
    expect(tarefaAtrasada(tarefa('d', { data: '2026-11-19', gatilho_texto: 'x' }), agora)).toBe(true)
    expect(tarefaAtrasada(tarefa('e'), agora)).toBe(false)
    expect(tarefaAtrasada(tarefa('f', { data: '2026-11-19', concluida_em: '2026-11-20T10:00:00Z' }), agora)).toBe(false)
  })

  it('agenda: pendentes no topo, dias em ordem, sem data no fim; concluídas antigas saem', () => {
    const lista = [
      tarefa('semdata'),
      tarefa('depois', { data: '2026-11-25' }),
      tarefa('ontem', { data: '2026-11-19' }),
      tarefa('hoje-tarde', { data: '2026-11-20', horario: '18:00' }),
      tarefa('hoje-cedo', { data: '2026-11-20', horario: '08:00' }),
      tarefa('amanha', { data: '2026-11-21' }),
      tarefa('velha', { data: '2026-11-10', concluida_em: '2026-11-10T12:00:00Z' }),
      tarefa('feita-hoje', { data: '2026-11-18', concluida_em: '2026-11-20T12:00:00Z' }),
    ]
    const g = agruparAgenda(lista, agora)
    expect(g.map((x) => [x.titulo, x.tarefas.map((t) => t.id)])).toEqual([
      ['Pendentes', ['ontem']],
      ['Hoje', ['feita-hoje', 'hoje-cedo', 'hoje-tarde']],
      ['Amanhã', ['amanha']],
      ['qua, 25/11', ['depois']],
      ['Sem data', ['semdata']],
    ])
    expect(tarefasDoBloco(lista, agora).map((x) => x.titulo)).toEqual(['Pendentes', 'Hoje', 'Amanhã'])
  })

  it('próximo passo: copia as configurações; data passada vira hoje; sem próximo do próximo', () => {
    const t = tarefa('t', { proximo: { ...tarefaVazia(), nome: 'Revisar', data: '2026-11-18', horario: '10:00', avisar: true } })
    const p = criarProximoPasso(t, 'novo', agora)!
    expect(p).toMatchObject({
      id: 'novo',
      nome: 'Revisar',
      data: '2026-11-20',
      horario: '10:00',
      avisar: true,
      proximo: null,
      concluida_em: null,
    })
    expect(criarProximoPasso(tarefa('x'), 'y', agora)).toBeNull()
  })

  it('gatilhos: concluir a tarefa avisa os hábitos de hoje não feitos e tarefas ligadas', () => {
    const t = tarefa('t')
    const habitos = [
      habito('ligado', { gatilho_tarefa_id: 't' }),
      habito('feito', { gatilho_tarefa_id: 't' }),
      habito('outro-dia', { gatilho_tarefa_id: 't', dias: [1] }), // sexta não vale
      habito('solto'),
    ]
    const tarefas = [tarefa('ligada', { gatilho_tarefa_id: 't' }), tarefa('ja', { gatilho_tarefa_id: 't', concluida_em: 'x' })]
    const r = gatilhosDaTarefa(t, habitos, [feito('feito', '2026-11-20')], tarefas, '2026-11-20')
    expect(r.map((a) => a.destino)).toEqual(['habito:ligado', 'tarefa:ligada'])
    expect(gatilhosDoHabito(habito('h'), [tarefa('x', { gatilho_habito_id: 'h' }), tarefa('y')]).map((a) => a.destino)).toEqual([
      'tarefa:x',
    ])
  })
})

describe('avisos da rotina', () => {
  it('hábito com horário: 15 min antes e na hora, nos dias dele; marcado hoje não avisa hoje', () => {
    const h = habito('agua', { horario: '16:00', avisar: true, dias: [5, 6] }) // sexta e sábado
    const a = avisosRotina([h], [], [], agora)
    expect(a.map((x) => [sp(x.quando), x.texto])).toEqual([
      ['sex., 15:45', 'Em 15 minutos.'],
      ['sex., 16:00', 'Está na hora.'],
      ['sáb., 15:45', 'Em 15 minutos.'],
      ['sáb., 16:00', 'Está na hora.'],
    ])
    expect(avisosRotina([h], [feito('agua', '2026-11-20')], [], agora).map((x) => sp(x.quando))).toEqual([
      'sáb., 15:45',
      'sáb., 16:00',
    ])
    expect(avisosRotina([{ ...h, avisar: false }], [], [], agora)).toEqual([])
  })

  it('tarefa com data e horário avisa; concluída ou sem "avisar" não', () => {
    const t = tarefa('prova', { data: '2026-11-21', horario: '09:00', avisar: true })
    const a = avisosRotina([], [], [t, { ...t, id: 'x', concluida_em: 'y' }, { ...t, id: 'z', avisar: false }], agora)
    expect(a.map((x) => [sp(x.quando), x.destino])).toEqual([
      ['sáb., 08:45', 'tarefa:prova'],
      ['sáb., 09:00', 'tarefa:prova'],
    ])
    expect(new Set(a.map((x) => x.id)).size).toBe(2)
    expect(a.every((x) => x.id >= 40_000 && x.id < 50_000)).toBe(true)
  })
})
