import { useNavegacao } from '../../app/navegacao'
import { useRascunho } from '../../estado/preferencias'
import { Cabecalho, Rotulo, Secao, dataCurta } from '../../ui/componentes'
import { diaLocal } from '../../util/data'
import { salvarDia, useDia } from '../dados'
import { formatarPeso, lerInteiro, lerPeso } from '../sono'

interface Formulario {
  horas: string
  minutos: string
  qualidade: string
  peso: string
  madrugada: boolean | null
  prejuizo: boolean | null
  prejuizoTexto: string
}

/** Sim/Não em dois botões. */
function SimNao({ valor, onChange, rotulo }: { valor: boolean | null; onChange: (v: boolean) => void; rotulo: string }) {
  return (
    <div className="opcoes opcoes-2" role="radiogroup" aria-label={rotulo}>
      {[true, false].map((v) => (
        <button key={String(v)} type="button" role="radio" aria-checked={valor === v} className="botao-marcavel botao-largo" onClick={() => onChange(v)}>
          {v ? 'Sim' : 'Não'}
        </button>
      ))}
    </div>
  )
}

/**
 * Tela diária (manhã): tempo de sono, qualidade, peso e duas perguntas rápidas.
 * Feita para responder logo ao acordar: poucos campos, botões grandes.
 */
export function TelaDiaria({ chave, dia }: { chave: string; dia: string }) {
  const { voltar } = useNavegacao()
  const registro = useDia(dia)
  const [rascunho, setRascunho] = useRascunho<Formulario | null>(chave, 'diaria', null)
  if (registro === undefined) return null

  const inicial: Formulario = {
    horas: registro?.sono_minutos != null ? String(Math.floor(registro.sono_minutos / 60)) : '',
    minutos: registro?.sono_minutos != null ? String(registro.sono_minutos % 60) : '',
    qualidade: registro?.qualidade != null ? String(registro.qualidade) : '',
    peso: registro?.peso_kg != null ? formatarPeso(registro.peso_kg) : '',
    madrugada: registro?.acordou_madrugada ?? null,
    prejuizo: registro?.prejuizo ?? null,
    prejuizoTexto: registro?.prejuizo_texto ?? '',
  }
  const f = rascunho ?? inicial
  const mudar = <K extends keyof Formulario>(campo: K, valor: Formulario[K]) => setRascunho({ ...f, [campo]: valor })

  const horas = lerInteiro(f.horas, 0, 23)
  const minutos = lerInteiro(f.minutos, 0, 59)
  const qualidade = lerInteiro(f.qualidade, 0, 99)
  const peso = lerPeso(f.peso)
  const erroSono = horas === undefined || minutos === undefined
  const valido = !erroSono && qualidade !== undefined && peso !== undefined

  async function salvar() {
    if (!valido) return
    const temSono = horas !== null || minutos !== null
    await salvarDia(dia, {
      sono_minutos: temSono ? (horas ?? 0) * 60 + (minutos ?? 0) : null,
      qualidade: qualidade ?? null,
      peso_kg: peso ?? null,
      acordou_madrugada: f.madrugada,
      prejuizo: f.prejuizo,
      prejuizo_texto: f.prejuizo && f.prejuizoTexto.trim() ? f.prejuizoTexto.trim() : null,
    })
    voltar()
  }

  const hoje = dia === diaLocal(new Date())
  return (
    <>
      <Cabecalho titulo={hoje ? 'Hoje' : dataCurta(`${dia}T12:00:00`)} />
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
              <input className="campo-entrada campo-numero" inputMode="numeric" aria-label="Horas" placeholder="h" value={f.horas} onChange={(e) => mudar('horas', e.target.value)} />
              <span className="campo-unidade">h</span>
              <input className="campo-entrada campo-numero" inputMode="numeric" aria-label="Minutos" placeholder="min" value={f.minutos} onChange={(e) => mudar('minutos', e.target.value)} />
              <span className="campo-unidade">min</span>
            </div>
          </Rotulo>
          {erroSono && <p className="aviso-campo">Tempo inválido.</p>}

          <Rotulo texto="Qualidade (00 a 99)">
            <input className="campo-entrada campo-numero" inputMode="numeric" value={f.qualidade} onChange={(e) => mudar('qualidade', e.target.value)} />
          </Rotulo>
          {qualidade === undefined && <p className="aviso-campo">Use um número de 0 a 99.</p>}

          <Rotulo texto="Peso (kg)">
            <input className="campo-entrada campo-numero" inputMode="decimal" value={f.peso} onChange={(e) => mudar('peso', e.target.value)} />
          </Rotulo>
          {peso === undefined && <p className="aviso-campo">Peso inválido.</p>}

          <Rotulo texto="Acordei de madrugada?">
            <SimNao rotulo="Acordei de madrugada?" valor={f.madrugada} onChange={(v) => mudar('madrugada', v)} />
          </Rotulo>

          <Rotulo texto="Tive algum prejuízo ao sono?">
            <SimNao rotulo="Tive algum prejuízo ao sono?" valor={f.prejuizo} onChange={(v) => mudar('prejuizo', v)} />
          </Rotulo>
          {f.prejuizo && (
            <textarea
              className="campo-entrada area-texto"
              rows={2}
              placeholder="O quê? (opcional)"
              aria-label="Prejuízo ao sono"
              value={f.prejuizoTexto}
              onChange={(e) => mudar('prejuizoTexto', e.target.value)}
            />
          )}

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
