# Técnico: plataforma, stack, APK, segurança e dados

## Plataforma e uso
- **Uso principal:** celular Android, como **app nativo (APK)** gerado com Capacitor e instalado direto, sem Play Store.
- **Uso secundário:** PC, pela **versão web** do mesmo código, hospedada no Netlify. Tudo funciona no PC, com layout responsivo.
- **Um só código** para as duas versões. Recursos que só existem no Android (notificações locais, tela cheia) têm alternativa ou não aparecem na web.
- **Dados iguais nos dois** via banco na nuvem.

### O app sobrevive a ser fechado pelo sistema (regra fixa)
O Android fecha apps em segundo plano para liberar memória. Isso **vai acontecer** e não deve ser combatido. O reinício deve ser **invisível**:
- salvar o estado continuamente: tela atual, card em revisão, posição na revisão, textos sendo digitados (rascunhos), formulários pela metade;
- ao reabrir, voltar **exatamente** onde estava, sem tela de carregamento longa e sem perder nada;
- testar de propósito (opção de desenvolvedor "Não manter atividades", ou fechar o app pelo sistema) antes de considerar uma tela pronta.

### Local primeiro e offline
- **Decisão (2026-11-18):** o app é **local primeiro** desde o passo 1. Todo registro é gravado no aparelho (IndexedDB, via Dexie) e entra numa fila que sincroniza com o Supabase quando há conexão.
- O app abre sem internet mostrando os últimos dados; revisões de cards e checks feitos offline sincronizam ao voltar a conexão.
- **Como funciona (código em `src/dados/`):** `registrar()` grava o registro no banco local e o coloca na fila numa única transação. `sincronizar()` envia a fila em ordem (um item só sai depois de o Supabase confirmar) e depois baixa o que mudou na nuvem desde a última vez (cursor por `updated_at`). Alteração local ainda na fila vence a da nuvem; entre as duas versões já sincronizadas, vence a de `updated_at` mais recente. Sincroniza ao abrir, ao voltar a internet, ao voltar para o app e a cada 5 minutos.
- Toda tabela nova sincronizada entra em `TABELAS` (`src/dados/banco.ts`) com a coluna que a identifica.
- Estado da interface (tela atual, barra aberta, modo de cor) fica no `localStorage`, que é lido na hora e evita "piscar" ao abrir.
- **Navegação** (`src/app/navegacao.tsx`): cada aba tem uma pilha de telas, salva no aparelho. O botão voltar do Android fecha a tela de cima; na tela principal de uma aba, volta ao Início; no Início, minimiza o app.
- **Rascunhos** (`useRascunho`): o que é digitado num formulário fica salvo, ligado àquela tela aberta; sobrevive ao fechamento pelo sistema e é descartado quando o usuário sai da tela pelo "voltar".
- A sincronização envia a fila em lotes de até 200 registros e baixa em páginas de 1000.
- **Modo Desenvolvedor** (Mais → Modo Desenvolvedor, com senha): mostra um botão na barra do mascote, entre a saudação e o botão de recolher, com ferramentas de teste: **Revisão Reset** (desfaz as revisões de hoje; cada card volta ao estado de antes) e **Fechar** (sai do modo). O código guarda só o resumo SHA-256 da senha; não é segurança (o repositório é público), só evita tocar sem querer.
- Se alguma função ficar indisponível offline, a interface avisa.
- Prioridade: **confiabilidade > offline completo**.

## Stack
Escolhida por ser a mais simples de manter e com mais documentação:
- **Frontend:** Vite + React + TypeScript.
- **App Android:** Capacitor, que empacota o mesmo frontend num APK.
- **Versão web (PC):** Netlify.
- **Banco, autenticação e funções:** Supabase (plano gratuito, região São Paulo). O plano gratuito **pausa o projeto após ~7 dias sem uso**; com uso diário não acontece, e se acontecer basta reativar no painel. O modo local primeiro mantém o app funcionando enquanto isso.
- **Cache local:** IndexedDB via Dexie.
- **Repetição espaçada:** FSRS via `ts-fsrs` (não reimplementar).
- **Notificações:** locais, agendadas pelo app (`@capacitor/local-notifications`), sem servidor de push na v1. Se algo não for coberto pelo plugin (ex.: tela cheia estilo alarme), escrever um plugin Android próprio pequeno, sem trabalho extra para o usuário. Detalhes em `notificacoes.md`.
- **Fontes:** empacotadas no app (pacotes `@fontsource`), não carregadas do Google, para funcionar offline.
- **Testes:** Vitest.
- **Estilo:** design tokens (variáveis CSS para cores, fontes, raios, espaçamentos), para trocar a identidade visual com facilidade.

