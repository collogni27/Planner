// Banco local (IndexedDB, via Dexie). Regra "local primeiro": todo registro é
// gravado aqui antes e enviado ao Supabase depois, pela fila de sincronização.
// Mudanças de formato = nova versão com migração (nunca apagar dados).
import Dexie, { type Table } from 'dexie'
import { idFixo } from './ids'
import type { ConfigModoVisual } from '../visual/modoVisual'

export { idFixo }

/** Campos que toda tabela sincronizada tem (iguais aos do Supabase). */
export interface Registro {
  user_id?: string
  created_at?: string
  updated_at: string
  deleted_at?: string | null
}

export interface Configuracoes extends Registro {
  user_id: string
  dados: {
    modo?: 'claro' | 'escuro' | 'foco'
    sono?: ConfigSono
    avisos?: { bomDia: boolean; sol: boolean; dormir: boolean }
    modoVisual?: ConfigModoVisual
  }
}

/** Horários-alvo (índice 0 = domingo … 6 = sábado, "HH:MM") e meta de sono. */
export interface ConfigSono {
  horarios: { dormir: string; acordar: string }[]
  metaMinutos: number
}

/** Registro de um dia: tela diária (manhã) e "tomei sol". O id é calculado da data. */
export interface Dia extends Registro {
  id: string
  dia: string // "2026-11-20" (São Paulo)
  peso_kg: number | null
  sono_minutos: number | null
  qualidade: number | null
  dormiu_no_horario: boolean | null
  acordou_no_horario: boolean | null
  sol_em: string | null
  bom_dia_em: string | null
}

// ---------- Rotina e nota diária (docs/modulos/rotina.md, notas.md) ----------

/** Nota de um dia. O id é calculado da data. */
export interface Nota extends Registro {
  id: string
  dia: string
  texto: string
}

/** Hábito. "Quando" é um horário (com aviso opcional), um gatilho ou nada. */
export interface Habito extends Registro {
  id: string
  nome: string
  descricao: string | null
  dias: number[] // 0 = domingo … 6 = sábado
  horario: string | null // "HH:MM"
  avisar: boolean
  gatilho_texto: string | null
  gatilho_tarefa_id: string | null
  ordem: number | null // null = ordem padrão
  created_at?: string
}

/** Hábito marcado num dia. O id é calculado do hábito + dia. */
export interface HabitoFeito extends Registro {
  id: string
  habito_id: string
  dia: string
  feito: boolean
}

/** Campos que definem uma tarefa (também usados no modelo do "próximo passo"). */
export interface DadosTarefa {
  nome: string
  descricao: string | null
  data: string | null // "2026-11-22"
  horario: string | null
  avisar: boolean
  gatilho_texto: string | null
  gatilho_tarefa_id: string | null
  gatilho_habito_id: string | null
}

