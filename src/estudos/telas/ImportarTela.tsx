import { useState } from 'react'
import { useRascunho } from '../../estado/preferencias'
import { Cabecalho, Rotulo, Secao } from '../../ui/componentes'
import { gravarImportacao, lerExistentes } from '../dados'
import { gerarRegistros, lerTexto, planejar, type ModoDuplicados, type Plano } from '../importacao'

const MAX_ERROS = 20

/** Importar cards: colar texto (ou abrir arquivo) → prévia → confirmar. */
export function ImportarTela({ chave }: { chave: string }) {
  const [texto, setTexto] = useRascunho(chave, 'texto', '')
  const [modo, setModo] = useRascunho<ModoDuplicados>(chave, 'modo', 'pular')
  const [previa, setPrevia] = useState<{ plano: Plano; erros: string[] } | null>(null)
  const [concluido, setConcluido] = useState<string | null>(null)
  const [trabalhando, setTrabalhando] = useState(false)

  async function analisar(conteudo = texto) {
    setConcluido(null)
    const { linhas, erros } = lerTexto(conteudo)
    setPrevia({ plano: planejar(linhas, await lerExistentes()), erros })
  }

  async function abrirArquivo(arquivo: File | undefined) {
    if (!arquivo) return
    const conteudo = await arquivo.text()
    setTexto(conteudo)
    await analisar(conteudo)
  }

  async function importar() {
    if (!previa) return
    setTrabalhando(true)
    const ex = await lerExistentes()
    // Recalcula na hora de gravar (os dados podem ter mudado desde a prévia).
    const plano = planejar(lerTexto(texto).linhas, ex)
    const registros = gerarRegistros(plano, modo, ex, () => crypto.randomUUID(), new Date())
    await gravarImportacao(registros)
    const atualizados = modo === 'atualizar' ? plano.duplicados.length : 0
    setConcluido(
      `${plano.novos.length} cards importados` + (atualizados ? ` e ${atualizados} atualizados.` : '.'),
    )
    setTexto('')
    setPrevia(null)
    setTrabalhando(false)
  }

  const p = previa?.plano
  const lista = (itens: string[]) => (itens.length > 0 ? itens.join(', ') : '')

  return (
    <>
      <Cabecalho titulo="Importar cards" />

      {concluido && (
        <Secao>
          <p className="mensagem-ok">{concluido}</p>
        </Secao>
      )}

      <Secao titulo="Texto ou arquivo">
        <textarea
          className="campo-entrada area-texto area-grande"
          aria-label="Texto para importar"
          rows={8}
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value)
            setPrevia(null)
          }}
        />
        <div className="botoes-linha">
          <label className="botao-secundario botao-arquivo">
            Abrir arquivo
            <input
              type="file"
              accept=".json,.tsv,.csv,.txt,text/plain,application/json,text/csv,text/tab-separated-values"
              onChange={(e) => void abrirArquivo(e.target.files?.[0])}
            />
          </label>
          <button className="botao-principal" disabled={!texto.trim()} onClick={() => void analisar()}>
            Analisar
          </button>
        </div>
      </Secao>

      {p && previa && (
        <Secao titulo="Prévia">
          <ul className="resumo">
            <li>
              <strong>{p.novos.length}</strong> cards novos
            </li>
            {p.duplicados.length > 0 && (
              <li>
                <strong>{p.duplicados.length}</strong> já existem (mesma frente no mesmo baralho)
              </li>
            )}
            {p.repetidosNoTexto.length > 0 && <li>{p.repetidosNoTexto.length} repetidos no próprio texto (entram uma vez)</li>}
            {p.novosBaralhos.length > 0 && <li>Baralhos novos: {lista(p.novosBaralhos)}</li>}
            {p.novosObjetivos.length > 0 && <li>Objetivos novos: {lista(p.novosObjetivos)}</li>}
            {p.novasMicrometas.length > 0 && <li>Conteúdos novos: {lista(p.novasMicrometas.map((m) => m.nome))}</li>}
          </ul>

          {p.duplicados.length > 0 && (
            <Rotulo texto="Os que já existem">
              <div className="opcoes opcoes-2" role="radiogroup" aria-label="O que fazer com os que já existem">
                {(['pular', 'atualizar'] as const).map((m) => (
                  <button key={m} role="radio" aria-checked={modo === m} className="botao-marcavel" onClick={() => setModo(m)}>
                    <span className="checkbox" aria-hidden="true" />
                    {m === 'pular' ? 'Pular' : 'Atualizar verso e tags'}
                  </button>
                ))}
              </div>
            </Rotulo>
          )}

          {previa.erros.length > 0 && (
            <div className="erros">
              <p className="campo-rotulo">Linhas com problema (não serão importadas):</p>
              <ul>
                {previa.erros.slice(0, MAX_ERROS).map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
              {previa.erros.length > MAX_ERROS && <p className="texto-secundario">E mais {previa.erros.length - MAX_ERROS}.</p>}
            </div>
          )}

          <button
            className="botao-principal"
            disabled={trabalhando || (p.novos.length === 0 && (modo === 'pular' || p.duplicados.length === 0))}
            onClick={() => void importar()}
          >
            {trabalhando ? 'Importando…' : 'Importar'}
          </button>
        </Secao>
      )}
    </>
  )
}
