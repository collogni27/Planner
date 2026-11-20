// Plugin Android próprio (android/.../AlarmesPlugin.java): aviso "Bom dia" e ajustes.
import { registerPlugin, type PluginListenerHandle } from '@capacitor/core'

export interface Alarmes {
  agendarBomDia(o: { horarios: number[] }): Promise<void>
  cancelarBomDia(): Promise<void>
  testarBomDia(o: { segundos: number }): Promise<void>
  estadoBomDia(): Promise<{ tocando: boolean }>
  encerrarBomDia(): Promise<void>
  destinoPendente(): Promise<{ destino: string | null }>
  permissoes(): Promise<{ alarmesExatos: boolean; semOtimizacaoBateria: boolean }>
  abrirAjusteAlarmes(): Promise<void>
  abrirAjusteBateria(): Promise<void>
  abrirAjusteNotificacoes(): Promise<void>
  addListener(evento: 'destino', f: (e: { destino: string }) => void): Promise<PluginListenerHandle>
}

export const Alarmes = registerPlugin<Alarmes>('Alarmes')
