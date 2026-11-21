import { LocalNotifications } from '@capacitor/local-notifications'
import { useCallback, useEffect, useState } from 'react'
import { useConfiguracao, salvarConfiguracao } from '../../dados/config'
import { Icone } from '../../icones/Icone'
import { useDia } from '../../sono/dados'
import { CONFIG_SONO_PADRAO } from '../../sono/sono'
import { Cabecalho, Secao, Vazio, dataCurta } from '../../ui/componentes'
import { diaLocal, horaMinuto } from '../../util/data'
import { AVISOS_PADRAO, horariosBomDia, type ConfigAvisos } from '../agenda'
import { Alarmes } from '../alarmes'
import { avisosComuns, avisosDisponiveis, testarAvisoComum } from '../avisos'

interface Permissoes {
  notificacoes: boolean
  alarmesExatos: boolean
  semOtimizacaoBateria: boolean
  fabricante: string
}

const NOMES: Record<keyof ConfigAvisos, string> = { bomDia: 'Bom dia', sol: 'Tomar sol', dormir: 'Hora de dormir' }

/** Configurações → Notificações: avisos ligados, permissões, testes e próximos avisos. */
export function NotificacoesTela() {
  const config = useConfiguracao()
  const hoje = useDia(diaLocal(new Date()))
  const [permissoes, setPermissoes] = useState<Permissoes | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)

  const lerPermissoes = useCallback(async () => {
    if (!avisosDisponiveis()) return
    const [n, a] = await Promise.all([LocalNotifications.checkPermissions(), Alarmes.permissoes()])
    setPermissoes({ notificacoes: n.display === 'granted', ...a })
  }, [])

  // Relê ao voltar dos ajustes do Android.
  useEffect(() => {
    void lerPermissoes()
    const aoVoltar = () => document.visibilityState === 'visible' && void lerPermissoes()
    document.addEventListener('visibilitychange', aoVoltar)
    return () => document.removeEventListener('visibilitychange', aoVoltar)
  }, [lerPermissoes])

  if (!avisosDisponiveis()) {
    return (
      <>
        <Cabecalho titulo="Notificações" />
        <Secao>
          <Vazio>Os avisos funcionam só no app Android.</Vazio>
        </Secao>
      </>
    )
  }
  if (!config || hoje === undefined) return null

  const avisos = config.avisos ?? AVISOS_PADRAO
  const sono = config.sono ?? CONFIG_SONO_PADRAO
  const agora = new Date()
  const proximos = [
    ...(avisos.bomDia ? horariosBomDia(sono, agora).slice(0, 1).map((q) => ({ titulo: 'Bom dia', quando: q })) : []),
    ...avisosComuns(sono, avisos, hoje ?? null, agora).map((a) => ({ titulo: a.titulo, quando: a.quando })),
  ]
    .sort((a, b) => a.quando.getTime() - b.quando.getTime())
    .slice(0, 5)

  const linhaPermissao = (rotulo: string, ok: boolean, abrir: () => Promise<void>) => (
    <div className="linha-info">
      <span className="texto-secundario">{rotulo}</span>
      {ok ? (
        <span>ok</span>
      ) : (
        <button className="botao-texto" onClick={() => void abrir()}>
          Permitir
        </button>
      )}
    </div>
  )

  return (
    <>
      <Cabecalho titulo="Notificações" />

      <Secao titulo="Avisos">
        {(Object.keys(NOMES) as (keyof ConfigAvisos)[]).map((k) => (
          <button
            key={k}
            className="botao-marcavel botao-largo"
            aria-pressed={avisos[k]}
            onClick={() => void salvarConfiguracao({ avisos: { ...avisos, [k]: !avisos[k] } })}
          >
            <span className="checkbox" aria-hidden="true">
              {avisos[k] && <Icone nome="check" tamanho={10} />}
            </span>
            {NOMES[k]}
          </button>
        ))}
      </Secao>

      {permissoes && (
        <Secao titulo="Permissões">
          {linhaPermissao('Notificações', permissoes.notificacoes, async () => {
            const r = await LocalNotifications.requestPermissions()
            if (r.display !== 'granted') await Alarmes.abrirAjusteNotificacoes()
            await lerPermissoes()
          })}
          {linhaPermissao('Alarmes no minuto certo', permissoes.alarmesExatos, () => Alarmes.abrirAjusteAlarmes())}
          {linhaPermissao('Sem economia de bateria', permissoes.semOtimizacaoBateria, () => Alarmes.abrirAjusteBateria())}
          <div className="linha-info">
            <span className="texto-secundario">Som e vibração dos avisos</span>
            <button className="botao-texto" onClick={() => void Alarmes.abrirAjusteNotificacoes()}>
              Abrir
            </button>
          </div>
          {/xiaomi|redmi|poco/i.test(permissoes.fabricante) && (
            <>
              <div className="linha-info">
                <span className="texto-secundario">Início automático</span>
                <button className="botao-texto" onClick={() => void Alarmes.abrirInicioAutomatico()}>
                  Abrir
                </button>
              </div>
              <p className="texto-secundario nota-rodape">
                Na Xiaomi, ligue o Início automático do Planner e, em "Som e vibração dos avisos", ative Som, Vibração e Notificações flutuantes em
                "Avisos".
              </p>
            </>
          )}
        </Secao>
      )}

      <Secao titulo="Teste">
        <div className="botoes-linha">
          <button
            className="botao-secundario"
            onClick={() => void Alarmes.testarBomDia({ segundos: 10 }).then(() => setMensagem('O Bom dia toca em 10 segundos.'))}
          >
            Bom dia
          </button>
          <button className="botao-secundario" onClick={() => void testarAvisoComum(10).then(() => setMensagem('O aviso chega em 10 segundos.'))}>
            Aviso comum
          </button>
        </div>
        {mensagem && <p className="mensagem-ok">{mensagem}</p>}
      </Secao>

      <Secao titulo="Próximos avisos">
        {proximos.length === 0 && <Vazio>Nenhum aviso agendado.</Vazio>}
        {proximos.map((p, i) => (
          <div key={i} className="linha-info">
            <span className="texto-secundario">{p.titulo}</span>
            <span>
              {dataCurta(p.quando.toISOString())} {horaMinuto(p.quando)}
            </span>
          </div>
        ))}
      </Secao>
    </>
  )
}
