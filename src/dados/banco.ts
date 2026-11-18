// Banco local (IndexedDB, via Dexie). Regra "local primeiro": todo registro é
// gravado aqui antes e enviado ao Supabase depois, pela fila de sincronização.
// Mudanças de formato = nova versão com migração (nunca apagar dados).
import Dexie, { type Table } from 'dexie'

/** Campos que toda tabela sincronizada tem (iguais aos do Supabase). */
export interface Registro {
  user_id: string
  created_at?: string
  updated_at: string
  deleted_at?: string | null
}

export interface Configuracoes extends Registro {
  dados: { modo?: 'claro' | 'escuro' | 'foco' }
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
} as const

export type NomeTabela = keyof typeof TABELAS

export class BancoPlanner extends Dexie {
  configuracoes!: Table<Configuracoes, string>
  fila!: Table<ItemFila, number>
  meta!: Table<Meta, string>

  constructor(nome = 'planner') {
    super(nome)
    this.version(1).stores({
      configuracoes: 'user_id',
      fila: '++id, [tabela+chave]',
      meta: 'chave',
    })
  }
}

export const banco = new BancoPlanner()
