import { useEffect, useMemo, useState } from 'react'
import { useNavegacao } from '../../app/navegacao'
import { useEstadoSalvo, useRascunho } from '../../estado/preferencias'
import { Cabecalho, Secao, Vazio } from '../../ui/componentes'
import { diaLocal, inicioDoDia } from '../../util/data'
import { useDadosRevisao, type DadosRevisao } from '../dados'
import { cardsLiberados, LIBERAR_MAIS, montarFila, NOVOS_POR_DIA, SEM_FILTRO, type Filtro } from '../revisao'

/** Relógio que anda sozinho (cards em aprendizado vencem com o passar dos minutos). */
export function useRelogio(intervaloMs = 30_000) {
  const [agora, setAgora] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), intervaloMs)
    return () => clearInterval(id)
  }, [intervaloMs])
  return [agora, setAgora] as const
}

/** Início do dia em São Paulo, estável enquanto o dia não vira. */
export function useInicioDoDia(agora: Date) {
  const dia = diaLocal(agora)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => inicioDoDia(agora), [dia])
}

/** Limite de cards novos de hoje: o padrão + o que foi liberado a mais hoje. */
export function useLimiteNovos(agora: Date) {
  const dia = diaLocal(agora)
  const [liberado, setLiberado] = useEstadoSalvo('novos-extra', { dia, extra: 0 })
  const extra = liberado.dia === dia ? liberado.extra : 0 // vale só para o dia em que foi liberado
  return [NOVOS_POR_DIA + extra, () => setLiberado({ dia, extra: extra + LIBERAR_MAIS })] as const
}

/** Fila de revisão com um filtro. */
export function filaDe(d: DadosRevisao, filtro: Filtro, agora: Date, limiteNovos: number) {
  return montarFila(cardsLiberados(d.cards, filtro, d.checkins, d.vinculos), agora, d.novosRespondidosHoje, diaLocal(agora), limiteNovos)
}

/** Quantos cards estão para revisar agora, com um filtro. */
export const paraRevisar = (d: DadosRevisao, filtro: Filtro, agora: Date, limiteNovos: number) =>
  filaDe(d, filtro, agora, limiteNovos).restantes

/**
 * Escolher o que revisar: baralhos, objetivos e tags (pode marcar vários em cada um;
 * nada marcado = sem filtro ali). Dentro de cada um vale qualquer um; entre eles, todos.
 */
export function RevisarTela({ chave }: { chave: string }) {
  const { abrir } = useNavegacao()
  const [agora] = useRelogio()
  const dados = useDadosRevisao(useInicioDoDia(agora))
  const [limiteNovos] = useLimiteNovos(agora)
  const [filtro, setFiltro] = useRascunho<Filtro>(chave, 'filtro', SEM_FILTRO)

  if (!dados) return null

  const alternar = (campo: keyof Filtro, valor: string) => {
    const lista = filtro[campo]
    setFiltro({ ...filtro, [campo]: lista.includes(valor) ? lista.filter((x) => x !== valor) : [...lista, valor] })
  }
  const tags = [...new Set(cardsLiberados(dados.cards, SEM_FILTRO, dados.checkins, dados.vinculos).flatMap((c) => c.tags))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  )
  const total = paraRevisar(dados, filtro, agora, limiteNovos)
  const livres = cardsLiberados(dados.cards, filtro, dados.checkins, dados.vinculos).length

  const fichas = (campo: keyof Filtro, opcoes: { valor: string; rotulo: string; numero?: number }[]) => (
    <div className="fichas">
      {opcoes.map((o) => (
        <button key={o.valor} className="ficha" aria-pressed={filtro[campo].includes(o.valor)} onClick={() => alternar(campo, o.valor)}>
          {o.rotulo}
          {o.numero !== undefined && <span className="ficha-numero">{o.numero}</span>}
        </button>
      ))}
    </div>
  )

  return (
    <>
      <Cabecalho titulo="Revisar" />

      <Secao titulo="Baralhos">
        {dados.baralhos.length === 0 ? (
          <Vazio>Nenhum baralho.</Vazio>
        ) : (
          fichas(
            'baralhos',
            dados.baralhos.map((b) => ({
              valor: b.id,
              rotulo: b.nome,
              numero: paraRevisar(dados, { ...SEM_FILTRO, baralhos: [b.id] }, agora, limiteNovos),
            })),
          )
        )}
      </Secao>

      {dados.objetivos.length > 0 && (
        <Secao titulo="Objetivos">{fichas('objetivos', dados.objetivos.map((o) => ({ valor: o.id, rotulo: o.nome })))}</Secao>
      )}

      {tags.length > 0 && <Secao titulo="Tags">{fichas('tags', tags.map((t) => ({ valor: t, rotulo: t })))}</Secao>}

      <Secao>
        <button className="botao-principal botao-grande" disabled={total === 0} onClick={() => abrir({ tela: 'sessao', filtro })}>
          {total === 0 ? 'Nada para revisar agora' : `Começar · ${total}`}
        </button>
        {total === 0 && livres > 0 && (
          <p className="texto-secundario">Os cards destes filtros ainda estão fortes na memória. Eles voltam quando for a hora certa.</p>
        )}
        <button className="botao-secundario" disabled={livres === 0} onClick={() => abrir({ tela: 'livre', filtro })}>
          {livres === 0 ? 'Revisão Livre' : `Revisão Livre · ${livres}`}
        </button>
      </Secao>
    </>
  )
}
