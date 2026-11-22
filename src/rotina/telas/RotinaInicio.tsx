import { useNavegacao } from '../../app/navegacao'
import { Secao, Vazio } from '../../ui/componentes'
import { diaLocal } from '../../util/data'
import { concluirTarefa, marcarHabito, useConfigAgenda, useFeitos, useHabitos, useTarefas } from '../dados'
import { feitoNoDia, habitoAtrasado, habitoValeNoDia, tarefasDoBloco } from '../rotina'
import { LinhaCheck, LinhaTarefa, rotaDaTarefa, textoQuando } from './partes'

const LIMITE_HABITOS = 6

/** Aba Rotina: hábitos de hoje e agenda (fixadas, pendentes, hoje e amanhã). */
export function RotinaInicio() {
  const { abrir } = useNavegacao()
  const agora = new Date()
  const hoje = diaLocal(agora)
  const habitos = useHabitos()
  const feitos = useFeitos(hoje)
  const tarefas = useTarefas()
  const config = useConfigAgenda()
  if (!habitos || !feitos || !tarefas || !config) return null

  const deHoje = habitos.filter((h) => habitoValeNoDia(h, hoje))
  const grupos = tarefasDoBloco(tarefas, agora, config)

  const mais = (onClick: () => void) => (
    <button className="botao-texto ver-todos" onClick={onClick}>
      Mais
    </button>
  )

  return (
    <>
      <Secao titulo="Hábitos">
        {deHoje.length === 0 && <Vazio>Nenhum hábito para hoje.</Vazio>}
        {deHoje.slice(0, LIMITE_HABITOS).map((h) => {
          const feito = feitoNoDia(feitos, h.id, hoje)
          return (
            <LinhaCheck
              key={h.id}
              titulo={h.nome}
              detalhe={textoQuando(h, tarefas, habitos)}
              marcado={feito}
              urgente={habitoAtrasado(h, feitos, agora)}
              onMarcar={() => void marcarHabito(h, hoje, !feito)}
              onAbrir={() => abrir({ tela: 'habito', id: h.id })}
            />
          )
        })}
        {mais(() => abrir({ tela: 'habitos' }))}
      </Secao>

      <Secao titulo="Agenda">
        {grupos.length === 0 && <Vazio>Nada para hoje e amanhã.</Vazio>}
        {grupos.map((g) => (
          <div key={g.chave} className="grupo-agenda">
            {g.titulo && <span className="campo-rotulo">{g.titulo}</span>}
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
          </div>
        ))}
        {mais(() => abrir({ tela: 'agenda' }))}
      </Secao>

      <button className="botao-secundario botao-largo" onClick={() => abrir({ tela: 'nao-planejada', id: null })}>
        Tarefa não planejada
      </button>
    </>
  )
}
