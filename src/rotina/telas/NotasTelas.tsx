import { useEffect, useRef } from 'react'
import { useNavegacao } from '../../app/navegacao'
import { useRascunho } from '../../estado/preferencias'
import { Cabecalho, Secao, Vazio } from '../../ui/componentes'
import { dataPorExtenso, diaLocal } from '../../util/data'
import { Calendario } from './Calendario'
import { salvarNota, useDiasComNota, useNota } from '../dados'

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

/** Notas anteriores: calendário do mês; dias com nota aparecem marcados. */
export function NotasTela({ chave }: { chave: string }) {
  const { abrir } = useNavegacao()
  const hoje = diaLocal(new Date())
  const [mes, setMes] = useRascunho(chave, 'mes', hoje.slice(0, 7))
  const comNota = useDiasComNota()
  if (!comNota) return null
  return (
    <>
      <Cabecalho titulo="Notas anteriores" />
      <Secao>
        <Calendario
          mes={mes}
          onMes={setMes}
          hoje={hoje}
          marcados={comNota}
          rotuloDia={(d) => `${porExtenso(d)}${comNota.has(d) ? '' : ', sem nota'}`}
          onDia={(d) => abrir({ tela: 'nota', dia: d })}
        />
      </Secao>
    </>
  )
}
