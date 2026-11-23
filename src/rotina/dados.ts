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
  type Projeto,
  type Tarefa,
} from '../dados/banco'
import { sincronizador } from '../nuvem/supabase'
import { avisarAgora } from '../notificacoes/avisos'
import { diaLocal } from '../util/data'
import { salvarConfiguracao, useConfiguracao } from '../dados/config'
import {
  AGENDA_PADRAO,
  completarHabito,
  completarTarefa,
  criarProximoPasso,
  desligarDe,
  gatilhosDaTarefa,
  gatilhosDoHabito,
  idDaNota,
  idDoFeito,
  ordenarHabitos,
  ordenarProjetos,
  vinculosVencidos,
  type ConfigAgenda,
} from './rotina'

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

const lerHabitos = async () => (await banco.habitos.toArray()).filter(ativo).map(completarHabito)
const lerTarefas = async () => (await banco.tarefas.toArray()).filter(ativo).map(completarTarefa)

export const useHabitos = () => useLiveQuery(async () => ordenarHabitos(await lerHabitos()))

export const useHabito = (id: string) =>
  useLiveQuery(async () => {
    const h = await banco.habitos.get(id)
    return ativo(h) ? completarHabito(h) : null
  }, [id])

/** Todas as marcas de um hábito (histórico). */
export const useFeitosDoHabito = (id: string) =>
  useLiveQuery(
    async () => (await banco.habitos_feitos.where('habito_id').equals(id).toArray()).filter((f) => ativo(f) && f.feito),
    [id],
  )

/** Marcas de hábitos a partir de uma data (inclusive). */
export const useFeitos = (desde: string) =>
  useLiveQuery(async () => (await banco.habitos_feitos.where('dia').aboveOrEqual(desde).toArray()).filter(ativo), [desde])

export async function salvarHabito(h: Habito) {
  await sincronizador.registrar('habitos', { ...h, created_at: h.created_at ?? agoraISO() })
  enviar()
}

/** Apaga e solta o que estava ligado a ele (com aviso). */
async function apagarComVinculos(apagado: { habitos?: Habito[]; tarefas?: Tarefa[] }, id: string) {
  const r = desligarDe(id, await lerHabitos(), await lerTarefas())
  const habitos = [...(apagado.habitos ?? []), ...r.habitos.filter((h) => h.id !== id)]
  const tarefas = [...(apagado.tarefas ?? []), ...r.tarefas.filter((t) => t.id !== id)]
  await sincronizador.registrarVarios('habitos', habitos)
  await sincronizador.registrarVarios('tarefas', tarefas)
  enviar()
  void avisarAgora(r.avisos)
}

export const apagarHabito = (h: Habito) => apagarComVinculos({ habitos: [{ ...h, deleted_at: agoraISO() }] }, h.id)

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

/** Marca ou desmarca um hábito no dia. Ao marcar hoje, avisa o que está ligado a ele. */
export async function marcarHabito(h: Habito, dia: string, feito: boolean) {
  const marca: HabitoFeito = { id: idDoFeito(h.id, dia), habito_id: h.id, dia, feito, updated_at: '' }
  await sincronizador.registrar('habitos_feitos', marca)
  enviar()
  if (!feito || dia !== diaLocal(new Date())) return
  const feitos = (await banco.habitos_feitos.where('dia').equals(dia).toArray()).filter(ativo)
  void avisarAgora(gatilhosDoHabito(h, await lerHabitos(), feitos, await lerTarefas(), dia))
}

/** Hábitos ligados a tarefas que já "sumiram" ficam sem vínculo (rodado ao abrir o app). */
export async function soltarVinculosVencidos() {
  const lista = vinculosVencidos(await lerHabitos(), (await banco.tarefas.toArray()).map(completarTarefa), diaLocal(new Date()))
  if (lista.length === 0) return
  await sincronizador.registrarVarios('habitos', lista)
  enviar()
}

// ---------- Tarefas ----------

export const useTarefas = () => useLiveQuery(lerTarefas)

export const useTarefa = (id: string) =>
  useLiveQuery(async () => {
    const t = await banco.tarefas.get(id)
    return ativo(t) ? completarTarefa(t) : null
  }, [id])

/** Ordem da Agenda (por ocorrência ou prioridade), guardada nas configurações. */
export function useConfigAgenda(): ConfigAgenda | undefined {
  const config = useConfiguracao()
  return config && { ...AGENDA_PADRAO, ...config.agenda }
}
export const salvarConfigAgenda = (agenda: ConfigAgenda) => salvarConfiguracao({ agenda })

