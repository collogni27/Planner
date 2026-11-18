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
| **Tomar sol** | ao acordar, +30 min e +60 min | só se "tomei sol" ainda não foi marcado hoje |
| **Hora de dormir** | horário-alvo de dormir do dia (opcional: aviso prévio X min antes) | sempre (se ativo) |
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

**Limitação técnica (explicar ao usuário):** desde o Android 14, o sistema permite deslizar quase qualquer notificação. O comportamento é **simulado**:
1. Notificação contínua (*ongoing*), prioridade alta, com vibração.
2. **Repetições pré-agendadas:** junto com o aviso principal, o app agenda repetições a cada X minutos (padrão: 3 min) até um limite (padrão: 30 min). Se eu deslizar, a próxima repetição aparece mesmo assim.
3. Tocar na notificação abre o destino e **cancela todas as repetições** pendentes.

**Opção de tela cheia (estilo alarme) para o "Bom dia":** uma notificação pode abrir o app em tela cheia, como um despertador (*full-screen intent*). Nas versões recentes a permissão é restrita, mas num app instalado manualmente o usuário pode liberá-la. Implementar como **opção** em Configurações, com instruções para liberar. Sem a permissão, usar o comportamento insistente normal. Se o plugin padrão não cobrir isso, escrever um plugin Android próprio (sem trabalho extra para o usuário).

- Qualquer tipo pode ser marcado como **insistente** em Configurações. Por padrão, só "Bom dia".
- Intervalo de reenvio e limite configuráveis.
- Validar cedo, no celular real (passo 4 do roadmap).
- **Botão de teste** de notificação em Configurações.
- Se faltarem permissões (notificações, alarmes exatos, tela cheia, otimização de bateria), o app avisa e explica como resolver, passo a passo.
