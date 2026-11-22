import { useState } from 'react'
import { useNavegacao } from '../../app/navegacao'
import { novoId, type Habito } from '../../dados/banco'
import { useRascunho } from '../../estado/preferencias'
import { Acoes, Cabecalho, Rotulo, Secao } from '../../ui/componentes'
import { useDialogos } from '../../ui/dialogos'
import { apagarHabito, salvarHabito, useFeitosDoHabito, useHabito, useHabitos, useTarefas } from '../dados'
import { Calendario } from './Calendario'
import { diaLocal } from '../../util/data'
import {
  habitoValeNoDia,
  somarDias,
  DIARIAMENTE,
  DIAS_DE_SEMANA,
  FINS_DE_SEMANA,
  LETRAS_DIAS,
  tipoDosDias,
  type TipoDias,
} from '../rotina'
import { Campo, CamposQuando, Fichas, lerQuando, quandoParaForm, type FormQuando } from './partes'

interface Formulario {
  nome: string
  descricao: string
  tipoDias: TipoDias
  dias: number[]
  quando: FormQuando
}

const DIAS_DO_TIPO: Record<Exclude<TipoDias, 'personalizado'>, number[]> = {
  diariamente: DIARIAMENTE,
  fins: FINS_DE_SEMANA,
  semana: DIAS_DE_SEMANA,
}

/** Criar ou editar um hábito. */
export function HabitoTela({ id, chave }: { id: string | null; chave: string }) {
  const { voltar } = useNavegacao()
  const { confirmar } = useDialogos()
  const habito = useHabito(id ?? '')
  const tarefas = useTarefas()
  const habitos = useHabitos()
  const [rascunho, setRascunho] = useRascunho<Formulario | null>(chave, 'habito', null)
  const [tentou, setTentou] = useState(false)
  if ((id && habito === undefined) || !tarefas || !habitos) return null
  if (id && !habito) return <Cabecalho titulo="Hábito" />

  const f: Formulario = rascunho ?? {
    nome: habito?.nome ?? '',
    descricao: habito?.descricao ?? '',
    tipoDias: habito ? tipoDosDias(habito.dias) : 'diariamente',
    dias: habito?.dias ?? DIARIAMENTE,
    quando: habito
      ? quandoParaForm(habito)
      : quandoParaForm({ horario: null, avisar: true, gatilho_texto: null, gatilho_tarefa_id: null, gatilho_habito_id: null }),
  }
  const mudar = (campos: Partial<Formulario>) => setRascunho({ ...f, ...campos })

  const dias = f.tipoDias === 'personalizado' ? f.dias : DIAS_DO_TIPO[f.tipoDias]
  const quando = lerQuando(f.quando)
  const valido = !!f.nome.trim() && dias.length > 0 && !!quando
  // Gatilho: tarefas ainda abertas (e a que já está ligada, mesmo se concluída).
  const opcoesTarefas = tarefas.filter((t) => !t.concluida_em || t.id === habito?.gatilho_tarefa_id)
  const opcoesHabitos = habitos.filter((h) => h.id !== id)

  async function salvar() {
    setTentou(true)
    if (!valido) return
    const novo: Habito = {
      ordem: null,
      ...habito,
      id: habito?.id ?? novoId(),
      nome: f.nome.trim(),
      descricao: f.descricao.trim() || null,
      dias: [...dias].sort(),
      horario: quando!.horario,
      avisar: quando!.avisar,
      gatilho_texto: quando!.gatilho_texto,
      gatilho_tarefa_id: quando!.gatilho_tarefa_id,
      gatilho_habito_id: quando!.gatilho_habito_id,
      updated_at: '',
    }
    await salvarHabito(novo)
    voltar()
  }

  async function apagar() {
    if (!habito) return
    const ok = await confirmar({
      titulo: 'Excluir hábito?',
      mensagem: 'O histórico dele também deixa de aparecer.',
      confirmar: 'Excluir',
      perigo: true,
    })
    if (!ok) return
    await apagarHabito(habito)
    voltar()
  }

  return (
    <>
      <Cabecalho titulo={habito ? 'Hábito' : 'Novo hábito'} />
      <Secao>
        <form
          className="formulario"
          onSubmit={(e) => {
            e.preventDefault()
            void salvar()
          }}
        >
          <Rotulo texto="Nome">
            <input className="campo-entrada" value={f.nome} onChange={(e) => mudar({ nome: e.target.value })} />
          </Rotulo>
          {tentou && !f.nome.trim() && <p className="aviso-campo">Dê um nome ao hábito.</p>}
          <Rotulo texto="Descrição (opcional)">
            <textarea
              className="campo-entrada area-texto"
              value={f.descricao}
              onChange={(e) => mudar({ descricao: e.target.value })}
            />
          </Rotulo>
          <Campo texto="Dias">
            <Fichas
              rotulo="Dias"
              valor={f.tipoDias}
              onChange={(tipoDias) => mudar({ tipoDias, dias: tipoDias === 'personalizado' ? dias : f.dias })}
              opcoes={[
                ['diariamente', 'Diariamente'],
                ['semana', 'Dias de semana'],
                ['fins', 'Fins de semana'],
                ['personalizado', 'Personalizado'],
              ]}
            />
            {f.tipoDias === 'personalizado' && (
              <div className="dias-semana">
                {LETRAS_DIAS.map((letra, i) => (
                  <button
                    key={i}
                    type="button"
                    className="ficha"
                    aria-pressed={f.dias.includes(i)}
                    onClick={() => mudar({ dias: f.dias.includes(i) ? f.dias.filter((d) => d !== i) : [...f.dias, i] })}
                  >
                    {letra}
                  </button>
                ))}
              </div>
            )}
            {tentou && dias.length === 0 && <p className="aviso-campo">Escolha ao menos um dia.</p>}
          </Campo>
          <CamposQuando
            f={f.quando}
            onChange={(q) => mudar({ quando: q })}
            tarefas={opcoesTarefas}
            habitos={opcoesHabitos}
            erro={tentou && !quando ? 'Complete o horário ou o gatilho.' : null}
          />
          <button className="botao-principal botao-grande" type="submit">
            Salvar
          </button>
        </form>
      </Secao>
      {habito && <HistoricoHabito habito={habito} chave={chave} />}
      {habito && (
        <Acoes>
          <button className="botao-secundario" onClick={() => void apagar()}>
            Excluir
          </button>
        </Acoes>
      )}
    </>
  )
}

