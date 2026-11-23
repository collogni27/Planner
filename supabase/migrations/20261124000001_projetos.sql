-- Migração 008 — Projetos (versão 0.6.1)
-- • projetos: nome, descrição e data de encerramento prevista (opcionais).
-- • tarefas.projeto_ids / habitos.projeto_ids: a quais projetos cada uma está ligada
--   (pode ser mais de um). Só acrescenta; nada existente é alterado.

create table if not exists public.projetos (
  id           uuid primary key,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome         text not null,
  descricao    text,
  encerramento date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create index if not exists projetos_sync on public.projetos (user_id, updated_at);

create trigger projetos_updated_at before update on public.projetos
  for each row execute function public.definir_updated_at();

alter table public.projetos enable row level security;
create policy "dono pode ler" on public.projetos for select using (auth.uid() = user_id);
create policy "dono pode inserir" on public.projetos for insert with check (auth.uid() = user_id);
create policy "dono pode alterar" on public.projetos for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono pode apagar" on public.projetos for delete using (auth.uid() = user_id);

alter table public.tarefas add column if not exists projeto_ids uuid[] not null default '{}';
alter table public.habitos add column if not exists projeto_ids uuid[] not null default '{}';
