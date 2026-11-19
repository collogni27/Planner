import { useState } from 'react'
import { useNavegacao } from '../../app/navegacao'
import type { Area, Micrometa } from '../../dados/banco'
import { useRascunho } from '../../estado/preferencias'
import { Icone } from '../../icones/Icone'
import { Acoes, Cabecalho, Item, Secao, Vazio, dataCurta, pedirNome } from '../../ui/componentes'
import {
  apagarArea,
  apagarObjetivo,
  criarArea,
  criarMicrometa,
  moverNaFila,
  proximaAEstudar,
  renomear,
  useAreas,
  useCheckins,
  useMicrometas,
  useObjetivo,
} from '../dados'

/** Um objetivo: micrometas agrupadas por área, na ordem da fila de estudo. */
export function ObjetivoTela({ id, chave }: { id: string; chave: string }) {
  const { abrir, voltar } = useNavegacao()
  const objetivo = useObjetivo(id)
  const areas = useAreas(id)
  const micrometas = useMicrometas(id)
  const checkins = useCheckins()
  const [nomeNova, setNomeNova] = useRascunho(chave, 'micrometa', '')
  const [areaNova, setAreaNova] = useRascunho<string>(chave, 'area', '')
  const [novaArea, setNovaArea] = useState('')

  if (objetivo === undefined || !areas || !micrometas) return null
  if (objetivo === null) return <Cabecalho titulo="Objetivo apagado" />

  const proxima = proximaAEstudar(micrometas, areas, checkins)
  const grupos: { area: Area | null; itens: Micrometa[] }[] = [
    { area: null, itens: micrometas.filter((m) => !m.area_id) },
    ...areas.map((a) => ({ area: a, itens: micrometas.filter((m) => m.area_id === a.id) })),
  ]

  function ultimoCheckin(m: Micrometa) {
    const c = checkins?.find((x) => x.micrometa_id === m.id)
    return c ? `estudada · ${dataCurta(c.estudado_em)}` : 'a estudar'
  }

  async function adicionarMicrometa() {
    if (!nomeNova.trim()) return
    await criarMicrometa(id, areaNova || null, nomeNova)
    setNomeNova('')
  }

  return (
    <>
      <Cabecalho titulo={objetivo.nome} />

      {proxima && (
        <Secao titulo="Próximo a estudar">
          <Item titulo={proxima.nome} onClick={() => abrir({ tela: 'micrometa', id: proxima.id })} />
        </Secao>
      )}

      {grupos
        .filter((g) => g.area || g.itens.length > 0)
        .map((g) => (
          <Secao
            key={g.area?.id ?? 'sem-area'}
            titulo={g.area?.nome ?? 'Sem área'}
            acao={
              g.area && (
                <span className="acoes-pequenas">
                  <button
                    className="botao-texto"
                    onClick={() => {
                      const nome = pedirNome(g.area!.nome, 'Novo nome da área')
                      if (nome) void renomear('areas', g.area!, nome)
                    }}
                  >
                    Renomear
                  </button>
                  <button
                    className="botao-texto"
                    onClick={() => {
                      if (confirm(`Apagar a área "${g.area!.nome}"? Os conteúdos dela ficam em "Sem área".`)) void apagarArea(g.area!)
                    }}
                  >
                    Apagar
                  </button>
                </span>
              )
            }
          >
            {g.itens.length === 0 && <Vazio>Nenhum conteúdo nesta área.</Vazio>}
            {g.itens.map((m, i) => (
              <Item
                key={m.id}
                titulo={m.nome}
                detalhe={ultimoCheckin(m)}
                onClick={() => abrir({ tela: 'micrometa', id: m.id })}
                direita={
                  <span className="mover">
                    <button className="botao-icone" aria-label={`Subir ${m.nome}`} disabled={i === 0} onClick={() => void moverNaFila(m, -1)}>
                      <Icone nome="cima" tamanho={14} />
                    </button>
                    <button
                      className="botao-icone"
                      aria-label={`Descer ${m.nome}`}
                      disabled={i === g.itens.length - 1}
                      onClick={() => void moverNaFila(m, 1)}
                    >
                      <Icone nome="baixo" tamanho={14} />
                    </button>
                  </span>
                }
              />
            ))}
          </Secao>
        ))}

      <Secao titulo="Nova área (opcional)">
        <form
          className="campo-adicionar"
          onSubmit={(e) => {
            e.preventDefault()
            if (novaArea.trim()) void criarArea(id, novaArea).then(() => setNovaArea(''))
          }}
        >
          <input
            className="campo-entrada"
            placeholder="Nome"
            aria-label="Nome da área"
            value={novaArea}
            onChange={(e) => setNovaArea(e.target.value)}
          />
          <button className="botao-secundario" type="submit" disabled={!novaArea.trim()}>
            Adicionar
          </button>
        </form>
      </Secao>

      <Secao titulo="Novo conteúdo">
        <form
          className="formulario"
          onSubmit={(e) => {
            e.preventDefault()
            void adicionarMicrometa()
          }}
        >
          <input
            className="campo-entrada"
            placeholder="Nome"
            aria-label="Nome do conteúdo"
            value={nomeNova}
            onChange={(e) => setNomeNova(e.target.value)}
          />
          <select className="campo-entrada" aria-label="Área" value={areaNova} onChange={(e) => setAreaNova(e.target.value)}>
            <option value="">Sem área</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
          <button className="botao-principal" type="submit" disabled={!nomeNova.trim()}>
            Adicionar conteúdo
          </button>
        </form>
      </Secao>

      <Acoes>
        <button
          className="botao-secundario"
          onClick={() => {
            const nome = pedirNome(objetivo.nome, 'Novo nome do objetivo')
            if (nome) void renomear('objetivos', objetivo, nome)
          }}
        >
          Renomear objetivo
        </button>
        <button
          className="botao-secundario"
          onClick={() => {
            if (confirm(`Apagar o objetivo "${objetivo.nome}" com suas áreas, conteúdos e check-ins? Os cards continuam nos baralhos.`)) {
              void apagarObjetivo(objetivo).then(voltar)
            }
          }}
        >
          Apagar objetivo
        </button>
      </Acoes>
    </>
  )
}
