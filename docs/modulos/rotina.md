# Rotina: hábitos e agenda (aba principal, 0.5.0)

Definido em 2026-11-22. **"Rotina" é uma aba principal** (ícone de calendário), entre Início e Estudos. A tela da aba tem dois blocos: **Hábitos** e **Agenda**.

## Hábitos
- Cada hábito tem **nome**, **descrição** (opcional), **dias** em que vale (Diariamente, Dias de semana, Fins de semana ou Personalizado, escolhendo os dias) e um **"quando"** opcional:
  - **Horário** ("HH:MM"), com a opção **"Avisar 15 min antes e na hora"**; ou
  - **Gatilho:** um texto escrito, uma **tarefa** (aviso quando ela é concluída) ou **outro hábito** (aviso quando ele é marcado) — só se o hábito vale hoje e ainda não foi marcado.
  - Hábito ligado a uma tarefa: quando a tarefa "some" (concluída num dia que já passou, ou apagada), o hábito fica com gatilho em texto, vazio.
- Marcar ou desmarcar o dia com **um toque** (só "feito / não feito"). Marcado hoje, o aviso de hoje é cancelado. **Sem streaks.**
- **Amarelo:** hábito com horário, de hoje, não marcado depois que o horário passou. Na virada do dia volta ao normal.
- **Bloco na Rotina:** os **6 primeiros** hábitos de hoje, com check, e **"Mais"**, que abre a lista completa.
- **Lista completa (Hábitos):** "Hoje" (com check) e "Outros dias"; **Novo hábito**; tocar num hábito abre para editar ou excluir.
- **Ordem:** padrão = primeiro os com horário (pela hora), depois os outros pela data de criação. **"Mudar ordem"** permite subir/descer à mão; **"Ordem padrão"** volta à original.
- **Histórico** (0.6.0), na tela do hábito: calendário do mês com os dias feitos e "x de y dias" nas últimas 4 semanas (só dias em que o hábito vale, desde que foi criado). Só consulta.

## Agenda (tarefas)
- Cada tarefa tem **nome**, **descrição** (opcional), **data** (opcional: Sem data, Hoje, Amanhã ou Outra, digitada "dd/mm/aaaa") e um **"quando"** opcional:
  - **Horário** (exige data), com a opção **"Avisar 15 min antes e na hora"**; ou
  - **Gatilho:** texto escrito (sem aviso), **outra tarefa** (aviso ao concluí-la) ou **um hábito** (aviso ao marcá-lo).
  - O gatilho só "acontece" **no dia da tarefa ligada**: marcar um hábito hoje não avisa a tarefa de amanhã (amanhã o hábito precisa ser marcado de novo). Tarefa de amanhã ligada a uma tarefa concluída hoje "descobre" amanhã: o aviso vem no **horário de acordar** do dia dela.
  - **Apagar** uma tarefa ou hábito: o que estava ligado a ele fica com gatilho em texto, vazio, e avisa na hora (qualquer dia): "Está sem gatilho vinculado agora".
- **Prioridade** (0.6.0): perguntas "Importante" e "Urgente" → nível 1 a 4 (matriz de Eisenhower: 1 nem um nem outro, 2 urgente, 3 importante, 4 os dois). Bolinha à direita da tarefa: nível 1 branca (escuro e foco) ou cinza bem escuro (claro), 2 ciano, 3 metade ciano e metade amarela, 4 amarela.
- **Fixar no topo:** a tarefa aparece em "Fixadas", no topo da Agenda e do bloco, qualquer que seja a data.
- **Próximo passo** (opcional): uma tarefa já configurada (nome, descrição, data, horário ou gatilho) que é **criada sozinha ao concluir a atual**, uma vez só. O próximo passo não tem próximo passo próprio. Se a data dele já passou quando a atual é concluída, fica para hoje.
- **Amarelo:** a tarefa não concluída fica amarela quando **passou do horário** dela; sem horário, quando **passou do dia** dela; **sem data, nunca**.
- **Bloco na Rotina:** fixadas, pendentes de dias anteriores (em amarelo), **hoje e amanhã**, com check para concluir, e **"Mais"**. Abaixo do bloco, o botão **"Tarefa não planejada"**.
- **Agenda completa:** "Fixadas", "Pendentes" (dias passados, não concluídas), um grupo por dia (Hoje, Amanhã, datas) e "Sem data"; **Não planejada**, **Nova tarefa**; **Ordem**; **Concluídas** (da mais recente; dá para desfazer). Concluídas hoje continuam marcadas no grupo do dia até a virada.
- **Ordem** (vale na Agenda e no bloco, guardada nas configurações): por **Ocorrência** (dia e horário mais próximos; empate → maior prioridade antes) ou por **Prioridade** (lista única, com o dia no detalhe; empate → horário mais próximo antes), em **Crescente** ou **Decrescente**.
- **Tarefa não planejada:** nome, descrição (opcional), data e hora em que foi feita (padrão: agora; não pode ser no futuro) e próximo passo opcional, criado na hora na Agenda. Vai direto para as Concluídas (marcada "Não planejada").
- O módulo **Tarefas** (`tarefas.md`) passou a ser esta Agenda.

## Projetos (0.6.1)
- Bloco **Projetos** na Rotina (abaixo do botão "Tarefa não planejada"): os **6 primeiros** e **"Mais"** (todos + **Novo projeto**).
- Projeto: **nome**, **descrição** (opcional) e **encerramento previsto** (opcional). Ordem: encerramento mais próximo primeiro; sem data no fim.
- **Tarefas** (inclusive próximo passo e não planejadas) e **hábitos** podem ser ligados a **um ou mais** projetos, no formulário de cada um.
- **Porcentagem** = tarefas ligadas concluídas ÷ tarefas ligadas, arredondada para cima, sem casas. Sem tarefas ligadas (ou todas concluídas): 100%. Hábitos não contam, só ficam registrados.
- Tela do projeto: progresso (número + medidor), edição, tarefas ligadas (com check) e hábitos ligados; excluir o projeto só tira o vínculo das tarefas e hábitos.
