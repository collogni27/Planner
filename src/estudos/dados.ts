// Leitura e gravação do módulo Estudos. Toda gravação passa pelo sincronizador
// (grava no aparelho + fila para a nuvem).
import { useLiveQuery } from 'dexie-react-hooks'
import {
  agoraISO,
  ativo,
  banco,
  novoId,
  type Area,
  type Baralho,
  type Card,
  type Checkin,
  type Micrometa,
  type NomeTabela,
  type Objetivo,
  type Registro,
  type Revisao,
} from '../dados/banco'
import { sincronizador } from '../nuvem/supabase'
import { estadoInicial } from './fsrs'
import type { Existentes, RegistrosImportacao } from './importacao'
import { desfazerRevisoesDeHoje, novosHoje } from './revisao'

const porOrdem = <T extends { ordem: number }>(a: T, b: T) => a.ordem - b.ordem
const porNome = <T extends { nome: string }>(a: T, b: T) => a.nome.localeCompare(b.nome, 'pt-BR')

async function salvar<T extends Registro>(tabela: NomeTabela, registros: T[]) {
  await sincronizador.registrarVarios(tabela, registros)
  void sincronizador.sincronizar()
}

const apagado = <T extends Registro>(r: T): T => ({ ...r, deleted_at: agoraISO() })
const proximaOrdem = (lista: { ordem: number }[]) => Math.max(0, ...lista.map((x) => x.ordem)) + 1

// ---------- Leitura (atualiza a tela sozinha quando os dados mudam) ----------

export const useObjetivos = () =>
  useLiveQuery(async () => (await banco.objetivos.toArray()).filter(ativo).sort(porOrdem))

export const useObjetivo = (id: string) => useLiveQuery(async () => {
  const o = await banco.objetivos.get(id)
  return ativo(o) ? o : null
}, [id])

export const useAreas = (objetivoId: string) =>
  useLiveQuery(async () => (await banco.areas.where('objetivo_id').equals(objetivoId).toArray()).filter(ativo).sort(porOrdem), [objetivoId])

export const useTodasAreas = () => useLiveQuery(async () => (await banco.areas.toArray()).filter(ativo))

export const useMicrometas = (objetivoId: string) =>
  useLiveQuery(
    async () => (await banco.micrometas.where('objetivo_id').equals(objetivoId).toArray()).filter(ativo).sort(porOrdem),
    [objetivoId],
  )

export const useTodasMicrometas = () => useLiveQuery(async () => (await banco.micrometas.toArray()).filter(ativo).sort(porOrdem))

export const useMicrometa = (id: string) => useLiveQuery(async () => {
  const m = await banco.micrometas.get(id)
  return ativo(m) ? m : null
}, [id])

/** Check-ins de todas as micrometas (para saber o que já foi estudado). */
export const useCheckins = () =>
  useLiveQuery(async () =>
    (await banco.checkins.toArray()).filter(ativo).sort((a, b) => b.estudado_em.localeCompare(a.estudado_em)),
  )

export const useBaralhos = () => useLiveQuery(async () => (await banco.baralhos.toArray()).filter(ativo).sort(porNome))

export const useBaralho = (id: string) => useLiveQuery(async () => {
  const b = await banco.baralhos.get(id)
  return ativo(b) ? b : null
}, [id])

export const useCardsDoBaralho = (baralhoId: string) =>
  useLiveQuery(async () => (await banco.cards.where('baralho_id').equals(baralhoId).toArray()).filter(ativo), [baralhoId])

export const useCardsDaMicrometa = (micrometaId: string) =>
  useLiveQuery(async () => (await banco.cards.where('micrometa_id').equals(micrometaId).toArray()).filter(ativo), [micrometaId])

export const useCard = (id: string | null) =>
  useLiveQuery(async () => {
    if (!id) return null
    const c = await banco.cards.get(id)
    return ativo(c) ? c : null
  }, [id])

/** Quantos cards ativos há em cada baralho. */
export const useContagemPorBaralho = () =>
  useLiveQuery(async () => {
    const contagem = new Map<string, number>()
    await banco.cards.each((c) => {
      if (!c.deleted_at) contagem.set(c.baralho_id, (contagem.get(c.baralho_id) ?? 0) + 1)
    })
    return contagem
  })

/** Tudo que a importação precisa conhecer (só registros ativos). */
export async function lerExistentes(): Promise<Existentes> {
  const [baralhos, objetivos, areas, micrometas, cards] = await Promise.all([
    banco.baralhos.toArray(),
    banco.objetivos.toArray(),
    banco.areas.toArray(),
    banco.micrometas.toArray(),
    banco.cards.toArray(),
  ])
  return {
    baralhos: baralhos.filter(ativo),
    objetivos: objetivos.filter(ativo),
    areas: areas.filter(ativo),
    micrometas: micrometas.filter(ativo),
    cards: cards.filter(ativo),
  }
}

