// Banco local (IndexedDB, via Dexie). Regra "local primeiro": todo registro é
// gravado aqui antes e enviado ao Supabase depois, pela fila de sincronização.
// Mudanças de formato = nova versão com migração (nunca apagar dados).
import Dexie, { type Table } from 'dexie'

/** Campos que toda tabela sincronizada tem (iguais aos do Supabase). */
export interface Registro {
  user_id?: string
  created_at?: string
  updated_at: string
  deleted_at?: string | null
}

export interface Configuracoes extends Registro {
  user_id: string
  dados: { modo?: 'claro' | 'escuro' | 'foco' }
}

// ---------- Estudos (docs/modulos/estudos.md) ----------

export interface Objetivo extends Registro {
  id: string
  nome: string
  ordem: number
}

export interface Area extends Registro {
  id: string
  objetivo_id: string
  nome: string
  ordem: number
}

export interface Micrometa extends Registro {
  id: string
  objetivo_id: string
  area_id: string | null
  nome: string
  ordem: number
}

/** Registro de "estudei esta micrometa" (fora do app). */
export interface Checkin extends Registro {
  id: string
  micrometa_id: string
  estudado_em: string
  nota: string | null
}

export interface Baralho extends Registro {
  id: string
  nome: string
  ordem: number
}

/** Card de texto. Os campos do FSRS seguem os nomes da biblioteca ts-fsrs. */
export interface Card extends Registro {
  id: string
  baralho_id: string
  micrometa_id: string | null
  frente: string
  verso: string
  tags: string[]
  due: string
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  learning_steps: number
  reps: number
  lapses: number
  state: number
  last_review: string | null
}

/** Uma resposta numa revisão (histórico; nunca apagado). */
export interface Revisao extends Registro {
  id: string
  card_id: string
  nota: number
  revisado_em: string
  state: number
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  duracao_ms: number | null
}

/** Item da fila: um registro que ainda precisa ser enviado ao Supabase. */
export interface ItemFila {
  id?: number
  tabela: NomeTabela
  chave: string
  registro: Registro
  criadoEm: string
  tentativas: number
  ultimoErro?: string
}

/** Informações da sincronização (ex.: até onde já baixamos de cada tabela). */
export interface Meta {
  chave: string
  valor: string
}

/** Tabelas sincronizadas e o nome da coluna que identifica cada linha. */
export const TABELAS = {
  configuracoes: 'user_id',
  objetivos: 'id',
  areas: 'id',
  micrometas: 'id',
  checkins: 'id',
  baralhos: 'id',
  cards: 'id',
  revisoes: 'id',
} as const

export type NomeTabela = keyof typeof TABELAS

export class BancoPlanner extends Dexie {
  configuracoes!: Table<Configuracoes, string>
  objetivos!: Table<Objetivo, string>
  areas!: Table<Area, string>
  micrometas!: Table<Micrometa, string>
  checkins!: Table<Checkin, string>
  baralhos!: Table<Baralho, string>
  cards!: Table<Card, string>
  revisoes!: Table<Revisao, string>
  fila!: Table<ItemFila, number>
  meta!: Table<Meta, string>

  constructor(nome = 'planner') {
    super(nome)
    this.version(1).stores({
      configuracoes: 'user_id',
      fila: '++id, [tabela+chave]',
      meta: 'chave',
    })
    // Versão 2 (2026-11-19): módulo Estudos. Só acrescenta tabelas; nada é apagado.
    this.version(2).stores({
      objetivos: 'id',
      areas: 'id, objetivo_id',
      micrometas: 'id, objetivo_id',
      checkins: 'id, micrometa_id',
      baralhos: 'id',
      cards: 'id, baralho_id, micrometa_id, due',
      revisoes: 'id, card_id, revisado_em',
    })
  }
}

export const banco = new BancoPlanner()

/** Novo identificador único (gerado no aparelho, funciona offline). */
export const novoId = () => crypto.randomUUID()

export const agoraISO = () => new Date().toISOString()

/** Esconde os registros apagados (exclusão lógica). */
export const ativo = <T extends Registro>(r: T | undefined): r is T => !!r && !r.deleted_at