/** Histórico: calendário com os dias feitos e "x de y dias" nas últimas 4 semanas. */
function HistoricoHabito({ habito, chave }: { habito: Habito; chave: string }) {
  const hoje = diaLocal(new Date())
  const [mes, setMes] = useRascunho(chave, 'mes', hoje.slice(0, 7))
  const feitos = useFeitosDoHabito(habito.id)
  if (!feitos) return null
  const dias = new Set(feitos.map((f) => f.dia))
  // Últimas 4 semanas (desde que o hábito existe), só os dias em que ele vale.
  const criado = habito.created_at ? diaLocal(new Date(habito.created_at)) : hoje
  const periodo = Array.from({ length: 28 }, (_, i) => somarDias(hoje, -i)).filter(
    (d) => d >= criado && habitoValeNoDia(habito, d),
  )
  const feitosNoPeriodo = periodo.filter((d) => dias.has(d)).length
  return (
    <Secao titulo="Histórico">
      <div className="historico-resumo">
        <span className="texto-secundario">Últimas 4 semanas</span>
        <span>
          {feitosNoPeriodo} de {periodo.length === 1 ? '1 dia' : `${periodo.length} dias`}
        </span>
      </div>
      <Calendario
        mes={mes}
        onMes={setMes}
        hoje={hoje}
        marcados={dias}
        rotuloDia={(d) => `${d.slice(8)}/${d.slice(5, 7)}${dias.has(d) ? ', feito' : ''}`}
      />
    </Secao>
  )
}
