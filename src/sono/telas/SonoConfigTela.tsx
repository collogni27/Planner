import { useState } from 'react'
import { useNavegacao } from '../../app/navegacao'
import { useRascunho } from '../../estado/preferencias'
import { Cabecalho, Rotulo, Secao } from '../../ui/componentes'
import { salvarConfigSono, useConfigSono } from '../dados'
import { DIAS_SEMANA, dormirValido, lerHorario, lerInteiro } from '../sono'

interface Formulario {
  horarios: { dormir: string; acordar: string }[]
  metaHoras: string
  metaMinutos: string
}

/** Horários-alvo por dia da semana (dormir e acordar) e meta de horas de sono. */
export function SonoConfigTela({ chave }: { chave: string }) {
  const { voltar } = useNavegacao()
  const config = useConfigSono()
  const [rascunho, setRascunho] = useRascunho<Formulario | null>(chave, 'config', null)
  const [tentou, setTentou] = useState(false)
  if (!config) return null

  const f: Formulario = rascunho ?? {
    horarios: config.horarios.map((h) => ({ ...h })),
    metaHoras: String(Math.floor(config.metaMinutos / 60)),
    metaMinutos: String(config.metaMinutos % 60),
  }
  const mudarHorario = (i: number, campo: 'dormir' | 'acordar', valor: string) =>
    setRascunho({ ...f, horarios: f.horarios.map((h, j) => (j === i ? { ...h, [campo]: valor } : h)) })

  const lidos = f.horarios.map((h) => ({ dormir: lerHorario(h.dormir), acordar: lerHorario(h.acordar) }))
  const erros = lidos.map((h) => !h.dormir || !dormirValido(h.dormir) || !h.acordar)
  const metaH = lerInteiro(f.metaHoras, 0, 14)
  const metaM = lerInteiro(f.metaMinutos, 0, 59)
  const valido = !erros.some(Boolean) && metaH != null && metaM !== undefined

  async function salvar() {
    setTentou(true)
    if (!valido) return
    await salvarConfigSono({
      horarios: lidos.map((h) => ({ dormir: h.dormir!, acordar: h.acordar! })),
      metaMinutos: metaH! * 60 + (metaM ?? 0),
    })
    voltar()
  }

  return (
    <>
      <Cabecalho titulo="Metas de sono" />
      <Secao titulo="Horários">
        <div className="tabela-horarios">
          <span />
          <span className="campo-rotulo">Dormir</span>
          <span className="campo-rotulo">Acordar</span>
          {f.horarios.map((h, i) => (
            <div key={i} className="linha-horario" data-erro={tentou && erros[i] ? 'sim' : undefined}>
              <span>{DIAS_SEMANA[i]}</span>
              <input
                className="campo-entrada campo-horario"
                inputMode="numeric"
                aria-label={`${DIAS_SEMANA[i]}: dormir`}
                value={h.dormir}
                onChange={(e) => mudarHorario(i, 'dormir', e.target.value)}
                onBlur={() => mudarHorario(i, 'dormir', lerHorario(h.dormir) ?? h.dormir)}
              />
              <input
                className="campo-entrada campo-horario"
                inputMode="numeric"
                aria-label={`${DIAS_SEMANA[i]}: acordar`}
                value={h.acordar}
                onChange={(e) => mudarHorario(i, 'acordar', e.target.value)}
                onBlur={() => mudarHorario(i, 'acordar', lerHorario(h.acordar) ?? h.acordar)}
              />
            </div>
          ))}
        </div>
        {tentou && erros.some(Boolean) && <p className="aviso-campo">Confira os horários marcados. A hora de dormir fica entre 18:00 e 23:59.</p>}
        <button
          className="botao-secundario"
          onClick={() => setRascunho({ ...f, horarios: f.horarios.map(() => ({ ...f.horarios[0] })) })}
        >
          Usar os horários de domingo em todos os dias
        </button>
      </Secao>

      <Secao titulo="Meta de sono">
        <Rotulo texto="Dormir ao menos">
          <div className="campos-lado">
            <input className="campo-entrada campo-numero" inputMode="numeric" aria-label="Horas da meta" value={f.metaHoras} onChange={(e) => setRascunho({ ...f, metaHoras: e.target.value })} />
            <span className="campo-unidade">h</span>
            <input className="campo-entrada campo-numero" inputMode="numeric" aria-label="Minutos da meta" value={f.metaMinutos} onChange={(e) => setRascunho({ ...f, metaMinutos: e.target.value })} />
            <span className="campo-unidade">min</span>
          </div>
        </Rotulo>
      </Secao>

      <button className="botao-principal botao-grande" onClick={() => void salvar()}>
        Salvar
      </button>
    </>
  )
}
