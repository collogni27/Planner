import { useState } from 'react'
import { useNavegacao } from '../../app/navegacao'
import type { DadosTarefa, Habito, Projeto, Tarefa } from '../../dados/banco'
import { useRascunho } from '../../estado/preferencias'
import { Acoes, Cabecalho, Rotulo, Secao } from '../../ui/componentes'
import { useDialogos } from '../../ui/dialogos'
import { diaLocal } from '../../util/data'
import { apagarTarefa, concluirTarefa, salvarTarefa, useHabitos, useProjetos, useTarefa, useTarefas } from '../dados'
import { tarefaVazia } from '../rotina'
import { CamposPrioridade, CamposProjetos } from './partes'
import {
  CamposData,
  CamposQuando,
  Marcavel,
  dataParaForm,
  lerFormData,
  lerQuando,
  quandoParaForm,
  type FormData,
  type FormQuando,
} from './partes'

export interface FormBase {
  nome: string
  descricao: string
  data: FormData
  quando: FormQuando
  prioridade: number
  projetos: string[]
}

interface Formulario extends FormBase {
  fixada: boolean
  temProximo: boolean
  proximo: FormBase
}

export const paraForm = (t: DadosTarefa, hoje: string): FormBase => ({
  nome: t.nome,
  descricao: t.descricao ?? '',
  data: dataParaForm(t.data, hoje),
  quando: quandoParaForm(t),
  prioridade: t.prioridade ?? 1,
  projetos: t.projeto_ids ?? [],
})

/** Lê o formulário: os dados da tarefa, ou a lista do que falta. */
export function lerBase(f: FormBase): { dados?: DadosTarefa; erros: { nome?: boolean; data?: boolean; quando?: string } } {
  const data = lerFormData(f.data)
  const quando = lerQuando(f.quando)
  const erros = {
    nome: !f.nome.trim(),
    data: data === undefined,
    quando: !quando
      ? 'Complete o horário ou o gatilho.'
      : quando.horario && !data
        ? 'Para usar horário, escolha uma data.'
        : undefined,
  }
  if (erros.nome || erros.data || erros.quando) return { erros }
  return {
    dados: {
      nome: f.nome.trim(),
      descricao: f.descricao.trim() || null,
      data: data!,
      ...quando!,
      prioridade: f.prioridade ?? 1,
      projeto_ids: f.projetos ?? [],
    },
    erros,
  }
}

export function CamposTarefa({
  f,
  onChange,
  tentou,
  tarefas,
  habitos,
  projetos,
}: {
  f: FormBase
  onChange: (f: FormBase) => void
  tentou: boolean
  tarefas: Tarefa[]
  habitos: Habito[]
  projetos: Projeto[]
}) {
  const { erros } = lerBase(f)
  return (
    <>
      <Rotulo texto="Nome">
        <input className="campo-entrada" value={f.nome} onChange={(e) => onChange({ ...f, nome: e.target.value })} />
      </Rotulo>
      {tentou && erros.nome && <p className="aviso-campo">Dê um nome à tarefa.</p>}
      <Rotulo texto="Descrição (opcional)">
        <textarea
          className="campo-entrada area-texto"
          value={f.descricao}
          onChange={(e) => onChange({ ...f, descricao: e.target.value })}
        />
      </Rotulo>
      <CamposData f={f.data} onChange={(data) => onChange({ ...f, data })} erro={tentou && erros.data} />
      <CamposQuando
        f={f.quando}
        onChange={(quando) => onChange({ ...f, quando })}
        tarefas={tarefas}
        habitos={habitos}
        erro={tentou ? erros.quando : null}
      />
      <CamposPrioridade nivel={f.prioridade ?? 1} onChange={(prioridade) => onChange({ ...f, prioridade })} />
      <CamposProjetos ids={f.projetos ?? []} onChange={(projetos) => onChange({ ...f, projetos })} projetos={projetos} />
    </>
  )
}

/** Criar ou editar uma tarefa da agenda, com o "próximo passo" opcional. */
export function TarefaTela({ id, chave }: { id: string | null; chave: string }) {
  const { voltar } = useNavegacao()
  const { confirmar } = useDialogos()
  const tarefa = useTarefa(id ?? '')
  const tarefas = useTarefas()
  const habitos = useHabitos()
  const projetos = useProjetos()
  const [rascunho, setRascunho] = useRascunho<Formulario | null>(chave, 'tarefa', null)
  const [tentou, setTentou] = useState(false)
  if ((id && tarefa === undefined) || !tarefas || !habitos || !projetos) return null
  if (id && !tarefa) return <Cabecalho titulo="Tarefa" />

  const hoje = diaLocal(new Date())
  const f: Formulario = rascunho ?? {
    ...paraForm(tarefa ?? { ...tarefaVazia(), avisar: true }, hoje),
    fixada: tarefa?.fixada ?? false,
    temProximo: !!tarefa?.proximo,
    proximo: paraForm(tarefa?.proximo ?? { ...tarefaVazia(), avisar: true }, hoje),
  }

  // Gatilho: outras tarefas ainda abertas (e as que já estão ligadas).
  const ligadas = [tarefa?.gatilho_tarefa_id, tarefa?.proximo?.gatilho_tarefa_id]
  const opcoesTarefas = tarefas.filter((t) => t.id !== id && (!t.concluida_em || ligadas.includes(t.id)))

  const principal = lerBase(f)
  const proximo = f.temProximo ? lerBase(f.proximo) : null

  async function salvar() {
    setTentou(true)
    if (!principal.dados || (proximo && !proximo.dados)) return
    await salvarTarefa(id, principal.dados, proximo?.dados ?? null, { fixada: f.fixada ?? false })
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
      <Cabecalho titulo={tarefa ? 'Tarefa' : 'Nova tarefa'} />
      {tarefa && (
        <Marcavel
          texto={tarefa.concluida_em ? 'Concluída' : 'Concluir'}
          marcado={!!tarefa.concluida_em}
          onChange={(v) => void concluirTarefa(tarefa, v)}
        />
      )}
      <Secao>
        <form
          className="formulario"
          onSubmit={(e) => {
            e.preventDefault()
            void salvar()
          }}
        >
          <CamposTarefa
            f={f}
            onChange={(b) => setRascunho({ ...f, ...b })}
            tentou={tentou}
            tarefas={opcoesTarefas}
            habitos={habitos}
            projetos={projetos}
          />
          <Marcavel texto="Fixar no topo" marcado={f.fixada ?? false} onChange={(fixada) => setRascunho({ ...f, fixada })} />
          <Marcavel texto="Próximo passo" marcado={f.temProximo} onChange={(temProximo) => setRascunho({ ...f, temProximo })} />
          {f.temProximo && (
            <div className="proximo-passo">
              {tarefa?.proximo_criado_id && <p className="texto-secundario">Já criado ao concluir esta tarefa.</p>}
              <CamposTarefa
                f={f.proximo}
                onChange={(p) => setRascunho({ ...f, proximo: p })}
                tentou={tentou}
                tarefas={opcoesTarefas}
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
