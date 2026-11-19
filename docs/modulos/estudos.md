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

## Estrutura
```
Objetivo (ex.: ENEM)
 └ Área (opcional, só organização; ex.: Matemática)
    └ Conteúdo (ex.: Função do 1º grau)  ← check-ins de estudo
```
- Pode haver vários objetivos ao mesmo tempo.
- **Conteúdos** têm ordem (fila de estudo, reordenável; o app mostra o "Próximo a estudar") e situação:
  - **a estudar** (sem check-in);
  - **estudado** (tem check-in; pode haver vários, guardados no histórico);
  - **em consolidação** e **dominado**: calculados pelo app a partir dos cards (versão de acompanhamento).
- **Baralhos** são geridos pelo usuário, numa lista simples, **sem sub-baralhos** (área e tags já organizam). Ex.: "ENEM – Flashcards", "ENEM – Questões". Questões **não** são um tipo especial: são cards comuns num baralho separado.
- Cada **card** (frente, verso, tags) pertence a **um baralho** e, opcionalmente, a **um conteúdo**.
- **Um card ligado a conteúdo só entra na revisão depois do primeiro check-in dele** (primeiro estudar, depois recuperar). Card sem conteúdo entra direto.
- Se um check-in liberar muitos cards de uma vez, o teto de 50 novos por dia distribui a entrada ao longo dos dias. (Aviso de carga no check-in: futuro, se fizer falta.)

### Tela principal de Estudos
- Blocos **Objetivos** e **Baralhos**: mostram os **5 primeiros**; se houver mais, botão **"Ver todos"** abre uma tela com a lista completa.
- Bloco **Cards**: Importar cards, Gerar cards com IA, Exportar cards.

## Revisão (versão 0.3.2)
- **Acessada pela tela de Estudos**: botão "Revisar" no topo (com o total para revisar agora).
- Ao abrir: escolher o **baralho** (cada um mostra quantos estão para revisar) e revisar **todos** os cards ou **filtrar** por **várias áreas** ou **várias tags** (vale qualquer uma das marcadas); aí "Começar".
- Ordem: primeiro os cards em aprendizado que já venceram; depois revisões e novos **misturados** (ordem estável no mesmo dia).
- Card respondido com "Errei" volta minutos depois, na mesma sessão. Se não houver mais nada, cards que voltam em até 20 min são adiantados; no fim, o app diz a que horas os próximos voltam.
- **Teto de segurança de 50 cards novos por dia** (o ritmo normal é dado pelos check-ins).
- Frente → "Mostrar resposta" → verso + 4 botões **Errei / Difícil / Bom / Fácil**, com o intervalo previsto em cada botão (ex.: "Bom · 10min", "Fácil · 10d"). Durante a revisão dá para editar o card.
- Agendamento pelo FSRS (`ts-fsrs`), meta de 90% de chance de lembrar (por enquanto fixa; ajuste em Configurações quando houver necessidade). No futuro, com meses de histórico, calibrar os parâmetros do FSRS com as minhas revisões.
- Histórico de toda revisão guardado (tabela `revisoes`), nunca apagado.
- Salva continuamente o card atual e se a resposta está aberta: reabrir após fechamento volta no mesmo ponto.
- Funciona offline; sincroniza depois.

## Acompanhamento (versão seguinte)
- **Por objetivo:** conteúdos a estudar / estudados / dominados; mapa de força por conteúdo.
- **Por conteúdo:** quanto lembro hoje (estimativa do FSRS), acerto, data do último estudo.
- **"Precisa de reforço":** conteúdos com muitos erros → sugerir **reestudar**.
- **Cards-problema:** errados várias vezes → sugerir reescrever ou dividir.
- **Carga dos próximos dias:** revisões previstas para amanhã e para a semana.
- Cards por baralho e por tag; novos/jovens/maduros.

## Importação e exportação
- Colar texto ou abrir arquivo. Formatos:
  - **JSON** (recomendado): `{ "cards": [ { "baralho", "conteudo", "frente", "verso", "tags" } ] }` (`tags` como lista ou texto).
  - **TSV/CSV** (separador detectado: tab, `;` ou `,`; campos entre aspas podem ter quebra de linha) com cabeçalho `baralho`, `conteudo`, `frente`, `verso`, `tags`.
  - `conteudo` = `Objetivo::Conteúdo` ou `Objetivo::Área::Conteúdo` (pode ficar vazio). `tags` separadas por espaço.
- Baralhos, objetivos, áreas e conteúdos que não existirem são criados.
- **Prévia** antes de confirmar; **duplicados** = mesma frente no mesmo baralho → **pular** ou **atualizar** verso/tags.
- **Exportação** de um baralho ou de todos em JSON e TSV (mesmo formato da importação).
- **Gerar cards com IA:** escolher baralho e conteúdo; o app monta um texto pronto (pede JSON, que resiste melhor a copiar e colar do chat) com orientações de bons cards. Um botão **"?"** abre/fecha o "Como funciona" (fechado por padrão).

## Fora do escopo da v1
Imagens, áudio, cloze, add-ons e importação `.apkg` do Anki.
