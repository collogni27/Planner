import { useState } from 'react'
import { definirModoDev } from '../estado/modoDev'
import { resetarRevisoesDeHoje } from '../estudos/dados'
import { Icone } from '../icones/Icone'
import { Sobreposicao, useDialogos } from '../ui/dialogos'
import { inicioDoDia } from '../util/data'

/** Botão do Modo Desenvolvedor na barra do mascote, com as ferramentas de teste. */
export function BotaoDev() {
  const [aberto, setAberto] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const { confirmar } = useDialogos()

  async function resetar() {
    setAberto(false)
    const ok = await confirmar({
      titulo: 'Apagar as revisões de hoje?',
      mensagem: 'Os cards revisados hoje voltam ao estado de antes.',
      confirmar: 'Apagar',
      perigo: true,
    })
    if (!ok) return
    const n = await resetarRevisoesDeHoje(inicioDoDia(new Date()))
    setMensagem(n === 1 ? '1 revisão desfeita.' : `${n} revisões desfeitas.`)
    setAberto(true)
  }

  return (
    <>
      <button
        className="barra-botao barra-recolher"
        aria-label="Modo Desenvolvedor"
        onClick={() => {
          setMensagem(null)
          setAberto(true)
        }}
      >
        <Icone nome="terminal" tamanho={16} />
      </button>
      <Sobreposicao aberto={aberto} onFechar={() => setAberto(false)} rotulo="Modo Desenvolvedor">
        <div className="dialogo-corpo">
          <h2 className="card-titulo">Modo Desenvolvedor</h2>
          {mensagem && <p className="mensagem-ok">{mensagem}</p>}
          <button className="botao-secundario" onClick={() => void resetar()}>
            Revisão Reset
          </button>
          <button
            className="botao-secundario"
            onClick={() => {
              setAberto(false)
              definirModoDev(false)
            }}
          >
            Fechar
          </button>
        </div>
      </Sobreposicao>
    </>
  )
}
