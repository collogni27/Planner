// Identificadores.

/**
 * Identificador fixo calculado a partir de um texto (ex.: objetivo + conteúdo).
 * Celular e PC chegam ao mesmo identificador, então a conversão feita nos dois
 * aparelhos não cria vínculos duplicados.
 */
export function idFixo(texto: string): string {
  const partes = [0x811c9dc5, 0x01000193, 0x2f6b7a1d, 0x6c8e9cf5].map((semente) => {
    let h = semente >>> 0
    for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 16777619) >>> 0
    return h.toString(16).padStart(8, '0')
  })
  const hex = partes.join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}
