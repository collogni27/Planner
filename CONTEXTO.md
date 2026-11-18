# CLAUDE.md — Documento fundamental do projeto

> Nome do app: **Planner** (identidade visual, logo e mascote em §9)
> Dono e único usuário: Miguel
> Idioma da interface: português do Brasil
> Fuso horário: America/Sao_Paulo

Este arquivo dá contexto e regras ao Claude Code. As tarefas de construção serão pedidas por partes, conforme o app for desenvolvido e testado. **Não construa nada só porque está descrito aqui.** Use este documento para entender o projeto e tomar decisões coerentes com ele.

---

## 1. Visão

Um app pessoal unificado que funciona como um **assistente particular**: reúne flashcards, agenda e hábitos, sono, dieta e planejamento semanal de treino, e **me avisa** do que precisa ser feito.

**Por que existe:** tenho tendência a procrastinar. Coordenar vários apps separados é atrito suficiente para eu largar tudo. Um lugar só, acessível e que toma a iniciativa de me lembrar das coisas reduz esse atrito.

**Critério de sucesso (3 meses):** estar registrando de fato o que me proponho e cumprindo pelo menos **80%** disso, sem falhas graves. O app serve para construir hábito, não para ser bonito ou completo.

### Princípios de produto
1. **Notificações são o recurso principal.** Um app que não avisa não cumpre seu papel. Na dúvida, priorize a confiabilidade dos avisos.
2. **Baixo atrito.** Registrar algo deve levar poucos toques. Formulários diários devem ser checkboxes e campos rápidos, com texto livre só quando opcional.
3. **Tom gentil, sem culpa.** Mensagens neutras ou encorajadoras. Nada de "você falhou", contadores de fracasso ou vermelho agressivo para dias perdidos.
4. **Sem gamificação.** Sem pontos, níveis, conquistas, badges ou streaks em destaque. Estatísticas e histórico existem para eu avaliar, não para competir.
5. **Muitas telas são aceitáveis.** Prefira telas separadas e claras a uma tela lotada.
6. **Feito para uma pessoa só.** Não construa multiusuário, compartilhamento, perfis ou painel administrativo.
7. **Não exibir contagens de pendências** ("3 de 7", "12 projetos") em resumos e listas. Mostrar só o conteúdo e a opção de ver tudo. Contadores desanimam mais do que ajudam.

---

## 2. Plataforma e uso

- **Uso principal:** celular Android, como **app nativo (APK)** gerado com Capacitor e instalado direto, sem Play Store.
- **Uso secundário:** PC, pela **versão web** do mesmo código, hospedada no Netlify. Tudo deve funcionar no PC, com layout responsivo.
- **Um só código** para as duas versões. Recursos que só existem no Android (notificações locais, tela cheia) devem ter uma alternativa ou simplesmente não aparecer na versão web.
- **Dados iguais nos dois** via banco na nuvem.

### O app deve sobreviver a ser fechado pelo sistema (regra fixa)
O Android fecha apps em segundo plano para liberar memória. Isso **vai acontecer** e não deve ser combatido. O app deve tornar o reinício **invisível**:
- salvar o estado continuamente: tela atual, card em revisão, posição na revisão, textos sendo digitados (rascunhos), formulários pela metade;
- ao reabrir, voltar **exatamente** onde eu estava, sem tela de carregamento longa e sem perder nada;
- testar isso de propósito (opção de desenvolvedor do Android "Não manter atividades", ou fechar o app pelo sistema) antes de considerar uma tela pronta.
- **Offline:** desejável, não obrigatório. Se for complexo, priorize **confiabilidade > offline**. O mínimo desejado é o app abrir sem internet mostrando os últimos dados, e revisões de cards e checks feitos offline entrarem numa fila que sincroniza ao voltar a conexão. Se alguma função ficar indisponível offline, avise isso na interface.

---

## 3. Stack técnica (decisão do Claude Code, com estas diretrizes)

O usuário não programa. Escolha a stack **mais simples de manter e com mais documentação**, e registre a escolha em §11. Diretriz padrão, se não houver motivo forte para outra:

- **Frontend:** Vite + React + TypeScript.
- **App Android:** **Capacitor**, que empacota o mesmo frontend num APK.
- **Versão web (PC):** Netlify (o usuário já usa).
- **Banco, autenticação e funções:** Supabase (plano gratuito). O usuário ainda não tem conta e precisará de instruções passo a passo para criar o projeto e copiar as chaves.
- **Cache local/offline:** IndexedDB (ex.: Dexie), se o offline for implementado.
- **Repetição espaçada:** algoritmo **FSRS** via biblioteca `ts-fsrs` (não reimplementar).
- **Notificações:** **locais**, agendadas pelo próprio app no Android (plugin `@capacitor/local-notifications`). Sem servidor de push na v1. Detalhes em §5.
- **Estilo:** use **design tokens** (variáveis CSS para cores, fontes, raios, espaçamentos) desde o início. A identidade visual será trocada depois, e isso precisa ser fácil.