// ---------- Gravação ----------

export async function criarObjetivo(nome: string) {
  const todos = (await banco.objetivos.toArray()).filter(ativo)
  const o: Objetivo = { id: novoId(), nome: nome.trim(), ordem: proximaOrdem(todos), updated_at: '' }
  await salvar('objetivos', [o])
  return o
}

export async function criarArea(objetivoId: string, nome: string) {
  const irmas = (await banco.areas.where('objetivo_id').equals(objetivoId).toArray()).filter(ativo)
  const a: Area = { id: novoId(), objetivo_id: objetivoId, nome: nome.trim(), ordem: proximaOrdem(irmas), updated_at: '' }
  await salvar('areas', [a])
  return a
}

export async function criarMicrometa(objetivoId: string, areaId: string | null, nome: string) {
  const irmas = (await banco.micrometas.where('objetivo_id').equals(objetivoId).toArray()).filter(ativo)
  const m: Micrometa = {
    id: novoId(),
    objetivo_id: objetivoId,
    area_id: areaId,
    nome: nome.trim(),
    ordem: proximaOrdem(irmas),
    updated_at: '',
  }
  await salvar('micrometas', [m])
  return m
}

export const renomear = <T extends Registro & { nome: string }>(tabela: NomeTabela, r: T, nome: string) =>
  salvar(tabela, [{ ...r, nome: nome.trim() }])

export const moverMicrometaDeArea = (m: Micrometa, areaId: string | null) => salvar('micrometas', [{ ...m, area_id: areaId }])

/** Troca a posição na fila de estudo com a vizinha (dentro da mesma área). */
export async function moverNaFila(m: Micrometa, direcao: -1 | 1) {
  const grupo = (await banco.micrometas.where('objetivo_id').equals(m.objetivo_id).toArray())
    .filter((x) => ativo(x) && x.area_id === m.area_id)
    .sort(porOrdem)
  const i = grupo.findIndex((x) => x.id === m.id)
  const vizinha = grupo[i + direcao]
  if (!vizinha) return
  await salvar('micrometas', [
    { ...m, ordem: vizinha.ordem },
    { ...vizinha, ordem: m.ordem },
  ])
}

export async function registrarCheckin(micrometaId: string, nota: string) {
  const c: Checkin = { id: novoId(), micrometa_id: micrometaId, estudado_em: agoraISO(), nota: nota.trim() || null, updated_at: '' }
  await salvar('checkins', [c])
}

export const apagarCheckin = (c: Checkin) => salvar('checkins', [apagado(c)])

/** Apaga a micrometa e seus check-ins; os cards continuam no baralho, sem micrometa. */
export async function apagarMicrometa(m: Micrometa) {
  const checkins = (await banco.checkins.where('micrometa_id').equals(m.id).toArray()).filter(ativo)
  const cards = (await banco.cards.where('micrometa_id').equals(m.id).toArray()).filter(ativo)
  await salvar('checkins', checkins.map(apagado))
  await salvar('cards', cards.map((c) => ({ ...c, micrometa_id: null })))
  await salvar('micrometas', [apagado(m)])
}

/** Apaga a área; as micrometas dela ficam "sem área". */
export async function apagarArea(a: Area) {
  const micrometas = (await banco.micrometas.where('objetivo_id').equals(a.objetivo_id).toArray()).filter(
    (m) => ativo(m) && m.area_id === a.id,
  )
  await salvar('micrometas', micrometas.map((m) => ({ ...m, area_id: null })))
  await salvar('areas', [apagado(a)])
}

/** Apaga o objetivo com áreas, micrometas e check-ins; os cards continuam nos baralhos. */
export async function apagarObjetivo(o: Objetivo) {
  const micrometas = (await banco.micrometas.where('objetivo_id').equals(o.id).toArray()).filter(ativo)
  for (const m of micrometas) await apagarMicrometa(m)
  const areas = (await banco.areas.where('objetivo_id').equals(o.id).toArray()).filter(ativo)
  await salvar('areas', areas.map(apagado))
  await salvar('objetivos', [apagado(o)])
}

export async function criarBaralho(nome: string) {
  const todos = (await banco.baralhos.toArray()).filter(ativo)
  const b: Baralho = { id: novoId(), nome: nome.trim(), ordem: proximaOrdem(todos), updated_at: '' }
  await salvar('baralhos', [b])
  return b
}

/** Apaga o baralho e os cards dele. */
export async function apagarBaralho(b: Baralho) {
  const cards = (await banco.cards.where('baralho_id').equals(b.id).toArray()).filter(ativo)
  await salvar('cards', cards.map(apagado))
  await salvar('baralhos', [apagado(b)])
}

