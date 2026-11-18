import { VERSAO } from '../config'
import { MODOS, type Modo } from '../estado/preferencias'
import { Icone } from '../icones/Icone'

const NOMES: Record<Modo, string> = { claro: 'Claro', escuro: 'Escuro', foco: 'Foco' }

interface Props {
  modo: Modo
  onModo: (modo: Modo) => void
  onVoltar: () => void
}

export function Configuracoes({ modo, onModo, onVoltar }: Props) {
  return (
    <>
      <div className="cabecalho-tela">
        <button className="botao-voltar" onClick={onVoltar}>
          <Icone nome="esquerda" tamanho={12} />
          Voltar
        </button>
        <h1 className="titulo-tela">Configurações</h1>
      </div>

      <section className="card">
        <h2 className="card-titulo">Modo de cor</h2>
        <div className="opcoes" role="radiogroup" aria-label="Modo de cor">
          {MODOS.map((m) => (
            <button
              key={m}
              role="radio"
              aria-checked={m === modo}
              className="botao-marcavel"
              onClick={() => onModo(m)}
            >
              <span className="checkbox" aria-hidden="true">
                {m === modo && <Icone nome="check" tamanho={10} />}
              </span>
              {NOMES[m]}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="card-titulo">Sobre</h2>
        <div className="linha-info">
          <span className="texto-secundario">Versão</span>
          <span className="numero-destaque">{VERSAO}</span>
        </div>
      </section>
    </>
  )
}
