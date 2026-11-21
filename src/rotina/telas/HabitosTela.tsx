import { useNavegacao } from '../../app/navegacao'
import type { Habito } from '../../dados/banco'
import { useRascunho } from '../../estado/preferencias'
import { Icone } from '../../icones/Icone'
import { Cabecalho, Item, Secao, Vazio } from '../../ui/componentes'
import { diaLocal } from '../../util/data'
import { marcarHabito, ordemPadraoHabitos, salvarOrdemHabitos, useFeitos, useHabitos, useTarefas } from '../dados'
import { feitoNoDia, habitoValeNoDia, textoDosDias } from '../rotina'
import { LinhaCheck, textoQuando } from './partes'

/** Todos os hábitos: os de hoje (com check), os de outros dias, criar e mudar a ordem. */
export function HabitosTela({ chave }: { chave: string }) {
  const { abrir } = useNavegacao()
  const hoje = diaLocal(new Date())
  const habitos = useHabitos()
  const feitos = useFeitos(hoje)
  const tarefas = useTarefas()
  const [ordenando, setOrdenando] = useRascunho(chave, 'ordenando', false)
  if (!habitos || !feitos || !tarefas) return null

  const detalhe = (h: Habito) =>
    [textoQuando({ ...h, gatilho_habito_id: null }, tarefas, habitos), textoDosDias(h.dias)].filter(Boolean).join(' · ')

  const mover = (i: number, delta: number) => {
    const lista = [...habitos]
    const [h] = lista.splice(i, 1)
    lista.splice(i + delta, 0, h)
    void salvarOrdemHabitos(lista)
  }

  if (ordenando) {
    return (
      <>
        <Cabecalho titulo="Ordem dos hábitos" />
        <Secao>
          {habitos.map((h, i) => (
            <Item
              key={h.id}
              titulo={h.nome}
              direita={
                <span className="mover">
                  <button className="botao-icone" aria-label={`Subir ${h.nome}`} disabled={i === 0} onClick={() => mover(i, -1)}>
                    <Icone nome="cima" tamanho={14} />
                  </button>
                  <button
                    className="botao-icone"
                    aria-label={`Descer ${h.nome}`}
                    disabled={i === habitos.length - 1}
                    onClick={() => mover(i, 1)}
                  >
                    <Icone nome="baixo" tamanho={14} />
                  </button>
                </span>
              }
            />
          ))}
        </Secao>
        <div className="acoes">
          <button className="botao-secundario" onClick={() => void ordemPadraoHabitos(habitos)}>
            Ordem padrão
          </button>
          <button className="botao-principal" onClick={() => setOrdenando(false)}>
            Pronto
          </button>
        </div>
      </>
    )
  }

  const deHoje = habitos.filter((h) => habitoValeNoDia(h, hoje))
  const outros = habitos.filter((h) => !habitoValeNoDia(h, hoje))

  return (
    <>
      <Cabecalho titulo="Hábitos" />
      <Secao titulo="Hoje">
        {deHoje.length === 0 && <Vazio>Nenhum hábito para hoje.</Vazio>}
        {deHoje.map((h) => {
          const feito = feitoNoDia(feitos, h.id, hoje)
          return (
            <LinhaCheck
              key={h.id}
              titulo={h.nome}
              detalhe={detalhe(h)}
              marcado={feito}
              onMarcar={() => void marcarHabito(h, hoje, !feito)}
              onAbrir={() => abrir({ tela: 'habito', id: h.id })}
            />
          )
        })}
      </Secao>
      {outros.length > 0 && (
        <Secao titulo="Outros dias">
          {outros.map((h) => (
            <Item key={h.id} titulo={h.nome} detalhe={detalhe(h)} onClick={() => abrir({ tela: 'habito', id: h.id })} />
          ))}
        </Secao>
      )}
      <div className="acoes">
        {habitos.length > 1 && (
          <button className="botao-secundario" onClick={() => setOrdenando(true)}>
            Mudar ordem
          </button>
        )}
        <button className="botao-principal" onClick={() => abrir({ tela: 'habito', id: null })}>
          Novo hábito
        </button>
      </div>
    </>
  )
}
