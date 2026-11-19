# Estudos (objetivos, micrometas e flashcards)

Definido em 2026-11-19. Substitui o antigo módulo "Flashcards". Aba principal **"Estudos"** (segunda aba).

## Ideia
Os flashcards não são um Anki solto: são a ferramenta de **recuperação** de um processo de estudo.
1. Defino um **objetivo final** (ex.: ENEM).
2. Defino as **micrometas** (microconteúdos): "Função do 1º grau", "Arranjo e combinação"…
3. Estudo cada micrometa **fora do app** (texto, aula) e faço o **check-in** no app.
4. Do estudo saem **flashcards** (e flashcards-questão), importados no app, ligados à micrometa.
5. No app faço as **revisões** e o **acompanhamento**.

Rotina esperada: revisão de cards **todo dia**; estudar micrometas **3 a 5 dias por semana**; sessões de questões quando quiser.

## Princípios científicos (guiam algoritmo e estatísticas)
- **Recuperação ativa:** o card mostra a pergunta; tento lembrar antes de ver a resposta.
- **Espaçamento:** o FSRS agenda cada card para quando a chance de lembrar cair para ~90%.
- **Intercalação:** dentro de um baralho, a revisão mistura micrometas.
- **Feedback honesto e gentil:** mostrar onde estou fraco para decidir o próximo estudo; sem placar, sem culpa.

## Estrutura
```
Objetivo (ex.: ENEM)
 └ Área (opcional, só organização; ex.: Matemática)
    └ Micrometa (ex.: Função do 1º grau)  ← check-ins de estudo
```
- Pode haver vários objetivos ao mesmo tempo.
- **Micrometas** têm ordem (fila de estudo; o app mostra a próxima) e situação:
  - **a estudar** (sem check-in);
  - **estudada** (tem check-in; pode haver vários check-ins, guardados no histórico);
  - **em consolidação** e **dominada**: calculadas pelo app a partir dos cards (versão 0.3.2).
- **Baralhos** são geridos pelo usuário, numa lista simples (ex.: "ENEM – Flashcards", "ENEM – Questões"). Questões **não** são um tipo especial: são cards comuns num baralho que o usuário separa para isso.
- Cada **card** (frente, verso, tags) pertence a **um baralho** e, opcionalmente, a **uma micrometa**.
- **Um card ligado a micrometa só entra na revisão depois do primeiro check-in dela** (primeiro estudo, depois recuperação). Card sem micrometa entra direto.
- Se um check-in for liberar muitos cards de uma vez, o app avisa a carga prevista e oferece liberar aos poucos (versão 0.3.1).

## Revisão (versão 0.3.1)
- Por baralho; dentro dele, micrometas misturadas.
- Frente → "Mostrar resposta" → verso + 4 botões **Errei / Difícil / Bom / Fácil**, com o intervalo previsto em cada botão.
- Agendamento pelo FSRS (`ts-fsrs`), meta padrão de 90% de chance de lembrar (ajustável em Configurações). No futuro, com meses de histórico, calibrar os parâmetros do FSRS com as minhas revisões.
- Histórico de toda revisão guardado (tabela `revisoes`), nunca apagado.
- Salva continuamente o card atual e se a resposta está aberta: reabrir após fechamento volta no mesmo ponto.
- Funciona offline; sincroniza depois.

## Acompanhamento (versão 0.3.2)
- **Por objetivo:** micrometas a estudar / estudadas / dominadas; mapa de força por micrometa.
- **Por micrometa:** quanto lembro hoje (estimativa do FSRS), acerto, data do último estudo.
- **"Precisa de reforço":** micrometas com muitos erros → sugerir **reestudar o conteúdo**.
- **Cards-problema:** errados várias vezes → sugerir reescrever ou dividir.
- **Carga dos próximos dias:** revisões previstas para amanhã e para a semana.
- Cards por baralho e por tag; novos/jovens/maduros.

## Importação e exportação (versão 0.3.0)
- Colar texto ou escolher arquivo. Formatos:
  - **TSV/CSV** (separador detectado: tab, `;` ou `,`; campos entre aspas podem ter quebra de linha) com cabeçalho `baralho`, `micrometa`, `frente`, `verso`, `tags`.
    - `micrometa` = `Objetivo::Micrometa` ou `Objetivo::Área::Micrometa` (pode ficar vazio).
    - `tags` separadas por espaço.
  - **JSON**: `{ "cards": [ { "baralho", "micrometa", "frente", "verso", "tags" } ] }` (`tags` como lista ou texto).
- Baralhos, objetivos, áreas e micrometas que não existirem são criados.
- **Prévia** antes de confirmar; **duplicados** = mesma frente no mesmo baralho → escolher **pular** ou **atualizar** verso/tags.
- **Exportação** de um baralho ou de todos em JSON e TSV (no mesmo formato da importação).
- **Tela de ajuda** com o formato e um texto pronto para pedir a uma IA que gere os cards a partir do conteúdo estudado, com orientações de bons cards (uma ideia por card, pergunta que exija lembrar).

## Fora do escopo da v1
Imagens, áudio, cloze, add-ons e importação `.apkg` do Anki.
