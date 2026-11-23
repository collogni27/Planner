import { describe, expect, it } from 'vitest'
import type { Habito, HabitoFeito, Projeto, Tarefa } from '../dados/banco'
import { avisosDormir, avisosRotina, avisosSol, lerAvisos } from '../notificacoes/agenda'
import {
  agruparAgenda,
  criarProximoPasso,
  desligarDe,
  habitoAtrasado,
  nivelDePrioridade,
  ordenarProjetos,
  ordenarTarefas,
  progressoDoProjeto,
  vinculosVencidos,
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
  gatilho_habito_id: null,
  projeto_ids: [],
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
  fixada: false,
  nao_planejada: false,
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
    expect(
      gatilhosDoHabito(habito('h'), [], [], [tarefa('x', { gatilho_habito_id: 'h' }), tarefa('y')], '2026-11-20').map(
        (a) => a.destino,
      ),
    ).toEqual(['tarefa:x'])
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

describe('0.6.0: prioridade, ordem, gatilhos por dia, vínculos', () => {
  it('importante/urgente → nível 1 a 4', () => {
    expect([
      nivelDePrioridade(false, false),
      nivelDePrioridade(false, true),
      nivelDePrioridade(true, false),
      nivelDePrioridade(true, true),
    ]).toEqual([1, 2, 3, 4])
  })

  it('ordem por ocorrência: horário mais próximo; mesmo horário → maior prioridade antes; decrescente inverte', () => {
    const lista = [
      tarefa('b', { data: '2026-11-20', horario: '10:00', prioridade: 1 }),
      tarefa('a', { data: '2026-11-20', horario: '10:00', prioridade: 4 }),
      tarefa('c', { data: '2026-11-20', horario: '08:00' }),
      tarefa('d', { data: '2026-11-20' }),
    ]
    expect(ordenarTarefas(lista, { ordem: 'ocorrencia', sentido: 'crescente' }).map((t) => t.id)).toEqual(['c', 'a', 'b', 'd'])
    expect(ordenarTarefas(lista, { ordem: 'ocorrencia', sentido: 'decrescente' }).map((t) => t.id)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('ordem por prioridade: mesmo nível → horário mais próximo antes', () => {
    const lista = [
      tarefa('x', { prioridade: 4, data: '2026-11-22' }),
      tarefa('y', { prioridade: 4, data: '2026-11-21' }),
      tarefa('z', { prioridade: 2, data: '2026-11-20' }),
    ]
    expect(ordenarTarefas(lista, { ordem: 'prioridade', sentido: 'decrescente' }).map((t) => t.id)).toEqual(['y', 'x', 'z'])
    expect(ordenarTarefas(lista, { ordem: 'prioridade', sentido: 'crescente' }).map((t) => t.id)).toEqual(['z', 'y', 'x'])
  })

  it('fixadas no topo; bloco mostra fixadas de qualquer dia', () => {
    const lista = [
      tarefa('hoje', { data: '2026-11-20' }),
      tarefa('fixa', { data: '2026-12-25', fixada: true }),
      tarefa('longe', { data: '2026-12-01' }),
    ]
    expect(agruparAgenda(lista, agora).map((g) => g.chave)).toEqual(['fixadas', '2026-11-20', '2026-12-01'])
    expect(tarefasDoBloco(lista, agora).map((g) => [g.chave, g.tarefas.map((t) => t.id)])).toEqual([
      ['fixadas', ['fixa']],
      ['2026-11-20', ['hoje']],
    ])
    expect(agruparAgenda(lista, agora, { ordem: 'prioridade', sentido: 'decrescente' }).map((g) => g.chave)).toEqual([
      'fixadas',
      'todas',
    ])
  })

  it('gatilho só acontece no dia: tarefa de amanhã não avisa hoje; hábito ligado a hábito avisa', () => {
    const t = tarefa('t')
    const amanha = tarefa('amanha', { gatilho_tarefa_id: 't', data: '2026-11-21' })
    const hojeT = tarefa('hoje', { gatilho_tarefa_id: 't', data: '2026-11-20' })
    expect(gatilhosDaTarefa(t, [], [], [amanha, hojeT], '2026-11-20').map((a) => a.destino)).toEqual(['tarefa:hoje'])
    const h = habito('h')
    const depois = habito('depois', { gatilho_habito_id: 'h' })
    const tAmanha = tarefa('ta', { gatilho_habito_id: 'h', data: '2026-11-21' })
    expect(gatilhosDoHabito(h, [h, depois], [], [tAmanha], '2026-11-20').map((a) => a.destino)).toEqual(['habito:depois'])
  })

  it('gatilho adiado: tarefa de amanhã ligada a tarefa concluída hoje avisa amanhã no horário de acordar', () => {
    const sono = { horarios: Array.from({ length: 7 }, () => ({ dormir: '23:00', acordar: '07:00' })), metaMinutos: 480 }
    const a = tarefa('a', { concluida_em: '2026-11-20T17:00:00Z' })
    const b = tarefa('b', { gatilho_tarefa_id: 'a', data: '2026-11-21' })
    expect(avisosRotina([], [], [a, b], agora, sono).map((x) => [sp(x.quando), x.destino])).toEqual([['sáb., 07:00', 'tarefa:b']])
    expect(avisosRotina([], [], [a, { ...b, data: '2026-11-20' }], agora, sono)).toEqual([])
  })

  it('apagar: o que estava ligado fica com gatilho em texto vazio e avisa', () => {
    const r = desligarDe(
      'x',
      [habito('h', { gatilho_habito_id: 'x' }), habito('solto')],
      [tarefa('t', { gatilho_tarefa_id: 'x', data: '2026-12-01' })],
    )
    expect(r.habitos.map((h) => [h.id, h.gatilho_texto, h.gatilho_habito_id])).toEqual([['h', '', null]])
    expect(r.tarefas.map((t) => [t.id, t.gatilho_texto, t.gatilho_tarefa_id])).toEqual([['t', '', null]])
    expect(r.avisos.map((a) => [a.destino, a.texto])).toEqual([
      ['habito:h', 'Está sem gatilho vinculado agora.'],
      ['tarefa:t', 'Está sem gatilho vinculado agora.'],
    ])
  })

  it('hábito ligado a tarefa concluída em dia passado perde o vínculo', () => {
    const tarefas = [
      tarefa('ontem', { concluida_em: '2026-11-19T15:00:00Z' }),
      tarefa('hoje', { concluida_em: '2026-11-20T15:00:00Z' }),
    ]
    const r = vinculosVencidos(
      [habito('a', { gatilho_tarefa_id: 'ontem' }), habito('b', { gatilho_tarefa_id: 'hoje' })],
      tarefas,
      '2026-11-20',
    )
    expect(r.map((h) => [h.id, h.gatilho_texto])).toEqual([['a', '']])
  })

  it('hábito com horário não marcado fica amarelo depois do horário', () => {
    expect(habitoAtrasado(habito('a', { horario: '14:00' }), [], agora)).toBe(true)
    expect(habitoAtrasado(habito('b', { horario: '16:00' }), [], agora)).toBe(false)
    expect(habitoAtrasado(habito('c', { horario: '14:00' }), [feito('c', '2026-11-20')], agora)).toBe(false)
    expect(habitoAtrasado(habito('d'), [], agora)).toBe(false)
  })
})

describe('0.6.1: projetos', () => {
  const projeto = (id: string, encerramento: string | null, created_at = '2026-11-01'): Projeto => ({
    id,
    nome: id,
    descricao: null,
    encerramento,
    created_at,
    updated_at: '',
  })

  it('ordem: encerramento mais próximo primeiro; sem data no fim', () => {
    const lista = [projeto('sem', null), projeto('dez', '2026-12-20'), projeto('nov', '2026-11-30')]
    expect(ordenarProjetos(lista).map((p) => p.id)).toEqual(['nov', 'dez', 'sem'])
  })

  it('progresso: sem tarefas = 100%; senão, concluídas/total para cima', () => {
    const tarefas = [
      tarefa('a', { projeto_ids: ['p'], concluida_em: 'x' }),
      tarefa('b', { projeto_ids: ['p', 'q'] }),
      tarefa('c', { projeto_ids: ['p'] }),
      tarefa('d', { projeto_ids: ['p'], deleted_at: 'x' }),
    ]
    expect(progressoDoProjeto('p', tarefas)).toBe(34) // 1 de 3 = 33,3… → 34
    expect(progressoDoProjeto('q', tarefas)).toBe(0)
    expect(progressoDoProjeto('vazio', tarefas)).toBe(100)
  })
})

describe('0.6.1: avisos ligados um a um', () => {
  it('configuração antiga (sol/dormir) vira a nova; cada aviso pode ser desligado', () => {
    expect(lerAvisos({ bomDia: true, sol: false, dormir: true })).toEqual({
      bomDia: true,
      sol30: false,
      sol60: false,
      dormir60: true,
      dormir30: true,
      dormir0: true,
    })
    const sono = { horarios: Array.from({ length: 7 }, () => ({ dormir: '22:30', acordar: '07:00' })), metaMinutos: 480 }
    expect(
      avisosDormir(sono, agora, [60])
        .slice(0, 2)
        .map((a) => sp(a.quando)),
    ).toEqual(['sex., 21:30', 'sáb., 21:30'])
    expect(avisosSol('2026-11-20T10:00:00Z', null, new Date('2026-11-20T10:05:00Z'), [60]).map((a) => sp(a.quando))).toEqual([
      'sex., 08:00',
    ])
  })
})
