# Estudos (objetivos, conteúdos e flashcards)

Definido em 2026-11-19. Substitui o antigo módulo "Flashcards". Aba principal **"Estudos"** (segunda aba).

> Nome na interface: **conteúdo** (masculino: "o conteúdo", "próximo a estudar"). No código e no banco o nome interno continua `micrometa`/`micrometas`, e na importação a coluna antiga `micrometa` ainda é aceita.

## Ideia
Os flashcards não são um Anki solto: são a ferramenta de **recuperação** de um processo de estudo.
1. Defino um **objetivo final** (ex.: ENEM).
2. Defino os **conteúdos** (microconteúdos): "Função do 1º grau", "Arranjo e combinação"…
3. Estudo cada conteúdo **fora do app** (texto, aula) e faço o **check-in** no app.
4. Do estudo saem **flashcards** (e flashcards-questão), importados no app, ligados ao conteúdo.
5. No app faço as **revisões** e o **acompanhamento**.

Rotina esperada: revisão de cards **todo dia**; estudar conteúdos **3 a 5 dias por semana**; sessões de questões quando quiser.

## Princípios científicos (guiam algoritmo e estatísticas)
- **Recuperação ativa:** o card mostra a pergunta; tento lembrar antes de ver a resposta.
- **Espaçamento:** o FSRS agenda cada card para quando a chance de lembrar cair para ~90%.
- **Intercalação:** dentro de uma revisão, os conteúdos vêm misturados.
- **Feedback honesto e gentil:** mostrar onde estou fraco para decidir o próximo estudo; sem placar, sem culpa.

## Estrutura (desde 0.3.4)
```
Baralho (ex.: Português, Matemática)  ← independente; pode aparecer em vários objetivos
Objetivo (ex.: TJSP, UNIVESP)          ← mostra os baralhos vinculados a ele
Conteúdo (ex.: Crase)                  ← pode estar em vários objetivos; tem um baralho (opcional)
Card                                   ← fica no baralho do conteúdo; tags livres (ex.: card, questao)
```
- **Áreas deixaram de existir** (2026-11-20): o **baralho faz o papel da matéria**. "Card" ou "questão" vira **tag**.
- **Baralho:** ente independente, vinculável a vários objetivos.
- **Objetivo:** na tela dele aparecem os baralhos vinculados (ordem ajustável) e, em cada baralho, **só os conteúdos daquele objetivo que estão naquele baralho**. Conteúdo do mesmo baralho que é de outro objetivo não aparece. A ordem dos conteúdos é a fila de estudo do objetivo ("Próximo a estudar").
- **Conteúdo:** criado dentro de um objetivo; pode ser **compartilhado** com outros objetivos ("Conteúdo de outro objetivo" na tela do objetivo, ou "Adicionar a outro objetivo" na tela do conteúdo). É **um só registro**: check-ins, cards e acompanhamento são os mesmos nos dois objetivos. Cada objetivo tem a própria posição dele na fila. Marcado como "compartilhado" na lista.
- **Baralho do conteúdo:** os cards de um conteúdo ficam no baralho dele. Mudar o baralho do conteúdo leva os cards junto (com confirmação). Conteúdo sem baralho aparece em "Sem baralho".
- **Situação do conteúdo:** a estudar → estudado → em consolidação → dominado (ver Acompanhamento).
- **Um card ligado a conteúdo só entra na revisão depois do primeiro check-in dele** (primeiro estudar, depois recuperar). Card sem conteúdo entra direto.
- Apagar objetivo: conteúdos que só existem nele são apagados; os compartilhados continuam. Apagar conteúdo: sai de todos os objetivos. Apagar baralho: apaga os cards; os conteúdos ficam sem baralho.
- No banco: `objetivo_baralhos`, `objetivo_conteudos` e `micrometas.baralho_id` (migração 003). A conversão dos dados de antes (cada conteúdo no objetivo onde foi criado; baralho = onde está a maioria dos cards dele) foi automática.

### Tela principal de Estudos
- Botão **Revisar** e **Acompanhamento**.
- Blocos **Objetivos** e **Baralhos**: mostram os **5 primeiros**; se houver mais, **"Ver todos"**.
- Bloco **Cards**: Importar cards, Gerar cards com IA, Exportar cards.

### Tela do baralho
- Resumo: novos / jovens / maduros e acerto (30 dias).
- Cards: busca e visão **Todos / Conteúdos / Tags** (agrupados sob subtítulos, com a quantidade).
- Cada card mostra a situação: "novo", "jovem · volta em 3d", "maduro · para revisar".
- Tela do card: bloco **Histórico** (situação, força, revisões e erros, lista das respostas).

