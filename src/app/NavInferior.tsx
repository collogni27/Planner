import { Icone, type NomeIcone } from '../icones/Icone'

export type Aba = 'inicio' | 'mais'

// As abas principais ainda serão decididas com o usuário (docs/identidade-visual.md).
// Por enquanto: Início + "Mais" (tela provisória com os módulos).
const ABAS: { id: Aba; rotulo: string; icone: NomeIcone }[] = [
  { id: 'inicio', rotulo: 'Início', icone: 'sol' },
  { id: 'mais', rotulo: 'Mais', icone: 'mais' },
]

export function NavInferior({ atual, onEscolher }: { atual: Aba; onEscolher: (aba: Aba) => void }) {
  return (
    <nav className="nav" aria-label="Abas">
      {ABAS.map((aba) => (
        <button
          key={aba.id}
          className="nav-item"
          aria-current={aba.id === atual ? 'page' : undefined}
          onClick={() => onEscolher(aba.id)}
        >
          <Icone nome={aba.icone} tamanho={22} />
          <span>{aba.rotulo}</span>
        </button>
      ))}
    </nav>
  )
}
