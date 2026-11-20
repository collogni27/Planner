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
5. **Rotina:** hábitos, agenda, nota diária.
6. **Tarefas:** horário/gatilho, prioridade, realizadas, não planejadas.
7. **"Bom dia"** (resumo + animação provisória; opção de tela cheia).
8. **Treino:** rotinas com exercícios e cargas, registro na academia, peso, modos restrito e livre, planejador semanal, cardio e notificação de treino.
9. **Dieta** com versões.
10. **Tela Início completa.**
11. Estatísticas, backup completo e revisão da sincronização offline.
12. Logo, ícone do app, variações do mascote e animação do "Bom dia" (a base visual já é usada desde o passo 1).

## Fora do escopo da v1
- Imagens, áudio, cloze e importação `.apkg` nos flashcards.
- Contagem de calorias e macros, banco de alimentos.
- Gamificação de qualquer tipo.
- Multiusuário e compartilhamento.
- Publicação na Play Store (o APK é instalado direto).
- Versão para iPhone.
- Notificações na versão web (PC), se forem trabalhosas.
- Encadeamento de tarefas e vínculo com projetos (futuro, ver `modulos/tarefas.md`).

## Decisões em aberto (perguntar quando chegar a hora)
- Pode haver duas sessões de treino no mesmo dia?
- O cardio tem regra de espaçamento, ou é só a meta semanal?
- Fórmula exata da contagem de "encaixes" na rotina livre (passo 8).
- Horário padrão da notificação de treino.
- A "nota para amanhã" (escrita na véspera) continua existindo ao lado da nota diária, ou o "Bom dia" mostra a nota de ontem?
- Como a tela diária se encaixa no "Bom dia" (antes, dentro ou depois).
- Quais módulos viram abas principais na navegação inferior.