### Geração do APK e atualizações (sem perder dados)
- **Build automático:** o APK é gerado pelo **GitHub Actions** a cada nova versão e publicado como **Release** no GitHub. O usuário não precisa instalar o Android Studio.
- **Atualização dentro do app:** ao abrir, o app consulta a última Release. Se houver versão nova, mostra um aviso discreto ("Nova versão disponível") com botão para baixar e abrir o instalador do Android. O usuário só confirma "Atualizar". (Apps fora da Play Store não podem se atualizar sem essa confirmação.)
- **Atualizar nunca apaga dados**, desde que estas regras sejam seguidas **sempre**:
  1. **O mesmo `applicationId`** (nome do pacote) para sempre. Nunca alterar.
  2. **A mesma chave de assinatura (keystore)** em todas as versões. Ela fica guardada como segredo do GitHub e **o usuário deve ter um backup dela fora do computador** (ex.: Google Drive). Se a chave for perdida, não dá mais para atualizar: será preciso desinstalar e reinstalar, o que apaga os dados locais (os da nuvem ficam salvos).
  3. **`versionCode` sempre maior** que o da versão anterior.
  4. Mudanças no formato dos dados locais (IndexedDB/armazenamento) usam **migrações versionadas**, que convertem os dados antigos em vez de apagá-los.
- A versão web no Netlify é atualizada normalmente a cada publicação.
- Mostrar o número da versão instalada em Configurações.

### Segurança e login
- **Um único usuário** com login por e-mail e senha no Supabase Auth. **Desative novos cadastros** depois de criar a conta.
- **Row Level Security (RLS) ativa em todas as tabelas**, permitindo acesso só ao `user_id` dono.
- Nunca coloque a chave `service_role` no frontend ou no repositório. Use variáveis de ambiente (`.env` no `.gitignore`).
- A sessão deve persistir para eu não precisar logar sempre.

---

## 4. Módulos da versão 1

### 4.0 Tela "Início"
Um **resumo** do dia que **cabe na tela sem rolagem**. O layout aprovado está em §9 ("Tela Início"): tarefas, bloco de sono e bloco de treino, com a barra do mascote no topo. Cada bloco leva à aba correspondente ao ser tocado.
- Hábitos, agenda completa, registro de tarefa não planejada, cards pendentes e estatísticas ficam nas abas próprias (Rotina, Cards etc.), **não** na tela Início.
- A nota do dia é acessada pela barra do mascote ("Notas anteriores" e "Editar nota atual").

### 4.1 Flashcards (estilo Anki)
- **Baralhos e sub-baralhos** em árvore, sem limite de profundidade (ex.: `ENEM::Humanas::História`).
- **Cards só de texto**, frente e verso. Sem imagem, áudio, cloze ou add-ons na v1.
- **Tags** por card.
- **Revisão** com 4 botões: Errei / Difícil / Bom / Fácil, agendada pelo FSRS. Estudar um baralho inclui seus sub-baralhos.
- Limites configuráveis de cards novos e de revisões por dia, por baralho.
- **Criar e editar** cards dentro do app.
- **Importação em massa (essencial):** os cards serão gerados por IA e importados. Aceitar:
  - **TSV/CSV** com colunas `baralho`, `frente`, `verso`, `tags` (baralho no formato `A::B::C`; tags separadas por espaço). Esse formato deve ser documentado numa tela de ajuda, com um exemplo pronto para copiar e passar a uma IA.
  - **JSON** no formato nativo do app.
  - Mostrar uma prévia antes de confirmar e detectar duplicatas (mesma frente no mesmo baralho).
- **Exportação** de baralhos em JSON e TSV.
- **Estatísticas:** cards por baralho e por tag (para eu ver quais matérias estão bem cobertas), taxa de acerto, cards maduros/jovens/novos e previsão de revisões nos próximos dias.
- Não é preciso importar `.apkg` do Anki.

### 4.2 Rotina: hábitos + agenda
- **Hábitos:** checklist diária. Cada hábito escolhe em quais dias da semana aparece. Marcar ou desmarcar com um toque. **Sem streaks**, mas com histórico consultável (calendário ou lista de dias).
- **Agenda:** compromissos com data, horário, título, nota opcional e lembrete opcional (X minutos antes, via notificação). Pode ter repetição simples (semanal).
- **Tarefa não planejada:** registro rápido de algo que fiz e quero registrar (texto + data/hora automática, editável). Aparece no histórico do dia.

