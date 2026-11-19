import { useNavegacao } from '../../app/navegacao'
import { CampoAdicionar, Item, Secao, Vazio } from '../../ui/componentes'
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

/** Tela principal da aba Estudos: objetivos, baralhos e importação. */
export function EstudosInicio() {
  const { abrir } = useNavegacao()
  const objetivos = useObjetivos()
  const micrometas = useTodasMicrometas()
  const areas = useTodasAreas()
  const checkins = useCheckins()
  const baralhos = useBaralhos()
  const contagem = useContagemPorBaralho()

  function detalheObjetivo(objetivoId: string) {
    const doObjetivo = (micrometas ?? []).filter((m) => m.objetivo_id === objetivoId)
    if (doObjetivo.length === 0) return 'Sem micrometas ainda'
    const proxima = proximaAEstudar(doObjetivo, areas ?? [], checkins)
    return proxima ? `Próxima: ${proxima.nome}` : 'Todas as micrometas já estudadas'
  }

  return (
    <>
      <Secao titulo="Objetivos">
        {objetivos?.length === 0 && <Vazio>Crie um objetivo (ex.: ENEM) e depois as micrometas dele.</Vazio>}
        {objetivos?.map((o) => (
          <Item key={o.id} titulo={o.nome} detalhe={detalheObjetivo(o.id)} onClick={() => abrir({ tela: 'objetivo', id: o.id })} />
        ))}
        <CampoAdicionar rotulo="Novo objetivo" onAdicionar={(nome) => void criarObjetivo(nome)} />
      </Secao>

      <Secao titulo="Baralhos">
        {baralhos?.length === 0 && <Vazio>Crie baralhos para separar os cards (ex.: "ENEM – Flashcards" e "ENEM – Questões").</Vazio>}
        {baralhos?.map((b) => {
          const n = contagem?.get(b.id) ?? 0
          return (
            <Item
              key={b.id}
              titulo={b.nome}
              detalhe={n === 1 ? '1 card' : `${n} cards`}
              onClick={() => abrir({ tela: 'baralho', id: b.id })}
            />
          )
        })}
        <CampoAdicionar rotulo="Novo baralho" onAdicionar={(nome) => void criarBaralho(nome)} />
      </Secao>

      <Secao titulo="Cards">
        <Item titulo="Importar cards" detalhe="Colar texto ou escolher arquivo" onClick={() => abrir({ tela: 'importar' })} />
        <Item titulo="Gerar cards com IA" detalhe="Texto pronto para pedir os cards" onClick={() => abrir({ tela: 'ajuda-ia' })} />
        <Item titulo="Exportar cards" detalhe="TSV ou JSON" onClick={() => abrir({ tela: 'exportar' })} />
      </Secao>
    </>
  )
}
