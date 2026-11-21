import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef } from 'react'
import { AvisoAtualizacao } from '../atualizacao/AvisoAtualizacao'
import { banco } from '../dados/banco'
import { useSincronizacaoAutomatica } from '../dados/useSincronizacao'
import { useEstadoSalvo, type Modo } from '../estado/preferencias'
import { nuvemConfigurada, sincronizador, useSessao } from '../nuvem/supabase'
import { Configuracoes } from '../telas/Configuracoes'
import { Inicio } from '../telas/Inicio'
import { Login } from '../telas/Login'
import { Mais } from '../telas/Mais'
import { AcompanhamentoTela } from '../estudos/telas/AcompanhamentoTela'
import { SonoConfigTela } from '../sono/telas/SonoConfigTela'
import { SonoTela } from '../sono/telas/SonoTela'
import { SonoHistoricoTela } from '../sono/telas/SonoHistoricoTela'
import { TelaDiaria } from '../sono/telas/TelaDiaria'
import { useTelaDiariaAutomatica } from '../sono/automatica'
import { useAvisosAutomaticos } from '../notificacoes/automatico'
import { NotificacoesTela } from '../notificacoes/telas/NotificacoesTela'
import { ModoVisualTela } from '../visual/ModoVisualTela'
import { MODO_VISUAL_PADRAO, minutosAgora, modoDoHorario } from '../visual/modoVisual'
import { AjudaIaTela } from '../estudos/telas/AjudaIaTela'
import { BaralhoTela } from '../estudos/telas/BaralhoTela'
import { CardTela } from '../estudos/telas/CardTela'
import { EstudosInicio } from '../estudos/telas/EstudosInicio'
import { ExportarTela } from '../estudos/telas/ExportarTela'
import { ImportarTela } from '../estudos/telas/ImportarTela'
import { MicrometaTela } from '../estudos/telas/MicrometaTela'
import { ObjetivoTela } from '../estudos/telas/ObjetivoTela'
import { RevisarTela } from '../estudos/telas/RevisarTela'
import { SessaoTela } from '../estudos/telas/SessaoTela'
import { RevisaoLivreTela } from '../estudos/telas/RevisaoLivreTela'
import { TodosTela } from '../estudos/telas/TodosTela'
import { ProvedorNavegacao, useNavegacao } from './navegacao'
import { ProvedorDialogos } from '../ui/dialogos'
import { BarraMascote } from './BarraMascote'
import { NavInferior } from './NavInferior'

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
  return (
    <ProvedorNavegacao>
      <ProvedorDialogos>
        <Conteudo userId={userId} email={email} modo={modo} setModo={setModo} />
      </ProvedorDialogos>
    </ProvedorNavegacao>
  )
}

function Conteudo({ userId, email, modo, setModo }: PropsConectado) {
  const { aba, rota, abrir } = useNavegacao()
  const [barraAberta, setBarraAberta] = useEstadoSalvo('barra-aberta', true)
  useSincronizacaoAutomatica()
  useTelaDiariaAutomatica(abrir)
  useAvisosAutomaticos(abrir)

  // Configurações salvas (vindas da nuvem ou deste aparelho).
  const conf = useLiveQuery(() => banco.configuracoes.get(userId), [userId])
  const modoSalvo = conf?.dados.modo
  const modoVisual = conf?.dados.modoVisual ?? MODO_VISUAL_PADRAO
  const chaveVisual = JSON.stringify(modoVisual)
  useEffect(() => {
    if (modoVisual.tipo === 'variavel') {
      // Modo Visual Variável: confere o horário a cada minuto.
      const aplicar = () => {
        const m = modoDoHorario(modoVisual.inicio, minutosAgora(new Date()))
        if (m) setModo(m)
      }
      aplicar()
      const id = setInterval(aplicar, 60_000)
      return () => clearInterval(id)
    }
    if (modoSalvo) setModo(modoSalvo) // ex.: modo trocado no PC aparece no celular
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modoSalvo, chaveVisual, setModo])

  /** Modo Visual Fixo: escolhe o modo e desliga o Variável. */
  async function escolherModo(m: Modo) {
    setModo(m) // muda na hora
    await sincronizador.registrar('configuracoes', {
      user_id: userId,
      dados: { ...conf?.dados, modo: m, modoVisual: { ...modoVisual, tipo: 'fixo' } },
      updated_at: '',
    })
    void sincronizador.sincronizar()
  }

  // Volta ao topo ao trocar de tela.
  const chaveTela = rota?.chave ?? aba
  const refConteudo = useRef<HTMLElement>(null)
  useEffect(() => {
    refConteudo.current?.scrollTo(0, 0)
  }, [chaveTela])

  let conteudo
  if (rota) {
    switch (rota.tela) {
      case 'configuracoes':
        conteudo = <Configuracoes email={email} />
        break
      case 'modo-visual':
        conteudo = <ModoVisualTela chave={rota.chave} modo={modo} onFixo={escolherModo} />
        break
      case 'objetivo':
        conteudo = <ObjetivoTela id={rota.id} chave={rota.chave} />
        break
      case 'micrometa':
        conteudo = <MicrometaTela id={rota.id} chave={rota.chave} />
        break
      case 'baralho':
        conteudo = <BaralhoTela id={rota.id} chave={rota.chave} />
        break
      case 'card':
        conteudo = <CardTela chave={rota.chave} id={rota.id} baralhoId={rota.baralhoId} micrometaId={rota.micrometaId} />
        break
      case 'importar':
        conteudo = <ImportarTela chave={rota.chave} />
        break
      case 'exportar':
        conteudo = <ExportarTela chave={rota.chave} baralhoId={rota.baralhoId} />
        break
      case 'notificacoes':
        conteudo = <NotificacoesTela />
        break
      case 'sono':
        conteudo = <SonoTela />
        break
      case 'sono-historico':
        conteudo = <SonoHistoricoTela />
        break
      case 'sono-config':
        conteudo = <SonoConfigTela chave={rota.chave} />
        break
      case 'diaria':
        conteudo = <TelaDiaria chave={rota.chave} dia={rota.dia} />
        break
      case 'acompanhamento':
        conteudo = <AcompanhamentoTela />
        break
      case 'revisar':
        conteudo = <RevisarTela chave={rota.chave} />
        break
      case 'sessao':
        conteudo = <SessaoTela chave={rota.chave} filtro={rota.filtro} />
        break
      case 'livre':
        conteudo = <RevisaoLivreTela chave={rota.chave} filtro={rota.filtro} />
        break
      case 'todos':
        conteudo = <TodosTela tipo={rota.tipo} />
        break
      case 'ajuda-ia':
        conteudo = <AjudaIaTela chave={rota.chave} micrometaId={rota.micrometaId} baralhoId={rota.baralhoId} />
        break
    }
  } else if (aba === 'estudos') {
    conteudo = <EstudosInicio />
  } else if (aba === 'mais') {
    conteudo = <Mais />
  } else {
    conteudo = <Inicio />
  }

  return (
    <div className="app">
      <BarraMascote modo={modo} aberta={barraAberta} onAlternar={() => setBarraAberta((a) => !a)} />
      <main className="conteudo" ref={refConteudo} key={chaveTela}>
        <AvisoAtualizacao />
        {conteudo}
      </main>
      <NavInferior />
    </div>
  )
}
