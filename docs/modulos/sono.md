# Sono

Fica em **Mais → Sono** (bloco próprio, com ícone de lua), por enquanto.

- **Horários-alvo por dia da semana** (domingo a sábado): hora de dormir e hora de acordar, cada dia independente. Tela **"Metas de sono"** (antes "Horários e meta"; 2026-11-24) (atalho "usar os horários de domingo em todos os dias").
  - A hora de dormir é **sempre antes da meia-noite** (entre 18:00 e 23:59): o usuário não dorme depois de 00:00 em nenhuma hipótese esperada.
- **Meta de horas de sono** configurável. "Dormi ao menos a meta?" **não é perguntado**: sai do tempo de sono informado.
- Guardados em `configuracoes.dados.sono` (sem tabela própria).

## Registro do dia (tabela `dias`)
Uma linha por dia (id calculado da data). Preenchido pela **tela diária** (`tela-diaria.md`) e editável depois na tela do Sono:
- tempo de sono e peso. A **qualidade** saiu em 2026-11-24 (a coluna antiga fica sem uso no banco);
- **dormi no horário esperado?** e **acordei no horário esperado?** (sim/não). Corrigido em 2026-11-21: são **só essas duas perguntas** (respondidas logo ao acordar, ainda despertando). "Acordei de madrugada?" e "prejuízo ao sono?" não existem (colunas antigas ficam sem uso no banco);
- **"Tomei sol"** (com a hora), marcado na tela do Sono (e, no futuro, no "Bom dia" e na tela Início);
- `bom_dia_em`: quando a tela "Bom dia" foi aberta (base dos avisos de sol; usado a partir da 0.4.1).
- O check de sono de uma noite pertence ao dia em que acordei.

## Tela do Sono
- **Hoje:** tempo (número grande), se atingiu a meta, peso, as duas respostas, "Editar" (ou "Preencher") e o botão **"Tomei sol"**.
- **Últimas 4 semanas:** são **4 semanas inteiras de domingo a sábado** (a atual e as 3 anteriores); quando começa uma semana nova, a mais antiga sai inteira. Mostra média de sono e, no formato **x de y dias** (x = dias "sim", y = dias respondidos): meta atingida, dormi no horário, acordei no horário; e dias em que tomou sol.
- **Evolução do Peso** (gráfico): 4 posições (Há 3 semanas, Há 2 semanas, Há 1 semana, Semana atual), cada uma com a **média de peso da semana** (arredondada para cima, uma casa decimal) num ponto, e uma linha ligando os pontos. A semana atual aparece desde o primeiro registro e muda a cada peso novo; semanas sem registro ficam sem ponto.
- **Histórico** e **Metas de sono**: cada um em seu bloco, cada um abre sua tela; o histórico lista todos os dias registrados (toque para editar).

Notificações do sono em `../notificacoes.md`.
