// Leitura e gravação do sono (registros diários e configuração).
import { useLiveQuery } from 'dexie-react-hooks'
import { ativo, agoraISO, banco, type ConfigSono, type Dia } from '../dados/banco'
import { salvarConfiguracao } from '../dados/config'
import { sincronizador } from '../nuvem/supabase'
import { CONFIG_SONO_PADRAO, diaVazio, idDoDia } from './sono'

async function salvar(d: Dia) {
  await sincronizador.registrar('dias', d)
  void sincronizador.sincronizar()
}

export const useDia = (dia: string) =>
  useLiveQuery(async () => {
    const d = await banco.dias.get(idDoDia(dia))
    return ativo(d) ? d : null
  }, [dia])

/** Registros a partir de uma data (inclusive), do mais recente para o mais antigo. */
export const useDias = (desde: string) =>
  useLiveQuery(async () => (await banco.dias.where('dia').aboveOrEqual(desde).toArray()).filter(ativo).sort((a, b) => b.dia.localeCompare(a.dia)), [desde])

/** Grava campos de um dia (cria o registro se ainda não existe). */
export async function salvarDia(dia: string, campos: Partial<Dia>) {
  const atual = await banco.dias.get(idDoDia(dia))
  await salvar({ ...(ativo(atual) ? atual : diaVazio(dia)), ...campos })
}

/** "Tomei sol": marca agora ou desmarca. */
export const marcarSol = (dia: string, tomou: boolean) => salvarDia(dia, { sol_em: tomou ? agoraISO() : null })

// ---------- Configuração (horários-alvo e meta), dentro de configuracoes.dados ----------

export const useConfigSono = () =>
  useLiveQuery(async (): Promise<ConfigSono> => {
    const conf = await banco.configuracoes.toCollection().first()
    return conf?.dados.sono ?? CONFIG_SONO_PADRAO
  })

export const salvarConfigSono = (sono: ConfigSono) => salvarConfiguracao({ sono })
