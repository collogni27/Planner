import { useNavegacao } from '../../app/navegacao'
import { useRascunho } from '../../estado/preferencias'
import { Acoes, Cabecalho, Item, Secao, Vazio, pedirNome } from '../../ui/componentes'
import { normalizar } from '../importacao'
import { apagarBaralho, renomear, useBaralho, useCardsDoBaralho, useTodasMicrometas } from '../dados'

const LIMITE_LISTA = 100

/** Um baralho: busca e lista de cards. */
export function BaralhoTela({ id, chave }: { id: string; chave: string }) {
  const { abrir, voltar } = useNavegacao()
  const baralho = useBaralho(id)
  const cards = useCardsDoBaralho(id)
  const micrometas = useTodasMicrometas()
  const [busca, setBusca] = useRascunho(chave, 'busca', '')

  if (baralho === undefined || !cards) return null
  if (baralho === null) return <Cabecalho titulo="Baralho apagado" />

  const termo = normalizar(busca)
  const encontrados = termo
    ? cards.filter((c) => normalizar(`${c.frente} ${c.verso} ${c.tags.join(' ')}`).includes(termo))
    : cards
  const nomeMicrometa = (mid: string | null) => micrometas?.find((m) => m.id === mid)?.nome

  return (
    <>
      <Cabecalho titulo={baralho.nome} />

      <Secao titulo="Cards">
        <input
          className="campo-entrada"
          type="search"
          placeholder="Buscar na frente, verso ou tags"
          aria-label="Buscar cards"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        {cards.length === 0 && <Vazio>Baralho vazio. Crie cards aqui ou importe vários de uma vez.</Vazio>}
        {cards.length > 0 && encontrados.length === 0 && <Vazio>Nenhum card encontrado.</Vazio>}
        {encontrados.slice(0, LIMITE_LISTA).map((c) => (
          <Item
            key={c.id}
            titulo={c.frente}
            detalhe={[nomeMicrometa(c.micrometa_id), c.tags.join(' ')].filter(Boolean).join(' · ') || undefined}
            onClick={() => abrir({ tela: 'card', id: c.id })}
          />
        ))}
        {encontrados.length > LIMITE_LISTA && (
          <Vazio>Mostrando os primeiros {LIMITE_LISTA}. Use a busca para achar os outros.</Vazio>
        )}
        <div className="botoes-linha">
          <button className="botao-secundario" onClick={() => abrir({ tela: 'card', id: null, baralhoId: id })}>
            Novo card
          </button>
          <button className="botao-secundario" onClick={() => abrir({ tela: 'exportar', baralhoId: id })}>
            Exportar
          </button>
        </div>
      </Secao>

      <p className="texto-secundario nota-rodape">A revisão dos cards chega na próxima versão.</p>

      <Acoes>
        <button
          className="botao-secundario"
          onClick={() => {
            const nome = pedirNome(baralho.nome, 'Novo nome do baralho')
            if (nome) void renomear('baralhos', baralho, nome)
          }}
        >
          Renomear baralho
        </button>
        <button
          className="botao-secundario"
          onClick={() => {
            if (confirm(`Apagar o baralho "${baralho.nome}" e todos os ${cards.length} cards dele?`)) void apagarBaralho(baralho).then(voltar)
          }}
        >
          Apagar baralho
        </button>
      </Acoes>
    </>
  )
}
