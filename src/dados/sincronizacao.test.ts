import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { BancoPlanner, type Configuracoes, type NomeTabela, type Registro } from './banco'
import { criarSincronizador, type Remoto } from './sincronizacao'

/** Nuvem falsa, em memória, que pode ser "desligada" para simular falta de internet. */
function nuvemFalsa() {
  const linhas = new Map<string, Registro>()
  const nuvem = {
    online: true,
    linhas,
    remoto: {
      async enviar(_t: NomeTabela, r: Registro) {
        if (!nuvem.online) return { erro: 'sem internet' }
        linhas.set(r.user_id, r)
        return {}
      },
      async baixar(_t: NomeTabela, desde: string | null) {
        if (!nuvem.online) return { erro: 'sem internet' }
        return { dados: [...linhas.values()].filter((r) => !desde || r.updated_at >= desde) }
      },
    } satisfies Remoto,
  }
  return nuvem
}

let n = 0
let banco: BancoPlanner
beforeEach(() => {
  banco = new BancoPlanner(`teste-${n++}`)
})

const conf = (modo: 'claro' | 'escuro' | 'foco'): Configuracoes => ({
  user_id: 'u1',
  dados: { modo },
  updated_at: '',
})

describe('sincronização local primeiro', () => {
  it('grava no aparelho na hora, mesmo sem internet, e envia quando a conexão volta', async () => {
    const nuvem = nuvemFalsa()
    nuvem.online = false
    const s = criarSincronizador(banco, nuvem.remoto)

    await s.registrar('configuracoes', conf('escuro'))
    expect((await banco.configuracoes.get('u1'))?.dados.modo).toBe('escuro')

    expect((await s.sincronizar()).ok).toBe(false)
    expect(await banco.fila.count()).toBe(1) // nada foi descartado

    nuvem.online = true
    expect((await s.sincronizar()).ok).toBe(true)
    expect(await banco.fila.count()).toBe(0)
    expect((nuvem.linhas.get('u1') as Configuracoes).dados.modo).toBe('escuro')
  })

  it('baixa o que mudou em outro aparelho', async () => {
    const nuvem = nuvemFalsa()
    nuvem.linhas.set('u1', { ...conf('foco'), updated_at: '2026-11-18T10:00:00Z' })
    const s = criarSincronizador(banco, nuvem.remoto)

    await s.sincronizar()
    expect((await banco.configuracoes.get('u1'))?.dados.modo).toBe('foco')
  })

  it('alteração local ainda não enviada não é sobrescrita pela nuvem', async () => {
    const nuvem = nuvemFalsa()
    nuvem.online = false
    const s = criarSincronizador(banco, nuvem.remoto)
    await s.registrar('configuracoes', conf('escuro'))

    // Enquanto isso, a nuvem tem um valor mais antigo.
    nuvem.linhas.set('u1', { ...conf('claro'), updated_at: '2000-01-01T00:00:00Z' })
    nuvem.online = true
    await s.sincronizar()

    expect((await banco.configuracoes.get('u1'))?.dados.modo).toBe('escuro')
    expect((nuvem.linhas.get('u1') as Configuracoes).dados.modo).toBe('escuro')
  })

  it('envia na ordem em que as alterações foram feitas', async () => {
    const nuvem = nuvemFalsa()
    nuvem.online = false
    const s = criarSincronizador(banco, nuvem.remoto)
    await s.registrar('configuracoes', conf('escuro'))
    await s.registrar('configuracoes', conf('foco'))

    nuvem.online = true
    await s.sincronizar()
    expect((nuvem.linhas.get('u1') as Configuracoes).dados.modo).toBe('foco')
  })
})
