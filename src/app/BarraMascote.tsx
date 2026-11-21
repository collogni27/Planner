import { useEffect, useState } from 'react'
import { Icone } from '../icones/Icone'
import { Mascote } from '../mascote/Mascote'
import type { Modo } from '../estado/preferencias'
import { dataPorExtenso, saudacao } from '../util/data'
import { NOME_USUARIO } from '../config'
import { useModoDev } from '../estado/modoDev'
import { BotaoDev } from './ModoDev'
import { useNavegacao } from './navegacao'
import { diaLocal } from '../util/data'

interface Props {
  modo: Modo
  aberta: boolean
  onAlternar: () => void
}

/** Relógio que atualiza a cada minuto (para a saudação e a data virarem sozinhas). */
function useAgora() {
  const [agora, setAgora] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  return agora
}

/** Barra do mascote no topo de todas as abas. Pode ser recolhida; o estado é lembrado. */
export function BarraMascote({ modo, aberta, onAlternar }: Props) {
  const agora = useAgora()
  const modoDev = useModoDev()
  const { abrir } = useNavegacao()

  return (
    <div className="barra-area">
      <div className={`barra-recolhivel ${aberta ? 'aberta' : ''}`}>
        <div className="barra-recolhivel-interno" inert={!aberta}>
          <header className="barra">
            <div className="barra-topo">
              <div className="barra-mascote">
                <Mascote modo={modo} largura={56} animacoes={['aceno', 'ocioso_piscar']} rotulo="Mascote do Planner" />
              </div>
              <div className="barra-textos">
                <div className="barra-saudacao">
                  {saudacao(agora)}, {NOME_USUARIO}.
                </div>
                <div className="barra-data">{dataPorExtenso(agora)}</div>
              </div>
              {modoDev && <BotaoDev />}
              <button className="barra-botao barra-recolher" aria-label="Recolher a barra do mascote" onClick={onAlternar}>
                <Icone nome="cima" tamanho={18} />
              </button>
            </div>
            <div className="barra-acoes">
              {/* Nota diária (docs/modulos/notas.md). */}
              <button className="barra-botao" onClick={() => abrir({ tela: 'notas' })}>
                <Icone nome="notas" tamanho={14} />
                <span>Notas anteriores</span>
              </button>
              <button className="barra-botao" onClick={() => abrir({ tela: 'nota', dia: diaLocal(new Date()) })}>
                <Icone nome="lapis" tamanho={14} />
                <span>Editar nota atual</span>
              </button>
            </div>
          </header>
        </div>
      </div>

      {/* O botão "Mostrar" abre enquanto a barra fecha (e vice-versa), na mesma
          animação: a altura total muda de forma contínua, sem pulo. */}
      <div className={`barra-recolhivel ${aberta ? '' : 'aberta'}`}>
        <div className="barra-recolhivel-interno" inert={aberta}>
          <div className="barra-mostrar-area">
            <button className="barra-mostrar" aria-label="Mostrar a barra do mascote" onClick={onAlternar}>
              <span className="barra-mostrar-pilula">
                <Mascote modo={modo} largura={22} />
                Mostrar
                <Icone nome="baixo" tamanho={12} />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
