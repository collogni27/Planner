// Agenda os avisos no Android (docs/notificacoes.md). Tudo é refeito ao abrir o app e
// sempre que algo relevante muda (horários, avisos ligados, Bom dia aberto, sol marcado).
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { ConfigSono, Dia } from '../dados/banco'
import { Alarmes } from './alarmes'
import { AVISOS_PADRAO, avisosDormir, avisosSol, ehNossoAviso, horariosBomDia, type Aviso, type ConfigAvisos } from './agenda'

export const avisosDisponiveis = () => Capacitor.isNativePlatform()

const CANAL = 'avisos'

export async function prepararAvisos() {
  if (!avisosDisponiveis()) return
  const p = await LocalNotifications.checkPermissions()
  if (p.display === 'prompt' || p.display === 'prompt-with-rationale') await LocalNotifications.requestPermissions()
  await LocalNotifications.createChannel({ id: CANAL, name: 'Avisos', importance: 4, visibility: 1, vibration: true })
}

/** Quais avisos (comuns) entram agora: hora de dormir e sol. */
export function avisosComuns(sono: ConfigSono, avisos: ConfigAvisos, hoje: Dia | null, agora: Date): Aviso[] {
  return [
    ...(avisos.dormir ? avisosDormir(sono, agora) : []),
    ...(avisos.sol ? avisosSol(hoje?.bom_dia_em ?? null, hoje?.sol_em ?? null, agora) : []),
  ]
}

export async function reagendar(sono: ConfigSono, avisos: ConfigAvisos = AVISOS_PADRAO, hoje: Dia | null) {
  if (!avisosDisponiveis()) return
  const agora = new Date()

  // Bom dia (plugin próprio, insistente).
  if (avisos.bomDia) await Alarmes.agendarBomDia({ horarios: horariosBomDia(sono, agora).map((d) => d.getTime()) })
  else await Alarmes.cancelarBomDia()

  // Avisos comuns: cancela os nossos pendentes e agenda de novo.
  const pendentes = await LocalNotifications.getPending()
  const nossos = pendentes.notifications.filter((n) => ehNossoAviso(n.id))
  if (nossos.length) await LocalNotifications.cancel({ notifications: nossos.map((n) => ({ id: n.id })) })
  const lista = avisosComuns(sono, avisos, hoje, agora)
  if (lista.length === 0) return
  await LocalNotifications.schedule({
    notifications: lista.map((a) => ({
      id: a.id,
      title: a.titulo,
      body: a.texto,
      channelId: CANAL,
      schedule: { at: a.quando, allowWhileIdle: true },
      extra: { destino: a.destino },
    })),
  })
}

/** Teste: um aviso comum daqui a alguns segundos. */
export async function testarAvisoComum(segundos = 10) {
  await LocalNotifications.schedule({
    notifications: [
      {
        id: 39_999,
        title: 'Teste do Planner',
        body: 'Os avisos estão funcionando.',
        channelId: CANAL,
        schedule: { at: new Date(Date.now() + segundos * 1000), allowWhileIdle: true },
        extra: { destino: 'sono' },
      },
    ],
  })
}
