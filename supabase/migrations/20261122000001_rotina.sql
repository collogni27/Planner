-- Migração 006 — Rotina e nota diária (versão 0.5.0)
-- • notas: uma nota por dia (o id é calculado da data).
-- • habitos: nome, descrição, dias da semana, horário (com aviso) ou gatilho, ordem.
-- • habitos_feitos: hábito marcado num dia (o id é calculado do hábito + dia).
-- • tarefas (Agenda): data, horário (com aviso) ou gatilho, próximo passo, conclusão.
-- Só acrescenta tabelas; nada existente é alterado.

create table if not exists public.notas (
  id         uuid primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dia        date not null,
  texto      text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.habitos (
  id                uuid primary key,
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome              text not null,
  descricao         text,
  dias              smallint[] not null default '{0,1,2,3,4,5,6}',
  horario           text,
  avisar            boolean not null default false,
  gatilho_texto     text,
  gatilho_tarefa_id uuid,
  ordem             double precision,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create table if not exists public.habitos_feitos (
  id         uuid primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  habito_id  uuid not null,
  dia        date not null,
  feito      boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.tarefas (
  id                uuid primary key,
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome              text not null,
  descricao         text,
  data              date,
  horario           text,
  avisar            boolean not null default false,
  gatilho_texto     text,
  gatilho_tarefa_id uuid,
  gatilho_habito_id uuid,
  proximo           jsonb,
  proximo_criado_id uuid,
  concluida_em      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create index if not exists notas_sync on public.notas (user_id, updated_at);
create index if not exists habitos_sync on public.habitos (user_id, updated_at);
create index if not exists habitos_feitos_sync on public.habitos_feitos (user_id, updated_at);
create index if not exists tarefas_sync on public.tarefas (user_id, updated_at);

create trigger notas_updated_at before update on public.notas
  for each row execute function public.definir_updated_at();
create trigger habitos_updated_at before update on public.habitos
  for each row execute function public.definir_updated_at();
create trigger habitos_feitos_updated_at before update on public.habitos_feitos
  for each row execute function public.definir_updated_at();
create trigger tarefas_updated_at before update on public.tarefas
  for each row execute function public.definir_updated_at();

alter table public.notas enable row level security;
alter table public.habitos enable row level security;
alter table public.habitos_feitos enable row level security;
alter table public.tarefas enable row level security;

create policy "dono pode ler" on public.notas for select using (auth.uid() = user_id);
create policy "dono pode inserir" on public.notas for insert with check (auth.uid() = user_id);
create policy "dono pode alterar" on public.notas for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono pode apagar" on public.notas for delete using (auth.uid() = user_id);

create policy "dono pode ler" on public.habitos for select using (auth.uid() = user_id);
create policy "dono pode inserir" on public.habitos for insert with check (auth.uid() = user_id);
create policy "dono pode alterar" on public.habitos for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono pode apagar" on public.habitos for delete using (auth.uid() = user_id);

create policy "dono pode ler" on public.habitos_feitos for select using (auth.uid() = user_id);
create policy "dono pode inserir" on public.habitos_feitos for insert with check (auth.uid() = user_id);
create policy "dono pode alterar" on public.habitos_feitos for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono pode apagar" on public.habitos_feitos for delete using (auth.uid() = user_id);

create policy "dono pode ler" on public.tarefas for select using (auth.uid() = user_id);
create policy "dono pode inserir" on public.tarefas for insert with check (auth.uid() = user_id);
create policy "dono pode alterar" on public.tarefas for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono pode apagar" on public.tarefas for delete using (auth.uid() = user_id);
