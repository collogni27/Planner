// Importação e exportação de cards (docs/modulos/estudos.md).
// Tudo aqui é lógica pura (sem banco), para ser coberta por testes.
import type { Area, Baralho, Card, Micrometa, Objetivo } from '../dados/banco'
import { estadoInicial } from './fsrs'

export interface CaminhoMicrometa {
  objetivo: string
  area: string | null
  nome: string
}

export interface LinhaImportada {
  linha: number
  baralho: string
  micrometa: CaminhoMicrometa | null
  frente: string
  verso: string
  tags: string[]
}

export interface ResultadoLeitura {
  linhas: LinhaImportada[]
  erros: string[]
}

/** Para comparar nomes e frentes: sem diferença de maiúsculas nem de espaços extras. */
export const normalizar = (t: string) => t.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR')

const semAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '')

// Nomes aceitos no cabeçalho para cada coluna.
// "micrometa" é o nome antigo de "conteudo" (aceito para arquivos já gerados).
const COLUNAS: Record<string, keyof Omit<LinhaImportada, 'linha'>> = {
  baralho: 'baralho',
  conteudo: 'micrometa',
  micrometa: 'micrometa',
  frente: 'frente',
  pergunta: 'frente',
  verso: 'verso',
  resposta: 'verso',
  tags: 'tags',
  tag: 'tags',
}

export function lerCaminho(texto: string): CaminhoMicrometa | null | 'invalido' {
  const t = texto.trim()
  if (!t) return null
  const partes = t.split('::').map((p) => p.trim())
  if (partes.some((p) => !p)) return 'invalido'
  if (partes.length === 2) return { objetivo: partes[0], area: null, nome: partes[1] }
  if (partes.length === 3) return { objetivo: partes[0], area: partes[1], nome: partes[2] }
  return 'invalido'
}

export const lerTags = (t: string | string[] | undefined) =>
  (Array.isArray(t) ? t : (t ?? '').split(/\s+/)).map((x) => x.trim()).filter(Boolean)

/** Lê texto colado ou de arquivo: JSON, ou TSV/CSV com cabeçalho. */
export function lerTexto(texto: string): ResultadoLeitura {
  const t = texto.replace(/^﻿/, '').trim()
  if (!t) return { linhas: [], erros: ['Nada para importar.'] }
  if (t.startsWith('{') || t.startsWith('[')) return lerJson(t)
  return lerSeparado(t)
}

function lerJson(t: string): ResultadoLeitura {
  let dados: unknown
  try {
    dados = JSON.parse(t)
  } catch {
    return { linhas: [], erros: ['O texto parece JSON, mas tem um erro de formato.'] }
  }
  const lista = Array.isArray(dados) ? dados : (dados as { cards?: unknown }).cards
  if (!Array.isArray(lista)) return { linhas: [], erros: ['JSON sem a lista "cards".'] }
  const brutas = lista.map((c: Record<string, unknown>) => ({
    baralho: String(c.baralho ?? ''),
    micrometa: String(c.conteudo ?? c.micrometa ?? ''),
    frente: String(c.frente ?? ''),
    verso: String(c.verso ?? ''),
    tags: c.tags as string | string[] | undefined,
  }))
  return validar(brutas, 1)
}

/** Divide o texto em linhas e campos, respeitando aspas (que podem conter quebras de linha). */
export function dividirCampos(t: string, sep: string): string[][] {
  const linhas: string[][] = []
  let campo = ''
  let linha: string[] = []
  let aspas = false
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (aspas) {
      if (c === '"' && t[i + 1] === '"') {
        campo += '"'
        i++
      } else if (c === '"') aspas = false
      else campo += c
    } else if (c === '"' && campo === '') aspas = true
    else if (c === sep) {
      linha.push(campo)
      campo = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++
      linha.push(campo)
      linhas.push(linha)
      linha = []
      campo = ''
    } else campo += c
  }
  linha.push(campo)
  linhas.push(linha)
  return linhas.filter((l) => l.some((c) => c.trim()))
}

function lerSeparado(t: string): ResultadoLeitura {
  const primeira = t.split(/\r?\n/)[0]
  const sep = primeira.includes('\t') ? '\t' : primeira.includes(';') ? ';' : ','
  const [cabecalho, ...resto] = dividirCampos(t, sep)
  const indices = cabecalho.map((nome) => COLUNAS[semAcento(normalizar(nome))])
  if (!indices.includes('frente') || !indices.includes('verso') || !indices.includes('baralho')) {
    return {
      linhas: [],
      erros: ['A primeira linha precisa ser o cabeçalho, com pelo menos as colunas baralho, frente e verso.'],
    }
  }
  const brutas = resto.map((campos) => {
    const r: Record<string, string> = {}
    indices.forEach((col, i) => {
      if (col) r[col] = campos[i] ?? ''
    })
    return { baralho: r.baralho ?? '', micrometa: r.micrometa ?? '', frente: r.frente ?? '', verso: r.verso ?? '', tags: r.tags }
  })
  return validar(brutas, 2)
}

