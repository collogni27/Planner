// Entregar um arquivo ao usuário: no PC baixa direto; no Android salva e abre o
// menu "Compartilhar" (dá para salvar no Drive, nos Arquivos, mandar para si mesmo…).
import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

export async function entregarArquivo(nome: string, conteudo: string, tipo: string) {
  if (Capacitor.isNativePlatform()) {
    const { uri } = await Filesystem.writeFile({ path: nome, data: conteudo, directory: Directory.Cache, encoding: Encoding.UTF8 })
    await Share.share({ title: nome, files: [uri] })
    return
  }
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }))
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Copia texto; devolve false se o aparelho não deixar. */
export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    return false
  }
}
