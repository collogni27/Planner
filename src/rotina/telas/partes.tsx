import type React from 'react'
// Peças compartilhadas das telas da Rotina: linhas com check e campos de "quando" e data.
import type { Rota } from '../../app/navegacao'
import type { DadosTarefa, Habito, Tarefa } from '../../dados/banco'
import { Icone } from '../../icones/Icone'
import { lerHorario } from '../../sono/sono'
import { Rotulo } from '../../ui/componentes'
import { Seletor } from '../../ui/dialogos'
import { diaLocal } from '../../util/data'
import { ehImportante, ehUrgente, nivelDePrioridade, dataBr, lerData, somarDias, tarefaAtrasada, tituloDoDia } from '../rotina'

// ---------- Linhas ----------

/** Linha com check à esquerda; tocar no texto abre o item. */
export function LinhaCheck({
  titulo,
  detalhe,
  marcado,
  urgente,
  prioridade,
  onMarcar,
  onAbrir,
}: {
  titulo: string
  detalhe?: string
  marcado: boolean
  urgente?: boolean
  /** Nível 1 a 4: bolinha à direita (só nas tarefas). */
  prioridade?: number
  onMarcar: () => void
  onAbrir: () => void
}) {
  return (
    <div className={`item item-check${urgente ? ' item-urgente' : ''}`}>
      <button
        className="botao-check"
        aria-pressed={marcado}
        aria-label={marcado ? `Desmarcar ${titulo}` : `Marcar ${titulo}`}
        onClick={onMarcar}
      >
        <span className="checkbox" aria-hidden="true">
          {marcado && <Icone nome="check" tamanho={10} />}
        </span>
      </button>
      <button className="item-principal" onClick={onAbrir}>
        <span className={`item-titulo${marcado ? ' item-feito' : ''}`}>{titulo}</span>
        {detalhe && <span className="item-detalhe">{detalhe}</span>}
      </button>
      {prioridade && (
        <span className="ponto-prioridade" data-nivel={prioridade} role="img" aria-label={`Prioridade ${prioridade}`} />
      )}
    </div>
  )
}

/** Texto do "quando": "07:30", "Depois de: Almoço" ou o gatilho escrito. */
export function textoQuando(
  q: Pick<DadosTarefa, 'horario' | 'gatilho_texto' | 'gatilho_tarefa_id' | 'gatilho_habito_id'>,
  tarefas: Tarefa[],
  habitos: Habito[],
) {
  if (q.horario) return q.horario
  if (q.gatilho_texto) return q.gatilho_texto
  const t = q.gatilho_tarefa_id && tarefas.find((x) => x.id === q.gatilho_tarefa_id)
  if (t) return `Depois de: ${t.nome}`
  const h = q.gatilho_habito_id && habitos.find((x) => x.id === q.gatilho_habito_id)
  if (h) return `Depois de: ${h.nome}`
  return undefined
}

export function LinhaTarefa({
  tarefa,
  tarefas,
  habitos,
  agora,
  mostrarData,
  onMarcar,
  onAbrir,
}: {
  tarefa: Tarefa
  tarefas: Tarefa[]
  habitos: Habito[]
  agora: Date
  /** Na lista sem grupos por dia (ordem por prioridade), mostra o dia no detalhe. */
  mostrarData?: boolean
  onMarcar: () => void
  onAbrir: () => void
}) {
  const dia = mostrarData && tarefa.data ? tituloDoDia(tarefa.data, diaLocal(agora)) : undefined
  const detalhe = [tarefa.nao_planejada ? 'Não planejada' : undefined, dia, textoQuando(tarefa, tarefas, habitos)]
    .filter(Boolean)
    .join(' · ')
  return (
    <LinhaCheck
      titulo={tarefa.nome}
      detalhe={detalhe || undefined}
      marcado={!!tarefa.concluida_em}
      urgente={tarefaAtrasada(tarefa, agora)}
      prioridade={tarefa.prioridade}
      onMarcar={onMarcar}
      onAbrir={onAbrir}
    />
  )
}

/** Tarefa comum abre o formulário completo; não planejada abre o dela. */
export const rotaDaTarefa = (t: Tarefa): Rota =>
  t.nao_planejada ? { tela: 'nao-planejada', id: t.id } : { tela: 'tarefa', id: t.id }

// ---------- Fichas de escolha única ----------

