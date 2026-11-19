// Caixas de diálogo próprias do app (no lugar de confirm/prompt do navegador e das
// listas de escolha do sistema). Aparecem por cima da tela, no visual do Planner.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icone } from '../icones/Icone'

// ---------- "Voltar" do Android fecha a caixa aberta antes de mudar de tela ----------

const fechaveis: (() => void)[] = []

/** Fecha a caixa de cima, se houver. Devolve true se fechou algo. */
export function fecharUltimaCaixa(): boolean {
  const fechar = fechaveis[fechaveis.length - 1]
  if (!fechar) return false
  fechar()
  return true
}

function useFechavel(aberto: boolean, fechar: () => void) {
  const ref = useRef(fechar)
  ref.current = fechar
  useEffect(() => {
    if (!aberto) return
    const f = () => ref.current()
    fechaveis.push(f)
    return () => {
      const i = fechaveis.indexOf(f)
      if (i >= 0) fechaveis.splice(i, 1)
    }
  }, [aberto])
}

/** Fundo escurecido + caixa. Tocar fora fecha. */
export function Sobreposicao({
  aberto,
  onFechar,
  children,
  rotulo,
}: {
  aberto: boolean
  onFechar: () => void
  children: ReactNode
  rotulo: string
}) {
  useFechavel(aberto, onFechar)
  if (!aberto) return null
  return createPortal(
    <div className="sobreposicao" onClick={onFechar}>
      <div className="dialogo" role="dialog" aria-modal="true" aria-label={rotulo} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body,
  )
}

// ---------- Confirmar e pedir texto (com promessa, para usar como confirm/prompt) ----------

interface OpcoesConfirmar {
  titulo: string
  mensagem?: string
  confirmar: string
  /** Ação perigosa (apagar etc.): botão em amarelo, a cor de atenção. */
  perigo?: boolean
}

interface OpcoesTexto {
  titulo: string
  valor?: string
  confirmar?: string
  senha?: boolean
}

type Pedido =
  | ({ tipo: 'confirmar'; resolver: (ok: boolean) => void } & OpcoesConfirmar)
  | ({ tipo: 'texto'; resolver: (texto: string | null) => void } & OpcoesTexto)

interface Dialogos {
  confirmar: (o: OpcoesConfirmar) => Promise<boolean>
  pedirTexto: (o: OpcoesTexto) => Promise<string | null>
}

const Contexto = createContext<Dialogos | null>(null)

export function ProvedorDialogos({ children }: { children: ReactNode }) {
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [texto, setTexto] = useState('')

  const confirmar = useCallback(
    (o: OpcoesConfirmar) => new Promise<boolean>((resolver) => setPedido({ tipo: 'confirmar', resolver, ...o })),
    [],
  )
  const pedirTexto = useCallback(
    (o: OpcoesTexto) =>
      new Promise<string | null>((resolver) => {
        setTexto(o.valor ?? '')
        setPedido({ tipo: 'texto', resolver, ...o })
      }),
    [],
  )

  const cancelar = () => {
    if (pedido?.tipo === 'confirmar') pedido.resolver(false)
    if (pedido?.tipo === 'texto') pedido.resolver(null)
    setPedido(null)
  }
  const aceitar = () => {
    if (pedido?.tipo === 'confirmar') pedido.resolver(true)
    if (pedido?.tipo === 'texto') pedido.resolver(texto.trim() || null)
    setPedido(null)
  }

  return (
    <Contexto.Provider value={{ confirmar, pedirTexto }}>
      {children}
      <Sobreposicao aberto={!!pedido} onFechar={cancelar} rotulo={pedido?.titulo ?? ''}>
        {pedido && (
          <form
            className="dialogo-corpo"
            onSubmit={(e) => {
              e.preventDefault()
              if (pedido.tipo === 'texto' && !texto.trim()) return
              aceitar()
            }}
          >
            <h2 className="card-titulo">{pedido.titulo}</h2>
            {pedido.tipo === 'confirmar' && pedido.mensagem && <p className="texto-secundario">{pedido.mensagem}</p>}
            {pedido.tipo === 'texto' && (
              <input
                className="campo-entrada"
                type={pedido.senha ? 'password' : 'text'}
                autoFocus
                aria-label={pedido.titulo}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
              />
            )}
            <div className="botoes-linha">
              <button type="button" className="botao-secundario" onClick={cancelar}>
                Cancelar
              </button>
              <button
                type="submit"
                className={pedido.tipo === 'confirmar' && pedido.perigo ? 'botao-perigo' : 'botao-principal'}
                disabled={pedido.tipo === 'texto' && !texto.trim()}
              >
                {pedido.confirmar ?? 'Salvar'}
              </button>
            </div>
          </form>
        )}
      </Sobreposicao>
    </Contexto.Provider>
  )
}

export function useDialogos() {
  const d = useContext(Contexto)
  if (!d) throw new Error('useDialogos fora do ProvedorDialogos')
  return d
}

// ---------- Lista de escolha (no lugar do <select> do sistema) ----------

export interface Opcao {
  valor: string
  rotulo: string
  /** Opções com o mesmo grupo aparecem juntas, sob esse título. */
  grupo?: string
}

export function Seletor({
  valor,
  opcoes,
  onChange,
  rotulo,
}: {
  valor: string
  opcoes: Opcao[]
  onChange: (valor: string) => void
  rotulo: string
}) {
  const [aberto, setAberto] = useState(false)
  const atual = opcoes.find((o) => o.valor === valor)
  const grupos: { titulo?: string; itens: Opcao[] }[] = []
  for (const o of opcoes) {
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.titulo === o.grupo) ultimo.itens.push(o)
    else grupos.push({ titulo: o.grupo, itens: [o] })
  }

  return (
    <>
      <button
        type="button"
        className="campo-entrada seletor"
        aria-label={rotulo}
        aria-haspopup="dialog"
        onClick={() => setAberto(true)}
      >
        <span className="seletor-texto">{atual?.rotulo ?? 'Escolha…'}</span>
        <Icone nome="baixo" tamanho={12} />
      </button>
      <Sobreposicao aberto={aberto} onFechar={() => setAberto(false)} rotulo={rotulo}>
        <div className="dialogo-corpo">
          <h2 className="card-titulo">{rotulo}</h2>
          <div className="seletor-lista" role="listbox" aria-label={rotulo}>
            {grupos.map((g, i) => (
              <div key={i} className="seletor-grupo">
                {g.titulo && <span className="campo-rotulo">{g.titulo}</span>}
                {g.itens.map((o) => (
                  <button
                    key={o.valor}
                    type="button"
                    role="option"
                    aria-selected={o.valor === valor}
                    className="seletor-opcao"
                    onClick={() => {
                      onChange(o.valor)
                      setAberto(false)
                    }}
                  >
                    <span>{o.rotulo}</span>
                    {o.valor === valor && <Icone nome="check" tamanho={12} />}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Sobreposicao>
    </>
  )
}
