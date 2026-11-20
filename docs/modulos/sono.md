# Sono

Fica em **Mais → Sono** (bloco próprio, com ícone de lua), por enquanto.

- **Horários-alvo por dia da semana** (domingo a sábado): hora de dormir e hora de acordar, cada dia independente. Tela "Horários e meta" (atalho "usar os horários de domingo em todos os dias").
  - A hora de dormir é **sempre antes da meia-noite** (entre 18:00 e 23:59): o usuário não dorme depois de 00:00 em nenhuma hipótese esperada.
- **Meta de horas de sono** configurável. "Dormi ao menos a meta?" **não é perguntado**: sai do tempo de sono informado.
- Guardados em `configuracoes.dados.sono` (sem tabela própria).

## Registro do dia (tabela `dias`)
Uma linha por dia (id calculado da data). Preenchido pela **tela diária** (`tela-diaria.md`) e editável depois na tela do Sono:
- tempo de sono, qualidade (00 a 99, do smartband; não calculada pelo app), peso;
- **dormi no horário esperado?** e **acordei no horário esperado?** (sim/não). Corrigido em 2026-11-21: são **só essas duas perguntas** (respondidas logo ao acordar, ainda despertando). "Acordei de madrugada?" e "prejuízo ao sono?" não existem (colunas antigas ficam sem uso no banco);
- **"Tomei sol"** (com a hora), marcado na tela do Sono (e, no futuro, no "Bom dia" e na tela Início);
- `bom_dia_em`: quando a tela "Bom dia" foi aberta (base dos avisos de sol; usado a partir da 0.4.1).
- O check de sono de uma noite pertence ao dia em que acordei.

## Tela do Sono
- **Hoje:** tempo (número grande), se atingiu a meta, qualidade com medidor, peso, as duas respostas, "Editar" (ou "Preencher") e o botão **"Tomei sol"**.
- **Últimas 4 semanas:** média de sono, qualidade média e, no formato **x de y dias** (x = dias "sim", y = dias respondidos): meta atingida, dormi no horário, acordei no horário; e dias em que tomou sol.
- **Histórico:** em **tela própria** (botão "Histórico"), todos os dias registrados; toque para editar o dia.

Notificações do sono em `../notificacoes.md`.
