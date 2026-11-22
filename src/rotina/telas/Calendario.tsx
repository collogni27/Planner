// Calendário de um mês (domingo a sábado), usado nas notas e no histórico dos hábitos.
import { Icone } from '../../icones/Icone'
import { LETRAS_DIAS, somarDias } from '../rotina'

const NOME_MES = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', month: 'long', year: 'numeric' })

function mudarMes(mes: string, delta: number) {
  const d = new Date(`${mes}-15T12:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + delta)
  return d.toISOString().slice(0, 7)
}

export function Calendario({
  mes,
  onMes,
  hoje,
  marcados,
  rotuloDia,
  onDia,
}: {
  mes: string // "2026-11"
  onMes: (mes: string) => void
  hoje: string
  marcados: Set<string>
  rotuloDia: (dia: string) => string
  /** Sem onDia, os dias só aparecem (não são tocáveis). */
  onDia?: (dia: string) => void
}) {
  const primeiro = `${mes}-01`
  const inicio = somarDias(primeiro, -new Date(`${primeiro}T12:00:00Z`).getUTCDay()) // domingo da 1ª semana
  const dias = Array.from({ length: 42 }, (_, i) => somarDias(inicio, i))
  const semanas = dias[35].slice(0, 7) === mes ? 6 : 5

  return (
    <>
      <div className="calendario-topo">
        <button className="botao-icone" aria-label="Mês anterior" onClick={() => onMes(mudarMes(mes, -1))}>
          <Icone nome="esquerda" tamanho={14} />
        </button>
        <span className="calendario-mes">{NOME_MES.format(new Date(`${mes}-15T12:00:00Z`))}</span>
        <button
          className="botao-icone"
          aria-label="Próximo mês"
          disabled={mes >= hoje.slice(0, 7)}
          onClick={() => onMes(mudarMes(mes, 1))}
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
          if (d.slice(0, 7) !== mes) return <span key={d} />
          const props = {
            className: 'calendario-dia',
            'data-nota': marcados.has(d) ? 'sim' : undefined,
            'aria-current': d === hoje ? ('date' as const) : undefined,
            'aria-label': rotuloDia(d),
          }
          return onDia ? (
            <button key={d} {...props} disabled={d > hoje} onClick={() => onDia(d)}>
              {Number(d.slice(8))}
            </button>
          ) : (
            <span key={d} {...props} role="img" data-futuro={d > hoje ? 'sim' : undefined}>
              {Number(d.slice(8))}
            </span>
          )
        })}
      </div>
    </>
  )
}
