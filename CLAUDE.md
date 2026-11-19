# CLAUDE.md — Planner

> App pessoal **Planner**. Dono e único usuário: Miguel.
> Interface em português do Brasil. Fuso horário: America/Sao_Paulo.

Este arquivo é o ponto de partida do Claude Code: visão, princípios, regras fixas e regras de trabalho. As especificações detalhadas ficam em `docs/` (mapa abaixo). As tarefas de construção são pedidas por partes. **Não construa nada só porque está descrito nos documentos.** Use-os para entender o projeto e decidir de forma coerente.

O projeto muda ao longo do caminho. Quando o usuário mudar de ideia, **atualize o documento do assunto** (não deixe a regra antiga viva em outro lugar) e registre a decisão em `docs/decisoes.md`, com data. O antigo `CONTEXTO.md` foi dividido nestes arquivos em 2026-11-18; o original está no histórico do git.

---

## Visão

Um app pessoal unificado que funciona como um **assistente particular**: reúne tarefas, estudos (objetivos, conteúdos e flashcards), rotina (hábitos e agenda), sono, dieta, treino e um "Bom dia" matinal, e **me avisa** do que precisa ser feito.

**Por que existe:** tendência a procrastinar. Coordenar vários apps é atrito suficiente para largar tudo. Um lugar só, acessível e que toma a iniciativa de lembrar reduz esse atrito.

**Critério de sucesso (3 meses):** registrar de fato o que me proponho e cumprir pelo menos **80%** disso, sem falhas graves. O app serve para construir hábito, não para ser bonito ou completo.

## Princípios de produto
1. **Notificações são o recurso principal.** Na dúvida, priorize a confiabilidade dos avisos.
2. **Baixo atrito.** Registrar algo leva poucos toques. Formulários diários são checkboxes e campos rápidos; texto livre só quando opcional.
3. **Tom gentil, sem culpa.** Nada de "você falhou", contadores de fracasso ou vermelho agressivo para dias perdidos.
4. **Sem gamificação.** Sem pontos, níveis, conquistas, badges ou streaks em destaque. Estatísticas e histórico existem para avaliar, não para competir.
5. **Muitas telas são aceitáveis.** Prefira telas separadas e claras a uma tela lotada.
6. **Feito para uma pessoa só.** Sem multiusuário, compartilhamento, perfis ou painel administrativo.

---

## Regras fixas (não mudam sem o usuário pedir explicitamente)
1. **O app sobrevive a ser fechado pelo sistema.** Salva o estado continuamente (tela atual, card em revisão, rascunhos, formulários pela metade) e reabre **exatamente** onde estava. Toda tela nova é testada com "Não manter atividades" do Android antes de ser considerada pronta. Detalhes em `docs/tecnico.md`.
2. **Local primeiro.** Todo registro é gravado primeiro no aparelho (IndexedDB) e depois sincronizado com o Supabase. O app abre sem internet com os últimos dados.
3. **Nunca perder dados.** Mudanças de esquema por migrações versionadas (`supabase/migrations` e migrações do banco local). Antes de migração que altere dados existentes, lembrar o usuário de exportar o backup.
4. **APK:** nunca alterar o `applicationId` nem a chave de assinatura (keystore); sempre aumentar o `versionCode`. Se algo exigir mexer nisso, pare e explique o risco.
5. **Segurança:** login único, cadastro desativado, RLS em todas as tabelas, nunca a chave `service_role`/secret no frontend ou no repositório. **O repositório é público**: nada de segredos nem dados pessoais no código.
6. **Um só código** para Android (Capacitor) e web (Netlify). Recursos só do Android têm alternativa ou não aparecem na web.
7. **Identidade visual** de `docs/identidade-visual.md` desde o início, via design tokens. O mascote vem **só** de `docs/mascote/mascote.json`. **Textos enxutos:** sem textinhos explicativos, exemplos ("ex.: …") e legendas que não sejam necessários (ver "Textos da interface" no mesmo documento).
8. Datas no fuso **America/Sao_Paulo**; semana de **domingo a sábado**.

---

## Regras de trabalho

**Sobre o usuário:** não programa (experiência com "vibe coding"), mas usa bem o computador. Testa o app de verdade no celular e relata problemas. O GitHub é gerido pelo Claude Code com liberdade; o usuário só precisa saber o que envolve ele (APK, Netlify, Supabase, permissões no celular).

1. **Entregue e resuma.** Ao terminar, resumo curto em português e sem jargão: o que foi feito, como testar (passo a passo), o que ficou pendente. Explique mais a fundo só quando perguntado.
2. **Peça confirmação antes de mudanças estruturais:** esquema do banco (tabelas, colunas), apagar ou migrar dados, trocar biblioteca ou stack, mudar a sincronização. Explique o motivo em linguagem simples.
3. **Passos fora do código** (Supabase, Netlify, variáveis de ambiente, permissões no Android): instruções numeradas, clique a clique, dizendo exatamente o que copiar e onde colar. Guias em `docs/guias/`.
4. **Git:** commits pequenos e descritivos em português, um por mudança lógica.
5. **Testes automatizados** para a lógica crítica: planejador de treino, agendamento de notificações (incluindo a condição do sol), integração com o FSRS e importação de cards.
6. **Uma coisa por vez.** Não adicione funcionalidades não pedidas; sugira no resumo.
7. **Código simples e legível,** com comentários curtos em português na lógica de negócio.
8. **Mantenha os documentos atualizados** e registre decisões em `docs/decisoes.md`.
9. Contradição entre um pedido e os documentos: pergunte antes de seguir.
10. **Toda tela nova sobrevive ao fechamento pelo sistema**; inclua no resumo como testar isso.

---

## Mapa dos documentos (leia o do assunto antes de mexer nele)

| Assunto | Arquivo |
|---|---|
| Stack, APK e atualizações, segurança, dados, offline | `docs/tecnico.md` |
| Identidade visual (tokens, fontes, formas, mascote, barra, navegação) | `docs/identidade-visual.md` |
| Notificações (prioridade máxima) | `docs/notificacoes.md` |
| Tela Início | `docs/modulos/inicio.md` |
| Tela diária (check-in da manhã) | `docs/modulos/tela-diaria.md` |
| Nota diária | `docs/modulos/notas.md` |
| Tarefas | `docs/modulos/tarefas.md` |
| Estudos (objetivos, conteúdos, flashcards) | `docs/modulos/estudos.md` |
| Rotina: hábitos e agenda | `docs/modulos/rotina.md` |
| Sono | `docs/modulos/sono.md` |
| Dieta | `docs/modulos/dieta.md` |
| Treino | `docs/modulos/treino.md` |
| "Bom dia" | `docs/modulos/bom-dia.md` |
| Ordem de construção, fora do escopo, decisões em aberto | `docs/roadmap.md` |
| Registro de decisões | `docs/decisoes.md` |
| Guias para o usuário (Supabase, Netlify, APK) | `docs/guias/` |
| Referências visuais | `docs/design/`, `docs/mascote/` |
