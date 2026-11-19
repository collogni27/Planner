import { useNavegacao } from '../../app/navegacao'
import { useRascunho } from '../../estado/preferencias'
import { Acoes, Cabecalho, Item, Secao, Vazio, dataCurta, pedirNome } from '../../ui/componentes'
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
          <Vazio>Ainda sem check-in. Os cards desta micrometa entram na revisão a partir do primeiro check-in.</Vazio>
        ) : (
          meus.map((c) => (
            <Item
              key={c.id}
              titulo={dataCurta(c.estudado_em)}
              detalhe={c.nota ?? undefined}
              direita={
                <button
                  className="botao-texto"
                  onClick={() => {
                    if (confirm('Apagar este check-in?')) void apagarCheckin(c)
                  }}
                >
                  Apagar
                </button>
              }
            />
          ))
        )}
      </Secao>

      <Secao titulo="Cards">
        {cards?.length === 0 && <Vazio>Nenhum card ligado a esta micrometa.</Vazio>}
        {cards?.map((c) => (
          <Item key={c.id} titulo={c.frente} detalhe={nomeBaralho(c.baralho_id)} onClick={() => abrir({ tela: 'card', id: c.id })} />
        ))}
        <div className="botoes-linha">
          <button className="botao-secundario" onClick={() => abrir({ tela: 'card', id: null, micrometaId: id })}>
            Novo card
          </button>
          <button className="botao-secundario" onClick={() => abrir({ tela: 'ajuda-ia', micrometaId: id })}>
            Gerar com IA
          </button>
        </div>
      </Secao>

      <Secao titulo="Área">
        <select
          className="campo-entrada"
          aria-label="Área da micrometa"
          value={micrometa.area_id ?? ''}
          onChange={(e) => void moverMicrometaDeArea(micrometa, e.target.value || null)}
        >
          <option value="">Sem área</option>
          {areas?.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome}
            </option>
          ))}
        </select>
      </Secao>

      <Acoes>
        <button
          className="botao-secundario"
          onClick={() => {
            const nome = pedirNome(micrometa.nome, 'Novo nome da micrometa')
            if (nome) void renomear('micrometas', micrometa, nome)
          }}
        >
          Renomear
        </button>
        <button
          className="botao-secundario"
          onClick={() => {
            if (confirm(`Apagar "${micrometa.nome}" e seus check-ins? Os cards continuam nos baralhos, sem micrometa.`)) {
              void apagarMicrometa(micrometa).then(voltar)
            }
          }}
        >
          Apagar
        </button>
      </Acoes>
    </>
  )
}
