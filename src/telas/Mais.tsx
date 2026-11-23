import { useState } from 'react'
import { useNavegacao } from '../app/navegacao'
import { definirModoDev, senhaCorreta, useModoDev } from '../estado/modoDev'
import { Item, Secao } from '../ui/componentes'
import { useDialogos } from '../ui/dialogos'

/** Tela provisória "Mais": dá acesso ao que ainda não virou aba principal. */
export function Mais() {
  const { abrir } = useNavegacao()
  const { pedirTexto } = useDialogos()
  const modoDev = useModoDev()
  const [aviso, setAviso] = useState<string | null>(null)

  async function entrarModoDev() {
    const senha = await pedirTexto({ titulo: 'Senha do Modo Desenvolvedor', senha: true, confirmar: 'Entrar' })
    if (senha === null) return
    if (await senhaCorreta(senha)) {
      definirModoDev(true)
      setAviso(null)
    } else setAviso('Senha incorreta.')
  }

  return (
    <>
      <Secao>
        <Item titulo="Sono" icone="lua" onClick={() => abrir({ tela: 'sono' })} />
      </Secao>
      <Secao>
        <Item titulo="Configurações" icone="engrenagem" onClick={() => abrir({ tela: 'configuracoes' })} />
      </Secao>
      <Secao>
        <Item titulo="Notificações" icone="sino" onClick={() => abrir({ tela: 'notificacoes' })} />
      </Secao>
      <Secao>
        <Item titulo="Modo Visual" icone="contraste" onClick={() => abrir({ tela: 'modo-visual' })} />
      </Secao>
      <Secao>
        <Item
          titulo="Modo Desenvolvedor"
          icone="coroa"
          detalhe={modoDev ? 'Ativo' : (aviso ?? undefined)}
          onClick={modoDev ? undefined : () => void entrarModoDev()}
        />
      </Secao>
      <p className="texto-secundario nota-rodape">Os módulos aparecem aqui conforme forem construídos.</p>
    </>
  )
}
