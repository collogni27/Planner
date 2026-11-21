# Nota diária

Definido em 2026-11-18.

- **Todo dia tem uma nota**, criada automaticamente.
- A nota do dia pode ser **editada a qualquer momento do dia** ("Editar nota atual", na barra do mascote). Salvamento contínuo, como todo rascunho.
- Na **virada do dia** (00:00, America/Sao_Paulo) a nota atual fica salva como está e uma nova nota é criada para o novo dia.
- Se nada foi escrito, o dia consta como **"sem nota"**.
- **"Notas anteriores"** abre um **calendário** que dá acesso a todas as notas.
- Histórico guardado para sempre. Notas de dias anteriores só aparecem (não são editadas).
- **"Nota para amanhã" = a nota diária** (2026-11-22): o que escrevo hoje "fica para amanhã". Ela aparece no topo da **tela diária** da manhã seguinte ("Nota de ontem") e, quando existir, no "Bom dia".

## Implementação (0.5.0)
- Tabela `notas` (id calculado da data). "Editar nota atual" abre a nota de hoje, que salva sozinha enquanto se escreve (e sobrevive ao app ser fechado). "Notas anteriores": calendário por mês (domingo a sábado), dias com nota marcados, dias futuros desligados.
