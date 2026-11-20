// A tela diária abre sozinha na primeira abertura do app no dia, se ainda não foi
// respondida. Antes, sincroniza (para não abrir no PC se já foi respondida no celular).
import { useEffect } from 'react'
import type { Rota } from '../app/navegacao'
import { banco } from '../dados/banco'
import { gravar, ler } from '../estado/preferencias'
import { sincronizador } from '../nuvem/supabase'
import { diaLocal } from '../util/data'
import { diaPreenchido, idDoDia } from './sono'

const CHAVE = 'diaria-aberta-em'

export function useTelaDiariaAutomatica(abrir: (rota: Rota) => void) {
  useEffect(() => {
    let cancelado = false
    async function verificar() {
      const hoje = diaLocal(new Date())
      if (ler(CHAVE, '') === hoje) return // já abriu hoje neste aparelho
      await sincronizador.sincronizar() // sem internet, falha rápido e segue
      const registro = await banco.dias.get(idDoDia(hoje))
      if (cancelado || ler(CHAVE, '') === hoje) return
      gravar(CHAVE, hoje)
      if (!diaPreenchido(registro) || registro?.deleted_at) abrir({ tela: 'diaria', dia: hoje })
    }
    void verificar()
    // Também ao voltar para o app (ex.: deixado aberto de um dia para o outro).
    const aoVoltar = () => document.visibilityState === 'visible' && void verificar()
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      cancelado = true
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [abrir])
}

/** Modo Desenvolvedor: faz o app agir como se ainda não tivesse sido aberto hoje. */
export function esquecerAberturaDeHoje() {
  gravar(CHAVE, '')
}

/** Marca que a tela diária já foi aberta hoje (ex.: pelo Bom dia), para não abrir de novo. */
export function marcarAberturaDeHoje() {
  gravar(CHAVE, diaLocal(new Date()))
}
