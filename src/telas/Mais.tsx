import { Icone } from '../icones/Icone'

export type TelaDeMais = 'configuracoes'

/** Tela provisória "Mais": dá acesso aos módulos enquanto as abas principais não são definidas. */
export function Mais({ onAbrir }: { onAbrir: (tela: TelaDeMais) => void }) {
  return (
    <>
      <section className="card lista">
        <button className="lista-item" onClick={() => onAbrir('configuracoes')}>
          <span>Configurações</span>
          <Icone nome="direita" tamanho={12} />
        </button>
      </section>
      <p className="texto-secundario nota-rodape">Os módulos aparecem aqui conforme forem construídos.</p>
    </>
  )
}
