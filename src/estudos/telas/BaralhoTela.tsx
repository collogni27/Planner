import { useNavegacao } from '../../app/navegacao'
import { useRascunho } from '../../estado/preferencias'
import { Acoes, Cabecalho, Item, Secao, Vazio, usePedirNome } from '../../ui/componentes'
import { useDialogos } from '../../ui/dialogos'
import { normalizar } from '../importacao'
import type { Card } from '../../dados/banco'
import { apagarBaralho, renomear, useBaralho, useCardsDoBaralho, useTudoDeEstudos } from '../dados'
import { acerto, maturidade, situacaoDoCard } from '../estatisticas'

const LIMITE_LISTA = 100

type Agrupar = 'todos' | 'conteudos' | 'tags'
const NOMES_AGRUPAR: Record<Agrupar, string> = { todos: 'Todos', conteudos: 'Conteúdos', tags: 'Tags' }

/** Um baralho: resumo, busca e cards (todos, por conteúdo ou por tag). */
export function BaralhoTela({ id, chave }: { id: string; chave: string }) {
  const { abrir, voltar } = useNavegacao()
  const { confirmar } = useDialogos()
  const pedirNome = usePedirNome()
  const baralho = useBaralho(id)
  const cards = useCardsDoBaralho(id)
  const tudo = useTudoDeEstudos()
  const [busca, setBusca] = useRascunho(chave, 'busca', '')
  const [agrupar, setAgrupar] = useRascunho<Agrupar>(chave, 'agrupar', 'todos')

  if (baralho === undefined || !cards || !tudo) return null
  if (baralho === null) return <Cabecalho titulo="Baralho apagado" />

  const agora = new Date()
  const termo = normalizar(busca)
  const encontrados = (termo ? cards.filter((c) => normalizar(`${c.frente} ${c.verso} ${c.tags.join(' ')}`).includes(termo)) : cards).slice(
    0,
    LIMITE_LISTA,
  )
  const nomeConteudo = (mid: string | null) => tudo.micrometas.find((m) => m.id === mid)?.nome
  const m = maturidade(cards)
  const ids = new Set(cards.map((c) => c.id))
  const a = acerto(
    tudo.revisoes.filter((r) => ids.has(r.card_id)),
    agora,
  )

  // Grupos conforme a escolha: um só ("Todos"), por conteúdo ou por tag.
  let grupos: { titulo: string | null; cards: Card[] }[] = [{ titulo: null, cards: encontrados }]
  if (agrupar === 'conteudos') {
    const nomes = [...new Set(encontrados.map((c) => nomeConteudo(c.micrometa_id) ?? ''))].sort((x, y) => x.localeCompare(y, 'pt-BR'))
    grupos = nomes.map((n) => ({ titulo: n || 'Sem conteúdo', cards: encontrados.filter((c) => (nomeConteudo(c.micrometa_id) ?? '') === n) }))
  } else if (agrupar === 'tags') {
    const tags = [...new Set(encontrados.flatMap((c) => c.tags))].sort((x, y) => x.localeCompare(y, 'pt-BR'))
    grupos = [
      ...tags.map((t) => ({ titulo: t, cards: encontrados.filter((c) => c.tags.includes(t)) })),
      { titulo: 'Sem tag', cards: encontrados.filter((c) => c.tags.length === 0) },
    ].filter((g) => g.cards.length > 0)
  }

  return (
    <>
      <Cabecalho titulo={baralho.nome} />

      <Secao>
        <div className="carga carga-4">
          {[
            ['novos', m.novos],
            ['jovens', m.jovens],
            ['maduros', m.maduros],
          ].map(([rotulo, n]) => (
            <div key={rotulo} className="carga-dia">
              <span className="carga-numero">{n}</span>
              <span className="carga-rotulo">{rotulo}</span>
            </div>
          ))}
          <div className="carga-dia">
            <span className="carga-numero">{a.valor === null ? '–' : `${a.valor}%`}</span>
            <span className="carga-rotulo">acerto</span>
          </div>
        </div>
      </Secao>

      <Secao titulo="Cards">
        <input
          className="campo-entrada"
          type="search"
          placeholder="Buscar na frente, verso ou tags"
          aria-label="Buscar cards"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <div className="opcoes" role="radiogroup" aria-label="Agrupar">
          {(['todos', 'conteudos', 'tags'] as const).map((g) => (
            <button key={g} role="radio" aria-checked={agrupar === g} className="botao-marcavel" onClick={() => setAgrupar(g)}>
              {NOMES_AGRUPAR[g]}
            </button>
          ))}
        </div>
        {cards.length === 0 && <Vazio>Nenhum card.</Vazio>}
        {cards.length > 0 && encontrados.length === 0 && <Vazio>Nenhum card encontrado.</Vazio>}
        {grupos.map((g) => (
          <div key={g.titulo ?? 'todos'} className="grupo-cards">
            {g.titulo && (
              <h3 className="subtitulo">
                <span>{g.titulo}</span>
                <span className="subtitulo-numero">{g.cards.length}</span>
              </h3>
            )}
            {g.cards.map((c) => (
              <Item
                key={c.id}
                titulo={c.frente}
                detalhe={[situacaoDoCard(c, agora), agrupar !== 'conteudos' && nomeConteudo(c.micrometa_id)].filter(Boolean).join(' · ')}
                onClick={() => abrir({ tela: 'card', id: c.id })}
              />
            ))}
          </div>
        ))}
        {cards.length > LIMITE_LISTA && !termo && <Vazio>Mostrando os primeiros {LIMITE_LISTA}. Use a busca para achar os outros.</Vazio>}
        <div className="botoes-linha">
          <button className="botao-secundario" onClick={() => abrir({ tela: 'card', id: null, baralhoId: id })}>
            Novo card
          </button>
          <button className="botao-secundario" onClick={() => abrir({ tela: 'exportar', baralhoId: id })}>
            Exportar
          </button>
        </div>
      </Secao>

      <Acoes>
        <button
          className="botao-secundario"
          onClick={() =>
            void pedirNome(baralho.nome, 'Renomear baralho').then((nome) => {
              if (nome) void renomear('baralhos', baralho, nome)
            })
          }
        >
          Renomear baralho
        </button>
        <button
          className="botao-secundario"
          onClick={() =>
            void confirmar({
              titulo: `Apagar o baralho "${baralho.nome}"?`,
              mensagem: `Os ${cards.length} cards dele também são apagados.`,
              confirmar: 'Apagar',
              perigo: true,
            }).then((ok) => {
              if (ok) void apagarBaralho(baralho).then(voltar)
            })
          }
        >
          Apagar baralho
        </button>
      </Acoes>
    </>
  )
}
