# Tela "Início"

Um **resumo** do dia que **cabe na tela sem rolagem**: tarefas, bloco de sono e bloco de treino, com a barra do mascote no topo (ver `../identidade-visual.md`). Cada bloco leva à aba correspondente ao ser tocado.
- Hábitos, agenda completa, cards pendentes e estatísticas ficam nas abas próprias, **não** na tela Início.
- A nota do dia é acessada pela barra do mascote ("Notas anteriores" e "Editar nota atual"; ver `notas.md`).

## Layout aprovado
Sem título nem data no corpo. **Com a barra do mascote aberta, o conteúdo preenche a tela, sem rolagem.** Com a barra recolhida, os blocos **não** esticam: sobra espaço embaixo, e está tudo bem. Só rola se a lista de tarefas for expandida. De cima para baixo:

1. **Tarefas** (vêm do módulo `tarefas.md`): título "Tarefas", as 5 primeiras tarefas do dia (horário à direita, quando houver) e, **abaixo da lista**, o botão "Ver todas". Sem contadores de feitas ou pendentes nesse bloco.
2. **Dois blocos lado a lado**, com altura natural (a do mais alto) e espaçamentos internos generosos, sem vãos grandes:
   - **Sono:** horas dormidas (número grande, ex.: `7h12`) no topo. Na base: **qualidade (00 a 99)** com medidor de 10 quadradinhos e, abaixo, o botão marcável **"Sol tomado"** na largura do bloco. Horas e qualidade vêm da tela diária (`tela-diaria.md`).
   - **Treino:** feitos/total da semana (número grande, ex.: `2/4`), "X feitos · Y faltam", **peso de hoje (kg)** e, na base, a **caixa de status do treino**, sempre com três linhas iguais em todos os modos. O conteúdo depende do modo de rotina (ver `treino.md`):
     - **Rotina livre:** número de encaixes, rótulo ("encaixe possível"/"encaixes possíveis") e o estado ("Descanso possível", "Recomendado hoje", "Tem que ser hoje", "Semana não fecha"). Com "Tem que ser hoje" a caixa fica **amarela**.
     - **Rotina restrita:** "Sem treino hoje" / "Pode descansar", ou "Hoje tem treino" / nome da sessão do dia (ex.: "Posterior Day").

## Candidato futuro
Um bloco baixo de **"Projetos em andamento"** (nome do projeto + porcentagem e "Ver todos"). Hoje não cabe sem rolagem com a barra aberta; só entra se o usuário pedir e houver espaço.
