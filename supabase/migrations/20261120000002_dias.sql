-- Migração 004 — registros diários (versão 0.4.0)
-- Uma linha por dia (o id é calculado da data, então celular e PC usam o mesmo).
-- Guarda a tela diária (peso, sono, qualidade, checks) e o "tomei sol".
-- Horários-alvo e meta de sono ficam em configuracoes.dados (sem tabela nova).

create table if not exists public.dias (
  id                uuid primary key,
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dia               date not null,
  peso_kg           numeric(5, 1),
  sono_minutos      integer check (sono_minutos between 0 and 1440),
  qualidade         smallint check (qualidade between 0 and 99),
  acordou_madrugada boolean,
  prejuizo          boolean,
  prejuizo_texto    text,
  sol_em            timestamptz,
  bom_dia_em        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create index if not exists dias_sync on public.dias (user_id, updated_at);
create index if not exists dias_dia on public.dias (user_id, dia);

create trigger dias_updated_at before update on public.dias
  for each row execute function public.definir_updated_at();

alter table public.dias enable row level security;
create policy "dono pode ler" on public.dias for select using (auth.uid() = user_id);
create policy "dono pode inserir" on public.dias for insert with check (auth.uid() = user_id);
create policy "dono pode alterar" on public.dias for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono pode apagar" on public.dias for delete using (auth.uid() = user_id);
