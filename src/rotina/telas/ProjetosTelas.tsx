import { useState } from 'react'
import { useNavegacao } from '../../app/navegacao'
import type { Projeto } from '../../dados/banco'
import { useRascunho } from '../../estado/preferencias'
import { Acoes, Cabecalho, Item, Medidor, Rotulo, Secao, Vazio } from '../../ui/componentes'
import { useDialogos } from '../../ui/dialogos'
import { diaLocal } from '../../util/data'
import { apagarProjeto, concluirTarefa, salvarProjeto, useHabitos, useProjeto, useProjetos, useTarefas } from '../dados'
import { dataBr, habitosDoProjeto, progressoDoProjeto, tarefasDoProjeto } from '../rotina'
import { CamposData, LinhaTarefa, dataParaForm, lerFormData, rotaDaTarefa, type FormData } from './partes'
import type { Tarefa } from '../../dados/banco'

/** "45% · até 20/12/2026". */
export const detalheProjeto = (p: Projeto, tarefas: Tarefa[]) =>
  [`${progressoDoProjeto(p.id, tarefas)}%`, p.encerramento && `até ${dataBr(p.encerramento)}`].filter(Boolean).join(' · ')

/** Todos os projetos, por encerramento previsto. */
export function ProjetosTela() {
  const { abrir } = useNavegacao()
  const projetos = useProjetos()
  const tarefas = useTarefas()
  if (!projetos || !tarefas) return null
  return (
    <>
      <Cabecalho titulo="Projetos" />
      <Secao>
        {projetos.length === 0 && <Vazio>Nenhum projeto.</Vazio>}
        {projetos.map((p) => (
          <Item
            key={p.id}
            titulo={p.nome}
            detalhe={detalheProjeto(p, tarefas)}
            onClick={() => abrir({ tela: 'projeto', id: p.id })}
          />
        ))}
      </Secao>
      <button className="botao-principal botao-grande" onClick={() => abrir({ tela: 'projeto', id: null })}>
        Novo projeto
      </button>
    </>
  )
}

interface Formulario {
  nome: string
  descricao: string
  encerramento: FormData
}

/** Criar ou editar um projeto; mostra o progresso e o que está ligado a ele. */
export function ProjetoTela({ id, chave }: { id: string | null; chave: string }) {
  const { abrir, voltar } = useNavegacao()
  const { confirmar } = useDialogos()
  const projeto = useProjeto(id ?? '')
  const tarefas = useTarefas()
  const habitos = useHabitos()
  const [rascunho, setRascunho] = useRascunho<Formulario | null>(chave, 'projeto', null)
  const [tentou, setTentou] = useState(false)
  if ((id && projeto === undefined) || !tarefas || !habitos) return null
  if (id && !projeto) return <Cabecalho titulo="Projeto" />

  const agora = new Date()
  const f: Formulario = rascunho ?? {
    nome: projeto?.nome ?? '',
    descricao: projeto?.descricao ?? '',
    encerramento: dataParaForm(projeto?.encerramento ?? null, diaLocal(agora)),
  }
  const mudar = (campos: Partial<Formulario>) => setRascunho({ ...f, ...campos })
  const encerramento = lerFormData(f.encerramento)

  async function salvar() {
    setTentou(true)
    if (!f.nome.trim() || encerramento === undefined) return
    await salvarProjeto(id, { nome: f.nome.trim(), descricao: f.descricao.trim() || null, encerramento })
    voltar()
  }

  async function apagar() {
    if (!projeto) return
    const ok = await confirmar({
      titulo: 'Excluir projeto?',
      mensagem: 'As tarefas e hábitos ligados a ele continuam, só sem o vínculo.',
      confirmar: 'Excluir',
      perigo: true,
    })
    if (!ok) return
    await apagarProjeto(projeto)
    voltar()
  }

  const ligadas = projeto ? tarefasDoProjeto(projeto.id, tarefas) : []
  const ligados = projeto ? habitosDoProjeto(projeto.id, habitos) : []
  const progresso = projeto ? progressoDoProjeto(projeto.id, tarefas) : 0

  return (
    <>
      <Cabecalho titulo={projeto ? 'Projeto' : 'Novo projeto'} />
      {projeto && (
        <Secao titulo="Progresso">
          <span className="numero-grande">{progresso}%</span>
          <Medidor valor={progresso} rotulo="Progresso" />
        </Secao>
      )}
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
          {tentou && !f.nome.trim() && <p className="aviso-campo">Dê um nome ao projeto.</p>}
          <Rotulo texto="Descrição (opcional)">
            <textarea
              className="campo-entrada area-texto"
              value={f.descricao}
              onChange={(e) => mudar({ descricao: e.target.value })}
            />
          </Rotulo>
          <CamposData
            rotulo="Encerramento previsto"
            f={f.encerramento}
            onChange={(encerramento) => mudar({ encerramento })}
            erro={tentou && encerramento === undefined}
          />
          <button className="botao-principal botao-grande" type="submit">
            Salvar
          </button>
        </form>
      </Secao>
      {projeto && (
        <Secao titulo="Tarefas">
          {ligadas.length === 0 && <Vazio>Nenhuma tarefa ligada.</Vazio>}
          {ligadas.map((t) => (
            <LinhaTarefa
              key={t.id}
              tarefa={t}
              tarefas={tarefas}
              habitos={habitos}
              agora={agora}
              mostrarData
              onMarcar={() => void concluirTarefa(t, !t.concluida_em)}
              onAbrir={() => abrir(rotaDaTarefa(t))}
            />
          ))}
        </Secao>
      )}
      {projeto && ligados.length > 0 && (
        <Secao titulo="Hábitos">
          {ligados.map((h) => (
            <Item key={h.id} titulo={h.nome} onClick={() => abrir({ tela: 'habito', id: h.id })} />
          ))}
        </Secao>
      )}
      {projeto && (
        <Acoes>
          <button className="botao-secundario" onClick={() => void apagar()}>
            Excluir
          </button>
        </Acoes>
      )}
    </>
  )
}
