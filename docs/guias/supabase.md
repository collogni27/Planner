# Guia: Supabase (feito uma vez)

## A. Criar o projeto
1. Abra **supabase.com** → **Start your project** → entre com o GitHub.
2. **New project**: nome `planner`; *Database Password* → *Generate a password* (guarde num lugar seguro); **Region:** *South America (São Paulo)* → **Create new project**.
3. Em **Project Settings → API Keys / Data API**, copie a **Project URL** e a chave **publishable** (`sb_publishable_…`) ou **anon public**. Essas duas são públicas. **Nunca** compartilhe a `service_role`/`secret`.

## B. Criar o usuário e fechar cadastros
1. **Authentication → Users → Add user → Create new user**: e-mail + senha, marcar **Auto Confirm User** → **Create user**.
2. **Authentication → Sign In / Providers** (ou *Settings*): desligar **Allow new users to sign up** → **Save**.

## C. Rodar as migrações
Para cada arquivo novo em `supabase/migrations/` (em ordem de nome):
1. **SQL Editor → New query**.
2. Cole o conteúdo do arquivo → **Run**. Deve aparecer *Success*.

Migrações já aplicadas: anote aqui (o Claude Code avisa quando houver uma nova).
- `20261118000001_configuracoes.sql`

## Se o projeto for pausado
O plano gratuito pausa após ~7 dias sem uso. No painel do Supabase, abra o projeto e clique em **Restore/Resume**. O app continua funcionando no celular enquanto isso.
