import { useNavegacao } from '../../app/navegacao'
import { Cabecalho, Item, Secao, Vazio } from '../../ui/componentes'
import { concluirTarefa, salvarConfigAgenda, useConfigAgenda, useHabitos, useTarefas } from '../dados'
import { agruparAgenda } from '../rotina'
import { Campo, Fichas, LinhaTarefa, rotaDaTarefa } from './partes'

/** Agenda completa: fixadas, pendentes, cada dia, sem data; ordem; concluídas em outra tela. */
export function AgendaTela() {
  const { abrir } = useNavegacao()
  const agora = new Date()
  const tarefas = useTarefas()
  const habitos = useHabitos()
  const config = useConfigAgenda()
  if (!tarefas || !habitos || !config) return null
  const grupos = agruparAgenda(tarefas, agora, config)

  return (
    <>
      <Cabecalho titulo="Agenda" />
      {grupos.length === 0 && (
        <Secao>
          <Vazio>Nenhuma tarefa.</Vazio>
        </Secao>
      )}
      {grupos.map((g) => (
        <Secao key={g.chave} titulo={g.titulo || undefined}>
          {g.tarefas.map((t) => (
            <LinhaTarefa
              key={t.id}
              tarefa={t}
              tarefas={tarefas}
              habitos={habitos}
              agora={agora}
              mostrarData={config.ordem === 'prioridade' || g.chave === 'fixadas'}
              onMarcar={() => void concluirTarefa(t, !t.concluida_em)}
              onAbrir={() => abrir(rotaDaTarefa(t))}
            />
          ))}
        </Secao>
      ))}
      <div className="acoes">
        <button className="botao-secundario" onClick={() => abrir({ tela: 'nao-planejada', id: null })}>
          Não planejada
        </button>
        <button className="botao-principal" onClick={() => abrir({ tela: 'tarefa', id: null })}>
          Nova tarefa
        </button>
      </div>
      <Secao titulo="Ordem">
        <Campo texto="Ordenar por">
          <Fichas
            rotulo="Ordenar por"
            valor={config.ordem}
            onChange={(ordem) => void salvarConfigAgenda({ ...config, ordem })}
            opcoes={[
              ['ocorrencia', 'Ocorrência'],
              ['prioridade', 'Prioridade'],
            ]}
          />
        </Campo>
        <Fichas
          rotulo="Sentido"
          valor={config.sentido}
          onChange={(sentido) => void salvarConfigAgenda({ ...config, sentido })}
          opcoes={[
            ['crescente', 'Crescente'],
            ['decrescente', 'Decrescente'],
          ]}
        />
      </Secao>
      <Secao>
        <Item titulo="Concluídas" onClick={() => abrir({ tela: 'concluidas' })} />
      </Secao>
    </>
  )
}

/** Tarefas concluídas (e não planejadas), da mais recente para a mais antiga. */
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
            mostrarData
            onMarcar={() => void concluirTarefa(t, false)}
            onAbrir={() => abrir(rotaDaTarefa(t))}
          />
        ))}
      </Secao>
    </>
  )
}
