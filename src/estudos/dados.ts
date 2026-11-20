// Leitura e gravação do módulo Estudos. Toda gravação passa pelo sincronizador
// (grava no aparelho + fila para a nuvem).
import { useLiveQuery } from 'dexie-react-hooks'
import {
  agoraISO,
  ativo,
  banco,
  novoId,
  idFixo,
  type Baralho,
  type Card,
  type Checkin,
  type Micrometa,
  type NomeTabela,
  type Objetivo,
  type ObjetivoBaralho,
  type ObjetivoConteudo,
  type Registro,
  type Revisao,
} from '../dados/banco'
import { sincronizador } from '../nuvem/supabase'
import { estadoInicial } from './fsrs'
import type { Existentes, RegistrosImportacao } from './importacao'
import type { ItemFila, Vinculos } from './modelo'
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

export const useTodasMicrometas = () => useLiveQuery(async () => (await banco.micrometas.toArray()).filter(ativo).sort(porOrdem))

export const useMicrometa = (id: string) => useLiveQuery(async () => {
  const m = await banco.micrometas.get(id)
  return ativo(m) ? m : null
}, [id])

/** Check-ins de todos os conteúdos (para saber o que já foi estudado). */
export const useCheckins = () =>
  useLiveQuery(async () =>
    (await banco.checkins.toArray()).filter(ativo).sort((a, b) => b.estudado_em.localeCompare(a.estudado_em)),
  )