### 4.3 Sono
- **Horários-alvo por dia da semana** (domingo a sábado): hora de dormir e hora de acordar, cada dia independente.
- **Meta de horas de sono** configurável (usada na pergunta "dormi ao menos X?").
- **Check diário** (respondido de manhã, sobre a noite anterior), todos sim/não:
  1. Dormi ao menos [meta] horas?
  2. Acordei de madrugada?
  3. Tive algum prejuízo ao sono? (se sim, campo de texto opcional)
  4. Dormi no horário esperado?
  5. Acordei no horário esperado?
- **Check "tomei sol"** diário.
- **Qualidade do sono (00 a 99):** número **digitado pelo usuário** a cada manhã (vem do smartband dele). Não é calculada pelo app.
- Histórico dos checks com resumo simples (ex.: % de dias no horário nas últimas 4 semanas).
- Notificações do sono em §5.

### 4.4 Dieta
Não é um contador de calorias diário. É o **registro da versão atual do plano alimentar**, que muda conforme eu progrido em kcal.
- **Plano atual:** lista de refeições (adicionar, remover, reordenar, renomear). Cada refeição tem os alimentos **escritos por extenso** (texto livre).
- **Campo de detalhes** do plano (texto livre: meta de kcal, observações etc.).
- **Área de referências livres** (texto e links: anotações, tabelas, fontes).
- **Versionamento:** ao salvar uma alteração, guardar a versão anterior com data, para eu poder ver como o plano evoluiu. A tela principal mostra sempre a versão mais atual.

### 4.5 Treino: rotinas completas, planejamento semanal, cardio e peso
A aba Treino reúne **tudo do treino**: as rotinas com exercícios, séries e cargas, o registro do que foi feito na academia, o planejamento da semana, o cardio e o histórico de peso corporal. Ela substitui o PWA de treino antigo do usuário, que **não** será importado nem usado como referência de código: o módulo é construído do zero.

**Rotinas e registro na academia:**
- Cada sessão (ex.: "Sessão A") tem uma lista de exercícios. Cada exercício tem séries planejadas (repetições e carga) e observações livres.
- Durante o treino: registrar, série por série, a carga e as repetições feitas, com toque rápido e o celular na mão. Mostrar os valores da última vez como referência.
- Histórico por exercício (cargas e repetições ao longo do tempo).
- Marcar a sessão como concluída alimenta automaticamente o check diário e o planejador abaixo.
- Esta tela é usada na academia, entre séries: botões grandes, poucos toques, e **nunca perder um registro** se o app for fechado pelo sistema no meio do treino (§2).

**Peso corporal:**
- Registro diário do peso (kg), que aparece também na tela Início.
- Histórico e gráfico simples ficam na aba Treino.

**Planejamento semanal:**

O sistema é **genérico e totalmente editável**: não assume nenhuma divisão específica (Upper/Lower, PPL etc.), porque minha divisão muda com o tempo.

- **Sessões da semana:** cadastro de **1 a 6 sessões** semanais, cada uma com nome livre. Hoje uso 4, mas o número muda.
- **Regras de intervalo definidas pelo usuário:** escolho **quais sessões precisam de quantos dias de intervalo entre si**. Exemplos:
  - "Sessão A ↔ Sessão B: no mínimo 1 dia de intervalo";
  - "Sessão C ↔ Sessão D: no mínimo 2 dias de intervalo";
  - uma sessão também pode ter regra com ela mesma, caso se repita na semana.
  - "N dias de intervalo" = N dias sem nenhuma das duas sessões entre elas (intervalo de 2 dias: segunda → no mínimo quinta).
  - Pares sem regra podem ficar em dias seguidos.
- **Dias disponíveis:** posso marcar dias da semana em que não posso treinar (fixos ou só nesta semana). O planejador não usa esses dias.
- **Não há dia fixo de treino**: o app distribui as sessões restantes respeitando as regras.
- **Check diário:** marcar qual sessão fiz no dia (ou nenhuma).
- **Meta de cardio semanal:** número de sessões **editável**, com checklist.
- A semana vai de **domingo a sábado**.
- **Planejador automático:** com base no que já fiz na semana e nos dias restantes, o app calcula as distribuições válidas das rotinas que faltam. São poucos dias e poucas sessões, então dá para testar todas as combinações (força bruta), sem algoritmo complexo. Considere também os treinos do fim da semana anterior para o espaçamento. Resultado para cada dia:
  - **"Tem que ser hoje"**: nenhuma distribuição válida existe sem treinar hoje.
  - **"Recomendado hoje"**: treinar hoje mantém mais opções abertas.
  - **"Descanso possível"**: dá para não treinar hoje sem comprometer a semana.
  - **"Semana já não fecha"**: não existe mais distribuição válida. Mostrar com tom neutro e sugerir o melhor possível (ex.: quais rotinas ainda cabem).
