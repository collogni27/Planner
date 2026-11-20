import { useState } from 'react'
import { definirModoDev } from '../estado/modoDev'
import { resetarRevisoesDeHoje } from '../estudos/dados'
import { Icone } from '../icones/Icone'
import { Sobreposicao, useDialogos } from '../ui/dialogos'
import { App as AppNativo } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { sincronizador } from '../nuvem/supabase'
import { esquecerAberturaDeHoje } from '../sono/automatica'
import { salvarDia } from '../sono/dados'
import { diaLocal, inicioDoDia } from '../util/data'

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

  /** Limpa o registro de hoje e fecha o app, como se ele ainda não tivesse sido aberto hoje. */
  async function resetarDia() {
    setAberto(false)
    const ok = await confirmar({
      titulo: 'Limpar o dia de hoje?',
      mensagem: 'Os dados de sono, peso e sol de hoje são apagados e o app fecha. Ao abrir de novo, ele age como na primeira abertura do dia.',
      confirmar: 'Limpar e fechar',
      perigo: true,
    })
    if (!ok) return
    await salvarDia(diaLocal(new Date()), {
      sono_minutos: null,
      qualidade: null,
      peso_kg: null,
      dormiu_no_horario: null,
      acordou_no_horario: null,
      sol_em: null,
      bom_dia_em: null,
    })
    esquecerAberturaDeHoje()
    await sincronizador.sincronizar()
    if (Capacitor.isNativePlatform()) await AppNativo.exitApp()
    else window.location.reload()
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
          <button className="botao-secundario" onClick={() => void resetarDia()}>
            Dia Reset
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
