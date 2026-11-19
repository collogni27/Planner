// Sincronização "local primeiro":
// 1. registrar(): grava no banco local E coloca na fila, numa única transação
//    (ou as duas coisas acontecem, ou nenhuma — nada se perde no meio).
// 2. sincronizar(): envia a fila ao Supabase (em ordem, em lotes) e depois baixa
//    o que mudou na nuvem (ex.: algo feito no PC).
// Um item só sai da fila depois que o Supabase confirmou. Sem internet, a fila
// espera; nada é descartado.
import { TABELAS, type BancoPlanner, type NomeTabela, type Registro } from './banco'

/** O que a sincronização precisa da nuvem (o Supabase, ou um falso nos testes). */
export interface Remoto {
  enviar(tabela: NomeTabela, registros: Registro[]): Promise<{ erro?: string }>
  /** Uma página de registros alterados desde `desde` (ordenados por updated_at). */
  baixar(tabela: NomeTabela, desde: string | null, pagina: number): Promise<{ dados?: Registro[]; erro?: string }>
}

export interface ResultadoSincronizacao {
  ok: boolean
  erro?: string
}

export const TAMANHO_LOTE = 200
export const TAMANHO_PAGINA = 1000

const chaveDe = (tabela: NomeTabela, registro: Registro) =>
  String((registro as unknown as Record<string, unknown>)[TABELAS[tabela]])

// Datas vindas do Supabase ("…+00:00") e do aparelho ("…Z") são comparadas como datas.
const momento = (iso: string) => Date.parse(iso)

export function criarSincronizador(banco: BancoPlanner, remoto: Remoto) {
  let emAndamento: Promise<ResultadoSincronizacao> | null = null

  /** Grava vários registros de uma tabela e põe todos na fila, numa transação só. */
  async function registrarVarios<T extends Registro>(tabela: NomeTabela, registros: T[]): Promise<void> {
    if (registros.length === 0) return
    const agora = new Date().toISOString()
    const comData = registros.map((r) => ({ ...r, updated_at: agora }))
    await banco.transaction('rw', banco.table(tabela), banco.fila, async () => {
      await banco.table(tabela).bulkPut(comData)
      await banco.fila.bulkAdd(
        comData.map((registro) => ({
          tabela,
          chave: chaveDe(tabela, registro),
          registro,
          criadoEm: agora,
          tentativas: 0,
        })),
      )
    })
  }

  const registrar = <T extends Registro>(tabela: NomeTabela, registro: T) => registrarVarios(tabela, [registro])

  async function enviarFila(): Promise<ResultadoSincronizacao> {
    for (;;) {
      const itens = await banco.fila.orderBy('id').limit(TAMANHO_LOTE).toArray()
      if (itens.length === 0) return { ok: true }

      // Lote = itens seguidos da mesma tabela (mantém a ordem entre tabelas).
      const lote = [itens[0]]
      for (const item of itens.slice(1)) {
        if (item.tabela !== lote[0].tabela) break
        lote.push(item)
      }
      // Se o mesmo registro aparece mais de uma vez no lote, vale a última versão.
      const ultimaVersao = new Map<string, Registro>()
      for (const item of lote) ultimaVersao.set(item.chave, item.registro)

      const { erro } = await remoto.enviar(lote[0].tabela, [...ultimaVersao.values()])
      if (erro) {
        // Para na primeira falha para manter a ordem; tenta de novo depois.
        await banco.fila.update(lote[0].id!, { tentativas: lote[0].tentativas + 1, ultimoErro: erro })
        return { ok: false, erro }
      }
      await banco.fila.bulkDelete(lote.map((i) => i.id!))
    }
  }

  async function baixar(tabela: NomeTabela): Promise<ResultadoSincronizacao> {
    const chaveCursor = `baixado:${tabela}`
    const desde = (await banco.meta.get(chaveCursor))?.valor ?? null

    for (let pagina = 0; ; pagina++) {
      const { dados, erro } = await remoto.baixar(tabela, desde, pagina)
      if (erro || !dados) return { ok: false, erro }

      await banco.transaction('rw', banco.table(tabela), banco.fila, banco.meta, async () => {
        let cursor = (await banco.meta.get(chaveCursor))?.valor ?? null
        for (const remotoReg of dados) {
          const chave = chaveDe(tabela, remotoReg)
          // Alteração local ainda não enviada vence: ela vai sobrescrever a nuvem.
          const pendentes = await banco.fila.where('[tabela+chave]').equals([tabela, chave]).count()
          if (pendentes === 0) {
            const local = (await banco.table(tabela).get(chave)) as Registro | undefined
            if (!local || momento(remotoReg.updated_at) >= momento(local.updated_at)) {
              await banco.table(tabela).put(remotoReg)
            }
          }
          if (!cursor || momento(remotoReg.updated_at) > momento(cursor)) cursor = remotoReg.updated_at
        }
        if (cursor) await banco.meta.put({ chave: chaveCursor, valor: cursor })
      })
      if (dados.length < TAMANHO_PAGINA) return { ok: true }
    }
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

  return { registrar, registrarVarios, sincronizar }
}

export type Sincronizador = ReturnType<typeof criarSincronizador>
