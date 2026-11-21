import { useNavegacao } from '../../app/navegacao'
import { Secao, Vazio } from '../../ui/componentes'
import { diaLocal } from '../../util/data'
import { concluirTarefa, marcarHabito, useFeitos, useHabitos, useTarefas } from '../dados'
import { feitoNoDia, habitoValeNoDia, tarefasDoBloco } from '../rotina'
import { LinhaCheck, LinhaTarefa, textoQuando } from './partes'

const LIMITE_HABITOS = 6

/** Aba Rotina: hábitos de hoje e agenda de hoje e amanhã. */
export function RotinaInicio() {
  const { abrir } = useNavegacao()
  const agora = new Date()
  const hoje = diaLocal(agora)
  const habitos = useHabitos()
  const feitos = useFeitos(hoje)
  const tarefas = useTarefas()
  if (!habitos || !feitos || !tarefas) return null

  const deHoje = habitos.filter((h) => habitoValeNoDia(h, hoje))
  const grupos = tarefasDoBloco(tarefas, agora)

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
              detalhe={textoQuando({ ...h, gatilho_habito_id: null }, tarefas, habitos)}
              marcado={feito}
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
            <span className="campo-rotulo">{g.titulo}</span>
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
          </div>
        ))}
        {mais(() => abrir({ tela: 'agenda' }))}
      </Secao>
    </>
  )
}