/** Vínculos objetivo↔baralho e objetivo↔conteúdo (só os ativos). */
export const useVinculos = () =>
  useLiveQuery(
    async (): Promise<Vinculos> => ({
      baralhos: (await banco.objetivo_baralhos.toArray()).filter(ativo),
      conteudos: (await banco.objetivo_conteudos.toArray()).filter(ativo),
    }),
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

/** Revisões (histórico) de um card, da mais recente para a mais antiga. */
export const useRevisoesDoCard = (id: string | null) =>
  useLiveQuery(async () => {
    if (!id) return []
    return (await banco.revisoes.where('card_id').equals(id).toArray())
      .filter(ativo)
      .sort((a, b) => b.revisado_em.localeCompare(a.revisado_em))
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

async function lerVinculos(): Promise<Vinculos> {
  return {
    baralhos: (await banco.objetivo_baralhos.toArray()).filter(ativo),
    conteudos: (await banco.objetivo_conteudos.toArray()).filter(ativo),
  }
}

/** Tudo que a importação precisa conhecer (só registros ativos). */
export async function lerExistentes(): Promise<Existentes> {
  const [baralhos, objetivos, micrometas, cards, vinculos] = await Promise.all([
    banco.baralhos.toArray(),
    banco.objetivos.toArray(),
    banco.micrometas.toArray(),
    banco.cards.toArray(),
    lerVinculos(),
  ])
  return {
    baralhos: baralhos.filter(ativo),
    objetivos: objetivos.filter(ativo),
    micrometas: micrometas.filter(ativo),
    cards: cards.filter(ativo),
    vinculos,
  }
}

// ---------- Gravação ----------

export async function criarObjetivo(nome: string) {
  const todos = (await banco.objetivos.toArray()).filter(ativo)
  const o: Objetivo = { id: novoId(), nome: nome.trim(), ordem: proximaOrdem(todos), updated_at: '' }
  await salvar('objetivos', [o])
  return o
}

export const renomear = <T extends Registro & { nome: string }>(tabela: NomeTabela, r: T, nome: string) =>
  salvar(tabela, [{ ...r, nome: nome.trim() }])

// Vínculos usam identificador fixo (objetivo + baralho/conteúdo): vincular de novo
// reaproveita o mesmo registro em vez de criar outro.
const idVinculoBaralho = (objetivoId: string, baralhoId: string) => idFixo(`baralho:${objetivoId}:${baralhoId}`)
const idVinculoConteudo = (objetivoId: string, conteudoId: string) => idFixo(`conteudo:${objetivoId}:${conteudoId}`)

/** Faz o baralho aparecer no objetivo (no fim da lista), se ainda não aparece. */
export async function vincularBaralho(objetivoId: string, baralhoId: string) {
  const id = idVinculoBaralho(objetivoId, baralhoId)
  const atual = await banco.objetivo_baralhos.get(id)
  if (ativo(atual)) return
  const irmaos = (await banco.objetivo_baralhos.where('objetivo_id').equals(objetivoId).toArray()).filter(ativo)
  const v: ObjetivoBaralho = { id, objetivo_id: objetivoId, baralho_id: baralhoId, ordem: proximaOrdem(irmaos), updated_at: '', deleted_at: null }
  await salvar('objetivo_baralhos', [v])
}

export async function desvincularBaralho(objetivoId: string, baralhoId: string) {
  const atual = await banco.objetivo_baralhos.get(idVinculoBaralho(objetivoId, baralhoId))
  if (ativo(atual)) await salvar('objetivo_baralhos', [apagado(atual)])
}

/** Troca a posição do baralho com o vizinho na tela do objetivo. */
export async function moverBaralhoNoObjetivo(objetivoId: string, baralhoId: string, direcao: -1 | 1) {
  const lista = (await banco.objetivo_baralhos.where('objetivo_id').equals(objetivoId).toArray()).filter(ativo).sort(porOrdem)
  const i = lista.findIndex((v) => v.baralho_id === baralhoId)
  const vizinho = lista[i + direcao]
  if (i < 0 || !vizinho) return
  await salvar('objetivo_baralhos', [
    { ...lista[i], ordem: vizinho.ordem },
    { ...vizinho, ordem: lista[i].ordem },
  ])
}

/** Põe o conteúdo no objetivo (no fim da fila) e faz o baralho dele aparecer ali. */
export async function adicionarConteudoAoObjetivo(objetivoId: string, conteudoId: string) {
  const id = idVinculoConteudo(objetivoId, conteudoId)
  const atual = await banco.objetivo_conteudos.get(id)
  if (!ativo(atual)) {
    const irmaos = (await banco.objetivo_conteudos.where('objetivo_id').equals(objetivoId).toArray()).filter(ativo)
    const v: ObjetivoConteudo = { id, objetivo_id: objetivoId, micrometa_id: conteudoId, ordem: proximaOrdem(irmaos), updated_at: '', deleted_at: null }
    await salvar('objetivo_conteudos', [v])
  }
  const m = await banco.micrometas.get(conteudoId)
  if (m?.baralho_id) await vincularBaralho(objetivoId, m.baralho_id)
}

/** Tira o conteúdo do objetivo (ele continua nos outros objetivos). */
export async function removerConteudoDoObjetivo(objetivoId: string, conteudoId: string) {
  const atual = await banco.objetivo_conteudos.get(idVinculoConteudo(objetivoId, conteudoId))
  if (ativo(atual)) await salvar('objetivo_conteudos', [apagado(atual)])
}

export async function criarConteudo(objetivoId: string, baralhoId: string | null, nome: string) {
  const m: Micrometa = { id: novoId(), objetivo_id: objetivoId, area_id: null, baralho_id: baralhoId, nome: nome.trim(), ordem: 0, updated_at: '' }
  await salvar('micrometas', [m])
  await adicionarConteudoAoObjetivo(objetivoId, m.id)
  return m
}

/** Troca a posição na fila do objetivo com o vizinho (dentro do mesmo baralho). */
export async function moverNaFila(objetivoId: string, grupo: ItemFila[], conteudoId: string, direcao: -1 | 1) {
  const i = grupo.findIndex((x) => x.conteudo.id === conteudoId)
  const vizinho = grupo[i + direcao]
  if (i < 0 || !vizinho) return
  const [a, b] = await banco.objetivo_conteudos.bulkGet([
    idVinculoConteudo(objetivoId, conteudoId),
    idVinculoConteudo(objetivoId, vizinho.conteudo.id),
  ])
  if (!a || !b) return
  // Se a ordem empatar, usa a posição na lista para desempatar.
  const ordemA = a.ordem === b.ordem ? i : a.ordem
  const ordemB = a.ordem === b.ordem ? i + direcao : b.ordem
  await salvar('objetivo_conteudos', [
    { ...a, ordem: ordemB },
    { ...b, ordem: ordemA },
  ])
}

/**
 * Muda o baralho do conteúdo. Os cards dele vão junto (os cards de um conteúdo
 * ficam no baralho do conteúdo), e o baralho passa a aparecer nos objetivos dele.
 */
export async function mudarBaralhoDoConteudo(m: Micrometa, baralhoId: string | null) {
  await salvar('micrometas', [{ ...m, baralho_id: baralhoId }])
  if (!baralhoId) return
  const cards = (await banco.cards.where('micrometa_id').equals(m.id).toArray()).filter((c) => ativo(c) && c.baralho_id !== baralhoId)
  await salvar('cards', cards.map((c) => ({ ...c, baralho_id: baralhoId })))
  const objetivos = (await banco.objetivo_conteudos.where('micrometa_id').equals(m.id).toArray()).filter(ativo)
  for (const v of objetivos) await vincularBaralho(v.objetivo_id, baralhoId)
}

export async function registrarCheckin(micrometaId: string, nota: string) {
  const c: Checkin = { id: novoId(), micrometa_id: micrometaId, estudado_em: agoraISO(), nota: nota.trim() || null, updated_at: '' }
  await salvar('checkins', [c])
}

export const apagarCheckin = (c: Checkin) => salvar('checkins', [apagado(c)])

/** Apaga o conteúdo de todos os objetivos, com seus check-ins; os cards ficam no baralho, sem conteúdo. */
export async function apagarMicrometa(m: Micrometa) {
  const checkins = (await banco.checkins.where('micrometa_id').equals(m.id).toArray()).filter(ativo)
  const cards = (await banco.cards.where('micrometa_id').equals(m.id).toArray()).filter(ativo)
  const vinculos = (await banco.objetivo_conteudos.where('micrometa_id').equals(m.id).toArray()).filter(ativo)
  await salvar('checkins', checkins.map(apagado))
  await salvar('cards', cards.map((c) => ({ ...c, micrometa_id: null })))
  await salvar('objetivo_conteudos', vinculos.map(apagado))
  await salvar('micrometas', [apagado(m)])
}

/**
 * Apaga o objetivo. Conteúdos que só existem nele são apagados (com check-ins);
 * conteúdos compartilhados continuam nos outros objetivos. Os cards ficam nos baralhos.
 */
export async function apagarObjetivo(o: Objetivo) {
  const vinculos = (await banco.objetivo_conteudos.where('objetivo_id').equals(o.id).toArray()).filter(ativo)
  for (const v of vinculos) {
    const outros = (await banco.objetivo_conteudos.where('micrometa_id').equals(v.micrometa_id).toArray()).filter(
      (x) => ativo(x) && x.objetivo_id !== o.id,
    )
    const m = await banco.micrometas.get(v.micrometa_id)
    if (outros.length === 0 && ativo(m)) await apagarMicrometa(m)
    else await salvar('objetivo_conteudos', [apagado(v)])
  }
  const baralhos = (await banco.objetivo_baralhos.where('objetivo_id').equals(o.id).toArray()).filter(ativo)
  await salvar('objetivo_baralhos', baralhos.map(apagado))
  await salvar('objetivos', [apagado(o)])
}

export async function criarBaralho(nome: string) {
  const todos = (await banco.baralhos.toArray()).filter(ativo)
  const b: Baralho = { id: novoId(), nome: nome.trim(), ordem: proximaOrdem(todos), updated_at: '' }
  await salvar('baralhos', [b])
  return b
}

/** Apaga o baralho e os cards dele; os conteúdos do baralho ficam "sem baralho". */
export async function apagarBaralho(b: Baralho) {
  const cards = (await banco.cards.where('baralho_id').equals(b.id).toArray()).filter(ativo)
  const conteudos = (await banco.micrometas.where('baralho_id').equals(b.id).toArray()).filter(ativo)
  const vinculos = (await banco.objetivo_baralhos.where('baralho_id').equals(b.id).toArray()).filter(ativo)
  await salvar('cards', cards.map(apagado))
  await salvar('micrometas', conteudos.map((m) => ({ ...m, baralho_id: null })))
  await salvar('objetivo_baralhos', vinculos.map(apagado))
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
  // Card de um conteúdo com baralho fica no baralho do conteúdo.
  const conteudo = limpo.micrometa_id ? await banco.micrometas.get(limpo.micrometa_id) : undefined
  if (conteudo?.baralho_id) limpo.baralho_id = conteudo.baralho_id
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
  await sincronizador.registrarVarios('baralhos', r.baralhos)
  await sincronizador.registrarVarios('micrometas', r.micrometas)
  await sincronizador.registrarVarios('objetivo_conteudos', r.vinculosConteudos)
  await sincronizador.registrarVarios('objetivo_baralhos', r.vinculosBaralhos)
  await sincronizador.registrarVarios('cards', r.cards)
  void sincronizador.sincronizar()
}

// ---------- Revisão ----------

export interface DadosRevisao {
  cards: Card[]
  micrometas: Micrometa[]
  objetivos: Objetivo[]
  baralhos: Baralho[]
  checkins: Checkin[]
  vinculos: Vinculos
  novosRespondidosHoje: number
}

/** Tudo que a revisão precisa, atualizado sozinho quando os dados mudam. */
export const useDadosRevisao = (inicioDoDia: Date) =>
  useLiveQuery(async (): Promise<DadosRevisao> => {
    const [cards, micrometas, objetivos, baralhos, checkins, vinculos, revisoesHoje] = await Promise.all([
      banco.cards.toArray(),
      banco.micrometas.toArray(),
      banco.objetivos.toArray(),
      banco.baralhos.toArray(),
      banco.checkins.toArray(),
      lerVinculos(),
      banco.revisoes.where('revisado_em').aboveOrEqual(inicioDoDia.toISOString()).toArray(),
    ])
    return {
      cards: cards.filter(ativo),
      micrometas: micrometas.filter(ativo),
      objetivos: objetivos.filter(ativo).sort(porOrdem),
      baralhos: baralhos.filter(ativo).sort(porNome),
      checkins: checkins.filter(ativo),
      vinculos,
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

// ---------- Acompanhamento ----------

/** Todos os dados ativos de Estudos (para o acompanhamento). */
export const useTudoDeEstudos = () =>
  useLiveQuery(async () => {
    const [cards, micrometas, checkins, revisoes, objetivos, baralhos, vinculos] = await Promise.all([
      banco.cards.toArray(),
      banco.micrometas.toArray(),
      banco.checkins.toArray(),
      banco.revisoes.toArray(),
      banco.objetivos.toArray(),
      banco.baralhos.toArray(),
      lerVinculos(),
    ])
    return {
      vinculos,
      cards: cards.filter(ativo),
      micrometas: micrometas.filter(ativo).sort(porOrdem),
      checkins: checkins.filter(ativo),
      revisoes: revisoes.filter(ativo),
      objetivos: objetivos.filter(ativo).sort(porOrdem),
      baralhos: baralhos.filter(ativo).sort(porNome),
    }
  })
