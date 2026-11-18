import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import { AvisoAtualizacao } from '../atualizacao/AvisoAtualizacao'
import { banco } from '../dados/banco'
import { useSincronizacaoAutomatica } from '../dados/useSincronizacao'
import { useEstadoSalvo, type Modo } from '../estado/preferencias'
import { nuvemConfigurada, sincronizador, useSessao } from '../nuvem/supabase'
import { Configuracoes } from '../telas/Configuracoes'
import { Inicio } from '../telas/Inicio'
import { Login } from '../telas/Login'
import { Mais, type TelaDeMais } from '../telas/Mais'
import { BarraMascote } from './BarraMascote'
import { NavInferior, type Aba } from './NavInferior'

// Onde o usuário está: a aba e, dentro dela, a tela aberta.
// Fica salvo para o app reabrir exatamente aqui depois de ser fechado pelo sistema.
interface Navegacao {
  aba: Aba
  telaMais: TelaDeMais | null
}

const NAV_INICIAL: Navegacao = { aba: 'inicio', telaMais: null }

export function App() {
  const [modo, setModo] = useEstadoSalvo<Modo>('modo', 'claro')
  const sessao = useSessao()

  // Aplica o modo de cor na página inteira (tokens em estilo/tokens.css).
  useEffect(() => {
    document.documentElement.dataset.modo = modo
    const fundo = getComputedStyle(document.documentElement).getPropertyValue('--fundo').trim()
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', fundo)
  }, [modo])

  if (!nuvemConfigurada) {
    return (
      <div className="login">
        <p className="texto-secundario">
          A conexão com o Supabase não está configurada (variáveis VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY).
        </p>
      </div>
    )
  }
  if (sessao === 'carregando') return null // instante de ler a sessão salva
  if (!sessao) return <Login modo={modo} />

  return <AppConectado userId={sessao.user.id} email={sessao.user.email ?? ''} modo={modo} setModo={setModo} />
}

interface PropsConectado {
  userId: string
  email: string
  modo: Modo
  setModo: (m: Modo) => void
}

function AppConectado({ userId, email, modo, setModo }: PropsConectado) {
  const [barraAberta, setBarraAberta] = useEstadoSalvo('barra-aberta', true)
  const [nav, setNav] = useEstadoSalvo<Navegacao>('navegacao', NAV_INICIAL)
  useSincronizacaoAutomatica()

  // Configurações salvas (vindas da nuvem ou deste aparelho).
  const conf = useLiveQuery(() => banco.configuracoes.get(userId), [userId])
  const modoSalvo = conf?.dados.modo
  useEffect(() => {
    if (modoSalvo) setModo(modoSalvo) // ex.: modo trocado no PC aparece no celular
  }, [modoSalvo, setModo])

  async function escolherModo(m: Modo) {
    setModo(m) // muda na hora
    await sincronizador.registrar('configuracoes', {
      user_id: userId,
      dados: { ...conf?.dados, modo: m },
      updated_at: '',
    })
    void sincronizador.sincronizar()
  }

  let conteudo
  if (nav.aba === 'inicio') {
    conteudo = <Inicio />
  } else if (nav.telaMais === 'configuracoes') {
    conteudo = (
      <Configuracoes
        modo={modo}
        email={email}
        onModo={escolherModo}
        onVoltar={() => setNav({ aba: 'mais', telaMais: null })}
      />
    )
  } else {
    conteudo = <Mais onAbrir={(tela) => setNav({ aba: 'mais', telaMais: tela })} />
  }

  return (
    <div className="app">
      <BarraMascote modo={modo} aberta={barraAberta} onAlternar={() => setBarraAberta((a) => !a)} />
      <main className="conteudo">
        <AvisoAtualizacao />
        {conteudo}
      </main>
      <NavInferior
        atual={nav.aba}
        onEscolher={(aba) =>
          // Tocar de novo na aba atual volta para a tela principal dela.
          setNav((n) => (n.aba === aba ? { aba, telaMais: null } : { ...n, aba }))
        }
      />
    </div>
  )
}
