import { useNavegacao } from '../../app/navegacao'
import { useRascunho } from '../../estado/preferencias'
import { Icone } from '../../icones/Icone'
import { Acoes, Cabecalho, Item, Secao, Vazio, dataCurta, usePedirNome } from '../../ui/componentes'
import { Seletor, useDialogos } from '../../ui/dialogos'
import {
  adicionarConteudoAoObjetivo,
  apagarObjetivo,
  criarBaralho,
  criarConteudo,
  desvincularBaralho,
  moverBaralhoNoObjetivo,
  moverNaFila,
  renomear,
  useBaralhos,
  useObjetivo,
  useObjetivos,
  useTudoDeEstudos,
  vincularBaralho,
} from '../dados'
import { NOME_SITUACAO, resumirConteudo } from '../estatisticas'
import { conteudosForaDoObjetivo, gruposDoObjetivo, objetivosDoConteudo, proximoAEstudar } from '../modelo'

const NOVO_BARALHO = '__novo__'

/**
 * Um objetivo: os baralhos dele (no lugar das antigas áreas) e, em cada um, os
 * conteúdos deste objetivo que estão naquele baralho, na ordem da fila de estudo.
 */
export function ObjetivoTela({ id, chave }: { id: string; chave: string }) {
  const { abrir, voltar } = useNavegacao()
  const { confirmar, pedirTexto } = useDialogos()
  const pedirNome = usePedirNome()
  const objetivo = useObjetivo(id)
  const objetivos = useObjetivos()
  const baralhos = useBaralhos()
  const tudo = useTudoDeEstudos()
  const [nomeNovo, setNomeNovo] = useRascunho(chave, 'conteudo', '')
  const [baralhoNovo, setBaralhoNovo] = useRascunho(chave, 'baralho', '')

  if (objetivo === undefined || !baralhos || !tudo || !objetivos) return null
  if (objetivo === null) return <Cabecalho titulo="Objetivo apagado" />

  const grupos = gruposDoObjetivo(id, tudo.micrometas, baralhos, tudo.vinculos)
  const proximo = proximoAEstudar(grupos, tudo.checkins)
  const vinculados = grupos.filter((g) => g.baralho).map((g) => g.baralho!)
  const naoVinculados = baralhos.filter((b) => !vinculados.includes(b))
  const fora = conteudosForaDoObjetivo(id, tudo.micrometas, tudo.vinculos)

  // Situação e força do conteúdo; avisa quando ele também está em outro objetivo.
  function detalheConteudo(conteudoId: string) {
    const m = tudo!.micrometas.find((x) => x.id === conteudoId)!
    const r = resumirConteudo(m, tudo!.cards, tudo!.checkins, tudo!.revisoes, new Date())
    const partes = [NOME_SITUACAO[r.situacao]]
    if (r.situacao === 'estudado' && r.ultimoEstudo) partes.push(dataCurta(r.ultimoEstudo))
    if (r.forca !== null) partes.push(`força ${r.forca}%`)
    if (objetivosDoConteudo(conteudoId, tudo!.vinculos).length > 1) partes.push('compartilhado')
    return partes.join(' · ')
  }

  async function vincular(valor: string) {
    if (valor === NOVO_BARALHO) {
      const nome = await pedirTexto({ titulo: 'Novo baralho', confirmar: 'Criar' })
      if (!nome) return
      const b = await criarBaralho(nome)
      await vincularBaralho(id, b.id)
    } else if (valor) await vincularBaralho(id, valor)
  }

  async function adicionarConteudo() {
    if (!nomeNovo.trim()) return
    await criarConteudo(id, baralhoNovo || null, nomeNovo)
    setNomeNovo('')
  }

  // Conteúdos de outros objetivos, agrupados pelo primeiro objetivo de cada um.
  const opcoesFora = fora.map((m) => {
    const primeiro = objetivosDoConteudo(m.id, tudo.vinculos)[0]
    return { valor: m.id, rotulo: m.nome, grupo: objetivos.find((o) => o.id === primeiro)?.nome ?? 'Sem objetivo' }
  })

  return (
    <>
      <Cabecalho titulo={objetivo.nome} />

      {proximo && (
        <Secao titulo="Próximo a estudar">
          <Item titulo={proximo.nome} onClick={() => abrir({ tela: 'micrometa', id: proximo.id })} />
        </Secao>
      )}

      <Secao titulo="Adicionar baralho">
        <Seletor
          rotulo="Baralho"
          valor=""
          onChange={(v) => void vincular(v)}
          opcoes={[...naoVinculados.map((b) => ({ valor: b.id, rotulo: b.nome })), { valor: NOVO_BARALHO, rotulo: 'Novo baralho…' }]}
        />
      </Secao>

      <Secao titulo="Novo conteúdo">
        <form
          className="formulario"
          onSubmit={(e) => {
            e.preventDefault()
            void adicionarConteudo()
          }}
        >
          <input
            className="campo-entrada"
            placeholder="Nome"
            aria-label="Nome do conteúdo"
            value={nomeNovo}
            onChange={(e) => setNomeNovo(e.target.value)}
          />
          <Seletor
            rotulo="Baralho do conteúdo"
            valor={baralhoNovo}
            onChange={setBaralhoNovo}
            opcoes={[{ valor: '', rotulo: 'Sem baralho' }, ...vinculados.map((b) => ({ valor: b.id, rotulo: b.nome }))]}
          />
          <button className="botao-principal" type="submit" disabled={!nomeNovo.trim()}>
            Adicionar conteúdo
          </button>
        </form>
      </Secao>

      {opcoesFora.length > 0 && (
        <Secao titulo="Conteúdo de outro objetivo">
          <Seletor
            rotulo="Conteúdo"
            valor=""
            onChange={(v) => {
              if (v) void adicionarConteudoAoObjetivo(id, v)
            }}
            opcoes={opcoesFora}
          />
        </Secao>
      )}

      {grupos.map((g, gi) => (
        <Secao
          key={g.baralho?.id ?? 'sem-baralho'}
          titulo={g.baralho?.nome ?? 'Sem baralho'}
          acao={
            g.baralho && (
              <span className="acoes-pequenas">
                {g.itens.length === 0 && (
                  <button className="botao-texto" onClick={() => void desvincularBaralho(id, g.baralho!.id)}>
                    Remover
                  </button>
                )}
                <button
                  className="botao-icone"
                  aria-label={`Subir ${g.baralho.nome}`}
                  disabled={gi === 0 || !grupos[gi - 1].baralho}
                  onClick={() => void moverBaralhoNoObjetivo(id, g.baralho!.id, -1)}
                >
                  <Icone nome="cima" tamanho={14} />
                </button>
                <button
                  className="botao-icone"
                  aria-label={`Descer ${g.baralho.nome}`}
                  disabled={gi === grupos.length - 1}
                  onClick={() => void moverBaralhoNoObjetivo(id, g.baralho!.id, 1)}
                >
                  <Icone nome="baixo" tamanho={14} />
                </button>
              </span>
            )
          }
        >
          {g.itens.length === 0 && <Vazio>Nenhum conteúdo deste objetivo neste baralho.</Vazio>}
          {g.itens.map((item, i) => (
            <Item
              key={item.conteudo.id}
              titulo={item.conteudo.nome}
              detalhe={detalheConteudo(item.conteudo.id)}
              onClick={() => abrir({ tela: 'micrometa', id: item.conteudo.id })}
              direita={
                <span className="mover">
                  <button
                    className="botao-icone"
                    aria-label={`Subir ${item.conteudo.nome}`}
                    disabled={i === 0}
                    onClick={() => void moverNaFila(id, g.itens, item.conteudo.id, -1)}
                  >
                    <Icone nome="cima" tamanho={14} />
                  </button>
                  <button
                    className="botao-icone"
                    aria-label={`Descer ${item.conteudo.nome}`}
                    disabled={i === g.itens.length - 1}
                    onClick={() => void moverNaFila(id, g.itens, item.conteudo.id, 1)}
                  >
                    <Icone nome="baixo" tamanho={14} />
                  </button>
                </span>
              }
            />
          ))}
        </Secao>
      ))}

      <Acoes>
        <button
          className="botao-secundario"
          onClick={() =>
            void pedirNome(objetivo.nome, 'Renomear objetivo').then((nome) => {
              if (nome) void renomear('objetivos', objetivo, nome)
            })
          }
        >
          Renomear objetivo
        </button>
        <button
          className="botao-secundario"
          onClick={() =>
            void confirmar({
              titulo: `Apagar o objetivo "${objetivo.nome}"?`,
              mensagem:
                'Conteúdos que só existem neste objetivo são apagados, com os check-ins. Os compartilhados continuam nos outros objetivos. Os cards continuam nos baralhos.',
              confirmar: 'Apagar',
              perigo: true,
            }).then((ok) => {
              if (ok) void apagarObjetivo(objetivo).then(voltar)
            })
          }
        >
          Apagar objetivo
        </button>
      </Acoes>
    </>
  )
}
