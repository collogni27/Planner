import { useNavegacao } from '../../app/navegacao'
import { useRascunho } from '../../estado/preferencias'
import { Cabecalho, Rotulo, Secao, Vazio } from '../../ui/componentes'
import { lerTags } from '../importacao'
import { Seletor, useDialogos } from '../../ui/dialogos'
import { opcoesBaralhos, opcoesConteudos } from '../opcoes'
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
  const { confirmar } = useDialogos()
  const card = useCard(id)
  const baralhos = useBaralhos()
  const objetivos = useObjetivos()
  const micrometas = useTodasMicrometas()
  const [rascunho, setRascunho] = useRascunho<Formulario | null>(chave, 'card', null)

  if (card === undefined || !baralhos || !objetivos || !micrometas) return null
  if (id && card === null) return <Cabecalho titulo="Card apagado" />

  const inicial: Formulario = card
    ? {
        baralhoId: card.baralho_id,
        micrometaId: card.micrometa_id ?? '',
        frente: card.frente,
        verso: card.verso,
        tags: card.tags.join(' '),
      }
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
            <textarea
              className="campo-entrada area-texto"
              rows={3}
              value={f.frente}
              onChange={(e) => mudar('frente', e.target.value)}
            />
          </Rotulo>
          <Rotulo texto="Verso">
            <textarea
              className="campo-entrada area-texto"
              rows={4}
              value={f.verso}
              onChange={(e) => mudar('verso', e.target.value)}
            />
          </Rotulo>
          <Rotulo texto="Baralho">
            <Seletor
              rotulo="Baralho"
              valor={f.baralhoId}
              onChange={(v) => mudar('baralhoId', v)}
              opcoes={opcoesBaralhos(baralhos)}
            />
          </Rotulo>
          <Rotulo texto="Conteúdo (opcional)">
            <Seletor
              rotulo="Conteúdo"
              valor={f.micrometaId}
              onChange={(v) => mudar('micrometaId', v)}
              opcoes={opcoesConteudos(objetivos, micrometas, 'Nenhum')}
            />
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
            onClick={() =>
              void confirmar({ titulo: 'Apagar este card?', confirmar: 'Apagar', perigo: true }).then((ok) => {
                if (ok) void apagarCard(card).then(voltar)
              })
            }
          >
            Apagar card
          </button>
        </div>
      )}
    </>
  )
}
