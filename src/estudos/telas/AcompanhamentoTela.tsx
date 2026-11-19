import { useNavegacao } from '../../app/navegacao'
import { Cabecalho, Item, Secao, Vazio } from '../../ui/componentes'
import { useTudoDeEstudos } from '../dados'
import {
  carga,
  cardsPorTag,
  cardsProblema,
  maturidade,
  NOME_SITUACAO,
  precisamReforco,
  resumirConteudo,
  type Situacao,
} from '../estatisticas'
import { useInicioDoDia, useRelogio } from './RevisarTela'

const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const MAX_TAGS = 20

/** Onde investir o próximo estudo: carga, reforço, cards-problema e visão geral. */
export function AcompanhamentoTela() {
  const { abrir } = useNavegacao()
  const [agora] = useRelogio(60_000)
  const inicio = useInicioDoDia(agora)
  const d = useTudoDeEstudos()
  if (!d) return null

  const resumos = d.micrometas.map((m) => resumirConteudo(m, d.cards, d.checkins, d.revisoes, agora))
  const reforco = precisamReforco(resumos)
  const problema = cardsProblema(d.cards)
  const previsto = carga(d.cards, d.checkins, inicio)
  const tags = cardsPorTag(d.cards)
  const descreverMedidas = (forca: number | null, acerto: number | null) =>
    [acerto !== null && `acerto ${acerto}%`, forca !== null && `força ${forca}%`].filter(Boolean).join(' · ')

  return (
    <>
      <Cabecalho titulo="Acompanhamento" />

      <Secao titulo="Revisões nos próximos dias">
        <div className="carga">
          {previsto.map((n, i) => {
            const diaDaSemana = new Date(inicio.getTime() + i * 86_400_000 + 12 * 3_600_000)
            return (
              <div key={i} className="carga-dia">
                <span className="carga-numero">{n}</span>
                <span className="carga-rotulo">{i === 0 ? 'hoje' : DIAS_SEMANA[(diaDaSemana.getUTCDay() + 7) % 7]}</span>
              </div>
            )
          })}
        </div>
      </Secao>

      <Secao titulo="Precisa de reforço">
        {reforco.length === 0 ? (
          <Vazio>Nada por enquanto.</Vazio>
        ) : (
          reforco.map((r) => (
            <Item
              key={r.conteudo.id}
              titulo={r.conteudo.nome}
              detalhe={descreverMedidas(r.forca, r.acerto)}
              onClick={() => abrir({ tela: 'micrometa', id: r.conteudo.id })}
            />
          ))
        )}
      </Secao>

      <Secao titulo="Cards-problema">
        {problema.length === 0 ? (
          <Vazio>Nada por enquanto.</Vazio>
        ) : (
          problema.map((c) => (
            <Item key={c.id} titulo={c.frente} detalhe={`errado ${c.lapses} vezes`} onClick={() => abrir({ tela: 'card', id: c.id })} />
          ))
        )}
      </Secao>

      <Secao titulo="Objetivos">
        {d.objetivos.length === 0 && <Vazio>Nenhum objetivo.</Vazio>}
        {d.objetivos.map((o) => {
          const contagem = new Map<Situacao, number>()
          for (const r of resumos.filter((r) => r.conteudo.objetivo_id === o.id)) contagem.set(r.situacao, (contagem.get(r.situacao) ?? 0) + 1)
          const detalhe = (['a-estudar', 'estudado', 'em-consolidacao', 'dominado'] as Situacao[])
            .filter((s) => contagem.get(s))
            .map((s) => `${contagem.get(s)} ${NOME_SITUACAO[s]}`)
            .join(' · ')
          return <Item key={o.id} titulo={o.nome} detalhe={detalhe || 'Sem conteúdos'} onClick={() => abrir({ tela: 'objetivo', id: o.id })} />
        })}
      </Secao>

      <Secao titulo="Baralhos">
        {d.baralhos.length === 0 && <Vazio>Nenhum baralho.</Vazio>}
        {d.baralhos.map((b) => {
          const m = maturidade(d.cards.filter((c) => c.baralho_id === b.id))
          return (
            <Item
              key={b.id}
              titulo={b.nome}
              detalhe={`${m.novos} novos · ${m.jovens} jovens · ${m.maduros} maduros`}
              onClick={() => abrir({ tela: 'baralho', id: b.id })}
            />
          )
        })}
      </Secao>

      {tags.length > 0 && (
        <Secao titulo="Tags">
          {tags.slice(0, MAX_TAGS).map((t) => (
            <Item key={t.tag} titulo={t.tag} detalhe={t.cards === 1 ? '1 card' : `${t.cards} cards`} />
          ))}
        </Secao>
      )}
    </>
  )
}
