import { describe, expect, it } from 'vitest'
import { analisarRelease, compararVersoes } from './atualizacao'

describe('verificação de atualização', () => {
  it('compara versões número a número (1.10 é maior que 1.9)', () => {
    expect(compararVersoes('1.10.0', '1.9.9')).toBeGreaterThan(0)
    expect(compararVersoes('v0.2.1', '0.2.1')).toBe(0)
    expect(compararVersoes('0.2.0', '0.2.1')).toBeLessThan(0)
  })

  const release = (tag: string) => ({
    tag_name: tag,
    assets: [{ name: `planner-${tag}.apk`, browser_download_url: `https://exemplo/${tag}.apk` }],
  })

  it('avisa quando a Release é mais nova', () => {
    expect(analisarRelease(release('v0.2.1'), '0.2.0')).toEqual({ versao: '0.2.1', urlApk: 'https://exemplo/v0.2.1.apk' })
  })

  it('não avisa quando já está na versão mais nova (ou mais nova que a Release)', () => {
    expect(analisarRelease(release('v0.2.0'), '0.2.0')).toBeNull()
    expect(analisarRelease(release('v0.1.9'), '0.2.0')).toBeNull()
  })

  it('não avisa se a Release não tem APK', () => {
    expect(analisarRelease({ tag_name: 'v9.0.0', assets: [] }, '0.2.0')).toBeNull()
  })
})
