import { useNavegacao } from '../../app/navegacao'
import { useRascunho } from '../../estado/preferencias'
import { Cabecalho, Rotulo, Secao, Vazio } from '../../ui/componentes'
import { lerTags } from '../importacao'
import { apagarCard, salvarCard, useBaralhos, useCard, useObjetivos, useTodasMicrometas } from '../dados'

interface Formulario {
  baralhoId: string
  micrometaId: string
  frente: string
  verso: string
  tags: string
}

interface Props {
  chave: string
  id: string | null
  baralhoId?: string
  micrometaId?: string
}

/** Criar ou editar um card. O que é digitado fica salvo como rascunho. */
export function CardTela({ chave, id, baralhoId, micrometaId }: Props) {
  const { voltar } = useNavegacao()
  const card = useCard(id)
  const baralhos = useBaralhos()
  const objetivos = useObjetivos()
  const micrometas = useTodasMicrometas()
  const [rascunho, setRascunho] = useRascunho<Formulario | null>(chave, 'card', null)

  if (card === undefined || !baralhos || !objetivos || !micrometas) return null
  if (id && card === null) return <Cabecalho titulo="Card apagado" />

  const inicial: Formulario = card
    ? { baralhoId: card.baralho_id, micrometaId: card.micrometa_id ?? '', frente: card.frente, verso: card.verso, tags: card.tags.join(' ') }
    : { baralhoId: baralhoId ?? baralhos[0]?.id ?? '', micrometaId: micrometaId ?? '', frente: '', verso: '', tags: '' }
  const f = rascunho ?? inicial
  const mudar = (campo: keyof Formulario, valor: string) => setRascunho({ ...f, [campo]: valor })
  const pronto = f.baralhoId && f.frente.trim() && f.verso.trim()

  async function salvar() {
    await salvarCard(id, {
      baralho_id: f.baralhoId,
      micrometa_id: f.micrometaId || null,
      frente: f.frente,
      verso: f.verso,
      tags: lerTags(f.tags),
    })
    voltar()
  }

  if (baralhos.length === 0) {
    return (
      <>
        <Cabecalho titulo="Novo card" />
        <Secao>
          <Vazio>Crie um baralho primeiro, na tela de Estudos.</Vazio>
        </Secao>
      </>
    )
  }

  return (
    <>
      <Cabecalho titulo={id ? 'Editar card' : 'Novo card'} />
      <Secao>
        <form
          className="formulario"
          onSubmit={(e) => {
            e.preventDefault()
            if (pronto) void salvar()
          }}
        >
          <Rotulo texto="Frente">
            <textarea className="campo-entrada area-texto" rows={3} value={f.frente} onChange={(e) => mudar('frente', e.target.value)} />
          </Rotulo>
          <Rotulo texto="Verso">
            <textarea className="campo-entrada area-texto" rows={4} value={f.verso} onChange={(e) => mudar('verso', e.target.value)} />
          </Rotulo>
          <Rotulo texto="Baralho">
            <select className="campo-entrada" value={f.baralhoId} onChange={(e) => mudar('baralhoId', e.target.value)}>
              {baralhos.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                </option>
              ))}
            </select>
          </Rotulo>
          <Rotulo texto="Conteúdo (opcional)">
            <select className="campo-entrada" value={f.micrometaId} onChange={(e) => mudar('micrometaId', e.target.value)}>
              <option value="">Nenhuma</option>
              {objetivos.map((o) => (
                <optgroup key={o.id} label={o.nome}>
                  {micrometas
                    .filter((m) => m.objetivo_id === o.id)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </Rotulo>
          <Rotulo texto="Tags (separadas por espaço)">
            <input className="campo-entrada" value={f.tags} onChange={(e) => mudar('tags', e.target.value)} />
          </Rotulo>
          <button className="botao-principal" type="submit" disabled={!pronto}>
            Salvar
          </button>
        </form>
      </Secao>
      {card && (
        <div className="acoes">
          <button
            className="botao-secundario"
            onClick={() => {
              if (confirm('Apagar este card?')) void apagarCard(card).then(voltar)
            }}
          >
            Apagar card
          </button>
        </div>
      )}
    </>
  )
}
