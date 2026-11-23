import { useState } from 'react'
import { useNavegacao } from '../../app/navegacao'
import { useRascunho } from '../../estado/preferencias'
import { lerHorario } from '../../sono/sono'
import { Acoes, Cabecalho, Rotulo, Secao } from '../../ui/componentes'
import { useDialogos } from '../../ui/dialogos'
import { diaLocal, horaMinuto } from '../../util/data'
import { apagarTarefa, salvarNaoPlanejada, useHabitos, useProjetos, useTarefa, useTarefas } from '../dados'
import { dataBr, emSaoPaulo, lerData, tarefaVazia } from '../rotina'
import { CamposProjetos, Marcavel } from './partes'
import { CamposTarefa, lerBase, paraForm, type FormBase } from './TarefaTela'

interface Formulario {
  nome: string
  descricao: string
  data: string // "dd/mm/aaaa"
  hora: string // "HH:MM"
  projetos: string[]
  temProximo: boolean
  proximo: FormBase
}

/** Tarefa não planejada: algo já feito, registrado depois (vai para as concluídas). */
export function NaoPlanejadaTela({ id, chave }: { id: string | null; chave: string }) {
  const { voltar } = useNavegacao()
  const { confirmar } = useDialogos()
  const tarefa = useTarefa(id ?? '')
  const tarefas = useTarefas()
  const habitos = useHabitos()
  const projetos = useProjetos()
  const [rascunho, setRascunho] = useRascunho<Formulario | null>(chave, 'nao-planejada', null)
  const [tentou, setTentou] = useState(false)
  if ((id && tarefa === undefined) || !tarefas || !habitos || !projetos) return null
  if (id && !tarefa) return <Cabecalho titulo="Tarefa não planejada" />

  const agora = new Date()
  const hoje = diaLocal(agora)
  const realizada = tarefa?.concluida_em ? new Date(tarefa.concluida_em) : agora
  const f: Formulario = rascunho ?? {
    nome: tarefa?.nome ?? '',
    descricao: tarefa?.descricao ?? '',
    data: dataBr(diaLocal(realizada)),
    hora: horaMinuto(realizada),
    projetos: tarefa?.projeto_ids ?? [],
    temProximo: !!tarefa?.proximo,
    proximo: paraForm(tarefa?.proximo ?? { ...tarefaVazia(), avisar: true }, hoje),
  }
  const mudar = (campos: Partial<Formulario>) => setRascunho({ ...f, ...campos })

  const data = lerData(f.data, hoje)
  const hora = lerHorario(f.hora)
  const quando = data && hora ? emSaoPaulo(data, hora) : null
  const proximo = f.temProximo ? lerBase(f.proximo) : null
  const erroQuando = !quando ? 'Confira a data e a hora.' : quando > agora ? 'A data e a hora não podem ser no futuro.' : null

  async function salvar() {
    setTentou(true)
    if (!f.nome.trim() || erroQuando || (proximo && !proximo.dados)) return
    await salvarNaoPlanejada(
      id,
      {
        nome: f.nome.trim(),
        descricao: f.descricao.trim() || null,
        realizadaEm: quando!.toISOString(),
        projeto_ids: f.projetos ?? [],
      },
      proximo?.dados ?? null,
    )
    voltar()
  }

  async function apagar() {
    if (!tarefa) return
    const ok = await confirmar({ titulo: 'Excluir tarefa?', mensagem: tarefa.nome, confirmar: 'Excluir', perigo: true })
    if (!ok) return
    await apagarTarefa(tarefa)
    voltar()
  }

  return (
    <>
      <Cabecalho titulo="Tarefa não planejada" />
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
          {tentou && !f.nome.trim() && <p className="aviso-campo">Dê um nome à tarefa.</p>}
          <Rotulo texto="Descrição (opcional)">
            <textarea
              className="campo-entrada area-texto"
              value={f.descricao}
              onChange={(e) => mudar({ descricao: e.target.value })}
            />
          </Rotulo>
          <div className="campos-lado">
            <Rotulo texto="Data">
              <input
                className="campo-entrada"
                inputMode="numeric"
                value={f.data}
                onChange={(e) => mudar({ data: e.target.value })}
              />
            </Rotulo>
            <Rotulo texto="Hora">
              <input
                className="campo-entrada campo-horario"
                inputMode="numeric"
                value={f.hora}
                onChange={(e) => mudar({ hora: e.target.value })}
                onBlur={() => mudar({ hora: lerHorario(f.hora) ?? f.hora })}
              />
            </Rotulo>
          </div>
          {tentou && erroQuando && <p className="aviso-campo">{erroQuando}</p>}
          <CamposProjetos ids={f.projetos ?? []} onChange={(projetos) => mudar({ projetos })} projetos={projetos} />
          <Marcavel texto="Próximo passo" marcado={f.temProximo} onChange={(temProximo) => mudar({ temProximo })} />
          {f.temProximo && (
            <div className="proximo-passo">
              {tarefa?.proximo_criado_id && <p className="texto-secundario">Já criado na agenda.</p>}
              <CamposTarefa
                f={f.proximo}
                onChange={(p) => mudar({ proximo: p })}
                tentou={tentou}
                tarefas={tarefas.filter((t) => t.id !== id && !t.concluida_em)}
                habitos={habitos}
                projetos={projetos}
              />
            </div>
          )}
          <button className="botao-principal botao-grande" type="submit">
            Salvar
          </button>
        </form>
      </Secao>
      {tarefa && (
        <Acoes>
          <button className="botao-secundario" onClick={() => void apagar()}>
            Excluir
          </button>
        </Acoes>
      )}
    </>
  )
}