export interface DadosCard {
  baralho_id: string
  micrometa_id: string | null
  frente: string
  verso: string
  tags: string[]
}

/** Cria (sem id) ou atualiza (com id) um card. Editar não muda o progresso de memória. */
export async function salvarCard(id: string | null, dados: DadosCard) {
  const limpo = { ...dados, frente: dados.frente.trim(), verso: dados.verso.trim() }
  if (id) {
    const atual = await banco.cards.get(id)
    if (atual) return salvar('cards', [{ ...atual, ...limpo }])
  }
  const novo: Card = { id: novoId(), ...limpo, ...estadoInicial(new Date()), updated_at: '' }
  await salvar('cards', [novo])
}

export const apagarCard = (c: Card) => salvar('cards', [apagado(c)])

/** Grava o resultado de uma importação, na ordem certa (pais antes dos filhos). */
export async function gravarImportacao(r: RegistrosImportacao) {
  await sincronizador.registrarVarios('objetivos', r.objetivos)
  await sincronizador.registrarVarios('areas', r.areas)
  await sincronizador.registrarVarios('micrometas', r.micrometas)
  await sincronizador.registrarVarios('baralhos', r.baralhos)
  await sincronizador.registrarVarios('cards', r.cards)
  void sincronizador.sincronizar()
}

// ---------- Situação das micrometas ----------

export type Situacao = 'a-estudar' | 'estudada'

export function situacaoDe(micrometaId: string, checkins: Checkin[] | undefined): Situacao {
  return checkins?.some((c) => c.micrometa_id === micrometaId) ? 'estudada' : 'a-estudar'
}

/** Próxima micrometa a estudar: a primeira da fila (área, depois ordem) sem check-in. */
export function proximaAEstudar(micrometas: Micrometa[], areas: Area[], checkins: Checkin[] | undefined) {
  const ordemArea = (id: string | null) => (id ? (areas.find((a) => a.id === id)?.ordem ?? 0) : -1)
  return [...micrometas]
    .sort((a, b) => ordemArea(a.area_id) - ordemArea(b.area_id) || a.ordem - b.ordem)
    .find((m) => situacaoDe(m.id, checkins) === 'a-estudar')
}

// ---------- Revisão ----------

export interface DadosRevisao {
  cards: Card[]
  micrometas: Micrometa[]
  areas: Area[]
  objetivos: Objetivo[]
  checkins: Checkin[]
  novosRespondidosHoje: number
}

/** Tudo que a revisão precisa, atualizado sozinho quando os dados mudam. */
export const useDadosRevisao = (inicioDoDia: Date) =>
  useLiveQuery(async (): Promise<DadosRevisao> => {
    const [cards, micrometas, areas, objetivos, checkins, revisoesHoje] = await Promise.all([
      banco.cards.toArray(),
      banco.micrometas.toArray(),
      banco.areas.toArray(),
      banco.objetivos.toArray(),
      banco.checkins.toArray(),
      banco.revisoes.where('revisado_em').aboveOrEqual(inicioDoDia.toISOString()).toArray(),
    ])
    return {
      cards: cards.filter(ativo),
      micrometas: micrometas.filter(ativo),
      areas: areas.filter(ativo),
      objetivos: objetivos.filter(ativo),
      checkins: checkins.filter(ativo),
      novosRespondidosHoje: novosHoje(revisoesHoje, inicioDoDia),
    }
  }, [inicioDoDia.getTime()])

/** Grava a resposta: o card com o novo agendamento e o registro no histórico. */
export async function gravarResposta(card: Card, revisao: Revisao) {
  await sincronizador.registrar('revisoes', revisao)
  await sincronizador.registrar('cards', card)
  void sincronizador.sincronizar()
}

/** Modo Desenvolvedor: desfaz as revisões de hoje. Devolve quantas foram desfeitas. */
export async function resetarRevisoesDeHoje(inicioDoDia: Date): Promise<number> {
  const hoje = (await banco.revisoes.where('revisado_em').aboveOrEqual(inicioDoDia.toISOString()).toArray()).filter(ativo)
  if (hoje.length === 0) return 0
  const ids = [...new Set(hoje.map((r) => r.card_id))]
  const [cards, todas] = await Promise.all([banco.cards.bulkGet(ids), banco.revisoes.where('card_id').anyOf(ids).toArray()])
  const anteriores = todas.filter((r) => r.revisado_em < inicioDoDia.toISOString())
  const r = desfazerRevisoesDeHoje(cards.filter(ativo), hoje, anteriores)
  await sincronizador.registrarVarios('revisoes', r.revisoes)
  await sincronizador.registrarVarios('cards', r.cards)
  void sincronizador.sincronizar()
  return r.revisoes.length
}
