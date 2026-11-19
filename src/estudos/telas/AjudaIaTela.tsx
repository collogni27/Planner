import { useState } from 'react'
import { useNavegacao } from '../../app/navegacao'
import { useRascunho } from '../../estado/preferencias'
import { Cabecalho, Rotulo, Secao } from '../../ui/componentes'
import { copiarTexto } from '../../util/arquivo'
import { useAreas, useBaralhos, useMicrometa, useObjetivo, useObjetivos, useTodasMicrometas } from '../dados'

/**
 * Texto para pedir a uma IA que gere os cards a partir do conteúdo estudado.
 * Pede JSON (e não TSV) porque copiar do chat da IA pode trocar TABs por espaços.
 */
export function textoParaIa(baralho: string, micrometa: string) {
  return `Crie flashcards para eu revisar com repetição espaçada, a partir do conteúdo que vou colar no final.

Regras para bons cards (prática de recuperação):
- Uma ideia por card. Se um assunto tem várias partes, faça vários cards.
- A frente é uma pergunta curta que me obrigue a LEMBRAR a resposta (não reconhecer). Evite perguntas de sim/não.
- O verso é curto e direto. Nada de listas longas: divida em cards menores.
- Use as minhas palavras e exemplos do conteúdo; inclua o porquê quando ajudar a entender.
- Para exercícios (exatas), coloque o enunciado na frente e a resolução passo a passo no verso.

Responda SOMENTE com um bloco de código JSON neste formato exato:
{
  "cards": [
    {
      "baralho": "${baralho}",
      "micrometa": "${micrometa}",
      "frente": "pergunta",
      "verso": "resposta",
      "tags": ["tag1", "tag2"]
    }
  ]
}

- "baralho" e "micrometa" devem ser exatamente os valores acima em todos os cards.
- Tags: palavras curtas, sem espaços dentro de cada tag.

Conteúdo:
[COLE AQUI O CONTEÚDO QUE VOCÊ ESTUDOU]`
}

export function AjudaIaTela({ chave, micrometaId, baralhoId }: { chave: string; micrometaId?: string; baralhoId?: string }) {
  const { abrir } = useNavegacao()
  const baralhos = useBaralhos()
  const objetivos = useObjetivos()
  const micrometas = useTodasMicrometas()
  const [mId, setMId] = useRascunho(chave, 'micrometa', micrometaId ?? '')
  const [bId, setBId] = useRascunho(chave, 'baralho', baralhoId ?? '')
  const [copiado, setCopiado] = useState<string | null>(null)

  const micrometa = useMicrometa(mId)
  const objetivo = useObjetivo(micrometa?.objetivo_id ?? '')
  const areas = useAreas(micrometa?.objetivo_id ?? '')
  const area = areas?.find((a) => a.id === micrometa?.area_id)

  const caminho = micrometa && objetivo ? [objetivo.nome, area?.nome, micrometa.nome].filter(Boolean).join('::') : 'Objetivo::Área::Micrometa'
  const nomeBaralho = baralhos?.find((b) => b.id === bId)?.nome ?? 'Nome do baralho'
  const texto = textoParaIa(nomeBaralho, caminho)

  return (
    <>
      <Cabecalho titulo="Gerar cards com IA" />

      <Secao titulo="Como funciona">
        <ol className="passos">
          <li>Escolha o baralho e a micrometa abaixo.</li>
          <li>Copie o texto e cole numa IA (ChatGPT, Claude…), junto com o conteúdo que você estudou.</li>
          <li>Copie a resposta da IA e cole em "Importar cards".</li>
        </ol>
      </Secao>

      <Secao titulo="Para quais cards">
        <div className="formulario">
          <Rotulo texto="Baralho">
            <select className="campo-entrada" value={bId} onChange={(e) => setBId(e.target.value)}>
              <option value="">Escolha…</option>
              {baralhos?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                </option>
              ))}
            </select>
          </Rotulo>
          <Rotulo texto="Micrometa">
            <select className="campo-entrada" value={mId} onChange={(e) => setMId(e.target.value)}>
              <option value="">Escolha…</option>
              {objetivos?.map((o) => (
                <optgroup key={o.id} label={o.nome}>
                  {micrometas
                    ?.filter((m) => m.objetivo_id === o.id)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </Rotulo>
        </div>
      </Secao>

      <Secao titulo="Texto para a IA">
        <pre className="texto-ia">{texto}</pre>
        <div className="botoes-linha">
          <button
            className="botao-principal"
            onClick={() =>
              void copiarTexto(texto).then((ok) =>
                setCopiado(ok ? 'Texto copiado.' : 'Não foi possível copiar; selecione o texto e copie manualmente.'),
              )
            }
          >
            Copiar texto
          </button>
          <button className="botao-secundario" onClick={() => abrir({ tela: 'importar' })}>
            Ir para importar
          </button>
        </div>
        {copiado && <p className="mensagem-ok">{copiado}</p>}
      </Secao>

      <Secao titulo="Formatos aceitos">
        <p className="texto-secundario">
          <strong>JSON</strong> como acima (recomendado) ou <strong>tabela TSV/CSV</strong> com a primeira linha{' '}
          <code>baralho · micrometa · frente · verso · tags</code>, separada por TAB, ponto e vírgula ou vírgula. A micrometa é
          escrita como <code>Objetivo::Micrometa</code> ou <code>Objetivo::Área::Micrometa</code> e pode ficar vazia. Tags
          separadas por espaço. Baralhos, objetivos e micrometas que não existirem são criados na importação.
        </p>
      </Secao>
    </>
  )
}
