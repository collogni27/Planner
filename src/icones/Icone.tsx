// Ícones em pixel art (grade 16x16, preenchimento sólido), tirados da referência
// docs/design/referencia-tela-inicio.html. Usam a cor do texto (currentColor).

const PIXEL = {
  sol: 'M6 6h4v4h-4z M7 1h2v3h-2z M7 12h2v3h-2z M1 7h3v2h-3z M12 7h3v2h-3z M3 3h2v2h-2z M11 3h2v2h-2z M3 11h2v2h-2z M11 11h2v2h-2z',
  interrogacao: 'M5 1h6v2h-6z M3 3h2v3h-2z M11 3h2v4h-2z M9 7h2v2h-2z M7 9h2v2h-2z M7 13h2v2h-2z',
  notas: 'M2 1h12v2h-12z M2 13h12v2h-12z M2 1h2v14h-2z M12 1h2v14h-2z M5 5h6v2h-6z M5 9h4v2h-4z',
  lapis: 'M11 1h3v3h-3z M9 3h3v3h-3z M7 5h3v3h-3z M5 7h3v3h-3z M3 9h3v3h-3z M1 12h3v3h-3z',
  lua: 'M6 1h6v2h-6z M4 3h4v2h-4z M3 5h3v6h-3z M4 11h4v2h-4z M6 13h6v2h-6z M11 11h3v2h-3z',
  halter: 'M1 6h2v5h-2z M3 4h3v9h-3z M6 7h5v3h-5z M11 4h3v9h-3z M14 6h2v5h-2z',
  mais: 'M3 7h2v2h-2z M7 7h2v2h-2z M11 7h2v2h-2z',
  terminal: 'M2 4h2v2h-2z M4 6h2v2h-2z M6 8h2v2h-2z M4 10h2v2h-2z M2 12h2v2h-2z M9 12h5v2h-5z',
  livro: 'M1 3h6v10h-6z M9 3h6v10h-6z M7 12h2v2h-2z',
  calendario: 'M1 3h14v3h-14z M1 6h2v9h-2z M13 6h2v9h-2z M3 13h10v2h-10z M4 1h2v3h-2z M10 1h2v3h-2z M5 8h2v2h-2z M9 8h2v2h-2z M5 11h2v1h-2z M9 11h2v1h-2z',
} as const

// Setas e "check" da referência (traço, não pixel).
const TRACO = {
  cima: { viewBox: '0 0 18 18', d: 'M4 11.5l5-5 5 5', largura: 2.2 },
  baixo: { viewBox: '0 0 18 18', d: 'M4 6.5l5 5 5-5', largura: 2.4 },
  direita: { viewBox: '0 0 18 18', d: 'M6.5 4l5 5-5 5', largura: 2.4 },
  esquerda: { viewBox: '0 0 18 18', d: 'M11.5 4l-5 5 5 5', largura: 2.4 },
  check: { viewBox: '0 0 14 14', d: 'M2.5 7.5l3 3 6-7', largura: 2.6 },
} as const

export type NomeIcone = keyof typeof PIXEL | keyof typeof TRACO

export function Icone({ nome, tamanho = 16 }: { nome: NomeIcone; tamanho?: number }) {
  if (nome in PIXEL) {
    return (
      <svg width={tamanho} height={tamanho} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
        <path d={PIXEL[nome as keyof typeof PIXEL]} fill="currentColor" />
      </svg>
    )
  }
  const t = TRACO[nome as keyof typeof TRACO]
  return (
    <svg width={tamanho} height={tamanho} viewBox={t.viewBox} aria-hidden="true">
      <path d={t.d} fill="none" stroke="currentColor" strokeWidth={t.largura} strokeLinecap="square" />
    </svg>
  )
}
