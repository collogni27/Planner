// Lógica da revisão (docs/modulos/estudos.md), sem banco nem tela, para ser testada.
import { fsrs, generatorParameters, Rating, State, type Card as CardFsrs, type FSRS, type Grade } from 'ts-fsrs'
import type { Card, Checkin, Micrometa, Revisao } from '../dados/banco'

/** Meta de memorização: o card volta quando a chance de lembrar cair para 90%. */
export const META_RETENCAO = 0.9

/**
 * Teto de segurança de cards novos por dia. O ritmo normal é dado pelos check-ins;
 * isto só evita uma avalanche de revisões nas semanas seguintes.
 */
export const NOVOS_POR_DIA = 50

/** Cards em aprendizado que voltam em até 20 min podem ser adiantados quando não há mais nada. */
export const ADIANTAR_MS = 20 * 60_000

export const agendador = fsrs(generatorParameters({ request_retention: META_RETENCAO, enable_fuzz: true }))

export type Filtro = { tipo: 'tudo' } | { tipo: 'areas'; ids: string[] } | { tipo: 'tags'; tags: string[] }

export const NOTAS: { nota: Grade; rotulo: string }[] = [
  { nota: Rating.Again, rotulo: 'Errei' },
  { nota: Rating.Hard, rotulo: 'Difícil' },
  { nota: Rating.Good, rotulo: 'Bom' },
  { nota: Rating.Easy, rotulo: 'Fácil' },
]

/**
 * Cards do baralho que podem ser revisados: ativos, dentro do filtro e, se ligados
 * a um conteúdo, só depois do primeiro check-in dele (primeiro estudar, depois recuperar).
 */
export function cardsLiberados(
  cards: Card[],
  baralhoId: string,
  filtro: Filtro,
  micrometas: Micrometa[],
  checkins: Checkin[],
): Card[] {
  const estudados = new Set(checkins.filter((c) => !c.deleted_at).map((c) => c.micrometa_id))
  const areaDe = new Map(micrometas.map((m) => [m.id, m.area_id]))
  return cards.filter((c) => {
    if (c.deleted_at || c.baralho_id !== baralhoId) return false
    if (c.micrometa_id && !estudados.has(c.micrometa_id)) return false
    if (filtro.tipo === 'areas') {
      const area = c.micrometa_id ? areaDe.get(c.micrometa_id) : null
      return !!area && filtro.ids.includes(area)
    }
    if (filtro.tipo === 'tags') return c.tags.some((t) => filtro.tags.includes(t))
    return true
  })
}

/** Quantos cards novos já foram respondidos pela primeira vez hoje (para o teto diário). */
export function novosHoje(revisoes: Revisao[], inicioDoDia: Date): number {
  const desde = inicioDoDia.getTime()
  return revisoes.filter((r) => !r.deleted_at && r.state === State.New && Date.parse(r.revisado_em) >= desde).length
}

/** Embaralhamento estável (o mesmo dia mantém a mesma ordem): mistura os conteúdos. */
function misturar(id: string, semente: string): number {
  let h = 2166136261
  for (const ch of id + semente) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return h >>> 0
}

export interface Fila {
  /** Próximo card a mostrar (ou null: nada para agora). */
  proximo: Card | null
  /** Quantos ainda estão para revisar agora (incluindo o próximo). */
  restantes: number
  /** Quando volta o próximo card em aprendizado, se houver (para avisar no fim). */
  voltaEm: Date | null
}

/**
 * Escolhe o próximo card: primeiro os em aprendizado que já venceram (são sensíveis ao
 * tempo), depois revisões e novos misturados. Novos respeitam o teto diário.
 */