## Revisão (versão 0.3.2)
- **Acessada pela tela de Estudos**: botão "Revisar" no topo (com o total para revisar agora).
- Ao abrir: marcar **Baralhos**, **Objetivos** e **Tags** (vários em cada um; nada marcado = sem filtro ali). Dentro de cada um vale **qualquer** dos marcados; entre eles, **todos** (ex.: baralho Português + tag `questao` = só questões de Português). Aí "Começar".
- **"Nada para revisar agora"** não é limite: os cards daqueles filtros ainda estão fortes; revisá-los antes da hora rende pouco (ver abaixo).
- **Revisão Livre:** passa por todos os cards dos filtros (vencidos ou não), com "Errei"/"Acertei", **sem mudar o agendamento e sem gravar no histórico**. Para véspera de prova. No fim mostra quantos acertos. Retoma no mesmo card se o app fechar.
- Ordem: primeiro os cards em aprendizado que já venceram; depois revisões e novos **misturados** (ordem estável no mesmo dia).
- Card respondido com "Errei" volta minutos depois, na mesma sessão. Se não houver mais nada, cards que voltam em até 20 min são adiantados; no fim, o app diz a que horas os próximos voltam.
- **Cards novos: 20 por dia** (padrão do Anki). Quando o limite segura cards, o fim da revisão mostra quantos ficaram para amanhã e o botão **"Liberar mais 20 hoje"**.
- **Revisões não têm limite.** Card vencido é card que o FSRS calculou estar perto de ser esquecido; adiá-lo só aumenta o esquecimento e acumula trabalho. O limite existe só para **novos**, porque cada card novo gera várias revisões nas semanas seguintes. Revisar cards que ainda não venceram (estudar adiantado) não é oferecido: rende pouco, porque a memória ainda está forte.
- Frente → "Mostrar resposta" → verso + 4 botões **Errei / Difícil / Bom / Fácil**, com o intervalo previsto em cada botão (ex.: "Bom · 10min", "Fácil · 10d"). Durante a revisão dá para editar o card.
- Agendamento pelo FSRS (`ts-fsrs`), meta de 90% de chance de lembrar (por enquanto fixa; ajuste em Configurações quando houver necessidade). No futuro, com meses de histórico, calibrar os parâmetros do FSRS com as minhas revisões.
- Histórico de toda revisão guardado (tabela `revisoes`), nunca apagado.
- Salva continuamente o card atual e se a resposta está aberta: reabrir após fechamento volta no mesmo ponto.
- Funciona offline; sincroniza depois.

## Acompanhamento (versão 0.3.3)
Tela "Acompanhamento" (abaixo do botão Revisar), mais dados na tela do objetivo e do conteúdo.
- **Força** de um conteúdo: média da chance de lembrar agora (estimativa do FSRS) dos cards já revisados, em %. Medidor de 10 quadradinhos na tela do conteúdo.
- **Acerto (30 dias):** % de respostas diferentes de "Errei" em cards que já estavam aprendidos (como a "retenção real" do Anki).
- **Situação** do conteúdo: a estudar (sem check-in) → estudado (check-in, nenhum card revisado) → em consolidação → **dominado** (todos os cards revisados e ≥ 80% maduros).
- **Maduro:** intervalo de 21 dias ou mais; **jovem:** revisado, intervalo menor; **novo:** nunca revisado.
- **Precisa de reforço:** acerto < 80% (com ≥ 5 respostas) ou força < 70% → sugerir **reestudar o conteúdo**.
- **Cards-problema:** errados 4 vezes ou mais (lapsos) → reescrever ou dividir.
- **Revisões nos próximos dias:** hoje (com atrasados) e os 6 dias seguintes.
- Por objetivo: quantos conteúdos em cada situação (conteúdos compartilhados contam nos dois). Por baralho: novos / jovens / maduros.

## Importação e exportação
- Colar texto ou abrir arquivo. Formatos:
  - **JSON** (recomendado): `{ "cards": [ { "baralho", "conteudo", "frente", "verso", "tags" } ] }` (`tags` como lista ou texto).
  - **TSV/CSV** (separador detectado: tab, `;` ou `,`; campos entre aspas podem ter quebra de linha) com cabeçalho `baralho`, `conteudo`, `frente`, `verso`, `tags`.
  - `conteudo` = `Objetivo::Conteúdo` (pode ficar vazio). O formato antigo `Objetivo::Área::Conteúdo` ainda é aceito (a área é ignorada). `tags` separadas por espaço.
- Baralhos, objetivos e conteúdos que não existirem são criados; o conteúdo novo ganha o baralho da linha, e o baralho passa a aparecer no objetivo.
- **Prévia** antes de confirmar; **duplicados** = mesma frente no mesmo baralho → **pular** ou **atualizar** verso/tags.
- **Exportação** de um baralho ou de todos em JSON e TSV (mesmo formato da importação).
- **Gerar cards com IA:** escolher baralho e conteúdo; o app monta um texto pronto (pede JSON, que resiste melhor a copiar e colar do chat) com orientações de bons cards. Um botão **"?"** abre/fecha o "Como funciona" (fechado por padrão).

## Fora do escopo da v1
Imagens, áudio, cloze, add-ons e importação `.apkg` do Anki.
