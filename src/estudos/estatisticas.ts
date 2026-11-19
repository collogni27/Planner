// Acompanhamento dos estudos (docs/modulos/estudos.md). Lógica pura, testada.
// Foco: mostrar onde investir o próximo estudo, não placar.
import { State } from 'ts-fsrs'
import type { Card, Checkin, Micrometa, Revisao } from '../dados/banco'
import { agendador, paraFsrs } from './revisao'

/** Card "maduro": intervalo de 21 dias ou mais (mesma definição do Anki). */
export const DIAS_MADURO = 21
/** Janela do acerto: últimos 30 dias. */
export const JANELA_ACERTO_MS = 30 * 86_400_000
/** Abaixo disto (em %), o conteúdo aparece em "Precisa de reforço". */
export const ACERTO_MINIMO = 80
export const FORCA_MINIMA = 70
/** Card errado este número de vezes (lapsos) vira "card-problema". */
export const LAPSOS_PROBLEMA = 4

export type Situacao = 'a-estudar' | 'estudado' | 'em-consolidacao' | 'dominado'

export const NOME_SITUACAO: Record<Situacao, string> = {
  'a-estudar': 'a estudar',
  estudado: 'estudado',
  'em-consolidacao': 'em consolidação',
  dominado: 'dominado',
}

const foiRevisado = (c: Card) => c.state !== State.New

/** Chance de lembrar o card agora (0 a 1), pela estimativa do FSRS. Card nunca revisado: null. */
export function forcaCard(c: Card, agora: Date): number | null {
  if (!foiRevisado(c)) return null
  return agendador.get_retrievability(paraFsrs(c), agora, false)
}

/** Média da chance de lembrar dos cards já revisados, em % (null se nenhum foi revisado). */
export function forca(cards: Card[], agora: Date): number | null {
  const valores = cards.map((c) => forcaCard(c, agora)).filter((v): v is number => v !== null)
  if (valores.length === 0) return null
  return Math.round((100 * valores.reduce((a, b) => a + b, 0)) / valores.length)
}

/**
 * Acerto nas revisões de cards que já estavam aprendidos (como a "retenção real" do Anki),
 * nos últimos 30 dias. Em %, com o total de respostas consideradas.
 */
export function acerto(revisoes: Revisao[], agora: Date): { valor: number | null; respostas: number } {
  const desde = agora.getTime() - JANELA_ACERTO_MS
  const consideradas = revisoes.filter((r) => !r.deleted_at && r.state === State.Review && Date.parse(r.revisado_em) >= desde)
  if (consideradas.length === 0) return { valor: null, respostas: 0 }
  const certas = consideradas.filter((r) => r.nota > 1).length
  return { valor: Math.round((100 * certas) / consideradas.length), respostas: consideradas.length }
}

export interface ResumoConteudo {
  conteudo: Micrometa
  situacao: Situacao
  cards: number
  forca: number | null
  acerto: number | null
  respostas: number
  ultimoEstudo: string | null
}

export function resumirConteudo(m: Micrometa, cards: Card[], checkins: Checkin[], revisoes: Revisao[], agora: Date): ResumoConteudo {
  const meus = cards.filter((c) => c.micrometa_id === m.id && !c.deleted_at)
  const ids = new Set(meus.map((c) => c.id))
  const estudos = checkins.filter((c) => c.micrometa_id === m.id && !c.deleted_at).sort((a, b) => b.estudado_em.localeCompare(a.estudado_em))
  const revisados = meus.filter(foiRevisado)
  const maduros = meus.filter((c) => foiRevisado(c) && c.scheduled_days >= DIAS_MADURO)

  let situacao: Situacao = 'a-estudar'
  if (estudos.length > 0) situacao = revisados.length === 0 ? 'estudado' : 'em-consolidacao'
  // Dominado: todos os cards já revisados e pelo menos 80% deles maduros.
  if (estudos.length > 0 && meus.length > 0 && revisados.length === meus.length && maduros.length >= 0.8 * meus.length) {
    situacao = 'dominado'
  }
  const a = acerto(
    revisoes.filter((r) => ids.has(r.card_id)),
    agora,
  )
  return {
    conteudo: m,
    situacao,
    cards: meus.length,
    forca: forca(meus, agora),
    acerto: a.valor,
    respostas: a.respostas,
    ultimoEstudo: estudos[0]?.estudado_em ?? null,
  }
}

/** Conteúdos que pedem reestudo: acerto baixo (com respostas suficientes) ou força baixa. */
export function precisamReforco(resumos: ResumoConteudo[]): ResumoConteudo[] {
  return resumos
    .filter(
      (r) =>
        (r.acerto !== null && r.respostas >= 5 && r.acerto < ACERTO_MINIMO) || (r.forca !== null && r.forca < FORCA_MINIMA),
    )
    .sort((a, b) => (a.acerto ?? a.forca ?? 100) - (b.acerto ?? b.forca ?? 100))
}

/** Cards errados muitas vezes: costumam estar mal escritos ou grandes demais. */
export const cardsProblema = (cards: Card[]) =>
  cards.filter((c) => !c.deleted_at && c.lapses >= LAPSOS_PROBLEMA).sort((a, b) => b.lapses - a.lapses)

/**
 * Revisões previstas por dia (hoje + 6 dias), só de cards já revisados e liberados.
 * Hoje inclui os atrasados. `inicioDeHoje` é a meia-noite em São Paulo.
 */
export function carga(cards: Card[], checkins: Checkin[], inicioDeHoje: Date, dias = 7): number[] {
  const estudados = new Set(checkins.filter((c) => !c.deleted_at).map((c) => c.micrometa_id))
  const contagem = Array.from({ length: dias }, () => 0)
  const dia = 86_400_000
  for (const c of cards) {
    if (c.deleted_at || !foiRevisado(c)) continue
    if (c.micrometa_id && !estudados.has(c.micrometa_id)) continue
    const i = Math.max(0, Math.floor((Date.parse(c.due) - inicioDeHoje.getTime()) / dia))
    if (i < dias) contagem[i]++
  }
  return contagem
}

/** Novos / jovens / maduros. */
export function maturidade(cards: Card[]) {
  const r = { novos: 0, jovens: 0, maduros: 0 }
  for (const c of cards) {
    if (c.deleted_at) continue
    if (!foiRevisado(c)) r.novos++
    else if (c.scheduled_days >= DIAS_MADURO) r.maduros++
    else r.jovens++
  }
  return r
}

/** Quantos cards há em cada tag (mais usadas primeiro). */
export function cardsPorTag(cards: Card[]): { tag: string; cards: number }[] {
  const m = new Map<string, number>()
  for (const c of cards) if (!c.deleted_at) for (const t of c.tags) m.set(t, (m.get(t) ?? 0) + 1)
  return [...m].map(([tag, n]) => ({ tag, cards: n })).sort((a, b) => b.cards - a.cards || a.tag.localeCompare(b.tag, 'pt-BR'))
}