export function montarFila(liberados: Card[], agora: Date, novosRespondidosHoje: number, semente: string): Fila {
  const t = agora.getTime()
  const vagasNovos = Math.max(0, NOVOS_POR_DIA - novosRespondidosHoje)
  const ordem = (a: Card, b: Card) => misturar(a.id, semente) - misturar(b.id, semente)

  const vencidos = liberados.filter((c) => Date.parse(c.due) <= t)
  const aprendendo = vencidos.filter((c) => c.state === State.Learning || c.state === State.Relearning)
  const revisoes = vencidos.filter((c) => c.state === State.Review)
  const novos = vencidos.filter((c) => c.state === State.New).sort(ordem).slice(0, vagasNovos)

  aprendendo.sort((a, b) => Date.parse(a.due) - Date.parse(b.due))
  const resto = [...revisoes, ...novos].sort(ordem)
  const fila = [...aprendendo, ...resto]

  const futurosAprendendo = liberados
    .filter((c) => (c.state === State.Learning || c.state === State.Relearning) && Date.parse(c.due) > t)
    .sort((a, b) => Date.parse(a.due) - Date.parse(b.due))

  if (fila.length > 0) return { proximo: fila[0], restantes: fila.length, voltaEm: null }

  // Nada vencido: adianta um card em aprendizado que volta em poucos minutos.
  const adiantavel = futurosAprendendo.find((c) => Date.parse(c.due) - t <= ADIANTAR_MS)
  if (adiantavel) return { proximo: adiantavel, restantes: 1, voltaEm: null }
  return { proximo: null, restantes: 0, voltaEm: futurosAprendendo[0] ? new Date(futurosAprendendo[0].due) : null }
}

// ---------- Conversão entre o banco e a biblioteca ----------

function paraFsrs(c: Card): CardFsrs {
  return {
    due: new Date(c.due),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsed_days: c.elapsed_days,
    scheduled_days: c.scheduled_days,
    learning_steps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state as State,
    last_review: c.last_review ? new Date(c.last_review) : undefined,
  }
}

function deFsrs(original: Card, n: CardFsrs): Card {
  return {
    ...original,
    due: n.due.toISOString(),
    stability: n.stability,
    difficulty: n.difficulty,
    elapsed_days: n.elapsed_days,
    scheduled_days: n.scheduled_days,
    learning_steps: n.learning_steps,
    reps: n.reps,
    lapses: n.lapses,
    state: n.state,
    last_review: n.last_review ? n.last_review.toISOString() : null,
  }
}

/** Quando o card voltaria para cada botão (para mostrar "Bom · 3d"). */
export function previa(card: Card, agora: Date, f: FSRS = agendador): Record<Grade, Date> {
  const p = f.repeat(paraFsrs(card), agora)
  return {
    [Rating.Again]: p[Rating.Again].card.due,
    [Rating.Hard]: p[Rating.Hard].card.due,
    [Rating.Good]: p[Rating.Good].card.due,
    [Rating.Easy]: p[Rating.Easy].card.due,
  } as Record<Grade, Date>
}

/** Aplica a resposta: novo estado do card + registro da revisão (com o estado de antes). */
export function responder(
  card: Card,
  nota: Grade,
  agora: Date,
  duracaoMs: number | null,
  gerarId: () => string,
  f: FSRS = agendador,
): { card: Card; revisao: Revisao } {
  const { card: novo, log } = f.next(paraFsrs(card), agora, nota)
  return {
    card: deFsrs(card, novo),
    revisao: {
      id: gerarId(),
      card_id: card.id,
      nota,
      revisado_em: agora.toISOString(),
      state: log.state,
      stability: log.stability,
      difficulty: log.difficulty,
      elapsed_days: log.elapsed_days,
      scheduled_days: log.scheduled_days,
      duracao_ms: duracaoMs,
      updated_at: '',
    },
  }
}

/** "1min", "10min", "3h", "4d", "2 meses", "1,5 ano". */
export function formatarIntervalo(de: Date, ate: Date): string {
  const min = Math.max(1, Math.round((ate.getTime() - de.getTime()) / 60_000))
  if (min < 60) return `${min}min`
  const horas = Math.round(min / 60)
  if (horas < 24) return `${horas}h`
  const dias = Math.round(horas / 24)
  if (dias < 31) return `${dias}d`
  const meses = Math.round(dias / 30)
  if (meses < 12) return meses === 1 ? '1 mês' : `${meses} meses`
  const anos = (dias / 365).toFixed(1).replace('.', ',').replace(',0', '')
  return anos === '1' ? '1 ano' : `${anos} anos`
}
