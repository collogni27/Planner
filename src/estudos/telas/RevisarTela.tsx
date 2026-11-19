import { useEffect, useMemo, useState } from 'react'
import { useNavegacao } from '../../app/navegacao'
import { useRascunho } from '../../estado/preferencias'
import { Icone } from '../../icones/Icone'
import { Cabecalho, Rotulo, Secao, Vazio } from '../../ui/componentes'
import { diaLocal, inicioDoDia } from '../../util/data'
import { useBaralhos, useDadosRevisao, type DadosRevisao } from '../dados'
import { cardsLiberados, montarFila, type Filtro } from '../revisao'

/** Relógio que anda sozinho (cards em aprendizado vencem com o passar dos minutos). */
export function useRelogio(intervaloMs = 30_000) {
  const [agora, setAgora] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), intervaloMs)
    return () => clearInterval(id)
  }, [intervaloMs])
  return [agora, setAgora] as const
}

/** Início do dia em São Paulo, estável enquanto o dia não vira. */
export function useInicioDoDia(agora: Date) {
  const dia = diaLocal(agora)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => inicioDoDia(agora), [dia])
}

/** Quantos cards estão para revisar agora num baralho, com um filtro. */
export function paraRevisar(d: DadosRevisao, baralhoId: string, filtro: Filtro, agora: Date) {
  return montarFila(cardsLiberados(d.cards, baralhoId, filtro, d.micrometas, d.checkins), agora, d.novosRespondidosHoje, diaLocal(agora))
    .restantes
}

type TipoFiltro = Filtro['tipo']

/** Escolher o baralho e, se quiser, filtrar por áreas ou tags; depois começar a revisão. */
export function RevisarTela({ chave }: { chave: string }) {
  const { abrir } = useNavegacao()
  const [agora] = useRelogio()
  const dados = useDadosRevisao(useInicioDoDia(agora))
  const baralhos = useBaralhos()
  const [baralhoId, setBaralhoId] = useRascunho(chave, 'baralho', '')
  const [tipo, setTipo] = useRascunho<TipoFiltro>(chave, 'tipo', 'tudo')
  const [areasEscolhidas, setAreas] = useRascunho<string[]>(chave, 'areas', [])
  const [tagsEscolhidas, setTags] = useRascunho<string[]>(chave, 'tags', [])

  if (!dados || !baralhos) return null

  const baralho = baralhos.find((b) => b.id === baralhoId) ?? (baralhos.length === 1 ? baralhos[0] : undefined)
  const filtro: Filtro =
    tipo === 'areas' ? { tipo, ids: areasEscolhidas } : tipo === 'tags' ? { tipo, tags: tagsEscolhidas } : { tipo: 'tudo' }

  // Opções de filtro: só áreas e tags que aparecem nos cards liberados do baralho.
  const liberados = baralho ? cardsLiberados(dados.cards, baralho.id, { tipo: 'tudo' }, dados.micrometas, dados.checkins) : []
  const areaDoConteudo = new Map(dados.micrometas.map((m) => [m.id, m.area_id]))
  const idsAreas = new Set(liberados.map((c) => (c.micrometa_id ? areaDoConteudo.get(c.micrometa_id) : null)).filter(Boolean))
  const opcoesAreas = dados.areas
    .filter((a) => idsAreas.has(a.id))
    .map((a) => ({ id: a.id, nome: `${dados.objetivos.find((o) => o.id === a.objetivo_id)?.nome ?? ''} › ${a.nome}` }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  const opcoesTags = [...new Set(liberados.flatMap((c) => c.tags))].sort((a, b) => a.localeCompare(b, 'pt-BR'))

  const total = baralho ? paraRevisar(dados, baralho.id, filtro, agora) : 0
  const alternar = (lista: string[], valor: string) => (lista.includes(valor) ? lista.filter((x) => x !== valor) : [...lista, valor])
  const filtroIncompleto = (tipo === 'areas' && areasEscolhidas.length === 0) || (tipo === 'tags' && tagsEscolhidas.length === 0)

  return (
    <>
      <Cabecalho titulo="Revisar" />

      <Secao titulo="Baralho">
        {baralhos.length === 0 && <Vazio>Nenhum baralho.</Vazio>}
        <div className="lista-escolha" role="radiogroup" aria-label="Baralho">
          {baralhos.map((b) => {
            const n = paraRevisar(dados, b.id, { tipo: 'tudo' }, agora)
            return (
              <button
                key={b.id}
                role="radio"
                aria-checked={baralho?.id === b.id}
                className="botao-marcavel escolha"
                onClick={() => {
                  setBaralhoId(b.id)
                  setAreas([])
                  setTags([])
                }}
              >
                <span className="checkbox" aria-hidden="true">
                  {baralho?.id === b.id && <Icone nome="check" tamanho={10} />}
                </span>
                <span className="escolha-nome">{b.nome}</span>
                <span className="escolha-numero">{n}</span>
              </button>
            )
          })}
        </div>
      </Secao>

      {baralho && (
        <Secao titulo="Cards">
          <div className="opcoes" role="radiogroup" aria-label="Quais cards">
            {(['tudo', 'areas', 'tags'] as const).map((t) => (
              <button key={t} role="radio" aria-checked={tipo === t} className="botao-marcavel" onClick={() => setTipo(t)}>
                <span className="checkbox" aria-hidden="true">
                  {tipo === t && <Icone nome="check" tamanho={10} />}
                </span>
                {t === 'tudo' ? 'Todos' : t === 'areas' ? 'Áreas' : 'Tags'}
              </button>
            ))}
          </div>

          {tipo === 'areas' &&
            (opcoesAreas.length === 0 ? (
              <Vazio>Nenhuma área nos cards deste baralho.</Vazio>
            ) : (
              <Rotulo texto="Áreas">
                <div className="fichas">
                  {opcoesAreas.map((a) => (
                    <button key={a.id} className="ficha" aria-pressed={areasEscolhidas.includes(a.id)} onClick={() => setAreas(alternar(areasEscolhidas, a.id))}>
                      {a.nome}
                    </button>
                  ))}
                </div>
              </Rotulo>
            ))}

          {tipo === 'tags' &&
            (opcoesTags.length === 0 ? (
              <Vazio>Nenhuma tag nos cards deste baralho.</Vazio>
            ) : (
              <Rotulo texto="Tags">
                <div className="fichas">
                  {opcoesTags.map((t) => (
                    <button key={t} className="ficha" aria-pressed={tagsEscolhidas.includes(t)} onClick={() => setTags(alternar(tagsEscolhidas, t))}>
                      {t}
                    </button>
                  ))}
                </div>
              </Rotulo>
            ))}

          <button
            className="botao-principal"
            disabled={total === 0 || filtroIncompleto}
            onClick={() => abrir({ tela: 'sessao', baralhoId: baralho.id, filtro })}
          >
            {filtroIncompleto ? 'Começar' : total === 0 ? 'Nada para revisar agora' : `Começar · ${total}`}
          </button>
        </Secao>
      )}
    </>
  )
}
