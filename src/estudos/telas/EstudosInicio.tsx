import { useNavegacao } from '../../app/navegacao'
import { CampoAdicionar, Item, Secao } from '../../ui/componentes'
import {
  criarBaralho,
  criarObjetivo,
  proximaAEstudar,
  useBaralhos,
  useCheckins,
  useContagemPorBaralho,
  useObjetivos,
  useTodasAreas,
  useTodasMicrometas,
} from '../dados'

/** Quantos itens cada lista mostra antes do "Ver todos". */
export const LIMITE_RESUMO = 5

/** Detalhe de um objetivo: o próximo conteúdo a estudar. */
export function useDetalheObjetivo() {
  const micrometas = useTodasMicrometas()
  const areas = useTodasAreas()
  const checkins = useCheckins()
  return (objetivoId: string) => {
    const doObjetivo = (micrometas ?? []).filter((m) => m.objetivo_id === objetivoId)
    if (doObjetivo.length === 0) return 'Sem conteúdos'
    const proximo = proximaAEstudar(doObjetivo, areas ?? [], checkins)
    return proximo ? `Próximo: ${proximo.nome}` : 'Todos os conteúdos estudados'
  }
}

export const textoCards = (n: number) => (n === 1 ? '1 card' : `${n} cards`)

/** Tela principal da aba Estudos: objetivos, baralhos e cards. */
export function EstudosInicio() {
  const { abrir } = useNavegacao()
  const objetivos = useObjetivos()
  const baralhos = useBaralhos()
  const contagem = useContagemPorBaralho()
  const detalheObjetivo = useDetalheObjetivo()

  return (
    <>
      <Secao titulo="Objetivos">
        {objetivos?.slice(0, LIMITE_RESUMO).map((o) => (
          <Item key={o.id} titulo={o.nome} detalhe={detalheObjetivo(o.id)} onClick={() => abrir({ tela: 'objetivo', id: o.id })} />
        ))}
        {(objetivos?.length ?? 0) > LIMITE_RESUMO && (
          <button className="botao-texto ver-todos" onClick={() => abrir({ tela: 'todos', tipo: 'objetivos' })}>
            Ver todos
          </button>
        )}
        <CampoAdicionar rotulo="Novo objetivo" onAdicionar={(nome) => void criarObjetivo(nome)} />
      </Secao>

      <Secao titulo="Baralhos">
        {baralhos?.slice(0, LIMITE_RESUMO).map((b) => (
          <Item
            key={b.id}
            titulo={b.nome}
            detalhe={textoCards(contagem?.get(b.id) ?? 0)}
            onClick={() => abrir({ tela: 'baralho', id: b.id })}
          />
        ))}
        {(baralhos?.length ?? 0) > LIMITE_RESUMO && (
          <button className="botao-texto ver-todos" onClick={() => abrir({ tela: 'todos', tipo: 'baralhos' })}>
            Ver todos
          </button>
        )}
        <CampoAdicionar rotulo="Novo baralho" onAdicionar={(nome) => void criarBaralho(nome)} />
      </Secao>

      <Secao titulo="Cards">
        <Item titulo="Importar cards" onClick={() => abrir({ tela: 'importar' })} />
        <Item titulo="Gerar cards com IA" onClick={() => abrir({ tela: 'ajuda-ia' })} />
        <Item titulo="Exportar cards" onClick={() => abrir({ tela: 'exportar' })} />
      </Secao>
    </>
  )
}
