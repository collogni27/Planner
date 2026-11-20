import { useState } from 'react'
import { useNavegacao } from '../../app/navegacao'
import { useRascunho } from '../../estado/preferencias'
import { Cabecalho, Recolhivel, Rotulo, Secao } from '../../ui/componentes'
import { copiarTexto } from '../../util/arquivo'
import { Seletor } from '../../ui/dialogos'
import { objetivosDoConteudo } from '../modelo'
import { opcoesBaralhos, opcoesConteudos } from '../opcoes'
import { useBaralhos, useMicrometa, useObjetivos, useTodasMicrometas, useVinculos } from '../dados'

/**
 * Texto para pedir a uma IA que gere os cards a partir do conteúdo estudado.
 * Pede JSON (e não TSV) porque copiar do chat da IA pode trocar TABs por espaços.
 */
export function textoParaIa(baralho: string, conteudo: string) {
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
      "conteudo": "${conteudo}",
      "frente": "pergunta",
      "verso": "resposta",
      "tags": ["tag1", "tag2"]
    }
  ]
}

- "baralho" e "conteudo" devem ser exatamente os valores acima em todos os cards.
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
  const [ajudaAberta, setAjudaAberta] = useState(false)

  const micrometa = useMicrometa(mId)
  const vinculos = useVinculos()
  // O conteúdo é identificado pelo primeiro objetivo dele; se tem baralho, os cards vão para ele.
  const objetivo = objetivos?.find((o) => micrometa && vinculos && o.id === objetivosDoConteudo(micrometa.id, vinculos)[0])
  const baralhoDoConteudo = baralhos?.find((b) => b.id === micrometa?.baralho_id)

  const caminho = micrometa && objetivo ? `${objetivo.nome}::${micrometa.nome}` : 'Objetivo::Conteúdo'
  const nomeBaralho = (baralhoDoConteudo ?? baralhos?.find((b) => b.id === bId))?.nome ?? 'Nome do baralho'
  const texto = textoParaIa(nomeBaralho, caminho)

  return (
    <>
      <Cabecalho
        titulo="Gerar cards com IA"
        acao={
          <button
            className="botao-ajuda"
            aria-label="Como funciona"
            aria-expanded={ajudaAberta}
            onClick={() => setAjudaAberta((a) => !a)}
          >
            ?
          </button>
        }
      />

      <Recolhivel aberto={ajudaAberta}>
        <Secao titulo="Como funciona">
          <ol className="passos">
            <li>Escolha o baralho e o conteúdo abaixo.</li>
            <li>Copie o texto e cole numa IA (ChatGPT, Claude…), junto com o que você estudou.</li>
            <li>Copie a resposta da IA e cole em "Importar cards".</li>
            <li>Formatos aceitos: JSON (recomendado) ou tabela TSV/CSV.</li>
          </ol>
        </Secao>
      </Recolhivel>

      <Secao titulo="Para quais cards">
        <div className="formulario">
          <Rotulo texto="Conteúdo">
            <Seletor
              rotulo="Conteúdo"
              valor={mId}
              onChange={setMId}
              opcoes={opcoesConteudos(objetivos ?? [], micrometas ?? [], vinculos ?? { baralhos: [], conteudos: [] }, 'Escolha…')}
            />
          </Rotulo>
          {baralhoDoConteudo ? (
            <div className="linha-info">
              <span className="texto-secundario">Baralho</span>
              <span>{baralhoDoConteudo.nome}</span>
            </div>
          ) : (
            <Rotulo texto="Baralho">
              <Seletor rotulo="Baralho" valor={bId} onChange={setBId} opcoes={opcoesBaralhos(baralhos ?? [], 'Escolha…')} />
            </Rotulo>
          )}
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
            Importar cards
          </button>
        </div>
        {copiado && <p className="mensagem-ok">{copiado}</p>}
      </Secao>
    </>
  )
}
