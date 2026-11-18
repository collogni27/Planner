import { useEffect, useState } from 'react'
import dados from '../../docs/mascote/mascote.json'
import { ALTURA, LARGURA, animacoes, quadros, type NomeAnimacao, type NomeQuadro } from './mascote'
import type { Modo } from '../estado/preferencias'

interface Props {
  modo: Modo
  /** Largura em px; a altura segue a proporção da grade. */
  largura: number
  /** Sequência de animações: as que não repetem tocam uma vez e passam para a próxima. */
  animacoes?: NomeAnimacao[]
  rotulo?: string
}

const prefereMenosMovimento = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Mascote em pixel art, desenhado a partir do mascote.json, com troca de quadros em degraus. */
export function Mascote({ modo, largura, animacoes: sequencia = [], rotulo }: Props) {
  const [quadro, setQuadro] = useState<NomeQuadro>('padrao')
  const chaveSequencia = sequencia.join(',')

  useEffect(() => {
    if (sequencia.length === 0 || prefereMenosMovimento()) {
      setQuadro('padrao')
      return
    }
    let timer: ReturnType<typeof setTimeout>
    let iAnimacao = 0
    let iQuadro = 0

    const passo = () => {
      const anim = animacoes[sequencia[iAnimacao]]
      setQuadro(anim.quadros[iQuadro])
      timer = setTimeout(() => {
        iQuadro++
        if (iQuadro >= anim.quadros.length) {
          iQuadro = 0
          // Animação que não repete passa para a próxima da sequência (se houver).
          if (!anim.repetir) {
            if (iAnimacao + 1 >= sequencia.length) {
              setQuadro('padrao')
              return
            }
            iAnimacao++
          }
        }
        passo()
      }, anim.duracoes_ms[iQuadro])
    }
    passo()
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveSequencia])

  const paleta = dados.paletas[modo]
  const { corpo, olhos } = quadros[quadro]
  return (
    <svg
      viewBox={`0 0 ${LARGURA} ${ALTURA}`}
      width={largura}
      height={Math.round((largura * ALTURA) / LARGURA)}
      shapeRendering="crispEdges"
      role={rotulo ? 'img' : undefined}
      aria-label={rotulo}
      aria-hidden={rotulo ? undefined : true}
    >
      <path d={corpo} fill={paleta.B} />
      <path d={olhos} fill={paleta.E} />
    </svg>
  )
}