export interface Tarefa extends Registro, DadosTarefa {
  id: string
  proximo: DadosTarefa | null
  proximo_criado_id: string | null
  concluida_em: string | null
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

/**
 * Conteúdo (nome interno: micrometa). Pode estar em vários objetivos (tabela
 * objetivo_conteudos) e tem um baralho opcional, onde ficam os cards dele.
 * `objetivo_id` = objetivo onde foi criado; `area_id` não é mais usado (0.3.4).
 */
export interface Micrometa extends Registro {
  id: string
  objetivo_id: string
  area_id: string | null
  baralho_id?: string | null
  nome: string
  ordem: number
}

/** Baralho que aparece num objetivo (no lugar da antiga área), com a ordem dele ali. */
export interface ObjetivoBaralho extends Registro {
  id: string
  objetivo_id: string
  baralho_id: string
  ordem: number
}

/** Conteúdo que faz parte de um objetivo, com a posição dele na fila de estudo. */
export interface ObjetivoConteudo extends Registro {
  id: string
  objetivo_id: string
  micrometa_id: string
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
  objetivo_baralhos: 'id',
  objetivo_conteudos: 'id',
  dias: 'id',
  notas: 'id',
  habitos: 'id',
  habitos_feitos: 'id',
  tarefas: 'id',
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
  objetivo_baralhos!: Table<ObjetivoBaralho, string>
  objetivo_conteudos!: Table<ObjetivoConteudo, string>
  dias!: Table<Dia, string>
  notas!: Table<Nota, string>
  habitos!: Table<Habito, string>
  habitos_feitos!: Table<HabitoFeito, string>
  tarefas!: Table<Tarefa, string>
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
    // Versão 3 (2026-11-20): baralhos e conteúdos compartilhados entre objetivos.
    // Converte os dados existentes (nada é apagado) e põe a conversão na fila da nuvem.
    this.version(3)
      .stores({
        micrometas: 'id, objetivo_id, baralho_id',
        objetivo_baralhos: 'id, objetivo_id, baralho_id',
        objetivo_conteudos: 'id, objetivo_id, micrometa_id',
      })
      .upgrade(async (tx) => {
        const micrometas = (await tx.table('micrometas').toArray()) as Micrometa[]
        const cards = (await tx.table('cards').toArray()) as Card[]
        const r = converterParaVinculos(micrometas, cards, new Date().toISOString())
        await tx.table('micrometas').bulkPut(r.micrometas)
        await tx.table('objetivo_conteudos').bulkPut(r.vinculosConteudos)
        await tx.table('objetivo_baralhos').bulkPut(r.vinculosBaralhos)
        const fila = (tabela: NomeTabela, registros: Registro[]) =>
          registros.map((registro) => ({
            tabela,
            chave: (registro as unknown as { id: string }).id,
            registro,
            criadoEm: registro.updated_at,
            tentativas: 0,
          }))
        await tx
          .table('fila')
          .bulkAdd([
            ...fila('micrometas', r.micrometas),
            ...fila('objetivo_conteudos', r.vinculosConteudos),
            ...fila('objetivo_baralhos', r.vinculosBaralhos),
          ])
      })
    // Versão 4 (2026-11-20): registros diários (sono, peso, sol). Só acrescenta.
    this.version(4).stores({ dias: 'id, dia' })
    // Versão 5 (2026-11-22): Rotina (hábitos, agenda) e nota diária. Só acrescenta.
    this.version(5).stores({ notas: 'id, dia', habitos: 'id', habitos_feitos: 'id, habito_id, dia', tarefas: 'id, data' })
  }
}

/**
 * Conversão de 0.3.3 → 0.3.4: cada conteúdo passa a estar no objetivo onde foi criado
 * (com a mesma ordem), ganha como baralho o baralho onde está a maioria dos cards dele,
 * e esses baralhos passam a aparecer no objetivo.
 */
export function converterParaVinculos(micrometas: Micrometa[], cards: Card[], agora: string) {
  const ativos = micrometas.filter((m) => !m.deleted_at)
  const vinculosConteudos: ObjetivoConteudo[] = ativos.map((m) => ({
    id: idFixo(`conteudo:${m.objetivo_id}:${m.id}`),
    objetivo_id: m.objetivo_id,
    micrometa_id: m.id,
    ordem: m.ordem,
    updated_at: agora,
  }))
  const atualizados: Micrometa[] = []
  const pares = new Map<string, ObjetivoBaralho>()
  for (const m of ativos) {
    const contagem = new Map<string, number>()
    for (const c of cards)
      if (!c.deleted_at && c.micrometa_id === m.id) contagem.set(c.baralho_id, (contagem.get(c.baralho_id) ?? 0) + 1)
    const baralho = [...contagem].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null
    atualizados.push({ ...m, baralho_id: baralho, updated_at: agora })
    if (baralho && !pares.has(`${m.objetivo_id}:${baralho}`)) {
      pares.set(`${m.objetivo_id}:${baralho}`, {
        id: idFixo(`baralho:${m.objetivo_id}:${baralho}`),
        objetivo_id: m.objetivo_id,
        baralho_id: baralho,
        ordem: pares.size + 1,
        updated_at: agora,
      })
    }
  }
  return { micrometas: atualizados, vinculosConteudos, vinculosBaralhos: [...pares.values()] }
}

export const banco = new BancoPlanner()

/** Novo identificador único (gerado no aparelho, funciona offline). */
export const novoId = () => crypto.randomUUID()

export const agoraISO = () => new Date().toISOString()

/** Esconde os registros apagados (exclusão lógica). */
export const ativo = <T extends Registro>(r: T | undefined): r is T => !!r && !r.deleted_at