## Geração do APK e atualizações (sem perder dados)
- **Build automático:** o APK é gerado pelo **GitHub Actions** a cada nova versão e publicado como **Release** no GitHub. O usuário não precisa do Android Studio.
- O repositório é **público** (2026-11-18), para o app conseguir consultar e baixar as Releases sem senha.
- **Atualização dentro do app:** ao abrir, o app consulta a última Release. Se houver versão nova, mostra um aviso discreto ("Nova versão disponível") com botão para baixar e abrir o instalador. O usuário só confirma "Atualizar" (apps fora da Play Store não se atualizam sem essa confirmação).
- **Atualizar nunca apaga dados**, desde que sempre:
  1. **o mesmo `applicationId`** para sempre;
  2. **a mesma keystore** em todas as versões, guardada como segredo do GitHub, com **backup do usuário fora do computador** (ex.: Google Drive). Se for perdida, não dá mais para atualizar: seria preciso desinstalar e reinstalar, apagando os dados locais (os da nuvem ficam);
  3. **`versionCode` sempre maior** que o anterior;
  4. mudanças no formato dos dados locais usam **migrações versionadas**, que convertem em vez de apagar.
- A versão web no Netlify é atualizada a cada publicação.
- O número da versão instalada aparece em Configurações.
- **Detalhes da implementação (2026-11-18):**
  - `applicationId`: **`io.github.collogni27.planner`** (em `capacitor.config.ts` e `android/app/build.gradle`). Nunca mudar.
  - A versão vem só do `package.json`; `versionCode = maior×1.000.000 + menor×1.000 + correção` (0.2.0 → 2000). Para lançar versão nova: aumentar a versão no `package.json`.
  - Workflow `.github/workflows/apk.yml`: em PR, testa e compila; no `main`, se não existe Release `vX.Y.Z`, gera o APK assinado e publica a Release com `planner-X.Y.Z.apk`.
  - O build compara a impressão digital da assinatura com `android/assinatura-esperada.txt` e não publica se for diferente.
  - O app consulta `api.github.com/repos/collogni27/Planner/releases/latest` ao abrir e ao voltar para a frente; o botão "Atualizar" abre o download do APK no navegador.
  - Ícones e abertura do Android gerados do `mascote.json` por `scripts/gerar-assets.py` + `npx @capacitor/assets generate --android`.
  - Guia do usuário: `docs/guias/apk.md`.

## Segurança e login
- **Um único usuário**, login por e-mail e senha no Supabase Auth. **Novos cadastros desativados** depois de criar a conta.
- **RLS ativa em todas as tabelas**, acesso só ao `user_id` dono.
- Nunca a chave `service_role`/secret no frontend ou no repositório. Configuração por variáveis de ambiente (`.env` no `.gitignore`). A URL e a chave pública (anon/publishable) podem ir no frontend.
- A sessão persiste: não é preciso logar sempre.

## Dados e histórico
- **Guardar todo o histórico** (checks, hábitos, revisões, versões da dieta, notas, tarefas feitas). Estimativa: poucos MB por ano. Sem exclusão automática.
- **Exportar tudo** num JSON único (backup completo) e **importar** esse backup, em Configurações.
- Todas as tabelas têm `user_id`, `created_at`, `updated_at` e `deleted_at` (exclusão lógica, necessária para a sincronização).
- Datas e horários sempre em **America/Sao_Paulo**. Um "dia" vai de 00:00 a 23:59 local. O check de sono de uma noite pertence ao dia em que acordei.
- Semana: **domingo a sábado**.
- Migrações do Supabase em `supabase/migrations`, numeradas por data.
