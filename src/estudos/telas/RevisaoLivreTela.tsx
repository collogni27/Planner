import { useEffect } from 'react'
import { useNavegacao } from '../../app/navegacao'
import { useRascunho } from '../../estado/preferencias'
import { Cabecalho, Secao } from '../../ui/componentes'
import { useDadosRevisao } from '../dados'
import { cardsLiberados, embaralhar, type Filtro } from '../revisao'
import { useInicioDoDia, useRelogio } from './RevisarTela'

interface Sessao {
  /** Ordem dos cards desta sessão (sorteada no início). */
  ids: string[]
  indice: number
  acertos: number
}

/**
 * Revisão Livre: passa por todos os cards escolhidos (vencidos ou não), sem mudar o
 * agendamento do FSRS e sem gravar no histórico. Para a véspera de prova, por exemplo.
 * A posição fica salva: se o app fechar, volta no mesmo card.
 */
export function RevisaoLivreTela({ chave, filtro }: { chave: string; filtro: Filtro }) {
  const { voltar } = useNavegacao()
  const [agora] = useRelogio(60_000)
  const dados = useDadosRevisao(useInicioDoDia(agora))
  const [sessao, setSessao] = useRascunho<Sessao | null>(chave, 'sessao', null)
  const [mostrando, setMostrando] = useRascunho(chave, 'resposta', false)

  const liberados = dados ? cardsLiberados(dados.cards, filtro, dados.checkins, dados.vinculos) : []

  useEffect(() => {
    if (dados && !sessao) setSessao({ ids: embaralhar(liberados.map((c) => c.id), String(Date.now())), indice: 0, acertos: 0 })
  }, [dados, sessao, liberados, setSessao])

  if (!dados || !sessao) return null

  // Pula cards que foram apagados no meio da sessão.
  let indice = sessao.indice
  while (indice < sessao.ids.length && !dados.cards.some((c) => c.id === sessao.ids[indice])) indice++
  const card = dados.cards.find((c) => c.id === sessao.ids[indice])

  function proximo(acertou: boolean) {
    setMostrando(false)
    setSessao({ ...sessao!, indice: indice + 1, acertos: sessao!.acertos + (acertou ? 1 : 0) })
  }

  if (!card) {
    const total = sessao.ids.length
    return (
      <>
        <Cabecalho titulo="Revisão Livre" />
        <Secao titulo="Revisão concluída">
          <p className="texto-secundario">
            {total === 1 ? '1 card' : `${total} cards`} · {sessao.acertos} {sessao.acertos === 1 ? 'acerto' : 'acertos'}
          </p>
          <button
            className="botao-secundario"
            onClick={() => setSessao({ ids: embaralhar(sessao.ids, String(Date.now())), indice: 0, acertos: 0 })}
          >
            Recomeçar
          </button>
          <button className="botao-principal" onClick={voltar}>
            Concluir
          </button>
        </Secao>
      </>
    )
  }

  const conteudo = dados.micrometas.find((m) => m.id === card.micrometa_id)
  return (
    <>
      <Cabecalho titulo="Revisão Livre" acao={<span className="restantes">{sessao.ids.length - indice}</span>} />

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
        <div className="notas notas-2" role="group" aria-label="Como foi">
          <button className="botao-nota" onClick={() => proximo(false)}>
            Errei
          </button>
          <button className="botao-nota" onClick={() => proximo(true)}>
            Acertei
          </button>
        </div>
      )}
    </>
  )
}
