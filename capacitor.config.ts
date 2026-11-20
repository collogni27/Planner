import type { CapacitorConfig } from '@capacitor/cli'

// ATENÇÃO: o appId (applicationId do Android) NUNCA pode mudar.
// Mudar = o Android trata como outro app, e atualizar por cima deixa de funcionar.
const config: CapacitorConfig = {
  appId: 'io.github.collogni27.planner',
  appName: 'Planner',
  webDir: 'dist',
  android: {
    backgroundColor: '#F1FAFA',
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_planner',
      iconColor: '#0A7A73',
    },
  },
}

export default config
