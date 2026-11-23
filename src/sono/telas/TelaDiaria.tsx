import { useNota } from '../../rotina/dados'
import { somarDias } from '../../rotina/rotina'
import { useNavegacao } from '../../app/navegacao'
import { useRascunho } from '../../estado/preferencias'
import { Cabecalho, Rotulo, Secao, dataCurta } from '../../ui/componentes'
import { diaLocal } from '../../util/data'
import { salvarDia, useDia } from '../dados'
import { formatarPeso, lerInteiro, lerPeso } from '../sono'

interface Formulario {
  horas: string
  minutos: string
  peso: string
  dormiu: boolean | null
  acordou: boolean | null
}

/** Sim/Não em dois botões. */
function SimNao({ valor, onChange, rotulo }: { valor: boolean | null; onChange: (v: boolean) => void; rotulo: string }) {
  return (
    <div className="opcoes opcoes-2" role="radiogroup" aria-label={rotulo}>
      {[true, false].map((v) => (
        <button
          key={String(v)}
          type="button"
          role="radio"
          aria-checked={valor === v}
          className="botao-marcavel botao-largo"
          onClick={() => onChange(v)}
        >
          {v ? 'Sim' : 'Não'}
        </button>
      ))}
    </div>
  )
}

/**
 * Tela diária (manhã): tempo de sono, peso e se dormiu/acordou no horário.
 * Feita para responder logo ao acordar: poucos campos, botões grandes.
 */
export function TelaDiaria({ chave, dia }: { chave: string; dia: string }) {
  const { voltar } = useNavegacao()
  const registro = useDia(dia)
  // A nota escrita ontem "fica para hoje": aparece aqui de manhã (docs/modulos/notas.md).
  const notaDeOntem = useNota(somarDias(dia, -1))
  const [rascunho, setRascunho] = useRascunho<Formulario | null>(chave, 'diaria', null)
  if (registro === undefined || notaDeOntem === undefined) return null

  const inicial: Formulario = {
    horas: registro?.sono_minutos != null ? String(Math.floor(registro.sono_minutos / 60)) : '',
    minutos: registro?.sono_minutos != null ? String(registro.sono_minutos % 60) : '',
    peso: registro?.peso_kg != null ? formatarPeso(registro.peso_kg) : '',
    dormiu: registro?.dormiu_no_horario ?? null,
    acordou: registro?.acordou_no_horario ?? null,
  }
  const f = rascunho ?? inicial
  const mudar = <K extends keyof Formulario>(campo: K, valor: Formulario[K]) => setRascunho({ ...f, [campo]: valor })

  const horas = lerInteiro(f.horas, 0, 23)
  const minutos = lerInteiro(f.minutos, 0, 59)
  const peso = lerPeso(f.peso)
  const erroSono = horas === undefined || minutos === undefined
  const valido = !erroSono && peso !== undefined

  async function salvar() {
    if (!valido) return
    const temSono = horas !== null || minutos !== null
    await salvarDia(dia, {
      sono_minutos: temSono ? (horas ?? 0) * 60 + (minutos ?? 0) : null,
      peso_kg: peso ?? null,
      dormiu_no_horario: f.dormiu,
      acordou_no_horario: f.acordou,
    })
    voltar()
  }

  const hoje = dia === diaLocal(new Date())
  return (
    <>
      <Cabecalho titulo={hoje ? 'Hoje' : dataCurta(`${dia}T12:00:00`)} />
      {notaDeOntem?.texto.trim() && (
        <Secao titulo="Nota de ontem">
          <p className="texto-nota">{notaDeOntem.texto}</p>
        </Secao>
      )}
      <Secao>
        <form
          className="formulario"
          onSubmit={(e) => {
            e.preventDefault()
            void salvar()
          }}
        >
          <Rotulo texto="Tempo de sono">
            <div className="campos-lado">
              <input
                className="campo-entrada campo-numero"
                inputMode="numeric"
                aria-label="Horas"
                placeholder="h"
                value={f.horas}
                onChange={(e) => mudar('horas', e.target.value)}
              />
              <span className="campo-unidade">h</span>
              <input
                className="campo-entrada campo-numero"
                inputMode="numeric"
                aria-label="Minutos"
                placeholder="min"
                value={f.minutos}
                onChange={(e) => mudar('minutos', e.target.value)}
              />
              <span className="campo-unidade">min</span>
            </div>
          </Rotulo>
          {erroSono && <p className="aviso-campo">Tempo inválido.</p>}

          <Rotulo texto="Peso (kg)">
            <input
              className="campo-entrada campo-numero"
              inputMode="decimal"
              value={f.peso}
              onChange={(e) => mudar('peso', e.target.value)}
            />
          </Rotulo>
          {peso === undefined && <p className="aviso-campo">Peso inválido.</p>}

          <Rotulo texto="Dormi no horário esperado?">
            <SimNao rotulo="Dormi no horário esperado?" valor={f.dormiu} onChange={(v) => mudar('dormiu', v)} />
          </Rotulo>

          <Rotulo texto="Acordei no horário esperado?">
            <SimNao rotulo="Acordei no horário esperado?" valor={f.acordou} onChange={(v) => mudar('acordou', v)} />
          </Rotulo>

          <button className="botao-principal botao-grande" type="submit" disabled={!valido}>
            Salvar
          </button>
        </form>
      </Secao>
      {hoje && !rascunho && !registro && (
        <div className="acoes">
          <button className="botao-secundario" onClick={voltar}>
            Agora não
          </button>
        </div>
      )}
    </>
  )
}
