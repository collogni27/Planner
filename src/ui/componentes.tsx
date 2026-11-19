// Peças de interface reaproveitadas pelas telas (estilos em estilo/base.css).
import { useState, type ReactNode } from 'react'
import { useNavegacao } from '../app/navegacao'
import { Icone } from '../icones/Icone'
import { useDialogos } from './dialogos'

/** Cabeçalho de tela com "Voltar" (e, opcionalmente, um botão à direita). */
export function Cabecalho({ titulo, acao }: { titulo: string; acao?: ReactNode }) {
  const { voltar } = useNavegacao()
  return (
    <div className="cabecalho-tela">
      <button className="botao-voltar" onClick={voltar}>
        <Icone nome="esquerda" tamanho={12} />
        Voltar
      </button>
      <h1 className="titulo-tela">{titulo}</h1>
      {acao && <span className="cabecalho-acao">{acao}</span>}
    </div>
  )
}

/** Bloco que abre e fecha com a mesma animação da barra do mascote. */
export function Recolhivel({ aberto, children }: { aberto: boolean; children: ReactNode }) {
  return (
    <div className={`barra-recolhivel ${aberto ? 'aberta' : ''}`}>
      <div className="barra-recolhivel-interno" inert={!aberto}>
        {children}
      </div>
    </div>
  )
}

export function Secao({ titulo, children, acao }: { titulo?: string; children: ReactNode; acao?: ReactNode }) {
  return (
    <section className="card">
      {(titulo || acao) && (
        <div className="secao-topo">
          {titulo && <h2 className="card-titulo">{titulo}</h2>}
          {acao}
        </div>
      )}
      {children}
    </section>
  )
}

/** Linha tocável de uma lista. */
export function Item({
  titulo,
  detalhe,
  onClick,
  direita,
}: {
  titulo: string
  detalhe?: ReactNode
  onClick?: () => void
  direita?: ReactNode
}) {
  return (
    <div className="item">
      <button className="item-principal" onClick={onClick} disabled={!onClick}>
        <span className="item-titulo">{titulo}</span>
        {detalhe && <span className="item-detalhe">{detalhe}</span>}
      </button>
      {direita}
      {onClick && !direita && (
        <span className="item-seta" aria-hidden="true">
          <Icone nome="direita" tamanho={12} />
        </span>
      )}
    </div>
  )
}

export function Vazio({ children }: { children: ReactNode }) {
  return <p className="texto-secundario vazio">{children}</p>
}

/** Campo de uma linha + botão "Adicionar" (para criar algo rapidamente). */
export function CampoAdicionar({ rotulo, onAdicionar }: { rotulo: string; onAdicionar: (texto: string) => void }) {
  const [texto, setTexto] = useState('')
  const enviar = () => {
    if (!texto.trim()) return
    onAdicionar(texto.trim())
    setTexto('')
  }
  return (
    <form
      className="campo-adicionar"
      onSubmit={(e) => {
        e.preventDefault()
        enviar()
      }}
    >
      <input
        className="campo-entrada"
        placeholder={rotulo}
        aria-label={rotulo}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      <button className="botao-secundario" type="submit" disabled={!texto.trim()}>
        Adicionar
      </button>
    </form>
  )
}

export function Rotulo({ texto, children }: { texto: string; children: ReactNode }) {
  return (
    <label className="campo">
      <span className="campo-rotulo">{texto}</span>
      {children}
    </label>
  )
}

/** Pede um novo nome numa caixa do app (para renomear). Devolve null se não mudou. */
export function usePedirNome() {
  const { pedirTexto } = useDialogos()
  return async (atual: string, titulo: string) => {
    const novo = await pedirTexto({ titulo, valor: atual, confirmar: 'Salvar' })
    return novo && novo !== atual ? novo : null
  }
}

/** Ações de manutenção no fim da tela (renomear, apagar…). */
export function Acoes({ children }: { children: ReactNode }) {
  return <div className="acoes">{children}</div>
}

/** "qua, 19/11" no fuso de São Paulo. */
export function dataCurta(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  })
    .format(new Date(iso))
    .replace('.', '')
}

/** Medidor de 10 quadradinhos (0 a 100), como o de qualidade do sono. */
export function Medidor({ valor, rotulo }: { valor: number; rotulo: string }) {
  const cheios = Math.round(valor / 10)
  return (
    <span className="medidor" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={valor} aria-label={rotulo}>
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} className={i < cheios ? 'medidor-cheio' : 'medidor-vazio'} />
      ))}
    </span>
  )
}
