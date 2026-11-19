import { useNavegacao } from '../../app/navegacao'
import { Cabecalho, Item, Secao } from '../../ui/componentes'
import { useBaralhos, useContagemPorBaralho, useObjetivos } from '../dados'
import { textoCards, useDetalheObjetivo } from './EstudosInicio'

/** Lista completa de objetivos ou de baralhos (quando passam de 5 na tela de Estudos). */
export function TodosTela({ tipo }: { tipo: 'objetivos' | 'baralhos' }) {
  const { abrir } = useNavegacao()
  const objetivos = useObjetivos()
  const baralhos = useBaralhos()
  const contagem = useContagemPorBaralho()
  const detalheObjetivo = useDetalheObjetivo()

  return (
    <>
      <Cabecalho titulo={tipo === 'objetivos' ? 'Objetivos' : 'Baralhos'} />
      <Secao>
        {tipo === 'objetivos'
          ? objetivos?.map((o) => (
              <Item key={o.id} titulo={o.nome} detalhe={detalheObjetivo(o.id)} onClick={() => abrir({ tela: 'objetivo', id: o.id })} />
            ))
          : baralhos?.map((b) => (
              <Item
                key={b.id}
                titulo={b.nome}
                detalhe={textoCards(contagem?.get(b.id) ?? 0)}
                onClick={() => abrir({ tela: 'baralho', id: b.id })}
              />
            ))}
      </Secao>
    </>
  )
}
