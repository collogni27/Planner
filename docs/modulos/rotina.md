# Rotina: hábitos e agenda (aba principal, 0.5.0)

Definido em 2026-11-22. **"Rotina" é uma aba principal** (ícone de calendário), entre Início e Estudos. A tela da aba tem dois blocos: **Hábitos** e **Agenda**.

## Hábitos
- Cada hábito tem **nome**, **descrição** (opcional), **dias** em que vale (Diariamente, Dias de semana, Fins de semana ou Personalizado, escolhendo os dias) e um **"quando"** opcional:
  - **Horário** ("HH:MM"), com a opção **"Avisar 15 min antes e na hora"**; ou
  - **Gatilho:** um texto escrito, ou uma **tarefa** — quando essa tarefa é concluída, chega um aviso de que é hora do hábito (só se o hábito vale hoje e ainda não foi marcado). Tarefas acontecem uma vez: depois de concluída, o vínculo deixa de disparar.
- Marcar ou desmarcar o dia com **um toque** (só "feito / não feito"). Marcado hoje, o aviso de hoje é cancelado. **Sem streaks.**
- **Bloco na Rotina:** os **6 primeiros** hábitos de hoje, com check, e **"Mais"**, que abre a lista completa.
- **Lista completa (Hábitos):** "Hoje" (com check) e "Outros dias"; **Novo hábito**; tocar num hábito abre para editar ou excluir.
- **Ordem:** padrão = primeiro os com horário (pela hora), depois os outros pela data de criação. **"Mudar ordem"** permite subir/descer à mão; **"Ordem padrão"** volta à original.
- Para o futuro: histórico consultável (calendário ou lista de dias).

## Agenda (tarefas)
- Cada tarefa tem **nome**, **descrição** (opcional), **data** (opcional: Sem data, Hoje, Amanhã ou Outra, digitada "dd/mm/aaaa") e um **"quando"** opcional:
  - **Horário** (exige data), com a opção **"Avisar 15 min antes e na hora"**; ou
  - **Gatilho:** texto escrito (sem aviso), **outra tarefa** (aviso ao concluí-la) ou **um hábito** (aviso ao marcá-lo).
- **Próximo passo** (opcional): uma tarefa já configurada (nome, descrição, data, horário ou gatilho) que é **criada sozinha ao concluir a atual**, uma vez só. O próximo passo não tem próximo passo próprio. Se a data dele já passou quando a atual é concluída, fica para hoje.
- **Amarelo:** a tarefa não concluída fica amarela quando **passou do horário** dela; sem horário, quando **passou do dia** dela; **sem data, nunca**.
- **Bloco na Rotina:** as tarefas de **hoje e amanhã** (mais as pendentes de dias anteriores, em amarelo), com check para concluir, e **"Mais"**.
- **Agenda completa:** "Pendentes" (dias passados, não concluídas) no topo, depois um grupo por dia (Hoje, Amanhã, datas), depois "Sem data"; **Nova tarefa**; **Concluídas** (da mais recente; dá para desfazer). Concluídas hoje continuam marcadas no grupo do dia até a virada.
- O módulo **Tarefas** (`tarefas.md`) passou a ser esta Agenda.
