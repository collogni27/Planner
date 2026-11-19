// Peças de interface reaproveitadas pelas telas (estilos em estilo/base.css).
import { useState, type ReactNode } from 'react'
import { useNavegacao } from '../app/navegacao'
import { Icone } from '../icones/Icone'

/** Cabeçalho de tela com "Voltar". */
export function Cabecalho({ titulo }: { titulo: string }) {
  const { voltar } = useNavegacao()
  return (
    <div className="cabecalho-tela">
      <button className="botao-voltar" onClick={voltar}>
        <Icone nome="esquerda" tamanho={12} />
        Voltar
      </button>
      <h1 className="titulo-tela">{titulo}</h1>
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

/** Pede um novo nome (para renomear). */
export function pedirNome(atual: string, rotulo = 'Novo nome'): string | null {
  const novo = window.prompt(rotulo, atual)
  return novo && novo.trim() && novo.trim() !== atual ? novo.trim() : null
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
