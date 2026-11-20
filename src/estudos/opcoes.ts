// Opções das listas de escolha (Seletor) usadas em várias telas de Estudos.
import type { Baralho, Micrometa, Objetivo } from '../dados/banco'
import type { Opcao } from '../ui/dialogos'
import { objetivosDoConteudo, type Vinculos } from './modelo'

/** Conteúdos agrupados pelo (primeiro) objetivo de cada um, com uma primeira opção vazia. */
export function opcoesConteudos(objetivos: Objetivo[], conteudos: Micrometa[], vinculos: Vinculos, vazio: string): Opcao[] {
  return [
    { valor: '', rotulo: vazio },
    ...objetivos.flatMap((o) =>
      conteudos
        .filter((m) => objetivosDoConteudo(m.id, vinculos)[0] === o.id)
        .map((m) => ({ valor: m.id, rotulo: m.nome, grupo: o.nome })),
    ),
  ]
}

export const opcoesBaralhos = (baralhos: Baralho[], vazio?: string): Opcao[] => [
  ...(vazio !== undefined ? [{ valor: '', rotulo: vazio }] : []),
  ...baralhos.map((b) => ({ valor: b.id, rotulo: b.nome })),
]
