// Verificação de atualização do APK: consulta a última Release do GitHub e
// compara com a versão instalada. O Android exige que o usuário confirme a
// instalação; o app só avisa e abre o download.
export const URL_ULTIMA_RELEASE = 'https://api.github.com/repos/collogni27/Planner/releases/latest'

export interface NovaVersao {
  versao: string
  urlApk: string
}

/** Compara "1.2.3" com "1.10.0": negativo se a < b, zero se iguais, positivo se a > b. */
export function compararVersoes(a: string, b: string): number {
  const pa = a.replace(/^v/, '').split('.').map(Number)
  const pb = b.replace(/^v/, '').split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d !== 0) return d
  }
  return 0
}

interface ReleaseGitHub {
  tag_name: string
  assets: { name: string; browser_download_url: string }[]
}

/** Lê a resposta da API do GitHub e diz se há versão mais nova com APK. */
export function analisarRelease(release: ReleaseGitHub, versaoAtual: string): NovaVersao | null {
  const apk = release.assets.find((a) => a.name.endsWith('.apk'))
  if (!apk || compararVersoes(release.tag_name, versaoAtual) <= 0) return null
  return { versao: release.tag_name.replace(/^v/, ''), urlApk: apk.browser_download_url }
}

export async function buscarNovaVersao(versaoAtual: string): Promise<NovaVersao | null> {
  try {
    const resposta = await fetch(URL_ULTIMA_RELEASE, { headers: { Accept: 'application/vnd.github+json' } })
    if (!resposta.ok) return null
    return analisarRelease((await resposta.json()) as ReleaseGitHub, versaoAtual)
  } catch {
    return null // sem internet: tenta na próxima abertura
  }
}
