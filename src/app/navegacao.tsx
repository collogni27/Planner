// Navegação: cada aba tem uma pilha de telas. Tudo fica salvo no aparelho,
// para o app reabrir exatamente na mesma tela depois de ser fechado pelo sistema.
import { App as AppNativo } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react'
import type { Filtro } from '../estudos/revisao'
import { removerRascunhos, useEstadoSalvo } from '../estado/preferencias'
import { fecharUltimaCaixa } from '../ui/dialogos'

export type Aba = 'inicio' | 'estudos' | 'mais'

/** Telas abertas por cima da tela principal de cada aba. */
export type Rota =
  | { tela: 'objetivo'; id: string }
  | { tela: 'micrometa'; id: string }
  | { tela: 'baralho'; id: string }
  | { tela: 'card'; id: string | null; baralhoId?: string; micrometaId?: string }
  | { tela: 'importar' }
  | { tela: 'exportar'; baralhoId?: string }
  | { tela: 'ajuda-ia'; micrometaId?: string; baralhoId?: string }
  | { tela: 'todos'; tipo: 'objetivos' | 'baralhos' }
  | { tela: 'revisar' }
  | { tela: 'acompanhamento' }
  | { tela: 'sessao'; filtro: Filtro }
  | { tela: 'livre'; filtro: Filtro }
  | { tela: 'configuracoes' }
  | { tela: 'sono' }
  | { tela: 'sono-config' }
  | { tela: 'sono-historico' }
  | { tela: 'diaria'; dia: string }

/** Rota + uma chave única (usada para os rascunhos daquela tela). */
export type RotaAberta = Rota & { chave: string }

interface Estado {
  aba: Aba
  pilhas: Record<Aba, RotaAberta[]>
}

const INICIAL: Estado = { aba: 'inicio', pilhas: { inicio: [], estudos: [], mais: [] } }

interface Navegacao {
  aba: Aba
  rota: RotaAberta | null
  abrir: (rota: Rota) => void
  voltar: () => void
  escolherAba: (aba: Aba) => void
}

const Contexto = createContext<Navegacao | null>(null)

export function ProvedorNavegacao({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useEstadoSalvo<Estado>('navegacao:v3', INICIAL)
  const pilha = estado.pilhas[estado.aba] ?? []

  const abrir = useCallback(
    (rota: Rota) =>
      setEstado((e) => ({
        ...e,
        pilhas: { ...e.pilhas, [e.aba]: [...e.pilhas[e.aba], { ...rota, chave: crypto.randomUUID() }] },
      })),
    [setEstado],
  )

  const voltar = useCallback(
    () =>
      setEstado((e) => {
        const atual = e.pilhas[e.aba]
        const saindo = atual[atual.length - 1]
        if (saindo) removerRascunhos(saindo.chave) // sair pelo "voltar" descarta o rascunho
        return { ...e, pilhas: { ...e.pilhas, [e.aba]: atual.slice(0, -1) } }
      }),
    [setEstado],
  )

  const escolherAba = useCallback(
    (aba: Aba) =>
      setEstado((e) => {
        // Tocar de novo na aba atual volta para a tela principal dela.
        if (e.aba !== aba) return { ...e, aba }
        e.pilhas[aba].forEach((r) => removerRascunhos(r.chave))
        return { ...e, pilhas: { ...e.pilhas, [aba]: [] } }
      }),
    [setEstado],
  )

  // Botão "voltar" do Android: fecha a tela de cima; na tela principal, volta ao Início;
  // no Início, minimiza o app (o estado continua salvo).
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    const ouvinte = AppNativo.addListener('backButton', () => {
      if (fecharUltimaCaixa()) return // primeiro fecha a caixa de diálogo aberta
      if (pilha.length > 0) voltar()
      else if (estado.aba !== 'inicio') escolherAba('inicio')
      else void AppNativo.minimizeApp()
    })
    return () => void ouvinte.then((o) => o.remove())
  }, [pilha.length, estado.aba, voltar, escolherAba])

  const valor = useMemo(
    () => ({ aba: estado.aba, rota: pilha[pilha.length - 1] ?? null, abrir, voltar, escolherAba }),
    [estado.aba, pilha, abrir, voltar, escolherAba],
  )
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useNavegacao() {
  const n = useContext(Contexto)
  if (!n) throw new Error('useNavegacao fora do ProvedorNavegacao')
  return n
}
