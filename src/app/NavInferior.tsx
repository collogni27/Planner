import { Icone, type NomeIcone } from '../icones/Icone'
import { useNavegacao, type Aba } from './navegacao'

// Abas principais decididas com o usuário (docs/identidade-visual.md).
// "Mais" é provisória e guarda o que ainda não virou aba.
const ABAS: { id: Aba; rotulo: string; icone: NomeIcone }[] = [
  { id: 'inicio', rotulo: 'Início', icone: 'sol' },
  { id: 'rotina', rotulo: 'Rotina', icone: 'calendario' },
  { id: 'estudos', rotulo: 'Estudos', icone: 'livro' },
  { id: 'mais', rotulo: 'Mais', icone: 'mais' },
]

export function NavInferior() {
  const { aba: atual, escolherAba } = useNavegacao()
  return (
    <nav className="nav" aria-label="Abas">
      {ABAS.map((aba) => (
        <button
          key={aba.id}
          className="nav-item"
          aria-current={aba.id === atual ? 'page' : undefined}
          onClick={() => escolherAba(aba.id)}
        >
          <Icone nome={aba.icone} tamanho={22} />
          <span>{aba.rotulo}</span>
        </button>
      ))}
    </nav>
  )
}
