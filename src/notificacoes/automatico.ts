// Liga os avisos ao app: reagenda quando algo muda e abre a tela certa ao tocar num aviso.
import { LocalNotifications } from '@capacitor/local-notifications'
import { useEffect } from 'react'
import type { Rota } from '../app/navegacao'
import { banco } from '../dados/banco'
import { useConfiguracao } from '../dados/config'
import { marcarAberturaDeHoje } from '../sono/automatica'
import { salvarDia, useDia } from '../sono/dados'
import { CONFIG_SONO_PADRAO, idDoDia } from '../sono/sono'
import { diaLocal } from '../util/data'
import { AVISOS_PADRAO } from './agenda'
import { Alarmes } from './alarmes'
import { avisosDisponiveis, prepararAvisos, reagendar } from './avisos'

/** Abriu pelo Bom dia (ou abriu o app enquanto ele tocava): para de insistir e abre a tela diária. */
async function atenderBomDia(abrir: (r: Rota) => void) {
  await Alarmes.encerrarBomDia()
  const hoje = diaLocal(new Date())
  const registro = await banco.dias.get(idDoDia(hoje))
  // A hora em que abriu o Bom dia conta como "acordei" (base dos avisos de sol).
  if (!registro?.bom_dia_em || registro.deleted_at) await salvarDia(hoje, { bom_dia_em: new Date().toISOString() })
  marcarAberturaDeHoje()
  abrir({ tela: 'diaria', dia: hoje })
}

export function useAvisosAutomaticos(abrir: (r: Rota) => void) {
  const config = useConfiguracao()
  const hoje = useDia(diaLocal(new Date()))
  const sono = config?.sono ?? CONFIG_SONO_PADRAO
  const avisos = config?.avisos ?? AVISOS_PADRAO

  // Reagenda sempre que horários, avisos ligados, Bom dia aberto ou sol mudarem.
  const chave = JSON.stringify([sono, avisos, hoje?.dia, hoje?.bom_dia_em, hoje?.sol_em])
  useEffect(() => {
    if (!avisosDisponiveis() || config === undefined || hoje === undefined) return
    void reagendar(sono, avisos, hoje ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])

  // Toque nas notificações e Bom dia tocando ao abrir o app.
  useEffect(() => {
    if (!avisosDisponiveis()) return
    const tratar = (destino: string | null | undefined) => {
      if (destino === 'bom-dia') void atenderBomDia(abrir)
      else if (destino === 'sono') abrir({ tela: 'sono' })
    }
    const verificarTocando = async () => {
      if ((await Alarmes.estadoBomDia()).tocando) void atenderBomDia(abrir)
    }
    void prepararAvisos()
    void Alarmes.destinoPendente().then(async ({ destino }) => {
      if (destino) tratar(destino)
      else await verificarTocando()
    })
    const ouvintes = [
      Alarmes.addListener('destino', (e) => tratar(e.destino)),
      LocalNotifications.addListener('localNotificationActionPerformed', (e) => tratar(e.notification.extra?.destino)),
    ]
    const aoVoltar = () => document.visibilityState === 'visible' && void verificarTocando()
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      ouvintes.forEach((o) => void o.then((h) => h.remove()))
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [abrir])
}
