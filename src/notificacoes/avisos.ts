// Agenda os avisos no Android (docs/notificacoes.md). Tudo é refeito ao abrir o app e
// sempre que algo relevante muda (horários, avisos ligados, Bom dia aberto, sol marcado).
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { ConfigSono, Dia, Habito, HabitoFeito, Tarefa } from '../dados/banco'
import type { AvisoGatilho } from '../rotina/rotina'
import { Alarmes } from './alarmes'
import {
  AVISOS_PADRAO,
  avisosDormir,
  avisosRotina,
  avisosSol,
  ehNossoAviso,
  horariosBomDia,
  idDeGatilho,
  type Aviso,
  type ConfigAvisos,
} from './agenda'

export const avisosDisponiveis = () => Capacitor.isNativePlatform()

// Canal novo (v2) com som próprio (android/app/src/main/res/raw/aviso.wav). Canais não
// mudam depois de criados; o antigo ("avisos", da 0.4.1) é apagado.
const CANAL = 'avisos_v2'
const SOM = 'aviso.wav'

export async function prepararAvisos() {
  if (!avisosDisponiveis()) return
  const p = await LocalNotifications.checkPermissions()
  if (p.display === 'prompt' || p.display === 'prompt-with-rationale') await LocalNotifications.requestPermissions()
  await LocalNotifications.deleteChannel({ id: 'avisos' }).catch(() => undefined)
  await LocalNotifications.createChannel({ id: CANAL, name: 'Avisos', importance: 5, visibility: 1, vibration: true, sound: SOM })
}

export interface DadosRotina {
  habitos: Habito[]
  feitos: HabitoFeito[]
  tarefas: Tarefa[]
}

/** Quais avisos (comuns) entram agora: hora de dormir, sol, hábitos e tarefas. */
export function avisosComuns(
  sono: ConfigSono,
  avisos: ConfigAvisos,
  hoje: Dia | null,
  agora: Date,
  rotina?: DadosRotina,
): Aviso[] {
  return [
    ...avisosDormir(
      sono,
      agora,
      [avisos.dormir60 && 60, avisos.dormir30 && 30, avisos.dormir0 && 0].filter((v) => v !== false),
    ),
    ...avisosSol(
      hoje?.bom_dia_em ?? null,
      hoje?.sol_em ?? null,
      agora,
      [avisos.sol30 && 30, avisos.sol60 && 60].filter((v) => v !== false),
    ),
    ...(rotina ? avisosRotina(rotina.habitos, rotina.feitos, rotina.tarefas, agora, sono) : []),
  ]
}

export async function reagendar(sono: ConfigSono, avisos: ConfigAvisos = AVISOS_PADRAO, hoje: Dia | null, rotina?: DadosRotina) {
  if (!avisosDisponiveis()) return
  const agora = new Date()

  // Bom dia (plugin próprio, insistente).
  if (avisos.bomDia) await Alarmes.agendarBomDia({ horarios: horariosBomDia(sono, agora).map((d) => d.getTime()) })
  else await Alarmes.cancelarBomDia()

  // Avisos comuns: cancela os nossos pendentes e agenda de novo.
  const pendentes = await LocalNotifications.getPending()
  const nossos = pendentes.notifications.filter((n) => ehNossoAviso(n.id))
  if (nossos.length) await LocalNotifications.cancel({ notifications: nossos.map((n) => ({ id: n.id })) })
  const lista = avisosComuns(sono, avisos, hoje, agora, rotina)
  if (lista.length === 0) return
  await LocalNotifications.schedule({
    notifications: lista.map((a) => ({
      id: a.id,
      title: a.titulo,
      body: a.texto,
      channelId: CANAL,
      sound: SOM,
      schedule: { at: a.quando, allowWhileIdle: true },
      extra: { destino: a.destino },
    })),
  })
}

/** Avisos de gatilho: saem na hora (ex.: concluí a tarefa que dispara um hábito). */
export async function avisarAgora(lista: AvisoGatilho[]) {
  if (!avisosDisponiveis() || lista.length === 0) return
  const base = Date.now()
  await LocalNotifications.schedule({
    notifications: lista.map((a, i) => ({
      id: idDeGatilho(Math.floor(base / 1000) + i),
      title: a.titulo,
      body: a.texto,
      channelId: CANAL,
      sound: SOM,
      schedule: { at: new Date(base + 1500 + i * 500), allowWhileIdle: true },
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
        sound: SOM,
        schedule: { at: new Date(Date.now() + segundos * 1000), allowWhileIdle: true },
        extra: { destino: 'sono' },
      },
    ],
  })
}
