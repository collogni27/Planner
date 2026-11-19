import { useNavegacao } from '../../app/navegacao'
import { useRascunho } from '../../estado/preferencias'
import { Acoes, Cabecalho, Item, Secao, Vazio, dataCurta, usePedirNome } from '../../ui/componentes'
import { Seletor, useDialogos } from '../../ui/dialogos'
import {
  apagarCheckin,
  apagarMicrometa,
  moverMicrometaDeArea,
  registrarCheckin,
  renomear,
  useAreas,
  useBaralhos,
  useCardsDaMicrometa,
  useCheckins,
  useMicrometa,
  useObjetivo,
} from '../dados'

/** Uma micrometa: check-in de estudo, histórico e cards ligados. */
export function MicrometaTela({ id, chave }: { id: string; chave: string }) {
  const { abrir, voltar } = useNavegacao()
  const { confirmar } = useDialogos()
  const pedirNome = usePedirNome()
  const micrometa = useMicrometa(id)
  const objetivo = useObjetivo(micrometa?.objetivo_id ?? '')
  const areas = useAreas(micrometa?.objetivo_id ?? '')
  const checkins = useCheckins()
  const cards = useCardsDaMicrometa(id)
  const baralhos = useBaralhos()
  const [nota, setNota] = useRascunho(chave, 'nota', '')

  if (micrometa === undefined) return null
  if (micrometa === null) return <Cabecalho titulo="Micrometa apagada" />

  const meus = checkins?.filter((c) => c.micrometa_id === id) ?? []
  const nomeBaralho = (bid: string) => baralhos?.find((b) => b.id === bid)?.nome ?? ''

  return (
    <>
      <Cabecalho titulo={micrometa.nome} />
      <p className="texto-secundario contexto">{objetivo?.nome}</p>

      <Secao titulo="Estudo">
        <form
          className="formulario"
          onSubmit={(e) => {
            e.preventDefault()
            void registrarCheckin(id, nota).then(() => setNota(''))
          }}
        >
          <input
            className="campo-entrada"
            placeholder="Anotação (opcional)"
            aria-label="Anotação do estudo"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />
          <button className="botao-principal" type="submit">
            Estudei hoje
          </button>
        </form>
        {meus.length === 0 ? (
          <Vazio>Os cards deste conteúdo entram na revisão a partir do primeiro check-in.</Vazio>
        ) : (
          meus.map((c) => (
            <Item
              key={c.id}
              titulo={dataCurta(c.estudado_em)}
              detalhe={c.nota ?? undefined}
              direita={
                <button
                  className="botao-texto"
                  onClick={() =>
                    void confirmar({ titulo: 'Apagar este check-in?', confirmar: 'Apagar', perigo: true }).then((ok) => {
                      if (ok) void apagarCheckin(c)
                    })
                  }
                >
                  Apagar
                </button>
              }
            />
          ))
        )}
      </Secao>

      <Secao titulo="Cards">
        {cards?.length === 0 && <Vazio>Nenhum card ligado a este conteúdo.</Vazio>}
        {cards?.map((c) => (
          <Item
            key={c.id}
            titulo={c.frente}
            detalhe={nomeBaralho(c.baralho_id)}
            onClick={() => abrir({ tela: 'card', id: c.id })}
          />
        ))}
        <div className="botoes-linha">
          <button className="botao-secundario" onClick={() => abrir({ tela: 'card', id: null, micrometaId: id })}>
            Novo card
          </button>
          <button className="botao-secundario" onClick={() => abrir({ tela: 'ajuda-ia', micrometaId: id })}>
            Novo card de IA
          </button>
        </div>
      </Secao>

      <Secao titulo="Área">
        <Seletor
          rotulo="Área do conteúdo"
          valor={micrometa.area_id ?? ''}
          onChange={(v) => void moverMicrometaDeArea(micrometa, v || null)}
          opcoes={[{ valor: '', rotulo: 'Sem área' }, ...(areas ?? []).map((a) => ({ valor: a.id, rotulo: a.nome }))]}
        />
      </Secao>

      <Acoes>
        <button
          className="botao-secundario"
          onClick={() =>
            void pedirNome(micrometa.nome, 'Renomear conteúdo').then((nome) => {
              if (nome) void renomear('micrometas', micrometa, nome)
            })
          }
        >
          Renomear
        </button>
        <button
          className="botao-secundario"
          onClick={() =>
            void confirmar({
              titulo: `Apagar "${micrometa.nome}"?`,
              mensagem: 'Os check-ins dele também são apagados. Os cards continuam nos baralhos, sem conteúdo.',
              confirmar: 'Apagar',
              perigo: true,
            }).then((ok) => {
              if (ok) void apagarMicrometa(micrometa).then(voltar)
            })
          }
        >
          Apagar
        </button>
      </Acoes>
    </>
  )
}
