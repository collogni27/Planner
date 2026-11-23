# Roadmap

## Ordem de construção (referência; pode mudar conforme os pedidos)
1. **Base:** projeto, login único, Supabase com RLS, design tokens, mascote, navegação entre abas, armazenamento local primeiro, versão web no Netlify.
2. **APK e atualizações:** Capacitor, keystore (com backup feito pelo usuário), build automático no GitHub Actions e verificação de atualização dentro do app. Validar cedo que **instalar uma versão nova por cima mantém os dados**.
3. **Estudos** (`modulos/estudos.md`):
   - 0.3.0: objetivos, áreas, conteúdos com check-in, baralhos e cards, importação/exportação, texto para IA;
   - 0.3.1: refinos (textos enxutos, "conteúdo" no lugar de "micrometa", "Ver todos", ajuda no "?");
   - 0.3.2: revisão com FSRS, aberta pela tela de Estudos (baralho inteiro ou filtrado por áreas/tags), retomando onde parou;
   - 0.3.3: acompanhamento (força por conteúdo, reforço, cards-problema, carga);
   - 0.3.4: baralhos e conteúdos compartilhados entre objetivos (sem áreas), revisão com filtros combinados, Revisão Livre, baralho agrupado e histórico do card.
4. **Sono + tela diária e primeira notificação ponta a ponta**:
   - 0.4.0: horários-alvo e meta, tela diária automática (tempo, qualidade, peso, 2 perguntas), tela do Sono com "tomei sol", resumo e histórico;
   - 0.4.1: perguntas da tela diária corrigidas (dormi/acordei no horário), histórico do sono em tela própria, Dia Reset no Modo Desenvolvedor; avisos Bom dia (insistente, abre a tela diária), Tomar sol (+30/+60 da abertura do Bom dia) e Hora de dormir (60, 30 min antes e na hora); permissões e botão de teste. Validar no celular real o agendamento, o deep link, a insistência e a chegada no horário exato.
   - 0.4.2: **som** — o Bom dia toca o próprio alarme (som 8-bit em repetição no volume de alarme + vibração, por um serviço), independente do som da notificação (que a Xiaomi silencia); avisos comuns com som próprio num canal novo; atalhos para os ajustes da Xiaomi. Mais reorganizado (Configurações, Notificações, Modo Visual, Modo Desenvolvedor) e **Modo Visual Variável** por horário.
5. **Rotina** (0.5.0): aba principal "Rotina" com hábitos (dias, horário com aviso ou gatilho, ordem) e Agenda de tarefas (data, horário com aviso ou gatilho em texto/tarefa/hábito, próximo passo, amarelo quando atrasada, concluídas); nota diária ("Editar nota atual", "Notas anteriores" em calendário, nota de ontem na tela diária).
6. **Extras da Rotina** (0.6.0): prioridade 1–4 com bolinhas, fixar no topo, ordem da Agenda (ocorrência/prioridade, crescente/decrescente), tarefa não planejada (com próximo passo), histórico dos hábitos, gatilho hábito→hábito, gatilho só no dia do item ligado, vínculo solto ao apagar (com aviso), hábito atrasado em amarelo; Modo Desenvolvedor com resets de Rotina, Estudos, Sono e geral.
   - 0.6.1: **Projetos** (com porcentagem pelas tarefas ligadas); sono sem qualidade, "últimas 4 semanas" de domingo a sábado e gráfico **Evolução do Peso**; avisos de dormir e de sol ligados um a um; volume do Bom dia pela base do volume de notificação; Mais com ícones; ajuda das permissões (Xiaomi e Samsung) no "?".
7. **Bom dia + mascote** (versão dedicada): tela "Bom dia" com o mascote animado e o resumo do dia, novas poses/variações do mascote (aprovadas antes), animações da barra, e opção de abrir em tela cheia como despertador.
8. **Treino:** rotinas com exercícios e cargas, registro na academia, peso, modos restrito e livre, planejador semanal, cardio e notificação de treino.
9. **Dieta** com versões.
10. **Tela Início completa.**
11. Estatísticas, backup completo e revisão da sincronização offline.
12. Revisão visual geral e versão de PC (layout próprio, deixando livre o canto do selo do Netlify).

## Fora do escopo da v1
- Imagens, áudio, cloze e importação `.apkg` nos flashcards.
- Contagem de calorias e macros, banco de alimentos.
- Gamificação de qualquer tipo.
- Multiusuário e compartilhamento.
- Publicação na Play Store (o APK é instalado direto).
- Versão para iPhone.
- Notificações na versão web (PC), se forem trabalhosas.
- Vínculo de tarefas com projetos (futuro, ver `modulos/tarefas.md`).

## Decisões em aberto (perguntar quando chegar a hora)
- Pode haver duas sessões de treino no mesmo dia?
- O cardio tem regra de espaçamento, ou é só a meta semanal?
- Fórmula exata da contagem de "encaixes" na rotina livre (passo 8).
- Horário padrão da notificação de treino.
- Como a tela diária se encaixa no "Bom dia" (antes, dentro ou depois).
- Quais módulos viram abas principais na navegação inferior.
