import { useEffect } from 'react'
import type { Grade } from 'ts-fsrs'
import { useNavegacao } from '../../app/navegacao'
import { useRascunho } from '../../estado/preferencias'
import { Cabecalho, Secao } from '../../ui/componentes'
import { diaLocal, horaMinuto } from '../../util/data'
import { gravarResposta, useDadosRevisao } from '../dados'
import { cardsLiberados, formatarIntervalo, montarFila, NOTAS, previa, responder, type Filtro } from '../revisao'
import { useInicioDoDia, useRelogio } from './RevisarTela'

interface Props {
  chave: string
  baralhoId: string
  filtro: Filtro
}

/**
 * A revisão em si. Fica salvo qual card está na tela, se a resposta está aberta e
 * quando o card apareceu: se o app for fechado, reabre no mesmo ponto.
 */
export function SessaoTela({ chave, baralhoId, filtro }: Props) {
  const { abrir, voltar } = useNavegacao()
  const [agora, setAgora] = useRelogio()
  const dados = useDadosRevisao(useInicioDoDia(agora))
  const [atualId, setAtualId] = useRascunho<string | null>(chave, 'card', null)
  const [mostrando, setMostrando] = useRascunho(chave, 'resposta', false)
  const [inicioMs, setInicioMs] = useRascunho<number | null>(chave, 'inicio', null)

  const liberados = dados ? cardsLiberados(dados.cards, baralhoId, filtro, dados.micrometas, dados.checkins) : []
  const fila = dados ? montarFila(liberados, agora, dados.novosRespondidosHoje, diaLocal(agora)) : null
  // O card que já estava na tela continua nela (mesmo que a ordem mude).
  const card = liberados.find((c) => c.id === atualId) ?? fila?.proximo ?? null

  useEffect(() => {
    if (card && card.id !== atualId) {
      setAtualId(card.id)
      setMostrando(false)
      setInicioMs(Date.now())
    }
  }, [card, atualId, setAtualId, setMostrando, setInicioMs])

  if (!dados || !fila) return null

  async function responderCom(nota: Grade) {
    if (!card) return
    const momento = new Date()
    const duracao = inicioMs ? Math.min(Date.now() - inicioMs, 10 * 60_000) : null
    const r = responder(card, nota, momento, duracao, () => crypto.randomUUID())
    setAtualId(null)
    setMostrando(false)
    setInicioMs(null)
    await gravarResposta(r.card, r.revisao)
    setAgora(new Date())
  }

  if (!card) {
    return (
      <>
        <Cabecalho titulo="Revisão" />
        <Secao titulo="Revisão concluída">
          <p className="texto-secundario">
            {fila.voltaEm ? `Alguns cards voltam às ${horaMinuto(fila.voltaEm)}.` : 'Nada mais para revisar agora.'}
          </p>
          <button className="botao-principal" onClick={voltar}>
            Concluir
          </button>
        </Secao>
      </>
    )
  }

  const conteudo = dados.micrometas.find((m) => m.id === card.micrometa_id)
  const momento = new Date()
  const quando = mostrando ? previa(card, momento) : null

  return (
    <>
      <Cabecalho
        titulo="Revisão"
        acao={<span className="restantes">{fila.restantes}</span>}
      />

      <section className="card cartao-revisao">
        {conteudo && <span className="cartao-contexto">{conteudo.nome}</span>}
        <p className="cartao-texto">{card.frente}</p>
        {mostrando && (
          <>
            <hr className="cartao-divisao" />
            <p className="cartao-texto">{card.verso}</p>
          </>
        )}
      </section>

      {!mostrando ? (
        <button className="botao-principal botao-grande" onClick={() => setMostrando(true)}>
          Mostrar resposta
        </button>
      ) : (
        <div className="notas" role="group" aria-label="Como foi">
          {NOTAS.map(({ nota, rotulo }) => (
            <button key={nota} className="botao-nota" onClick={() => void responderCom(nota)}>
              <span>{rotulo}</span>
              <span className="botao-nota-tempo">{quando && formatarIntervalo(momento, quando[nota])}</span>
            </button>
          ))}
        </div>
      )}

      <div className="acoes">
        <button className="botao-texto" onClick={() => abrir({ tela: 'card', id: card.id })}>
          Editar card
        </button>
      </div>
    </>
  )
}
