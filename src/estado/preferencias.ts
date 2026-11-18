// Estado da interface salvo no aparelho, para o app reabrir exatamente onde estava
// (tela atual, barra do mascote aberta/recolhida, modo de cor).
// Usa localStorage porque é síncrono: ao reabrir, a tela certa aparece já no
// primeiro quadro, sem "piscar". Dados de verdade (registros) vão para o IndexedDB.
import { useCallback, useEffect, useState } from 'react'

export type Modo = 'claro' | 'escuro' | 'foco'
export const MODOS: Modo[] = ['claro', 'escuro', 'foco']

const PREFIXO = 'planner:v1:'

export function ler<T>(chave: string, padrao: T): T {
  try {
    const bruto = localStorage.getItem(PREFIXO + chave)
    return bruto === null ? padrao : (JSON.parse(bruto) as T)
  } catch {
    return padrao
  }
}

export function gravar<T>(chave: string, valor: T): void {
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(valor))
  } catch {
    // Sem armazenamento disponível (ex.: modo privado): segue sem salvar.
  }
}

/** Como useState, mas o valor fica salvo e volta igual quando o app reabre. */
export function useEstadoSalvo<T>(chave: string, padrao: T) {
  const [valor, setValor] = useState<T>(() => ler(chave, padrao))
  useEffect(() => gravar(chave, valor), [chave, valor])
  const atualizar = useCallback((novo: T | ((anterior: T) => T)) => setValor(novo), [])
  return [valor, atualizar] as const
}
