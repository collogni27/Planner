import { Browser } from '@capacitor/browser'
import { App as AppNativo } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useEffect, useState } from 'react'
import { VERSAO } from '../config'
import { buscarNovaVersao, type NovaVersao } from './atualizacao'

/** Aviso discreto "Nova versão disponível". Só no app Android (a web atualiza sozinha). */
export function AvisoAtualizacao() {
  const [nova, setNova] = useState<NovaVersao | null>(null)
  const [dispensado, setDispensado] = useState(false)

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    const verificar = () => void buscarNovaVersao(VERSAO).then(setNova)
    verificar()
    // Verifica de novo quando o app volta para a frente.
    const ouvinte = AppNativo.addListener('resume', verificar)
    return () => void ouvinte.then((o) => o.remove())
  }, [])

  if (!nova || dispensado) return null
  return (
    <div className="aviso" role="status">
      <span className="aviso-texto">Nova versão disponível ({nova.versao})</span>
      <button className="aviso-botao secundario" onClick={() => setDispensado(true)}>
        Depois
      </button>
      {/* Abre o download do APK; ao terminar, tocar no arquivo baixado e confirmar "Atualizar". */}
      <button className="aviso-botao" onClick={() => void Browser.open({ url: nova.urlApk })}>
        Atualizar
      </button>
    </div>
  )
}