export async function salvarTarefa(
  id: string | null,
  dados: DadosTarefa,
  proximo: DadosTarefa | null,
  extra: { fixada: boolean },
) {
  const atual = id ? await banco.tarefas.get(id) : undefined
  const t: Tarefa = {
    proximo_criado_id: null,
    concluida_em: null,
    nao_planejada: false,
    ...(ativo(atual) ? completarTarefa(atual) : {}),
    ...dados,
    ...extra,
    id: id ?? novoId(),
    proximo,
    created_at: atual?.created_at ?? agoraISO(),
    updated_at: '',
  }
  await sincronizador.registrar('tarefas', t)
  enviar()
  return t.id
}

/**
 * Tarefa não planejada: registrada já feita (vai para as concluídas). Se tiver próximo
 * passo, ele é criado na hora, na agenda.
 */
export async function salvarNaoPlanejada(
  id: string | null,
  campos: { nome: string; descricao: string | null; realizadaEm: string; projeto_ids: string[] },
  proximo: DadosTarefa | null,
) {
  const atual = id ? await banco.tarefas.get(id) : undefined
  const base: Tarefa = ativo(atual)
    ? completarTarefa(atual)
    : {
        id: novoId(),
        ...tarefaSimples(),
        proximo: null,
        proximo_criado_id: null,
        concluida_em: null,
        fixada: false,
        nao_planejada: true,
        updated_at: '',
      }
  const t: Tarefa = {
    ...base,
    nome: campos.nome,
    descricao: campos.descricao,
    projeto_ids: campos.projeto_ids,
    data: diaLocal(new Date(campos.realizadaEm)),
    concluida_em: campos.realizadaEm,
    proximo,
    created_at: base.created_at ?? agoraISO(),
    updated_at: '',
  }
  const passo = !t.proximo_criado_id ? criarProximoPasso(t, novoId(), new Date()) : null
  if (passo) t.proximo_criado_id = passo.id
  await sincronizador.registrarVarios('tarefas', passo ? [t, { ...passo, created_at: agoraISO() }] : [t])
  enviar()
}

const tarefaSimples = (): DadosTarefa => ({
  nome: '',
  descricao: null,
  data: null,
  horario: null,
  avisar: false,
  gatilho_texto: null,
  gatilho_tarefa_id: null,
  gatilho_habito_id: null,
  prioridade: 1,
  projeto_ids: [],
})

export const apagarTarefa = (t: Tarefa) => apagarComVinculos({ tarefas: [{ ...t, deleted_at: agoraISO() }] }, t.id)

/** Fixar no topo (ou soltar). */
export async function fixarTarefa(t: Tarefa, fixada: boolean) {
  await sincronizador.registrar('tarefas', { ...t, fixada })
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
    lerHabitos(),
    banco.habitos_feitos.where('dia').equals(diaLocal(agora)).toArray(),
    lerTarefas(),
  ])
  void avisarAgora(gatilhosDaTarefa(t, habitos, feitos.filter(ativo), tarefas, diaLocal(agora)))
}

// ---------- Projetos ----------

export const useProjetos = () => useLiveQuery(async () => ordenarProjetos((await banco.projetos.toArray()).filter(ativo)))

export const useProjeto = (id: string) =>
  useLiveQuery(async () => {
    const p = await banco.projetos.get(id)
    return ativo(p) ? p : null
  }, [id])

export async function salvarProjeto(
  id: string | null,
  campos: { nome: string; descricao: string | null; encerramento: string | null },
) {
  const atual = id ? await banco.projetos.get(id) : undefined
  const p: Projeto = {
    ...(ativo(atual) ? atual : {}),
    ...campos,
    id: id ?? novoId(),
    created_at: atual?.created_at ?? agoraISO(),
    updated_at: '',
  }
  await sincronizador.registrar('projetos', p)
  enviar()
  return p.id
}

/** Apaga o projeto e tira o vínculo das tarefas e hábitos ligados a ele. */
export async function apagarProjeto(p: Projeto) {
  const sem = <T extends { projeto_ids: string[] }>(lista: T[]) =>
    lista.filter((x) => x.projeto_ids.includes(p.id)).map((x) => ({ ...x, projeto_ids: x.projeto_ids.filter((i) => i !== p.id) }))
  await sincronizador.registrar('projetos', { ...p, deleted_at: agoraISO() })
  await sincronizador.registrarVarios('tarefas', sem(await lerTarefas()))
  await sincronizador.registrarVarios('habitos', sem(await lerHabitos()))
  enviar()
}
