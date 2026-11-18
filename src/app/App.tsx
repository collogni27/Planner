import { useEffect } from 'react'
import { useEstadoSalvo, type Modo } from '../estado/preferencias'
import { Configuracoes } from '../telas/Configuracoes'
import { Inicio } from '../telas/Inicio'
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
  const [barraAberta, setBarraAberta] = useEstadoSalvo('barra-aberta', true)
  const [nav, setNav] = useEstadoSalvo<Navegacao>('navegacao', NAV_INICIAL)

  // Aplica o modo de cor na página inteira (tokens em estilo/tokens.css).
  useEffect(() => {
    document.documentElement.dataset.modo = modo
    const fundo = getComputedStyle(document.documentElement).getPropertyValue('--fundo').trim()
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', fundo)
  }, [modo])

  let conteudo
  if (nav.aba === 'inicio') {
    conteudo = <Inicio />
  } else if (nav.telaMais === 'configuracoes') {
    conteudo = <Configuracoes modo={modo} onModo={setModo} onVoltar={() => setNav({ aba: 'mais', telaMais: null })} />
  } else {
    conteudo = <Mais onAbrir={(tela) => setNav({ aba: 'mais', telaMais: tela })} />
  }

  return (
    <div className="app">
      <BarraMascote modo={modo} aberta={barraAberta} onAlternar={() => setBarraAberta((a) => !a)} />
      <main className="conteudo">{conteudo}</main>
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
