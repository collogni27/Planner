import { LocalNotifications } from '@capacitor/local-notifications'
import { useCallback, useEffect, useState } from 'react'
import { useConfiguracao, salvarConfiguracao } from '../../dados/config'
import { Icone } from '../../icones/Icone'
import { useFeitos, useHabitos, useTarefas } from '../../rotina/dados'
import { useDia } from '../../sono/dados'
import { CONFIG_SONO_PADRAO } from '../../sono/sono'
import { Cabecalho, Recolhivel, Secao, Vazio, dataCurta } from '../../ui/componentes'
import { diaLocal, horaMinuto } from '../../util/data'
import { horariosBomDia, lerAvisos, type ConfigAvisos } from '../agenda'
import { Alarmes } from '../alarmes'
import { avisosComuns, avisosDisponiveis, testarAvisoComum } from '../avisos'

interface Permissoes {
  notificacoes: boolean
  alarmesExatos: boolean
  semOtimizacaoBateria: boolean
  fabricante: string
}

const NOMES: Record<keyof ConfigAvisos, string> = {
  bomDia: 'Horário de acordar',
  sol30: 'Tomar sol 30 min após acordar',
  sol60: 'Tomar sol 60 min após acordar',
  dormir60: '60 min antes de dormir',
  dormir30: '30 min antes de dormir',
  dormir0: 'Hora de dormir',
}

/** Configurações → Notificações: avisos ligados, permissões, testes e próximos avisos. */
export function NotificacoesTela() {
  const config = useConfiguracao()
  const hoje = useDia(diaLocal(new Date()))
  const habitos = useHabitos()
  const feitos = useFeitos(diaLocal(new Date()))
  const tarefas = useTarefas()
  const [permissoes, setPermissoes] = useState<Permissoes | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [ajudaAberta, setAjudaAberta] = useState(false)

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
  if (!config || hoje === undefined || !habitos || !feitos || !tarefas) return null

  const avisos = lerAvisos(config.avisos)
  const sono = config.sono ?? CONFIG_SONO_PADRAO
  const agora = new Date()
  const proximos = [
    ...(avisos.bomDia
      ? horariosBomDia(sono, agora)
          .slice(0, 1)
          .map((q) => ({ titulo: 'Horário de acordar', quando: q }))
      : []),
    ...avisosComuns(sono, avisos, hoje ?? null, agora, { habitos, feitos, tarefas }).map((a) => ({
      titulo: a.titulo,
      quando: a.quando,
    })),
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
        <Secao
          titulo="Permissões"
          acao={
            <button
              className="botao-ajuda"
              aria-label="Como liberar"
              aria-expanded={ajudaAberta}
              onClick={() => setAjudaAberta((a) => !a)}
            >
              ?
            </button>
          }
        >
          <Recolhivel aberto={ajudaAberta}>
            <div className="ajuda-permissoes">
              <span className="campo-rotulo">Xiaomi (Redmi, Poco)</span>
              <ol className="passos">
                <li>Em "Início automático", ligue o Planner.</li>
                <li>Em "Som e vibração dos avisos", abra "Avisos" e ative Som, Vibração e Notificações flutuantes.</li>
                <li>Deixe "Sem economia de bateria" como ok.</li>
              </ol>
              <span className="campo-rotulo">Samsung</span>
              <ol className="passos">
                <li>Configurações → Aplicativos → Planner → Bateria: escolha "Sem restrições".</li>
                <li>
                  Configurações → Assistência do aparelho e bateria → Bateria → Limites de uso em segundo plano: tire o Planner de
                  "Apps em suspensão" e coloque em "Apps nunca suspensos".
                </li>
                <li>Configurações → Aplicativos → Planner → Notificações: deixe ligadas, com som, para "Avisos".</li>
                <li>Configurações → Aplicativos → Planner → "Alarmes e lembretes": permitido.</li>
              </ol>
            </div>
          </Recolhivel>
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
            <div className="linha-info">
              <span className="texto-secundario">Início automático</span>
              <button className="botao-texto" onClick={() => void Alarmes.abrirInicioAutomatico()}>
                Abrir
              </button>
            </div>
          )}
        </Secao>
      )}

      <Secao titulo="Teste">
        <div className="botoes-linha">
          <button
            className="botao-secundario"
            onClick={() => void Alarmes.testarBomDia({ segundos: 10 }).then(() => setMensagem('O alarme toca em 10 segundos.'))}
          >
            Horário de acordar
          </button>
          <button
            className="botao-secundario"
            onClick={() => void testarAvisoComum(10).then(() => setMensagem('O aviso chega em 10 segundos.'))}
          >
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