- Mostrar na tela de treino uma sugestão de distribuição para o resto da semana, recalculada a cada check.
- **Essa lógica deve ter testes automatizados**, porque é onde bugs são mais prováveis.

### 4.6 "Bom dia": resumo matinal e nota para amanhã
**Objetivo:** me despertar de verdade. Quando o alarme toca, levanto para desligar o celular (ele fica longe da cama) e corro o risco de voltar a dormir. O "Bom dia" é um gancho para isso: toco na notificação, vejo uma animação e um resumo do dia, e o cérebro "liga".

- **Entrada:** tela cheia, aberta ao tocar na notificação de "Bom dia" (§5). Também pode ser aberta manualmente pela tela "Início".
- **Animação curta** de abertura (2 a 4 segundos, pulável com um toque): por enquanto, algo simples como um sol nascendo. No futuro será o mascote (§9). Deve ser leve e não travar celular fraco.
- **Resumo do dia**, em blocos curtos e fáceis de ler meio dormindo:
  - a **nota para hoje** (escrita na véspera), em destaque, primeiro;
  - compromissos da agenda com horário;
  - hábitos do dia;
  - treino: o que está previsto, e se é "tem que ser hoje";
  - cards pendentes;
  - lembrete de tomar sol, com botão para marcar "tomei sol" ali mesmo.
- **Ação de saída:** um botão claro ("Começar o dia" ou similar) que leva à tela "Início". Opcionalmente, o check do sono da noite anterior aparece aqui mesmo.
- **Abrir o "Bom dia" conta como "acordei"** (ver §5 e §10): registra o horário real em que abri.

**Nota para amanhã:**
- Um bloco de texto livre que escrevo em qualquer momento do dia, para o dia seguinte.
- Aparece em destaque no "Bom dia" e também na tela "Início" do dia seguinte.
- Fica salva no histórico, associada ao dia a que se destina.
- Atalho para escrevê-la na tela "Início". O aviso de "hora de dormir" pode lembrar de escrevê-la, se ainda não foi escrita (configurável).

---

## 5. Notificações (prioridade máxima)

No Android, as notificações são **locais**: o próprio app as agenda no sistema, então funcionam com o app fechado e sem internet. Na versão web (PC), notificações são opcionais e podem ficar de fora da v1. Cada tipo pode ser ligado ou desligado e ter o horário ajustado em Configurações.

**Como o agendamento funciona:**
- O app mantém agendados os avisos dos **próximos 7 dias**. Sempre que algo relevante muda (horários de sono, agenda, check de treino, configurações) e sempre que o app é aberto, ele **cancela e reagenda** tudo.
- Avisos condicionais são agendados com antecedência e **cancelados** quando a condição deixa de valer. Ex.: os avisos de sol são cancelados assim que marco "tomei sol".
- Usar **alarmes exatos** do Android, para os avisos chegarem no minuto certo. O app deve pedir as permissões necessárias (notificações, alarmes exatos) e explicar como liberá-las. Inclui orientar a desativar a otimização de bateria para o app, se o celular estiver atrasando os avisos.
- Os avisos devem sobreviver a reiniciar o celular (reagendar ao ligar).

| Aviso | Quando | Condição |
|---|---|---|
| **"Bom dia"** ⚑ | horário-alvo de acordar do dia | sempre (se ativo); **insistente**, ver abaixo |
| **Tomar sol** | ao acordar, +30 min e +60 min | só se o check "tomei sol" ainda não foi marcado hoje |
| **Hora de dormir** | horário-alvo de dormir do dia (opcional: aviso prévio X min antes) | sempre (se ativo) |
| **Treino** | horário configurável (ex.: manhã) | quando o planejador indicar "tem que ser hoje" ou "recomendado hoje", com texto diferente para cada |
| **Lembrete de agenda** | X min antes do compromisso | se o compromisso tiver lembrete |
| **Revisar cards** (opcional) | horário configurável | se houver cards pendentes |

- Os horários de acordar e dormir são **puxados da configuração do dia da semana** correspondente.
- Os textos das notificações são curtos, gentis e editáveis no futuro (podem ganhar a "voz" do mascote).

