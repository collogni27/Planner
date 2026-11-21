// Leitura e gravação da Rotina (hábitos, tarefas) e da nota diária.
import { useLiveQuery } from 'dexie-react-hooks'
import {
  agoraISO,
  ativo,
  banco,
  novoId,
  type DadosTarefa,
  type Habito,
  type HabitoFeito,
  type Nota,
  type Tarefa,
} from '../dados/banco'
import { sincronizador } from '../nuvem/supabase'
import { avisarAgora } from '../notificacoes/avisos'
import { diaLocal } from '../util/data'
import { criarProximoPasso, gatilhosDaTarefa, gatilhosDoHabito, idDaNota, idDoFeito, ordenarHabitos } from './rotina'

const enviar = () => void sincronizador.sincronizar()

// ---------- Nota diária ----------

export const useNota = (dia: string) =>
  useLiveQuery(async () => {
    const n = await banco.notas.get(idDaNota(dia))
    return ativo(n) ? n : null
  }, [dia])

/** Dias que têm nota escrita (para o calendário de "Notas anteriores"). */
export const useDiasComNota = () =>
  useLiveQuery(async () => new Set((await banco.notas.toArray()).filter((n) => ativo(n) && n.texto.trim()).map((n) => n.dia)))

export async function salvarNota(dia: string, texto: string) {
  const atual = await banco.notas.get(idDaNota(dia))
  if (ativo(atual) && atual.texto === texto) return
  const nota: Nota = { id: idDaNota(dia), dia, texto, updated_at: '' }
  await sincronizador.registrar('notas', nota)
  enviar()
}

// ---------- Hábitos ----------

export const useHabitos = () => useLiveQuery(async () => ordenarHabitos((await banco.habitos.toArray()).filter(ativo)))

export const useHabito = (id: string) =>
  useLiveQuery(async () => {
    const h = await banco.habitos.get(id)
    return ativo(h) ? h : null
  }, [id])

/** Marcas de hábitos a partir de uma data (inclusive). */
export const useFeitos = (desde: string) =>
  useLiveQuery(async () => (await banco.habitos_feitos.where('dia').aboveOrEqual(desde).toArray()).filter(ativo), [desde])

export async function salvarHabito(h: Habito) {
  await sincronizador.registrar('habitos', { ...h, created_at: h.created_at ?? agoraISO() })
  enviar()
}

export async function apagarHabito(h: Habito) {
  await sincronizador.registrar('habitos', { ...h, deleted_at: agoraISO() })
  enviar()
}

/** Grava a ordem escolhida à mão (lista inteira, já na ordem nova). */
export async function salvarOrdemHabitos(lista: Habito[]) {
  await sincronizador.registrarVarios(
    'habitos',
    lista.map((h, i) => ({ ...h, ordem: i + 1 })),
  )
  enviar()
}

/** Volta à ordem padrão (por horário e data de criação). */
export async function ordemPadraoHabitos(lista: Habito[]) {
  await sincronizador.registrarVarios(
    'habitos',
    lista.filter((h) => h.ordem !== null).map((h) => ({ ...h, ordem: null })),
  )
  enviar()
}

/** Marca ou desmarca um hábito no dia. Ao marcar, avisa as tarefas ligadas a ele. */
export async function marcarHabito(h: Habito, dia: string, feito: boolean) {
  const marca: HabitoFeito = { id: idDoFeito(h.id, dia), habito_id: h.id, dia, feito, updated_at: '' }
  await sincronizador.registrar('habitos_feitos', marca)
  enviar()
  if (feito) void avisarAgora(gatilhosDoHabito(h, (await banco.tarefas.toArray()).filter(ativo)))
}

// ---------- Tarefas ----------

export const useTarefas = () => useLiveQuery(async () => (await banco.tarefas.toArray()).filter(ativo))

export const useTarefa = (id: string) =>
  useLiveQuery(async () => {
    const t = await banco.tarefas.get(id)
    return ativo(t) ? t : null
  }, [id])

export async function salvarTarefa(id: string | null, dados: DadosTarefa, proximo: DadosTarefa | null) {
  const atual = id ? await banco.tarefas.get(id) : undefined
  const t: Tarefa = {
    proximo_criado_id: null,
    concluida_em: null,
    ...(ativo(atual) ? atual : {}),
    ...dados,
    id: id ?? novoId(),
    proximo,
    created_at: atual?.created_at ?? agoraISO(),
    updated_at: '',
  }
  await sincronizador.registrar('tarefas', t)
  enviar()
  return t.id
}

export async function apagarTarefa(t: Tarefa) {
  await sincronizador.registrar('tarefas', { ...t, deleted_at: agoraISO() })
  enviar()
}

/**
 * Conclui (ou desfaz). Ao concluir: cria o próximo passo (uma vez só) e avisa os
 * hábitos e tarefas que têm esta tarefa como gatilho.
 */
export async function concluirTarefa(t: Tarefa, concluida: boolean) {
  const agora = new Date()
  if (!concluida) {
    await sincronizador.registrar('tarefas', { ...t, concluida_em: null })
    enviar()
    return
  }
  const proximo = t.proximo_criado_id ? null : criarProximoPasso(t, novoId(), agora)
  const atualizada: Tarefa = { ...t, concluida_em: agora.toISOString(), proximo_criado_id: proximo?.id ?? t.proximo_criado_id }
  await sincronizador.registrarVarios('tarefas', proximo ? [atualizada, { ...proximo, created_at: agoraISO() }] : [atualizada])
  enviar()
  const [habitos, feitos, tarefas] = await Promise.all([
    banco.habitos.toArray(),
    banco.habitos_feitos.where('dia').equals(diaLocal(agora)).toArray(),
    banco.tarefas.toArray(),
  ])
  void avisarAgora(gatilhosDaTarefa(t, habitos.filter(ativo), feitos.filter(ativo), tarefas.filter(ativo), diaLocal(agora)))
}
