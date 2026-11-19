import { VERSAO } from '../config'
import { useSituacaoSincronizacao } from '../dados/useSincronizacao'
import { MODOS, type Modo } from '../estado/preferencias'
import { Icone } from '../icones/Icone'
import { Cabecalho } from '../ui/componentes'
import { supabase } from '../nuvem/supabase'

const NOMES: Record<Modo, string> = { claro: 'Claro', escuro: 'Escuro', foco: 'Foco' }

interface Props {
  modo: Modo
  email: string
  onModo: (modo: Modo) => void
}

export function Configuracoes({ modo, email, onModo }: Props) {
  const { online, pendentes } = useSituacaoSincronizacao()

  let situacao = 'Tudo sincronizado.'
  if (!online) situacao = 'Sem internet. O que você registrar fica salvo no aparelho e é enviado quando a conexão voltar.'
  else if (pendentes > 0) situacao = 'Há alterações salvas no aparelho aguardando envio para a nuvem.'

  async function sair() {
    if (pendentes > 0 && !confirm('Há alterações ainda não enviadas. Elas continuam salvas neste aparelho. Sair mesmo assim?')) {
      return
    }
    // "local": sai só deste aparelho, funciona mesmo sem internet.
    await supabase?.auth.signOut({ scope: 'local' })
  }

  return (
    <>
      <Cabecalho titulo="Configurações" />

      <section className="card">
        <h2 className="card-titulo">Modo de cor</h2>
        <div className="opcoes" role="radiogroup" aria-label="Modo de cor">
          {MODOS.map((m) => (
            <button
              key={m}
              role="radio"
              aria-checked={m === modo}
              className="botao-marcavel"
              onClick={() => onModo(m)}
            >
              <span className="checkbox" aria-hidden="true">
                {m === modo && <Icone nome="check" tamanho={10} />}
              </span>
              {NOMES[m]}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="card-titulo">Conta</h2>
        <div className="linha-info">
          <span className="texto-secundario">Entrou como</span>
          <span className="texto-curto">{email}</span>
        </div>
        <p className="texto-secundario">{situacao}</p>
        <button className="botao-marcavel botao-largo" onClick={sair}>
          Sair
        </button>
      </section>

      <section className="card">
        <h2 className="card-titulo">Sobre</h2>
        <div className="linha-info">
          <span className="texto-secundario">Versão</span>
          <span className="numero-destaque">{VERSAO}</span>
        </div>
      </section>
    </>
  )
}