/** Como Rotulo, mas sem <label> (que "clicaria" o primeiro botão de dentro). */
export function Campo({ texto, children }: { texto: string; children: React.ReactNode }) {
  return (
    <div className="campo">
      <span className="campo-rotulo">{texto}</span>
      {children}
    </div>
  )
}

export function Fichas<T extends string>({
  valor,
  opcoes,
  onChange,
  rotulo,
}: {
  valor: T
  opcoes: [T, string][]
  onChange: (v: T) => void
  rotulo: string
}) {
  return (
    <div className="fichas" role="radiogroup" aria-label={rotulo}>
      {opcoes.map(([v, texto]) => (
        <button
          key={v}
          type="button"
          role="radio"
          className="ficha"
          aria-pressed={valor === v}
          aria-checked={valor === v}
          onClick={() => onChange(v)}
        >
          {texto}
        </button>
      ))}
    </div>
  )
}

export function Marcavel({ texto, marcado, onChange }: { texto: string; marcado: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" className="botao-marcavel botao-largo" aria-pressed={marcado} onClick={() => onChange(!marcado)}>
      <span className="checkbox" aria-hidden="true">
        {marcado && <Icone nome="check" tamanho={10} />}
      </span>
      {texto}
    </button>
  )
}

// ---------- "Quando": nada, horário ou gatilho ----------

export interface FormQuando {
  tipo: 'nenhum' | 'horario' | 'gatilho'
  horario: string
  avisar: boolean
  gatilho: 'texto' | 'tarefa' | 'habito'
  texto: string
  tarefaId: string
  habitoId: string
}

export function quandoParaForm(
  q: Pick<DadosTarefa, 'horario' | 'avisar' | 'gatilho_texto' | 'gatilho_tarefa_id' | 'gatilho_habito_id'>,
): FormQuando {
  const base: FormQuando = { tipo: 'nenhum', horario: '', avisar: true, gatilho: 'texto', texto: '', tarefaId: '', habitoId: '' }
  if (q.horario) return { ...base, tipo: 'horario', horario: q.horario, avisar: q.avisar }
  if (q.gatilho_tarefa_id) return { ...base, tipo: 'gatilho', gatilho: 'tarefa', tarefaId: q.gatilho_tarefa_id }
  if (q.gatilho_habito_id) return { ...base, tipo: 'gatilho', gatilho: 'habito', habitoId: q.gatilho_habito_id }
  // Texto vazio = vínculo que deixou de existir: continua "gatilho em texto".
  if (q.gatilho_texto !== null) return { ...base, tipo: 'gatilho', texto: q.gatilho_texto }
  return base
}

type CamposQuando = Pick<DadosTarefa, 'horario' | 'avisar' | 'gatilho_texto' | 'gatilho_tarefa_id' | 'gatilho_habito_id'>

/** Lê o formulário; devolve null se faltar algo. */
export function lerQuando(f: FormQuando): CamposQuando | null {
  const vazio: CamposQuando = {
    horario: null,
    avisar: false,
    gatilho_texto: null,
    gatilho_tarefa_id: null,
    gatilho_habito_id: null,
  }
  if (f.tipo === 'nenhum') return vazio
  if (f.tipo === 'horario') {
    const h = lerHorario(f.horario)
    return h ? { ...vazio, horario: h, avisar: f.avisar } : null
  }
  if (f.gatilho === 'texto') return { ...vazio, gatilho_texto: f.texto.trim() }
  if (f.gatilho === 'tarefa') return f.tarefaId ? { ...vazio, gatilho_tarefa_id: f.tarefaId } : null
  return f.habitoId ? { ...vazio, gatilho_habito_id: f.habitoId } : null
}

