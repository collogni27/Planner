import { useNavegacao } from '../../app/navegacao'
import { Cabecalho, Item, Secao, Vazio } from '../../ui/componentes'
import { concluirTarefa, useHabitos, useTarefas } from '../dados'
import { agruparAgenda } from '../rotina'
import { LinhaTarefa } from './partes'

/** Agenda completa: pendentes, cada dia, sem data; concluídas em outra tela. */
export function AgendaTela() {
  const { abrir } = useNavegacao()
  const agora = new Date()
  const tarefas = useTarefas()
  const habitos = useHabitos()
  if (!tarefas || !habitos) return null
  const grupos = agruparAgenda(tarefas, agora)

  return (
    <>
      <Cabecalho titulo="Agenda" />
      {grupos.length === 0 && (
        <Secao>
          <Vazio>Nenhuma tarefa.</Vazio>
        </Secao>
      )}
      {grupos.map((g) => (
        <Secao key={g.chave} titulo={g.titulo}>
          {g.tarefas.map((t) => (
            <LinhaTarefa
              key={t.id}
              tarefa={t}
              tarefas={tarefas}
              habitos={habitos}
              agora={agora}
              onMarcar={() => void concluirTarefa(t, !t.concluida_em)}
              onAbrir={() => abrir({ tela: 'tarefa', id: t.id })}
            />
          ))}
        </Secao>
      ))}
      <button className="botao-principal botao-grande" onClick={() => abrir({ tela: 'tarefa', id: null })}>
        Nova tarefa
      </button>
      <Secao>
        <Item titulo="Concluídas" onClick={() => abrir({ tela: 'concluidas' })} />
      </Secao>
    </>
  )
}

/** Tarefas concluídas, da mais recente para a mais antiga (dá para desfazer). */
export function ConcluidasTela() {
  const { abrir } = useNavegacao()
  const agora = new Date()
  const tarefas = useTarefas()
  const habitos = useHabitos()
  if (!tarefas || !habitos) return null
  const lista = tarefas.filter((t) => t.concluida_em).sort((a, b) => b.concluida_em!.localeCompare(a.concluida_em!))

  return (
    <>
      <Cabecalho titulo="Concluídas" />
      <Secao>
        {lista.length === 0 && <Vazio>Nenhuma tarefa concluída ainda.</Vazio>}
        {lista.map((t) => (
          <LinhaTarefa
            key={t.id}
            tarefa={t}
            tarefas={tarefas}
            habitos={habitos}
            agora={agora}
            onMarcar={() => void concluirTarefa(t, false)}
            onAbrir={() => abrir({ tela: 'tarefa', id: t.id })}
          />
        ))}
      </Secao>
    </>
  )
}
