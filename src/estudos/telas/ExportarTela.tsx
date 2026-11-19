import { useState } from 'react'
import { banco, ativo } from '../../dados/banco'
import { useRascunho } from '../../estado/preferencias'
import { Cabecalho, Rotulo, Secao } from '../../ui/componentes'
import { entregarArquivo } from '../../util/arquivo'
import { lerExistentes, useBaralhos } from '../dados'
import { gerarJson, gerarTsv, paraExportacao } from '../importacao'

type Formato = 'tsv' | 'json'

/** Exportar um baralho (ou todos) em TSV ou JSON, no mesmo formato da importação. */
export function ExportarTela({ chave, baralhoId }: { chave: string; baralhoId?: string }) {
  const baralhos = useBaralhos()
  const [escolhido, setEscolhido] = useRascunho(chave, 'baralho', baralhoId ?? '')
  const [formato, setFormato] = useRascunho<Formato>(chave, 'formato', 'tsv')
  const [mensagem, setMensagem] = useState<string | null>(null)

  async function exportar() {
    const ex = await lerExistentes()
    const cards = (escolhido ? await banco.cards.where('baralho_id').equals(escolhido).toArray() : await banco.cards.toArray()).filter(ativo)
    const linhas = paraExportacao(cards, ex)
    const nomeBase = escolhido ? (baralhos?.find((b) => b.id === escolhido)?.nome ?? 'baralho') : 'todos-os-cards'
    const nome = `planner-${nomeBase.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase()}.${formato}`
    try {
      await entregarArquivo(
        nome,
        formato === 'tsv' ? gerarTsv(linhas) : gerarJson(linhas),
        formato === 'tsv' ? 'text/tab-separated-values' : 'application/json',
      )
      setMensagem(`${cards.length} cards exportados.`)
    } catch {
      setMensagem('Exportação cancelada.')
    }
  }

  return (
    <>
      <Cabecalho titulo="Exportar cards" />
      <Secao>
        <div className="formulario">
          <Rotulo texto="O que exportar">
            <select className="campo-entrada" value={escolhido} onChange={(e) => setEscolhido(e.target.value)}>
              <option value="">Todos os baralhos</option>
              {baralhos?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                </option>
              ))}
            </select>
          </Rotulo>
          <Rotulo texto="Formato">
            <div className="opcoes opcoes-2" role="radiogroup" aria-label="Formato">
              {(['tsv', 'json'] as const).map((f) => (
                <button key={f} role="radio" aria-checked={formato === f} className="botao-marcavel" onClick={() => setFormato(f)}>
                  <span className="checkbox" aria-hidden="true" />
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </Rotulo>
          <button className="botao-principal" onClick={() => void exportar()}>
            Exportar
          </button>
          {mensagem && <p className="mensagem-ok">{mensagem}</p>}
        </div>
      </Secao>
      <p className="texto-secundario nota-rodape">
        O arquivo traz frente, verso, tags, baralho e micrometa. O progresso das revisões fica no backup completo (em uma versão futura).
      </p>
    </>
  )
}
