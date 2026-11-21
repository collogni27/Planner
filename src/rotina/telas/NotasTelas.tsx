import { useEffect, useRef } from 'react'
import { useNavegacao } from '../../app/navegacao'
import { useRascunho } from '../../estado/preferencias'
import { Icone } from '../../icones/Icone'
import { Cabecalho, Secao, Vazio } from '../../ui/componentes'
import { dataPorExtenso, diaLocal } from '../../util/data'
import { salvarNota, useDiasComNota, useNota } from '../dados'
import { LETRAS_DIAS, somarDias } from '../rotina'

const porExtenso = (dia: string) => dataPorExtenso(new Date(`${dia}T12:00:00-03:00`))

/**
 * Nota de um dia. A de hoje é editável e salva sozinha enquanto se escreve; as de
 * outros dias só aparecem (cada dia fica como estava na virada).
 */
export function NotaTela({ dia, chave }: { dia: string; chave: string }) {
  const nota = useNota(dia)
  const editavel = dia === diaLocal(new Date())
  // Rascunho: o texto sobrevive ao app ser fechado no meio da escrita.
  const [rascunho, setRascunho] = useRascunho<string | null>(chave, 'texto', null)
  const pendente = useRef<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const gravar = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    if (pendente.current !== null) void salvarNota(dia, pendente.current)
    pendente.current = null
  }

  // Ao abrir: se ficou rascunho de antes (app fechado), grava. Ao sair: grava o que faltou.
  useEffect(() => {
    if (editavel && rascunho !== null) {
      pendente.current = rascunho
      gravar()
    }
    return gravar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (nota === undefined) return null
  const texto = rascunho ?? nota?.texto ?? ''

  if (!editavel) {
    return (
      <>
        <Cabecalho titulo={porExtenso(dia)} />
        <Secao>{nota?.texto.trim() ? <p className="texto-nota">{nota.texto}</p> : <Vazio>Sem nota.</Vazio>}</Secao>
      </>
    )
  }

  return (
    <>
      <Cabecalho titulo="Nota de hoje" />
      <textarea
        className="campo-entrada area-texto area-nota"
        aria-label="Nota de hoje"
        value={texto}
        onChange={(e) => {
          setRascunho(e.target.value)
          pendente.current = e.target.value
          if (timer.current) clearTimeout(timer.current)
          timer.current = setTimeout(gravar, 600)
        }}
      />
    </>
  )
}

const NOME_MES = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', month: 'long', year: 'numeric' })

function mudarMes(mes: string, delta: number) {
  const d = new Date(`${mes}-15T12:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + delta)
  return d.toISOString().slice(0, 7)
}

/** Notas anteriores: calendário do mês; dias com nota aparecem marcados. */
export function NotasTela({ chave }: { chave: string }) {
  const { abrir } = useNavegacao()
  const hoje = diaLocal(new Date())
  const [mes, setMes] = useRascunho(chave, 'mes', hoje.slice(0, 7))
  const comNota = useDiasComNota()
  if (!comNota) return null

  const primeiro = `${mes}-01`
  const inicio = somarDias(primeiro, -new Date(`${primeiro}T12:00:00Z`).getUTCDay()) // domingo da 1ª semana
  const dias = Array.from({ length: 42 }, (_, i) => somarDias(inicio, i))
  const semanas = dias[35].slice(0, 7) === mes ? 6 : 5

  return (
    <>
      <Cabecalho titulo="Notas anteriores" />
      <Secao>
        <div className="calendario-topo">
          <button className="botao-icone" aria-label="Mês anterior" onClick={() => setMes(mudarMes(mes, -1))}>
            <Icone nome="esquerda" tamanho={14} />
          </button>
          <span className="calendario-mes">{NOME_MES.format(new Date(`${mes}-15T12:00:00Z`))}</span>
          <button
            className="botao-icone"
            aria-label="Próximo mês"
            disabled={mes >= hoje.slice(0, 7)}
            onClick={() => setMes(mudarMes(mes, 1))}
          >
            <Icone nome="direita" tamanho={14} />
          </button>
        </div>
        <div className="calendario">
          {LETRAS_DIAS.map((l, i) => (
            <span key={i} className="calendario-semana">
              {l}
            </span>
          ))}
          {dias.slice(0, semanas * 7).map((d) => {
            const doMes = d.slice(0, 7) === mes
            if (!doMes) return <span key={d} />
            return (
              <button
                key={d}
                className="calendario-dia"
                data-nota={comNota.has(d) ? 'sim' : undefined}
                aria-current={d === hoje ? 'date' : undefined}
                aria-label={`${porExtenso(d)}${comNota.has(d) ? '' : ', sem nota'}`}
                disabled={d > hoje}
                onClick={() => abrir({ tela: 'nota', dia: d })}
              >
                {Number(d.slice(8))}
              </button>
            )
          })}
        </div>
      </Secao>
    </>
  )
}
