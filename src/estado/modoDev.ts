// Modo Desenvolvedor: ferramentas de teste escondidas atrás de uma senha.
// Não é segurança (o código é público); só evita tocar nelas sem querer.
// Guardamos o resumo (SHA-256) da senha, não a senha em si.
import { useSyncExternalStore } from 'react'
import { gravar, ler } from './preferencias'

const RESUMO_SENHA = '4026a4c591d3706a41b7e4d18525dc9eac8bcf7a1a7ecf1659736b03efb11bcf'
const CHAVE = 'modo-dev'
const ouvintes = new Set<() => void>()

export async function senhaCorreta(senha: string): Promise<boolean> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(senha))
  const hex = [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return hex === RESUMO_SENHA
}

export function definirModoDev(ativo: boolean) {
  gravar(CHAVE, ativo)
  ouvintes.forEach((o) => o())
}

export function useModoDev(): boolean {
  return useSyncExternalStore(
    (o) => {
      ouvintes.add(o)
      return () => ouvintes.delete(o)
    },
    () => ler(CHAVE, false),
  )
}
