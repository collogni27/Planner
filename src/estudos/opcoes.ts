// Opções das listas de escolha (Seletor) usadas em várias telas de Estudos.
import type { Baralho, Micrometa, Objetivo } from '../dados/banco'
import type { Opcao } from '../ui/dialogos'

/** Conteúdos agrupados pelo objetivo, com uma primeira opção vazia. */
export function opcoesConteudos(objetivos: Objetivo[], conteudos: Micrometa[], vazio: string): Opcao[] {
  return [
    { valor: '', rotulo: vazio },
    ...objetivos.flatMap((o) =>
      conteudos.filter((m) => m.objetivo_id === o.id).map((m) => ({ valor: m.id, rotulo: m.nome, grupo: o.nome })),
    ),
  ]
}

export const opcoesBaralhos = (baralhos: Baralho[], vazio?: string): Opcao[] => [
  ...(vazio !== undefined ? [{ valor: '', rotulo: vazio }] : []),
  ...baralhos.map((b) => ({ valor: b.id, rotulo: b.nome })),
]
