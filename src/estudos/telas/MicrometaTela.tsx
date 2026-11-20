import { useNavegacao } from '../../app/navegacao'
import { useRascunho } from '../../estado/preferencias'
import { Acoes, Cabecalho, Item, Medidor, Secao, Vazio, dataCurta, usePedirNome } from '../../ui/componentes'
import { NOME_SITUACAO, resumirConteudo } from '../estatisticas'
import { Seletor, useDialogos } from '../../ui/dialogos'
import {
  apagarCheckin,
  apagarMicrometa,
  adicionarConteudoAoObjetivo,
  mudarBaralhoDoConteudo,
  registrarCheckin,
  removerConteudoDoObjetivo,
  renomear,
  useBaralhos,
  useCardsDaMicrometa,
  useCheckins,
  useMicrometa,
  useObjetivos,
  useTudoDeEstudos,
} from '../dados'
import { objetivosDoConteudo } from '../modelo'

/** Um conteúdo: check-in de estudo, histórico, cards, baralho e objetivos em que aparece. */
export function MicrometaTela({ id, chave }: { id: string; chave: string }) {
  const { abrir, voltar } = useNavegacao()
  const { confirmar } = useDialogos()
  const pedirNome = usePedirNome()
  const micrometa = useMicrometa(id)
  const objetivos = useObjetivos()
  const checkins = useCheckins()
  const cards = useCardsDaMicrometa(id)
  const tudo = useTudoDeEstudos()
  const baralhos = useBaralhos()
  const [nota, setNota] = useRascunho(chave, 'nota', '')

  if (micrometa === undefined) return null
  if (micrometa === null) return <Cabecalho titulo="Conteúdo apagado" />

  const meus = checkins?.filter((c) => c.micrometa_id === id) ?? []
  const nomeBaralho = (bid: string) => baralhos?.find((b) => b.id === bid)?.nome ?? ''
  const resumo = tudo ? resumirConteudo(micrometa, tudo.cards, tudo.checkins, tudo.revisoes, new Date()) : null
  const meusObjetivos = tudo ? objetivosDoConteudo(id, tudo.vinculos) : []
  const nomeObjetivo = (oid: string) => objetivos?.find((o) => o.id === oid)?.nome ?? ''
  const outrosObjetivos = (objetivos ?? []).filter((o) => !meusObjetivos.includes(o.id))

  async function trocarBaralho(baralhoId: string) {
    const fora = (cards ?? []).filter((c) => baralhoId && c.baralho_id !== baralhoId).length
    if (fora > 0) {
      const ok = await confirmar({
        titulo: 'Mudar o baralho?',
        mensagem: fora === 1 ? 'O card deste conteúdo vai junto para o novo baralho.' : `Os ${fora} cards deste conteúdo vão junto para o novo baralho.`,
        confirmar: 'Mudar',
      })
      if (!ok) return
    }
    await mudarBaralhoDoConteudo(micrometa!, baralhoId || null)
  }

  return (
    <>
      <Cabecalho titulo={micrometa.nome} />
      <p className="texto-secundario contexto">{meusObjetivos.map(nomeObjetivo).join(' · ')}</p>

      {resumo && (
        <Secao titulo="Acompanhamento">
          <div className="linha-info">
            <span className="texto-secundario">Situação</span>
            <span>{NOME_SITUACAO[resumo.situacao]}</span>
          </div>
          {resumo.forca !== null && (
            <>
              <div className="linha-info">
                <span className="texto-secundario">Força</span>
                <span className="numero-destaque">{resumo.forca}%</span>
              </div>
              <Medidor valor={resumo.forca} rotulo="Força" />
            </>
          )}
          {resumo.acerto !== null && (
            <div className="linha-info">
              <span className="texto-secundario">Acerto (30 dias)</span>
              <span className="numero-destaque">{resumo.acerto}%</span>
            </div>
          )}
        </Secao>
      )}

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

      <Secao titulo="Baralho">
        <Seletor
          rotulo="Baralho do conteúdo"
          valor={micrometa.baralho_id ?? ''}
          onChange={(v) => void trocarBaralho(v)}
          opcoes={[{ valor: '', rotulo: 'Sem baralho' }, ...(baralhos ?? []).map((b) => ({ valor: b.id, rotulo: b.nome }))]}
        />
      </Secao>

      <Secao titulo="Objetivos">
        {meusObjetivos.map((oid) => (
          <Item
            key={oid}
            titulo={nomeObjetivo(oid)}
            onClick={() => abrir({ tela: 'objetivo', id: oid })}
            direita={
              meusObjetivos.length > 1 && (
                <button className="botao-texto" onClick={() => void removerConteudoDoObjetivo(oid, id)}>
                  Remover
                </button>
              )
            }
          />
        ))}
        {outrosObjetivos.length > 0 && (
          <Seletor
            rotulo="Adicionar a outro objetivo"
            valor=""
            onChange={(v) => {
              if (v) void adicionarConteudoAoObjetivo(v, id)
            }}
            opcoes={outrosObjetivos.map((o) => ({ valor: o.id, rotulo: o.nome }))}
          />
        )}
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
              mensagem: 'Ele sai de todos os objetivos, com os check-ins. Os cards continuam no baralho, sem conteúdo.',
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