### Destino ao tocar (deep link)
Cada tipo de notificação abre o app **direto na tela correspondente**. Se o app já estiver aberto, navega até lá. Se o app tinha sido fechado pelo sistema, abre direto na tela de destino.

| Notificação | Abre em |
|---|---|
| Bom dia | tela "Bom dia" (§4.6), com animação |
| Tomar sol | "Bom dia" ou tela de sono, com o check de sol em evidência |
| Hora de dormir | tela de sono / nota para amanhã |
| Treino | tela de treino da semana |
| Agenda | o compromisso |
| Revisar cards | tela de revisão |

### Notificações insistentes (⚑)
Para avisos que não posso ignorar, quero que **deslizar para o lado não resolva**: o aviso só some de verdade quando eu **toco nele e abro o app**.

**Limitação técnica, a ser explicada ao usuário:** desde o Android 14, o sistema permite deslizar quase qualquer notificação, mesmo de apps nativos. O comportamento desejado deve ser **simulado**:
1. A notificação é marcada como contínua (*ongoing*) e com prioridade alta, com vibração.
2. **Repetições pré-agendadas:** junto com o aviso principal, o app agenda repetições a cada X minutos (padrão: 3 min) até um limite (padrão: 30 min). Se eu deslizar, a próxima repetição aparece mesmo assim.
3. Tocar na notificação abre a tela de destino e **cancela todas as repetições** pendentes.

**Opção de tela cheia (estilo alarme) para o "Bom dia":** o Android permite que uma notificação abra o app em tela cheia, como um despertador (*full-screen intent*). Nas versões recentes, essa permissão é restrita, mas num app instalado manualmente o usuário pode liberá-la nas configurações. Implementar como **opção** em Configurações, com instruções para liberar a permissão. Se ela não estiver liberada, usar o comportamento insistente normal.

- Qualquer tipo de notificação pode ser marcado como **insistente** nas Configurações. Por padrão, só "Bom dia" vem marcado.
- O intervalo de reenvio e o limite são configuráveis.
- Validar esse comportamento cedo, no celular real (ver §8).
- Deve existir um **botão de teste** de notificação em Configurações.
- Se as permissões necessárias não estiverem liberadas (notificações, alarmes exatos, tela cheia, otimização de bateria), o app avisa e explica como resolver, passo a passo.

---

## 6. Dados e histórico

- **Guardar todo o histórico** (checks, hábitos, revisões, versões da dieta). É só texto. Estimativa: poucos MB por ano, muito abaixo do limite gratuito do Supabase. Não implemente exclusão automática de histórico.
- **Exportar tudo** em um JSON único (backup completo) e **importar** esse backup. Acessível em Configurações.
- Todas as tabelas têm `user_id`, `created_at`, `updated_at`. Use exclusão lógica (`deleted_at`) quando houver sincronização offline.
- Datas e horários sempre no fuso **America/Sao_Paulo**. Um "dia" vai de 00:00 a 23:59 local. O check de sono de uma noite pertence ao dia em que acordei.
- Semana: **domingo a sábado**.
- A nota para amanhã pertence ao dia a que se destina, não ao dia em que foi escrita.

---

## 7. Fora do escopo da v1
- Imagens, áudio, cloze e importação `.apkg` nos flashcards.
- Contagem de calorias e macros, banco de alimentos.
- Gamificação de qualquer tipo.
- Multiusuário e compartilhamento.
- Publicação na Play Store (o APK é instalado direto).
- Versão para iPhone.
- Notificações na versão web (PC), se forem trabalhosas.

---

## 8. Ordem de construção (referência)
1. Base: projeto, login único, Supabase com RLS, design tokens, navegação entre abas, versão web no Netlify.
2. **APK e atualizações:** Capacitor, keystore (com backup feito pelo usuário), build automático no GitHub Actions e verificação de atualização dentro do app. Validar cedo que **instalar uma versão nova por cima mantém os dados**.
3. Flashcards (com importação TSV/JSON e revisão FSRS), já salvando o estado para sobreviver ao fechamento pelo sistema.
4. Sono (horários + checks) e **primeira notificação funcionando ponta a ponta**: validar cedo no celular real o agendamento local, o deep link, o comportamento insistente e a chegada no horário exato.
5. Rotina: hábitos, agenda, tarefa não planejada, nota para amanhã.
6. Tela "Bom dia" (resumo + animação provisória; opção de tela cheia).
7. Treino: rotinas com exercícios e cargas, registro na academia, peso, planejador semanal, cardio e notificação de treino.
8. Dieta com versões.
9. Tela "Início" completa.
10. Estatísticas, backup completo e offline.
11. Logo, ícone do app, variações do mascote e animação do "Bom dia" (a base visual já está definida em §9 e deve ser usada desde o passo 1).

