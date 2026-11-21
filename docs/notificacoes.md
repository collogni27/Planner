# Notificações (prioridade máxima)

No Android, as notificações são **locais**: o próprio app as agenda no sistema, então funcionam com o app fechado e sem internet. Na versão web (PC), são opcionais e podem ficar de fora da v1. Cada tipo pode ser ligado ou desligado e ter o horário ajustado em Configurações.

## Como o agendamento funciona
- O app mantém agendados os avisos dos **próximos 7 dias**. Sempre que algo relevante muda (horários de sono, agenda, tarefas com horário, check de treino, configurações) e sempre que o app é aberto, ele **cancela e reagenda** tudo.
- Avisos condicionais são agendados com antecedência e **cancelados** quando a condição deixa de valer. Ex.: os avisos de sol são cancelados assim que marco "tomei sol".
- Usar **alarmes exatos** do Android, para chegar no minuto certo. O app pede as permissões necessárias (notificações, alarmes exatos) e explica como liberá-las, inclusive como desativar a otimização de bateria para o app se o celular estiver atrasando os avisos.
- Os avisos sobrevivem a reiniciar o celular (reagendar ao ligar).

| Aviso | Quando | Condição |
|---|---|---|
| **"Bom dia"** ⚑ | horário-alvo de acordar do dia | sempre (se ativo); **insistente** |
| **Tomar sol** | +30 min e +60 min **a partir da abertura do "Bom dia"** (sem abrir, não há aviso de sol) | só se "tomei sol" ainda não foi marcado hoje |
| **Hora de dormir** | **60 min antes, 30 min antes e na hora** do horário-alvo de dormir do dia (para "desacelerar" e encerrar atividades a tempo) | sempre (se ativo) |
| **Treino** | horário configurável (ex.: manhã) | quando o planejador indicar "tem que ser hoje" (rotina livre) ou houver treino no dia (rotina restrita), com texto diferente para cada |
| **Lembrete de agenda** | X min antes do compromisso | se o compromisso tiver lembrete |
| **Revisar cards** (opcional) | horário configurável | se houver cards pendentes |

- Os horários de acordar e dormir são **puxados da configuração do dia da semana** correspondente.
- Os textos são curtos, gentis e editáveis no futuro (podem ganhar a "voz" do mascote).

## Destino ao tocar (deep link)
Cada notificação abre o app **direto na tela correspondente**. Se o app já estiver aberto, navega até lá. Se tinha sido fechado pelo sistema, abre direto no destino.

| Notificação | Abre em |
|---|---|
| Bom dia | tela "Bom dia", com animação |
| Tomar sol | "Bom dia" ou tela de sono, com o check de sol em evidência |
| Hora de dormir | tela de sono / nota do dia |
| Treino | tela de treino da semana |
| Agenda | o compromisso |
| Revisar cards | tela de revisão |

## Notificações insistentes (⚑)
Para avisos que não posso ignorar, **deslizar para o lado não resolve**: o aviso só some de verdade quando toco nele e abro o app.

**Limitação técnica (explicar ao usuário):** desde o Android 14, o sistema permite deslizar quase qualquer notificação. O comportamento é **simulado** (definido em 2026-11-20):
1. Notificação contínua (*ongoing*), prioridade alta, som insistente e vibração.
2. **Volta na hora ao ser deslizada:** quando a notificação é dispensada, o Android avisa o app (*deleteIntent*) e ela é **recolocada imediatamente**, até eu tocar nela ou passarem **30 minutos**. (Repetir por agendamento a cada 5 s daria ~360 alarmes por manhã, acima do limite do Android; por isso esse caminho.) Exige um pequeno código Android próprio no projeto.
3. Tocar na notificação abre o destino e encerra a insistência.

**Opção de tela cheia (estilo alarme) para o "Bom dia":** uma notificação pode abrir o app em tela cheia, como um despertador (*full-screen intent*). Nas versões recentes a permissão é restrita, mas num app instalado manualmente o usuário pode liberá-la. Implementar como **opção** em Configurações, com instruções para liberar. Sem a permissão, usar o comportamento insistente normal. Se o plugin padrão não cobrir isso, escrever um plugin Android próprio (sem trabalho extra para o usuário).

- Qualquer tipo pode ser marcado como **insistente** em Configurações. Por padrão, só "Bom dia".
- Intervalo de reenvio e limite configuráveis.
- Validar cedo, no celular real (passo 4 do roadmap).
- **Botão de teste** de notificação em Configurações.
- Se faltarem permissões (notificações, alarmes exatos, tela cheia, otimização de bateria), o app avisa e explica como resolver, passo a passo.

## Implementação (0.4.1)
- **Configurações → Notificações:** ligar/desligar Bom dia, Tomar sol e Hora de dormir; permissões (notificações, alarmes no minuto certo, sem economia de bateria) com botão "Permitir" que abre o ajuste certo do Android; testes (Bom dia e aviso comum em 10 s); próximos avisos. Na web: "Os avisos funcionam só no app Android". Guia do usuário: `guias/notificacoes.md`.
- **Bom dia:** plugin Android próprio (`android/app/src/main/java/.../AlarmesPlugin.java`, `BomDia.java`, `BomDiaReceiver.java`): alarme de despertador (`setAlarmClock`), som de alarme repetindo, notificação contínua recolocada ao ser deslizada (até 30 min), reagendamento ao reiniciar o celular. Tocar no aviso **ou abrir o app enquanto ele toca** encerra a insistência, registra a hora (`bom_dia_em`) e abre a tela diária.
- **Hora de dormir e Tomar sol:** `@capacitor/local-notifications` (exatos, com o celular em repouso). Ids 20000+ (dormir) e 30000+ (sol).
- Reagendamento: ao abrir o app e sempre que mudam horários, avisos ligados, Bom dia aberto ou sol marcado. Lógica em `src/notificacoes/agenda.ts`, com testes.
- Ainda **não** abre em tela cheia (opção de despertador fica para o passo "Bom dia + mascote").

## Som (0.4.2)
- A Xiaomi (HyperOS) silencia/abafa o som de notificações de apps instalados fora da loja. Por isso:
  - **Bom dia:** o app toca o **próprio alarme** por um serviço (`BomDiaServico`): som `res/raw/bom_dia.wav` (arpejo 8-bit) em repetição no **volume de alarme**, com vibração, até atender ou 30 min. A notificação é silenciosa (canal `bom_dia_v2`) e continua voltando ao ser deslizada.
  - **Avisos comuns:** canal novo `avisos_v2` com som próprio `res/raw/aviso.wav` e vibração (canais não mudam depois de criados; o antigo é apagado). Na Xiaomi pode ser preciso ligar Som/Vibração/Flutuante do canal "Avisos" — atalhos em Notificações → Permissões.
- Sons gerados por `scripts/gerar-sons.py` (onda quadrada, combinando com o visual pixel).
