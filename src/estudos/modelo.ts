// Regras do modelo de Estudos (0.3.4), sem banco nem tela, para serem testadas:
// • Baralho: independente; pode aparecer em vários objetivos (objetivo_baralhos).
// • Conteúdo: pode estar em vários objetivos (objetivo_conteudos) e ter um baralho.
// • Na tela do objetivo, cada baralho mostra só os conteúdos DAQUELE objetivo
//   que estão NAQUELE baralho.
import type { Baralho, Checkin, Micrometa, ObjetivoBaralho, ObjetivoConteudo } from '../dados/banco'

export interface Vinculos {
  baralhos: ObjetivoBaralho[]
  conteudos: ObjetivoConteudo[]
}

const ativos = <T extends { deleted_at?: string | null }>(l: T[]) => l.filter((x) => !x.deleted_at)

/** Objetivos em que o conteúdo aparece. */
export const objetivosDoConteudo = (conteudoId: string, v: Vinculos) =>
  ativos(v.conteudos)
    .filter((x) => x.micrometa_id === conteudoId)
    .map((x) => x.objetivo_id)

/** Vínculo de um conteúdo com um objetivo (com a ordem dele na fila daquele objetivo). */
export const vinculoConteudo = (objetivoId: string, conteudoId: string, v: Vinculos) =>
  ativos(v.conteudos).find((x) => x.objetivo_id === objetivoId && x.micrometa_id === conteudoId)

export const vinculoBaralho = (objetivoId: string, baralhoId: string, v: Vinculos) =>
  ativos(v.baralhos).find((x) => x.objetivo_id === objetivoId && x.baralho_id === baralhoId)

export interface ItemFila {
  conteudo: Micrometa
  ordem: number
}

export interface Grupo {
  /** null = "Sem baralho" */
  baralho: Baralho | null
  itens: ItemFila[]
}

/**
 * Grupos da tela do objetivo: os baralhos vinculados (na ordem do objetivo) e,
 * em cada um, os conteúdos do objetivo que estão nele (na ordem da fila).
 * Conteúdo do objetivo cujo baralho não está vinculado aparece mesmo assim, no
 * grupo do baralho dele; conteúdo sem baralho vai para "Sem baralho" (primeiro).
 */
export function gruposDoObjetivo(objetivoId: string, conteudos: Micrometa[], baralhos: Baralho[], v: Vinculos): Grupo[] {
  const meus = ativos(v.conteudos).filter((x) => x.objetivo_id === objetivoId)
  const itens: ItemFila[] = meus
    .map((x) => ({ conteudo: conteudos.find((c) => c.id === x.micrometa_id && !c.deleted_at), ordem: x.ordem }))
    .filter((i): i is ItemFila => !!i.conteudo)
    .sort((a, b) => a.ordem - b.ordem)

  const vinculados = ativos(v.baralhos)
    .filter((x) => x.objetivo_id === objetivoId)
    .sort((a, b) => a.ordem - b.ordem)
    .map((x) => baralhos.find((b) => b.id === x.baralho_id && !b.deleted_at))
    .filter((b): b is Baralho => !!b)
  const extras = baralhos.filter(
    (b) => !b.deleted_at && !vinculados.includes(b) && itens.some((i) => i.conteudo.baralho_id === b.id),
  )

  const semBaralho = itens.filter((i) => !i.conteudo.baralho_id || !baralhos.some((b) => b.id === i.conteudo.baralho_id && !b.deleted_at))
  return [
    ...(semBaralho.length > 0 ? [{ baralho: null, itens: semBaralho }] : []),
    ...[...vinculados, ...extras].map((b) => ({ baralho: b, itens: itens.filter((i) => i.conteudo.baralho_id === b.id) })),
  ]
}

/** Próximo a estudar: o primeiro da fila (grupo por grupo) ainda sem check-in. */
export function proximoAEstudar(grupos: Grupo[], checkins: Checkin[]): Micrometa | undefined {
  const estudados = new Set(checkins.filter((c) => !c.deleted_at).map((c) => c.micrometa_id))
  for (const g of grupos) for (const i of g.itens) if (!estudados.has(i.conteudo.id)) return i.conteudo
  return undefined
}

/** Conteúdos que ainda não estão neste objetivo (para "Adicionar conteúdo de outro objetivo"). */
export const conteudosForaDoObjetivo = (objetivoId: string, conteudos: Micrometa[], v: Vinculos) =>
  conteudos.filter((c) => !c.deleted_at && !vinculoConteudo(objetivoId, c.id, v))
