import { useState } from 'react'
import { salvarConfiguracao, useConfiguracao } from '../dados/config'
import { MODOS, useRascunho, type Modo } from '../estado/preferencias'
import { Icone } from '../icones/Icone'
import { lerHorario } from '../sono/sono'
import { Cabecalho, Secao } from '../ui/componentes'
import { inicioValido, MODO_VISUAL_PADRAO, type ConfigModoVisual } from './modoVisual'

const NOMES: Record<Modo, string> = { claro: 'Claro', escuro: 'Escuro', foco: 'Foco' }

interface Props {
  chave: string
  modo: Modo
  onFixo: (modo: Modo) => void
}

/** Mais → Modo Visual: um modo fixo, ou modos que mudam sozinhos por horário. */
export function ModoVisualTela({ chave, modo, onFixo }: Props) {
  const config = useConfiguracao()
  const [horarios, setHorarios] = useRascunho<Record<Modo, { ligado: boolean; texto: string }> | null>(chave, 'horarios', null)
  const [aviso, setAviso] = useState<string | null>(null)
  if (!config) return null

  const mv: ConfigModoVisual = config.modoVisual ?? MODO_VISUAL_PADRAO
  const variavel = mv.tipo === 'variavel'
  const f =
    horarios ??
    (Object.fromEntries(
      MODOS.map((m) => [m, { ligado: mv.inicio[m] !== null, texto: mv.inicio[m] ?? MODO_VISUAL_PADRAO.inicio[m]! }]),
    ) as Record<Modo, { ligado: boolean; texto: string }>)

  const lido = Object.fromEntries(MODOS.map((m) => [m, f[m].ligado ? lerHorario(f[m].texto) : null])) as ConfigModoVisual['inicio']
  const horarioInvalido = MODOS.some((m) => f[m].ligado && !lerHorario(f[m].texto))
  const desligados = MODOS.filter((m) => !f[m].ligado).length

  async function salvarVariavel() {
    if (horarioInvalido || !inicioValido(lido)) {
      setAviso('Use pelo menos 2 modos, com horários diferentes.')
      return
    }
    setAviso(null)
    await salvarConfiguracao({ modoVisual: { tipo: 'variavel', inicio: lido } })
    setHorarios(null)
  }

  return (
    <>
      <Cabecalho titulo="Modo Visual" />

      <Secao titulo="Modo Visual Fixo">
        <div className="opcoes" role="radiogroup" aria-label="Modo Visual Fixo">
          {MODOS.map((m) => {
            const marcado = !variavel && m === modo
            return (
              <button key={m} role="radio" aria-checked={marcado} className="botao-marcavel" onClick={() => onFixo(m)}>
                <span className="checkbox" aria-hidden="true">
                  {marcado && <Icone nome="check" tamanho={10} />}
                </span>
                {NOMES[m]}
              </button>
            )
          })}
        </div>
      </Secao>

      <Secao>
        <button className="botao-marcavel botao-largo" role="radio" aria-checked={variavel} onClick={() => void salvarVariavel()}>
          <span className="checkbox" aria-hidden="true">
            {variavel && <Icone nome="check" tamanho={10} />}
          </span>
          Modo Visual Variável
        </button>
        <div className="tabela-modos">
          {MODOS.map((m) => (
            <div key={m} className="linha-modo">
              <button
                className="botao-marcavel"
                aria-pressed={f[m].ligado}
                disabled={f[m].ligado && desligados >= 1}
                onClick={() => setHorarios({ ...f, [m]: { ...f[m], ligado: !f[m].ligado } })}
              >
                <span className="checkbox" aria-hidden="true">
                  {f[m].ligado && <Icone nome="check" tamanho={10} />}
                </span>
                {NOMES[m]}
              </button>
              <input
                className="campo-entrada campo-horario"
                inputMode="numeric"
                aria-label={`Início do modo ${NOMES[m]}`}
                disabled={!f[m].ligado}
                value={f[m].ligado ? f[m].texto : ''}
                onChange={(e) => setHorarios({ ...f, [m]: { ...f[m], texto: e.target.value } })}
                onBlur={() => setHorarios({ ...f, [m]: { ...f[m], texto: lerHorario(f[m].texto) ?? f[m].texto } })}
              />
            </div>
          ))}
        </div>
        {aviso && <p className="aviso-campo">{aviso}</p>}
        {(horarios || !variavel) && (
          <button className="botao-principal" onClick={() => void salvarVariavel()}>
            {variavel ? 'Salvar horários' : 'Usar Modo Visual Variável'}
          </button>
        )}
      </Secao>
    </>
  )
}
