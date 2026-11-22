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
import { allMaxReset, dayMaxReset, revisionMaxReset, routineMaxReset, routineReset } from './resets'

/** Confirmações seguidas para as ferramentas que apagam dados (2, 3 ou 4 vezes). */
const PASSOS = [
  (o: { titulo: string; mensagem: string }) => ({ ...o, confirmar: 'Continuar' }),
  () => ({ titulo: 'Tem certeza?', mensagem: 'Isto não pode ser desfeito.', confirmar: 'Sim' }),
  () => ({ titulo: 'Confirme de novo', mensagem: 'Os dados apagados não voltam.', confirmar: 'Sim, apagar' }),
  () => ({ titulo: 'Última confirmação', mensagem: 'Tudo da conta será apagado.', confirmar: 'Apagar tudo' }),
]

async function fecharApp() {
  await sincronizador.sincronizar()
  if (Capacitor.isNativePlatform()) await AppNativo.exitApp()
  else window.location.reload()
}

/** Botão do Modo Desenvolvedor na barra do mascote, com as ferramentas de teste. */
export function BotaoDev() {
  const [aberto, setAberto] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const { confirmar } = useDialogos()

  /** Pede `vezes` confirmações; só segue se todas forem aceitas. */
  async function confirmarVezes(vezes: number, titulo: string, texto: string) {
    setAberto(false)
    for (let i = 0; i < vezes; i++) {
      if (!(await confirmar({ ...PASSOS[i]({ titulo, mensagem: texto }), perigo: true }))) return false
    }
    return true
  }

  const feito = (texto: string) => {
    setMensagem(texto)
    setAberto(true)
  }

  async function revisionReset() {
    if (!(await confirmarVezes(2, 'Revision Reset', 'As revisões de hoje são desfeitas e os cards voltam ao estado de antes.')))
      return
    const n = await resetarRevisoesDeHoje(inicioDoDia(new Date()))
    feito(n === 1 ? '1 revisão desfeita.' : `${n} revisões desfeitas.`)
  }

  /** Limpa o registro de hoje e fecha o app, como se ele ainda não tivesse sido aberto hoje. */
  async function dayReset() {
    if (
      !(await confirmarVezes(
        2,
        'Day Reset',
        'Os dados de sono, peso e sol de hoje são apagados e o app fecha, como antes da primeira abertura do dia.',
      ))
    )
      return
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
    await fecharApp()
  }

  async function routine() {
    if (!(await confirmarVezes(2, 'Routine Reset', 'Todos os hábitos e as tarefas em aberto são apagados. O histórico fica.')))
      return
    await routineReset()
    void sincronizador.sincronizar()
    feito('Hábitos e tarefas apagados.')
  }

  async function routineMax() {
    if (!(await confirmarVezes(3, 'Routine Max Reset', 'Todos os hábitos, tarefas e o histórico deles são apagados.'))) return
    await routineMaxReset()
    void sincronizador.sincronizar()
    feito('Rotina apagada.')
  }

  async function revisionMax() {
    if (
      !(await confirmarVezes(
        3,
        'Revision Max Reset',
        'Todos os objetivos, baralhos, conteúdos, cards e o histórico de revisões são apagados.',
      ))
    )
      return
    await revisionMaxReset()
    void sincronizador.sincronizar()
    feito('Estudos apagados.')
  }

  async function dayMax() {
    if (
      !(await confirmarVezes(
        3,
        'Day Max Reset',
        'Todo o histórico de sono é apagado e o app fecha, como antes da primeira abertura do dia.',
      ))
    )
      return
    await dayMaxReset()
    await fecharApp()
  }

  async function allMax() {
    if (
      !(await confirmarVezes(
        4,
        'All Max Reset',
        'Todos os dados da conta são apagados e o app fecha, como se fosse aberto pela primeira vez.',
      ))
    )
      return
    await allMaxReset()
    await fecharApp()
  }

  const ferramentas: [string, () => Promise<void>][] = [
    ['Revision Reset', revisionReset],
    ['Day Reset', dayReset],
    ['Routine Reset', routine],
    ['Routine Max Reset', routineMax],
    ['Revision Max Reset', revisionMax],
    ['Day Max Reset', dayMax],
    ['All Max Reset', allMax],
  ]

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
          {ferramentas.map(([nome, acao]) => (
            <button key={nome} className="botao-secundario" onClick={() => void acao()}>
              {nome}
            </button>
          ))}
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
