import { useNavegacao } from '../app/navegacao'
import { Item, Secao } from '../ui/componentes'

/** Tela provisória "Mais": dá acesso ao que ainda não virou aba principal. */
export function Mais() {
  const { abrir } = useNavegacao()
  return (
    <>
      <Secao>
        <Item titulo="Configurações" onClick={() => abrir({ tela: 'configuracoes' })} />
      </Secao>
      <p className="texto-secundario nota-rodape">Os módulos aparecem aqui conforme forem construídos.</p>
    </>
  )
}