function validar(
  brutas: { baralho: string; micrometa: string; frente: string; verso: string; tags: string | string[] | undefined }[],
  primeiraLinha: number,
): ResultadoLeitura {
  const linhas: LinhaImportada[] = []
  const erros: string[] = []
  brutas.forEach((b, i) => {
    const n = i + primeiraLinha
    const caminho = lerCaminho(b.micrometa)
    if (!b.baralho.trim()) erros.push(`Linha ${n}: falta o baralho.`)
    else if (!b.frente.trim() || !b.verso.trim()) erros.push(`Linha ${n}: falta a frente ou o verso.`)
    else if (caminho === 'invalido')
      erros.push(`Linha ${n}: conteúdo "${b.micrometa}" deve ser Objetivo::Conteúdo ou Objetivo::Área::Conteúdo.`)
    else
      linhas.push({
        linha: n,
        baralho: b.baralho.trim(),
        micrometa: caminho,
        frente: b.frente.trim(),
        verso: b.verso.trim(),
        tags: lerTags(b.tags),
      })
  })
  return { linhas, erros }
}

// ---------- Planejamento (o que será criado) ----------

export interface Existentes {
  baralhos: Baralho[]
  objetivos: Objetivo[]
  areas: Area[]
  micrometas: Micrometa[]
  cards: Card[]
}

export interface Plano {
  novos: LinhaImportada[]
  duplicados: { linha: LinhaImportada; cardId: string }[]
  repetidosNoTexto: LinhaImportada[]
  novosBaralhos: string[]
  novosObjetivos: string[]
  novasMicrometas: CaminhoMicrometa[]
}

const chaveCard = (baralho: string, frente: string) => `${normalizar(baralho)}\u0000${normalizar(frente)}`
const chaveCaminho = (c: CaminhoMicrometa) =>
  [c.objetivo, c.area ?? '', c.nome].map(normalizar).join('\u0000')

/** Separa novos, duplicados (já existem: mesma frente no mesmo baralho) e o que será criado. */
export function planejar(linhas: LinhaImportada[], ex: Existentes): Plano {
  const nomeBaralho = new Map(ex.baralhos.map((b) => [b.id, b.nome]))
  const existentes = new Map(ex.cards.map((c) => [chaveCard(nomeBaralho.get(c.baralho_id) ?? '', c.frente), c.id]))
  const baralhosExistentes = new Set(ex.baralhos.map((b) => normalizar(b.nome)))
  const objetivosExistentes = new Set(ex.objetivos.map((o) => normalizar(o.nome)))
  const caminhosExistentes = new Set(ex.micrometas.map((m) => chaveCaminho(caminhoDe(m, ex))))

  const plano: Plano = {
    novos: [],
    duplicados: [],
    repetidosNoTexto: [],
    novosBaralhos: [],
    novosObjetivos: [],
    novasMicrometas: [],
  }
  const vistosNoTexto = new Set<string>()
  for (const l of linhas) {
    const chave = chaveCard(l.baralho, l.frente)
    if (vistosNoTexto.has(chave)) {
      plano.repetidosNoTexto.push(l)
      continue
    }
    vistosNoTexto.add(chave)
    const idExistente = existentes.get(chave)
    if (idExistente) plano.duplicados.push({ linha: l, cardId: idExistente })
    else plano.novos.push(l)

    if (!baralhosExistentes.has(normalizar(l.baralho))) {
      baralhosExistentes.add(normalizar(l.baralho))
      plano.novosBaralhos.push(l.baralho)
    }
    if (l.micrometa) {
      if (!objetivosExistentes.has(normalizar(l.micrometa.objetivo))) {
        objetivosExistentes.add(normalizar(l.micrometa.objetivo))
        plano.novosObjetivos.push(l.micrometa.objetivo)
      }
      const cc = chaveCaminho(l.micrometa)
      if (!caminhosExistentes.has(cc)) {
        caminhosExistentes.add(cc)
        plano.novasMicrometas.push(l.micrometa)
      }
    }
  }
  return plano
}

function caminhoDe(m: Micrometa, ex: Pick<Existentes, 'objetivos' | 'areas'>): CaminhoMicrometa {
  return {
    objetivo: ex.objetivos.find((o) => o.id === m.objetivo_id)?.nome ?? '',
    area: ex.areas.find((a) => a.id === m.area_id)?.nome ?? null,
    nome: m.nome,
  }
}

// ---------- Registros a gravar ----------

export type ModoDuplicados = 'pular' | 'atualizar'

