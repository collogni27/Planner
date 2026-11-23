import { useNavegacao } from '../../app/navegacao'
import { Icone } from '../../icones/Icone'
import { Cabecalho, Item, Secao, Vazio } from '../../ui/componentes'
import { diaLocal } from '../../util/data'
import { marcarSol, useConfigSono, useDia, useDias } from '../dados'
import { diaPreenchido, dormiuMeta, formatarPeso, inicioDas4Semanas, pesoPorSemana, resumirSono, textoDuracao } from '../sono'
import { GraficoPeso } from './GraficoPeso'
import type { Dia } from '../../dados/banco'

const qtdDias = (n: number) => (n === 1 ? '1 dia' : `${n} dias`)

export const resumoDoDia = (d: Dia) =>
  [d.sono_minutos !== null && textoDuracao(d.sono_minutos), d.peso_kg !== null && `${formatarPeso(d.peso_kg)} kg`]
    .filter(Boolean)
    .join(' · ')

/** Sono: hoje, "tomei sol", resumo das últimas 4 semanas e histórico. */
export function SonoTela() {
  const { abrir } = useNavegacao()
  const hoje = diaLocal(new Date())
  const registro = useDia(hoje)
  const dias = useDias(inicioDas4Semanas(hoje))
  const config = useConfigSono()
  if (registro === undefined || !dias || !config) return null

  const r = resumirSono(dias, config.metaMinutos, hoje)
  const tomouSol = !!registro?.sol_em
  const meta = registro ? dormiuMeta(registro, config.metaMinutos) : null

  return (
    <>
      <Cabecalho titulo="Sono" />

      <Secao titulo="Hoje">
        {diaPreenchido(registro) ? (
          <>
            <span className="numero-grande">{registro!.sono_minutos !== null ? textoDuracao(registro!.sono_minutos) : '–'}</span>
            {meta !== null && (
              <p className="texto-secundario">
                {meta ? 'Meta atingida' : `Abaixo da meta de ${textoDuracao(config.metaMinutos)}`}
              </p>
            )}
            {registro!.peso_kg !== null && (
              <div className="linha-info">
                <span className="texto-secundario">Peso</span>
                <span className="numero-destaque">{formatarPeso(registro!.peso_kg)} kg</span>
              </div>
            )}
            {registro!.dormiu_no_horario != null && (
              <div className="linha-info">
                <span className="texto-secundario">Dormi no horário</span>
                <span>{registro!.dormiu_no_horario ? 'sim' : 'não'}</span>
              </div>
            )}
            {registro!.acordou_no_horario != null && (
              <div className="linha-info">
                <span className="texto-secundario">Acordei no horário</span>
                <span>{registro!.acordou_no_horario ? 'sim' : 'não'}</span>
              </div>
            )}
            <button className="botao-secundario" onClick={() => abrir({ tela: 'diaria', dia: hoje })}>
              Editar
            </button>
          </>
        ) : (
          <button className="botao-principal" onClick={() => abrir({ tela: 'diaria', dia: hoje })}>
            Preencher
          </button>
        )}
        <button className="botao-marcavel botao-largo" aria-pressed={tomouSol} onClick={() => void marcarSol(hoje, !tomouSol)}>
          <span className="checkbox" aria-hidden="true">
            {tomouSol && <Icone nome="check" tamanho={10} />}
          </span>
          Tomei sol
        </button>
      </Secao>

      <Secao titulo="Últimas 4 semanas">
        {r.diasComRegistro === 0 ? (
          <Vazio>Sem registros ainda.</Vazio>
        ) : (
          <>
            {r.mediaMinutos !== null && (
              <div className="linha-info">
                <span className="texto-secundario">Média de sono</span>
                <span className="numero-destaque">{textoDuracao(r.mediaMinutos)}</span>
              </div>
            )}
            {r.comTempo > 0 && (
              <div className="linha-info">
                <span className="texto-secundario">Meta atingida</span>
                <span>
                  {r.metaAtingida} de {qtdDias(r.comTempo)}
                </span>
              </div>
            )}
            {r.respondeuDormir > 0 && (
              <div className="linha-info">
                <span className="texto-secundario">Dormi no horário</span>
                <span>
                  {r.dormiuNoHorario} de {qtdDias(r.respondeuDormir)}
                </span>
              </div>
            )}
            {r.respondeuAcordar > 0 && (
              <div className="linha-info">
                <span className="texto-secundario">Acordei no horário</span>
                <span>
                  {r.acordouNoHorario} de {qtdDias(r.respondeuAcordar)}
                </span>
              </div>
            )}
            <div className="linha-info">
              <span className="texto-secundario">Tomei sol</span>
              <span>{qtdDias(r.sol)}</span>
            </div>
          </>
        )}
      </Secao>

      <Secao titulo="Evolução do Peso">
        <GraficoPeso semanas={pesoPorSemana(dias, hoje)} />
      </Secao>

      <Secao>
        <Item titulo="Histórico" onClick={() => abrir({ tela: 'sono-historico' })} />
      </Secao>
      <Secao>
        <Item titulo="Metas de sono" onClick={() => abrir({ tela: 'sono-config' })} />
      </Secao>
    </>
  )
}