export function CamposQuando({
  f,
  onChange,
  tarefas,
  habitos,
  erro,
}: {
  f: FormQuando
  onChange: (f: FormQuando) => void
  tarefas: Tarefa[]
  habitos: Habito[]
  erro?: string | null
}) {
  const tiposGatilho: [FormQuando['gatilho'], string][] = [
    ['texto', 'Texto'],
    ['tarefa', 'Tarefa'],
    ['habito', 'Hábito'],
  ]
  return (
    <>
      <Campo texto="Quando">
        <Fichas
          rotulo="Quando"
          valor={f.tipo}
          onChange={(tipo) => onChange({ ...f, tipo })}
          opcoes={[
            ['nenhum', 'Sem horário'],
            ['horario', 'Horário'],
            ['gatilho', 'Gatilho'],
          ]}
        />
      </Campo>
      {f.tipo === 'horario' && (
        <>
          <Rotulo texto="Horário">
            <input
              className="campo-entrada campo-horario"
              inputMode="numeric"
              value={f.horario}
              onChange={(e) => onChange({ ...f, horario: e.target.value })}
              onBlur={() => onChange({ ...f, horario: lerHorario(f.horario) ?? f.horario })}
            />
          </Rotulo>
          <Marcavel texto="Avisar 15 min antes e na hora" marcado={f.avisar} onChange={(avisar) => onChange({ ...f, avisar })} />
        </>
      )}
      {f.tipo === 'gatilho' && (
        <>
          <Fichas
            rotulo="Tipo de gatilho"
            valor={f.gatilho}
            onChange={(gatilho) => onChange({ ...f, gatilho })}
            opcoes={tiposGatilho}
          />
          {f.gatilho === 'texto' && (
            <input
              className="campo-entrada"
              aria-label="Gatilho"
              value={f.texto}
              onChange={(e) => onChange({ ...f, texto: e.target.value })}
            />
          )}
          {f.gatilho === 'tarefa' && (
            <Seletor
              rotulo="Tarefa"
              valor={f.tarefaId}
              onChange={(tarefaId) => onChange({ ...f, tarefaId })}
              opcoes={tarefas.map((t) => ({ valor: t.id, rotulo: t.nome }))}
            />
          )}
          {f.gatilho === 'habito' && (
            <Seletor
              rotulo="Hábito"
              valor={f.habitoId}
              onChange={(habitoId) => onChange({ ...f, habitoId })}
              opcoes={habitos.map((h) => ({ valor: h.id, rotulo: h.nome }))}
            />
          )}
        </>
      )}
      {erro && <p className="aviso-campo">{erro}</p>}
    </>
  )
}

// ---------- Prioridade ----------

/** Importante? Urgente? O nível (1 a 4) sai das duas respostas. */
export function CamposPrioridade({ nivel, onChange }: { nivel: number; onChange: (nivel: number) => void }) {
  const importante = ehImportante(nivel)
  const urgente = ehUrgente(nivel)
  return (
    <Campo texto="Prioridade">
      <div className="opcoes opcoes-2 com-ponto">
        <Marcavel texto="Importante" marcado={importante} onChange={(v) => onChange(nivelDePrioridade(v, urgente))} />
        <Marcavel texto="Urgente" marcado={urgente} onChange={(v) => onChange(nivelDePrioridade(importante, v))} />
      </div>
    </Campo>
  )
}

// ---------- Data da tarefa ----------

export interface FormData {
  tipo: 'sem' | 'hoje' | 'amanha' | 'outra'
  texto: string
}

export function dataParaForm(data: string | null, hoje: string): FormData {
  if (!data) return { tipo: 'sem', texto: '' }
  if (data === hoje) return { tipo: 'hoje', texto: '' }
  if (data === somarDias(hoje, 1)) return { tipo: 'amanha', texto: '' }
  return { tipo: 'outra', texto: dataBr(data) }
}

/** undefined = data inválida. */
export function lerFormData(f: FormData): string | null | undefined {
  const hoje = diaLocal(new Date())
  if (f.tipo === 'sem') return null
  if (f.tipo === 'hoje') return hoje
  if (f.tipo === 'amanha') return somarDias(hoje, 1)
  return lerData(f.texto, hoje) ?? undefined
}

export function CamposData({ f, onChange, erro }: { f: FormData; onChange: (f: FormData) => void; erro?: boolean }) {
  return (
    <Campo texto="Data">
      <Fichas
        rotulo="Data"
        valor={f.tipo}
        onChange={(tipo) => onChange({ ...f, tipo })}
        opcoes={[
          ['sem', 'Sem data'],
          ['hoje', 'Hoje'],
          ['amanha', 'Amanhã'],
          ['outra', 'Outra'],
        ]}
      />
      {f.tipo === 'outra' && (
        <input
          className="campo-entrada"
          aria-label="Data (dia/mês/ano)"
          placeholder="dd/mm/aaaa"
          inputMode="numeric"
          value={f.texto}
          onChange={(e) => onChange({ ...f, texto: e.target.value })}
        />
      )}
      {erro && <p className="aviso-campo">Data inválida.</p>}
    </Campo>
  )
}
