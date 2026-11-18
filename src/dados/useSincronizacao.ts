import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { sincronizador } from '../nuvem/supabase'
import { banco } from './banco'

const INTERVALO_MS = 5 * 60_000

/** Sincroniza ao abrir o app, ao voltar a internet, ao voltar para o app e a cada 5 minutos. */
export function useSincronizacaoAutomatica() {
  useEffect(() => {
    const rodar = () => void sincronizador.sincronizar()
    const aoVoltar = () => document.visibilityState === 'visible' && rodar()
    rodar()
    window.addEventListener('online', rodar)
    document.addEventListener('visibilitychange', aoVoltar)
    const id = setInterval(rodar, INTERVALO_MS)
    return () => {
      window.removeEventListener('online', rodar)
      document.removeEventListener('visibilitychange', aoVoltar)
      clearInterval(id)
    }
  }, [])
}

/** Situação para mostrar na interface: online? quantas alterações esperando envio? */
export function useSituacaoSincronizacao() {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  const pendentes = useLiveQuery(() => banco.fila.count(), [], 0)
  return { online, pendentes }
}
