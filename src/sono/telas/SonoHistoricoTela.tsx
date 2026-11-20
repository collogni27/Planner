import { useNavegacao } from '../../app/navegacao'
import { Cabecalho, Item, Secao, Vazio, dataCurta } from '../../ui/componentes'
import { useDias } from '../dados'
import { diaPreenchido } from '../sono'
import { resumoDoDia } from './SonoTela'

/** Histórico do sono: todos os dias registrados, do mais recente ao mais antigo. */
export function SonoHistoricoTela() {
  const { abrir } = useNavegacao()
  const dias = useDias('2000-01-01')
  if (!dias) return null
  const preenchidos = dias.filter(diaPreenchido)
  return (
    <>
      <Cabecalho titulo="Histórico do sono" />
      <Secao>
        {preenchidos.length === 0 && <Vazio>Sem registros ainda.</Vazio>}
        {preenchidos.map((d) => (
          <Item key={d.id} titulo={dataCurta(`${d.dia}T12:00:00`)} detalhe={resumoDoDia(d)} onClick={() => abrir({ tela: 'diaria', dia: d.dia })} />
        ))}
      </Secao>
    </>
  )
}
