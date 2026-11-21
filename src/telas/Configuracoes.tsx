import { VERSAO } from '../config'
import { useSituacaoSincronizacao } from '../dados/useSincronizacao'
import { Cabecalho } from '../ui/componentes'
import { useDialogos } from '../ui/dialogos'
import { supabase } from '../nuvem/supabase'

export function Configuracoes({ email }: { email: string }) {
  const { online, pendentes } = useSituacaoSincronizacao()
  const { confirmar } = useDialogos()

  let situacao = 'Tudo sincronizado.'
  if (!online) situacao = 'Sem internet. O que você registrar fica salvo no aparelho e é enviado quando a conexão voltar.'
  else if (pendentes > 0) situacao = 'Há alterações salvas no aparelho aguardando envio para a nuvem.'

  async function sair() {
    if (
      pendentes > 0 &&
      !(await confirmar({
        titulo: 'Sair mesmo assim?',
        mensagem: 'Há alterações ainda não enviadas. Elas continuam salvas neste aparelho.',
        confirmar: 'Sair',
        perigo: true,
      }))
    ) {
      return
    }
    // "local": sai só deste aparelho, funciona mesmo sem internet.
    await supabase?.auth.signOut({ scope: 'local' })
  }

  return (
    <>
      <Cabecalho titulo="Configurações" />

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
