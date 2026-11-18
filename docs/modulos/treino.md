# Treino: rotinas, registro na academia, planejamento semanal, cardio e peso

A aba Treino reúne **tudo do treino**: rotinas com exercícios, séries e cargas, o registro do que foi feito na academia, o planejamento da semana, o cardio e o histórico de peso corporal. Ela substitui o PWA de treino antigo do usuário, que **não** será importado nem usado como referência de código: o módulo é construído do zero.

## Rotinas e registro na academia
- Cada sessão (ex.: "Sessão A", "Posterior Day") tem uma lista de exercícios. Cada exercício tem séries planejadas (repetições e carga) e observações livres.
- Durante o treino: registrar, série por série, a carga e as repetições feitas, com toque rápido e o celular na mão. Mostrar os valores da última vez como referência.
- Histórico por exercício (cargas e repetições ao longo do tempo).
- Marcar a sessão como concluída alimenta automaticamente o check diário e o planejamento.
- Tela usada na academia, entre séries: botões grandes, poucos toques e **nunca perder um registro** se o app for fechado pelo sistema no meio do treino.

## Peso corporal
- Registrado na **tela diária** (`tela-diaria.md`) e mostrado na tela Início.
- Histórico, gráfico simples e edição ficam na aba Treino.

## Dois modos de rotina (definido em 2026-11-18)
O usuário escolhe um dos modos.

### Rotina restrita
- Cada sessão tem **dias fixos da semana**.
- Na tela Início, a caixa de status mostra:
  - em dia sem treino: **"Sem treino hoje"** (em cima) / **"Pode descansar"** (embaixo);
  - em dia com treino: **"Hoje tem treino"** (em cima) / **nome da sessão do dia** (embaixo, ex.: "Posterior Day").

### Rotina livre (a da referência visual)
Sistema **genérico e totalmente editável**: não assume nenhuma divisão específica (Upper/Lower, PPL etc.), porque a divisão muda com o tempo. Treina-se conforme a conveniência, e o app calcula o que ainda cabe.

- **Sessões da semana:** cadastro de **1 a 6 sessões** semanais, cada uma com nome livre.
- **Regras de intervalo definidas pelo usuário:** quais sessões precisam de quantos dias de intervalo entre si. Exemplos:
  - "Upper A ↔ Upper B: no mínimo 1 dia de intervalo";
  - "Lower A ↔ Lower B: no mínimo 2 dias de intervalo";
  - uma sessão pode ter regra com ela mesma, caso se repita na semana;
  - "N dias de intervalo" = N dias sem nenhuma das duas sessões entre elas (intervalo de 2 dias: segunda → no mínimo quinta);
  - pares sem regra podem ficar em dias seguidos.
- **Dias disponíveis:** marcar dias em que não posso treinar (fixos ou só nesta semana). O planejador não usa esses dias.
- **Não há dia fixo de treino**: o app distribui as sessões restantes respeitando as regras.
- **Planejador automático:** com base no que já foi feito na semana, nos dias restantes e nos espaçamentos, calcula as distribuições válidas das sessões que faltam. São poucos dias e poucas sessões: testar todas as combinações (força bruta). Considerar também os treinos do fim da semana anterior para o espaçamento.
- **Encaixes:** quantas opções de encaixe ainda existem para os treinos da semana. O estado de cada dia vem do número de encaixes, conforme o exemplo do usuário:
  - **3 ou mais → "Descanso possível"**: dá para não treinar hoje sem comprometer a semana. (Se há 3 e não treino hoje, amanhã serão 2.)
  - **2 → "Recomendado hoje"**: treinar hoje mantém mais opções abertas.
  - **1 → "Tem que ser hoje"**: sem treinar hoje, a semana não fecha. Caixa amarela.
  - **0 → "Semana já não fecha"**: não existe distribuição válida. Tom neutro, sugerindo o melhor possível (ex.: quais sessões ainda cabem).
  - A fórmula exata da contagem de encaixes será fechada com o usuário no passo do treino, com exemplos que viram testes automatizados.
- Mostrar na tela de treino uma sugestão de distribuição para o resto da semana, recalculada a cada check.
- **Essa lógica tem testes automatizados**, porque é onde bugs são mais prováveis.

## Comum aos dois modos
- **Check diário:** marcar qual sessão fiz no dia (ou nenhuma).
- **Meta de cardio semanal:** número de sessões **editável**, com checklist.
- A semana vai de **domingo a sábado**.