A ordem pode mudar conforme os pedidos do usuário.

---

## 9. Identidade visual (base aprovada; nome e logo ainda pendentes)

**Direção:** "limpo com detalhe de pixel". Interface limpa e legível. O pixel aparece no mascote, nos ícones, nos números e em detalhes (como o medidor de sono). Evitar a estética genérica de IA: nada de degradês, glassmorphism, emojis como ícones, sombras difusas ou cantos exageradamente arredondados.

**Referência visual:** `docs/design/referencia-tela-inicio.html` (abra no navegador). Mostra a tela Início nos modos claro, escuro e foco, mais a barra do mascote recolhida. É uma referência estática: as regras abaixo valem mais que o arquivo.

### Tipografia
O app usa **apenas duas fontes** (Google Fonts):
- **DotGothic16** (pixel) para o **texto grande**: saudação do mascote, números grandes (horas de sono, treinos feitos), valores de destaque (qualidade, peso, encaixes) e a marca "Planner".
- **JetBrains Mono** para **todo o resto**: texto, títulos de blocos, botões, rótulos, horários e contadores. Texto pequeno que precisa de destaque usa **JetBrains Mono em negrito (700)**.
- **Nunca usar itálico.** Nunca usar a fonte pixel em texto corrido ou pequeno.
- JetBrains Mono é larga (monoespaçada): textos longos em linha única usam reticências (`text-overflow: ellipsis`) em vez de quebrar o layout.

### Formas (iguais nos três modos)
- Cards com borda de 2px, raio de 8px, sem sombra. Elementos internos com raio de 6px.
- Checkboxes quadradas (raio 3px).
- Ícones em pixel art num grid de 16×16, preenchimento sólido.
- Alvos de toque com no mínimo 44px.

### Modos de cor (tokens)
| Token | Claro | Escuro | Foco |
|---|---|---|---|
| fundo | `#F1FAFA` | `#102A2F` | `#131718` |
| superfície (cards) | `#FFFFFF` | `#173840` | `#1D2223` |
| borda dos cards | `#D3E7E6` | `#22474E` | `#2A3133` |
| texto | `#102A2F` | `#F1FAFA` | `#EAF1F0` |
| texto secundário | `#4A6669` | `#9DBDBF` | `#9AA9A8` |
| ação principal | `#0A7A73` | `#5FE9DE` | `#5FE9DE` |
| texto sobre ação | `#FFFFFF` | `#102A2F` | `#102A2F` |
| barra do mascote | `#DDF1EE` | `#0C2024` (borda `#22474E`) | `#181C1D` (borda `#2A3133`) |
| destaque urgente | `#FEF156` com texto `#102A2F` | igual | igual |

- O **amarelo `#FEF156` é reservado** para o sol e para o que é urgente ("tem que ser hoje"). Não usar em outros lugares.
- Água-marinha (`#5FE9DE`) nunca como texto sobre fundo claro.
- O modo **foco** é um escuro em cinza neutro, com exatamente as mesmas formas e posições dos outros dois.
- O usuário escolhe o modo em Configurações.

### Mascote
- Pixel art, corpo retangular com braços e pernas, olhos água-marinha. **Versão azul por padrão:** corpo `#0A7A73` no modo claro e `#13958C` nos modos escuro e foco, olhos `#5FE9DE`.
- **Fonte de verdade: `docs/mascote/mascote.json`**, fornecido pelo usuário. Ele contém a grade de pixels (25×19), as paletas por modo, os quadros (`padrao`, `piscar`, `oi`) e as animações. Leia esse arquivo e gere o mascote a partir dele. Nunca desenhe o mascote "à mão" nem a partir de imagens.
- Cada pose ou variação nova (dormindo, óculos de estudo, faixa de treino) é **um novo quadro na mesma grade**, com as mesmas letras e cores, adicionado a esse arquivo.

- Animações em poucos quadros (2 a 4), trocados em degraus, no estilo pixel: piscar, pulinho, aceno. Respeitar `prefers-reduced-motion`.
- **Piscar corretamente:** o corpo é desenhado inteiro (inclusive embaixo dos olhos) e os olhos por cima. Piscar é trocar para o quadro `piscar`, em que o olho vira 1 linha na base. O fundo da tela **nunca** pode aparecer no lugar do olho.
- Variações por módulo (óculos nos flashcards, olhos fechados no sono etc.) devem ser aprovadas pelo usuário antes de entrar no app.

