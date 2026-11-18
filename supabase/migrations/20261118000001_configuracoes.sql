-- Migração 001 — tabela de configurações do usuário (passo 1)
-- Uma linha por usuário, com as preferências em JSON (modo de cor etc.).
-- Também serve para provar que a proteção por usuário (RLS) funciona.

-- Função reaproveitável: atualiza "updated_at" sempre que a linha muda.
create or replace function public.definir_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.configuracoes (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  dados      jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger configuracoes_updated_at
  before update on public.configuracoes
  for each row execute function public.definir_updated_at();

-- RLS: cada usuário só enxerga e altera a própria linha.
alter table public.configuracoes enable row level security;

create policy "dono pode ler" on public.configuracoes
  for select using (auth.uid() = user_id);
create policy "dono pode inserir" on public.configuracoes
  for insert with check (auth.uid() = user_id);
create policy "dono pode alterar" on public.configuracoes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono pode apagar" on public.configuracoes
  for delete using (auth.uid() = user_id);