export interface RegistrosImportacao {
  objetivos: Objetivo[]
  areas: Area[]
  micrometas: Micrometa[]
  baralhos: Baralho[]
  cards: Card[]
}

/** Monta tudo que precisa ser gravado (criando baralhos, objetivos, áreas e micrometas que faltam). */
export function gerarRegistros(
  plano: Plano,
  modo: ModoDuplicados,
  ex: Existentes,
  gerarId: () => string,
  agora: Date,
): RegistrosImportacao {
  const r: RegistrosImportacao = { objetivos: [], areas: [], micrometas: [], baralhos: [], cards: [] }
  const proximaOrdem = (lista: { ordem: number }[]) => Math.max(0, ...lista.map((x) => x.ordem)) + 1

  const baralhos = [...ex.baralhos]
  const objetivos = [...ex.objetivos]
  const areas = [...ex.areas]
  const micrometas = [...ex.micrometas]
  const novo = { updated_at: '' }

  const idBaralho = (nome: string) => {
    let b = baralhos.find((x) => normalizar(x.nome) === normalizar(nome))
    if (!b) {
      b = { ...novo, id: gerarId(), nome, ordem: proximaOrdem(baralhos) }
      baralhos.push(b)
      r.baralhos.push(b)
    }
    return b.id
  }
  const idMicrometa = (c: CaminhoMicrometa) => {
    let o = objetivos.find((x) => normalizar(x.nome) === normalizar(c.objetivo))
    if (!o) {
      o = { ...novo, id: gerarId(), nome: c.objetivo, ordem: proximaOrdem(objetivos) }
      objetivos.push(o)
      r.objetivos.push(o)
    }
    let areaId: string | null = null
    if (c.area) {
      const objetivoId = o.id
      let a = areas.find((x) => x.objetivo_id === objetivoId && normalizar(x.nome) === normalizar(c.area!))
      if (!a) {
        a = { ...novo, id: gerarId(), objetivo_id: o.id, nome: c.area, ordem: proximaOrdem(areas.filter((x) => x.objetivo_id === objetivoId)) }
        areas.push(a)
        r.areas.push(a)
      }
      areaId = a.id
    }
    const objetivoId = o.id
    let m = micrometas.find(
      (x) => x.objetivo_id === objetivoId && x.area_id === areaId && normalizar(x.nome) === normalizar(c.nome),
    )
    if (!m) {
      m = {
        ...novo,
        id: gerarId(),
        objetivo_id: o.id,
        area_id: areaId,
        nome: c.nome,
        ordem: proximaOrdem(micrometas.filter((x) => x.objetivo_id === objetivoId)),
      }
      micrometas.push(m)
      r.micrometas.push(m)
    }
    return m.id
  }

  for (const l of plano.novos) {
    r.cards.push({
      ...novo,
      id: gerarId(),
      baralho_id: idBaralho(l.baralho),
      micrometa_id: l.micrometa ? idMicrometa(l.micrometa) : null,
      frente: l.frente,
      verso: l.verso,
      tags: l.tags,
      ...estadoInicial(agora),
    })
  }
  if (modo === 'atualizar') {
    // Atualiza só verso e tags; o progresso de memória do card é mantido.
    for (const d of plano.duplicados) {
      const atual = ex.cards.find((c) => c.id === d.cardId)
      if (atual) r.cards.push({ ...atual, verso: d.linha.verso, tags: d.linha.tags })
    }
  }
  return r
}

// ---------- Exportação ----------

export interface CardExportado {
  baralho: string
  conteudo: string
  frente: string
  verso: string
  tags: string[]
}

export function paraExportacao(cards: Card[], ex: Pick<Existentes, 'baralhos' | 'objetivos' | 'areas' | 'micrometas'>) {
  return cards.map((c): CardExportado => {
    const m = ex.micrometas.find((x) => x.id === c.micrometa_id)
    const cam = m ? caminhoDe(m, ex) : null
    return {
      baralho: ex.baralhos.find((b) => b.id === c.baralho_id)?.nome ?? '',
      conteudo: cam ? [cam.objetivo, cam.area, cam.nome].filter(Boolean).join('::') : '',
      frente: c.frente,
      verso: c.verso,
      tags: c.tags,
    }
  })
}

const campoTsv = (v: string) => (/[\t\n\r"]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)

export function gerarTsv(cards: CardExportado[]): string {
  const linhas = [['baralho', 'conteudo', 'frente', 'verso', 'tags']]
  for (const c of cards) linhas.push([c.baralho, c.conteudo, c.frente, c.verso, c.tags.join(' ')])
  return linhas.map((l) => l.map(campoTsv).join('\t')).join('\n') + '\n'
}

export const gerarJson = (cards: CardExportado[]) => JSON.stringify({ cards }, null, 2) + '\n'