### Nome e logo
- Nome: **Planner**. Na marca, escrito em DotGothic16.
- Logo e ícone do app: o **mascote padrão** (paleta clara) centralizado sobre um quadrado com o **fundo do modo claro** (`#F1FAFA`). Arquivo de referência: `docs/mascote/logo-planner.svg`. Gerar os ícones do Android (incluindo o ícone adaptativo) a partir dele.

### Barra do mascote (topo, todas as abas)
- Fica acima do conteúdo em todas as abas. Pode ser **recolhida** (sobe e some, com animação curta) e reaberta por um botão pequeno e baixo ("Mostrar", com o mascote em miniatura; visual de ~34px de altura dentro de uma área de toque de 44px). O estado (aberta ou recolhida) é lembrado.
- A barra tem **folga ao redor do mascote** (área de ~64×64px e padding generoso) reservada para animações futuras. Não encher esse espaço com outros elementos.
- Conteúdo: mascote animado, saudação (em DotGothic16), a **data** (o único lugar da tela Início onde a data aparece) e dois botões lado a lado: **"Notas anteriores"** e **"Editar nota atual"**, sempre com o texto em **uma linha** em todos os modos.
- O visual da barra acompanha a aba atual (o mascote pode mudar de variação por aba).

### Tela Início (layout aprovado)
Sem título nem data no corpo. **Com a barra do mascote aberta, o conteúdo preenche a tela, sem rolagem.** Com a barra recolhida, os blocos **não** esticam: sobra espaço embaixo, e está tudo bem. Só rola se a lista de tarefas for expandida. De cima para baixo:
1. **Tarefas:** título "Tarefas", as 5 primeiras tarefas (horário à direita, quando houver) e, **abaixo da lista**, o botão "Ver todas". Sem contadores de feitas ou pendentes.
2. **Dois blocos lado a lado**, com altura natural (a do mais alto dos dois) e espaçamentos internos generosos, mas sem vãos grandes:
   - **Sono:** horas dormidas (número grande) no topo. Na base: **qualidade (00 a 99)** com medidor de 10 quadradinhos e, abaixo, o botão marcável **"Sol tomado"** na largura do bloco.
   - **Treino:** feitos/total da semana (número grande), "X feitos · Y faltam", **peso de hoje (kg)** e, na base, a caixa de encaixes. A caixa tem sempre três linhas, iguais em todos os modos: o número, o rótulo ("encaixe possível"/"encaixes possíveis") e uma nota de uma linha. Se restar **1**, a caixa fica amarela com "Tem que ser hoje"; nos outros casos, "Descanso possível".
- **Candidato futuro:** um bloco baixo de **"Projetos em andamento"** (nome do projeto + porcentagem e "Ver todos", sem contagem). Hoje não cabe sem rolagem com a barra aberta; só entra se o usuário pedir e houver espaço.

### Navegação inferior (abas ainda indefinidas)
- A primeira aba é **"Início"** (ícone de sol em pixel). As demais estão marcadas como **"(XXXXX)"** com ícone de **ponto de interrogação** em pixel no protótipo: **quais serão as abas principais ainda será decidido aos poucos com o usuário.**
- Não decida sozinho quais módulos viram abas. Enquanto não estiver definido, os módulos ficam acessíveis por uma tela provisória (ex.: "Mais"), e você pergunta ao usuário quando a decisão for necessária.

---

## 10. Decisões em aberto (perguntar quando chegar a hora)
- Pode haver duas sessões de treino no mesmo dia?
- O cardio tem alguma regra de espaçamento, ou é só a meta semanal?
- Lembretes de sol: **proposta** — contar +30 e +60 min a partir do momento em que abro o "Bom dia"; se eu não abrir, contar do horário-alvo de acordar. Confirmar.
- Horário padrão da notificação de treino.

---

## 11. Regras de trabalho para o Claude Code

**Sobre o usuário:** não programa (experiência só com "vibe coding"), mas usa bem o computador. Testa o app de verdade no celular e relata problemas.

