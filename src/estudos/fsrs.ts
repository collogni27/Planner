// Integração com o FSRS (biblioteca ts-fsrs): só converte entre o formato da
// biblioteca e o formato salvo no banco (datas como texto ISO).
import { createEmptyCard } from 'ts-fsrs'
import type { Card } from '../dados/banco'

export type EstadoFsrs = Pick<
  Card,
  | 'due'
  | 'stability'
  | 'difficulty'
  | 'elapsed_days'
  | 'scheduled_days'
  | 'learning_steps'
  | 'reps'
  | 'lapses'
  | 'state'
  | 'last_review'
>

/** Estado de um card novo (nunca revisado). */
export function estadoInicial(agora: Date): EstadoFsrs {
  const c = createEmptyCard(agora)
  return {
    due: c.due.toISOString(),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsed_days: c.elapsed_days,
    scheduled_days: c.scheduled_days,
    learning_steps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    last_review: null,
  }
}
