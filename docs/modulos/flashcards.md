# Flashcards (estilo Anki)

- **Baralhos e sub-baralhos** em árvore, sem limite de profundidade (ex.: `ENEM::Humanas::História`).
- **Cards só de texto**, frente e verso. Sem imagem, áudio, cloze ou add-ons na v1.
- **Tags** por card.
- **Revisão** com 4 botões: Errei / Difícil / Bom / Fácil, agendada pelo FSRS (`ts-fsrs`). Estudar um baralho inclui seus sub-baralhos.
- Limites configuráveis de cards novos e de revisões por dia, por baralho.
- **Criar e editar** cards dentro do app.
- A revisão salva o estado continuamente (card atual, posição) para sobreviver ao fechamento pelo sistema.
- **Importação em massa (essencial):** os cards serão gerados por IA e importados. Aceitar:
  - **TSV/CSV** com colunas `baralho`, `frente`, `verso`, `tags` (baralho no formato `A::B::C`; tags separadas por espaço). Formato documentado numa tela de ajuda, com exemplo pronto para copiar e passar a uma IA.
  - **JSON** no formato nativo do app.
  - Prévia antes de confirmar e detecção de duplicatas (mesma frente no mesmo baralho).
- **Exportação** de baralhos em JSON e TSV.
- **Estatísticas:** cards por baralho e por tag (quais matérias estão bem cobertas), taxa de acerto, cards maduros/jovens/novos e previsão de revisões nos próximos dias.
- Não é preciso importar `.apkg` do Anki.
- A integração com o FSRS tem testes automatizados.