**Como trabalhar:**
1. **Entregue e resuma.** Ao terminar uma tarefa, faça um resumo curto, em português e sem jargão: o que foi feito, como testar (passo a passo), o que ficou pendente. Explique mais a fundo só quando o usuário perguntar.
2. **Peça confirmação antes de mudanças estruturais:** alterar o esquema do banco (tabelas, colunas), apagar ou migrar dados, trocar biblioteca ou stack, mudar a forma de sincronização. Explique o motivo em linguagem simples.
3. **Nunca perca dados do usuário.** Mudanças de esquema usam migrações versionadas (pasta `supabase/migrations`). Antes de qualquer migração que altere dados existentes, lembre o usuário de exportar o backup.
4. **Passos fora do código** (criar conta no Supabase, configurar o Netlify, variáveis de ambiente, permitir notificações no Android): dê instruções numeradas, clique a clique, dizendo exatamente o que copiar e onde colar.
5. **Git:** commits pequenos e descritivos em português, um por mudança lógica, para ser fácil voltar atrás.
6. **Testes automatizados** para a lógica crítica: planejador de treino, agendamento de notificações (incluindo a condição do sol) e a integração com o FSRS.
7. **Faça uma coisa por vez.** Não adicione funcionalidades que não foram pedidas. Se notar algo útil, sugira no resumo em vez de implementar.
8. **Código simples e legível,** com comentários curtos em português nas partes de lógica de negócio.
9. **Mantenha este arquivo atualizado:** ao tomar uma decisão relevante (stack, formato de dados, regra resolvida de §10), registre em "Registro de decisões" abaixo, com data.
10. Ao encontrar uma contradição entre um pedido e este documento, pergunte antes de seguir.
11. **Nunca altere** o `applicationId` nem a chave de assinatura do app, e **sempre aumente o `versionCode`** ao gerar uma versão nova (ver §3). Se alguma mudança exigir mexer nisso, pare e explique o risco antes.
12. **Toda tela nova deve sobreviver ao fechamento pelo sistema** (ver §2). Inclua no resumo de entrega como testar isso.

---

## Registro de decisões
<!-- formato: AAAA-MM-DD — decisão — motivo -->
- 2026-11-13 — Supabase como banco e autenticação; Netlify para a versão web — gratuito e suficiente para uso pessoal; usuário já usa Netlify.
- 2026-11-13 — FSRS (`ts-fsrs`) para repetição espaçada — mais preciso que SM-2 e já pronto em biblioteca.
- 2026-11-13 — Login único com cadastro desativado + RLS — sem login, os dados ficariam expostos a quem tivesse a URL.
- 2026-11-13 — Histórico completo, sem expiração — volume estimado de poucos MB por ano.
- 2026-11-13 — Treino genérico: 1 a 6 sessões com nomes livres e regras de intervalo por par de sessões; meta de cardio editável — a divisão de treino muda com o tempo.
- 2026-11-13 — Semana de domingo a sábado.
- 2026-11-13 — Tela "Bom dia" com animação, resumo e nota para amanhã, aberta pela notificação — ajudar a despertar e começar o dia com direção.
- 2026-11-17 — App Android nativo com Capacitor (APK instalado direto) + versão web no Netlify, mesmo código — o PWA era descartado pelo Chrome com frequência e reiniciava; o nativo também dá notificações locais mais confiáveis.
- 2026-11-17 — Notificações locais agendadas pelo app (sem servidor de push na v1); insistência simulada com repetições pré-agendadas; opção de tela cheia para o "Bom dia".
- 2026-11-17 — Estado salvo continuamente para o app reabrir onde parou — o fechamento pelo sistema é inevitável, o reinício deve ser invisível.
- 2026-11-17 — Base visual: DotGothic16 nos destaques + Atkinson Hyperlegible no texto; modos claro, escuro (petróleo) e foco (cinza) com as mesmas formas; mascote azul definido como matriz de pixels — legibilidade com estilo próprio, sem estética genérica.
- 2026-11-17 — Nome "Planner"; logo = mascote padrão sobre `#F1FAFA`; mascote definido em `docs/mascote/mascote.json`.
- 2026-11-17 — A aba Treino passa a incluir rotinas completas (exercícios, séries, cargas), registro na academia e histórico de peso, substituindo o PWA de treino antigo.
- 2026-11-18 — Fontes: só DotGothic16 (texto grande) e JetBrains Mono (resto, negrito para destaque), sem itálico. Tela Hoje sem hábitos e sem rolagem; peso passa para o bloco de treino.
- 2026-11-18 — Tela renomeada para "Início"; tarefas sem contadores e "Ver todas" abaixo; blocos com altura natural; abas principais ainda indefinidas ("(XXXXX)"); princípio de não exibir contagens.
- 2026-11-18 — Treino construído do zero, sem importar o PWA antigo.
- 2026-11-17 — Qualidade do sono (00 a 99) digitada pelo usuário, vinda do smartband.
- 2026-11-17 — APK gerado pelo GitHub Actions e publicado em Releases; atualização verificada dentro do app; mesmo applicationId e keystore para sempre — atualizar sem perder dados.
