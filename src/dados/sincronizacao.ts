// Sincronização "local primeiro":
// 1. registrar(): grava no banco local E coloca na fila, numa única transação
//    (ou as duas coisas acontecem, ou nenhuma — nada se perde no meio).
// 2. sincronizar(): envia a fila ao Supabase (em ordem) e depois baixa o que
//    mudou na nuvem (ex.: algo feito no PC).
// Um item só sai da fila depois que o Supabase confirmou. Sem internet, a fila
// espera; nada é descartado.
import { TABELAS, type BancoPlanner, type NomeTabela, type Registro } from './banco'

/** O que a sincronização precisa da nuvem (o Supabase, ou um falso nos testes). */
export interface Remoto {
  enviar(tabela: NomeTabela, registro: Registro): Promise<{ erro?: string }>
  baixar(tabela: NomeTabela, desde: string | null): Promise<{ dados?: Registro[]; erro?: string }>
}

export interface ResultadoSincronizacao {
  ok: boolean
  erro?: string
}

const chaveDe = (tabela: NomeTabela, registro: Registro) =>
  String((registro as unknown as Record<string, unknown>)[TABELAS[tabela]])

export function criarSincronizador(banco: BancoPlanner, remoto: Remoto) {
  let emAndamento: Promise<ResultadoSincronizacao> | null = null

  async function registrar<T extends Registro>(tabela: NomeTabela, registro: T): Promise<void> {
    const comData = { ...registro, updated_at: new Date().toISOString() }
    await banco.transaction('rw', banco.table(tabela), banco.fila, async () => {
      await banco.table(tabela).put(comData)
      await banco.fila.add({
        tabela,
        chave: chaveDe(tabela, comData),
        registro: comData,
        criadoEm: new Date().toISOString(),
        tentativas: 0,
      })
    })
  }

  async function enviarFila(): Promise<ResultadoSincronizacao> {
    const itens = await banco.fila.orderBy('id').toArray()
    for (const item of itens) {
      const { erro } = await remoto.enviar(item.tabela, item.registro)
      if (erro) {
        // Para na primeira falha para manter a ordem; tenta de novo depois.
        await banco.fila.update(item.id!, { tentativas: item.tentativas + 1, ultimoErro: erro })
        return { ok: false, erro }
      }
      await banco.fila.delete(item.id!)
    }
    return { ok: true }
  }

  async function baixar(tabela: NomeTabela): Promise<ResultadoSincronizacao> {
    const chaveCursor = `baixado:${tabela}`
    const desde = (await banco.meta.get(chaveCursor))?.valor ?? null
    const { dados, erro } = await remoto.baixar(tabela, desde)
    if (erro || !dados) return { ok: false, erro }

    let cursor = desde
    await banco.transaction('rw', banco.table(tabela), banco.fila, banco.meta, async () => {
      for (const remotoReg of dados) {
        const chave = chaveDe(tabela, remotoReg)
        // Alteração local ainda não enviada vence: ela vai sobrescrever a nuvem.
        const pendentes = await banco.fila.where('[tabela+chave]').equals([tabela, chave]).count()
        if (pendentes === 0) {
          const local = (await banco.table(tabela).get(chave)) as Registro | undefined
          if (!local || remotoReg.updated_at >= local.updated_at) {
            await banco.table(tabela).put(remotoReg)
          }
        }
        if (!cursor || remotoReg.updated_at > cursor) cursor = remotoReg.updated_at
      }
      if (cursor) await banco.meta.put({ chave: chaveCursor, valor: cursor })
    })
    return { ok: true }
  }

  /** Envia a fila e baixa as novidades. Chamadas simultâneas compartilham a mesma rodada. */
  function sincronizar(): Promise<ResultadoSincronizacao> {
    if (emAndamento) return emAndamento
    emAndamento = (async () => {
      try {
        const envio = await enviarFila()
        if (!envio.ok) return envio
        for (const tabela of Object.keys(TABELAS) as NomeTabela[]) {
          const r = await baixar(tabela)
          if (!r.ok) return r
        }
        return { ok: true }
      } catch (e) {
        return { ok: false, erro: e instanceof Error ? e.message : String(e) }
      } finally {
        emAndamento = null
      }
    })()
    return emAndamento
  }

  return { registrar, sincronizar }
}

export type Sincronizador = ReturnType<typeof criarSincronizador>
