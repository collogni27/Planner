// Evolução do Peso: média de cada uma das últimas 4 semanas, com uma linha ligando os pontos.
import { formatarPeso, type PesoDaSemana } from '../sono'

const LARGURA = 320
const ALTURA = 120
const TOPO = 22 // espaço para o número acima do ponto
const BASE = 16 // espaço embaixo da linha mais baixa
const PONTO = 6 // pontos quadrados, no estilo pixel

export function GraficoPeso({ semanas }: { semanas: PesoDaSemana[] }) {
  const valores = semanas.map((s) => s.media).filter((v): v is number => v !== null)
  if (valores.length === 0) return <p className="texto-secundario vazio">Sem registros de peso nestas semanas.</p>

  const min = Math.min(...valores)
  const max = Math.max(...valores)
  const faixa = max - min || 1 // tudo igual: linha reta no meio
  const coluna = LARGURA / semanas.length
  const x = (i: number) => coluna * i + coluna / 2
  const y = (v: number) => (max === min ? (TOPO + ALTURA - BASE) / 2 : TOPO + ((max - v) / faixa) * (ALTURA - TOPO - BASE))
  const pontos = semanas.map((s, i) => (s.media === null ? null : { x: x(i), y: y(s.media), v: s.media }))
  const linha = pontos.filter((p) => p !== null)

  return (
    <div className="grafico-peso">
      <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} role="img" aria-label="Evolução do peso nas últimas 4 semanas">
        {linha.length > 1 && (
          <polyline points={linha.map((p) => `${p!.x},${p!.y}`).join(' ')} fill="none" stroke="var(--acao)" strokeWidth={2} />
        )}
        {pontos.map(
          (p, i) =>
            p && (
              <g key={i}>
                <rect
                  x={p.x - PONTO / 2}
                  y={p.y - PONTO / 2}
                  width={PONTO}
                  height={PONTO}
                  fill="var(--acao)"
                  shapeRendering="crispEdges"
                />
                <text x={p.x} y={p.y - 9} textAnchor="middle" className="grafico-numero">
                  {formatarPeso(p.v)}
                </text>
              </g>
            ),
        )}
      </svg>
      <div className="grafico-rotulos">
        {semanas.map((s) => (
          <span key={s.rotulo}>{s.rotulo}</span>
        ))}
      </div>
    </div>
  )
}
