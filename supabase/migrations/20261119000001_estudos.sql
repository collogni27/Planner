-- Migração 002 — módulo Estudos (passo 3)
-- Objetivos → áreas (opcional) → micrometas, check-ins de estudo, baralhos,
-- cards (com estado do FSRS) e histórico de revisões (nunca apagado).
-- Sem chaves estrangeiras entre tabelas de propósito: o app é "local primeiro"
-- e a sincronização não pode travar por ordem de chegada; o app garante a ligação.

create table if not exists public.objetivos (
  id         uuid primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome       text not null,
  ordem      double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists objetivos_sync on public.objetivos (user_id, updated_at);
create trigger objetivos_updated_at before update on public.objetivos
  for each row execute function public.definir_updated_at();
alter table public.objetivos enable row level security;
create policy "dono pode ler" on public.objetivos for select using (auth.uid() = user_id);
create policy "dono pode inserir" on public.objetivos for insert with check (auth.uid() = user_id);
create policy "dono pode alterar" on public.objetivos for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono pode apagar" on public.objetivos for delete using (auth.uid() = user_id);

create table if not exists public.areas (
  id         uuid primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  objetivo_id uuid not null,
  nome        text not null,
  ordem       double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists areas_sync on public.areas (user_id, updated_at);
create trigger areas_updated_at before update on public.areas
  for each row execute function public.definir_updated_at();
alter table public.areas enable row level security;
create policy "dono pode ler" on public.areas for select using (auth.uid() = user_id);
create policy "dono pode inserir" on public.areas for insert with check (auth.uid() = user_id);
create policy "dono pode alterar" on public.areas for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono pode apagar" on public.areas for delete using (auth.uid() = user_id);

create table if not exists public.micrometas (
  id         uuid primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  objetivo_id uuid not null,
  area_id     uuid,
  nome        text not null,
  ordem       double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists micrometas_sync on public.micrometas (user_id, updated_at);
create trigger micrometas_updated_at before update on public.micrometas
  for each row execute function public.definir_updated_at();
alter table public.micrometas enable row level security;
create policy "dono pode ler" on public.micrometas for select using (auth.uid() = user_id);
create policy "dono pode inserir" on public.micrometas for insert with check (auth.uid() = user_id);
create policy "dono pode alterar" on public.micrometas for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono pode apagar" on public.micrometas for delete using (auth.uid() = user_id);

create table if not exists public.checkins (
  id         uuid primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  micrometa_id uuid not null,
  estudado_em  timestamptz not null,
  nota         text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists checkins_sync on public.checkins (user_id, updated_at);
create trigger checkins_updated_at before update on public.checkins
  for each row execute function public.definir_updated_at();
alter table public.checkins enable row level security;
create policy "dono pode ler" on public.checkins for select using (auth.uid() = user_id);
create policy "dono pode inserir" on public.checkins for insert with check (auth.uid() = user_id);
create policy "dono pode alterar" on public.checkins for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono pode apagar" on public.checkins for delete using (auth.uid() = user_id);

create table if not exists public.baralhos (
  id         uuid primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome       text not null,
  ordem      double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists baralhos_sync on public.baralhos (user_id, updated_at);
create trigger baralhos_updated_at before update on public.baralhos
  for each row execute function public.definir_updated_at();
alter table public.baralhos enable row level security;
create policy "dono pode ler" on public.baralhos for select using (auth.uid() = user_id);
create policy "dono pode inserir" on public.baralhos for insert with check (auth.uid() = user_id);
create policy "dono pode alterar" on public.baralhos for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono pode apagar" on public.baralhos for delete using (auth.uid() = user_id);

create table if not exists public.cards (
  id         uuid primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  baralho_id     uuid not null,
  micrometa_id   uuid,
  frente         text not null,
  verso          text not null,
  tags           text[] not null default '{}',
  -- Estado de memória do FSRS (biblioteca ts-fsrs)
  due            timestamptz not null default now(),
  stability      double precision not null default 0,
  difficulty     double precision not null default 0,
  elapsed_days   integer not null default 0,
  scheduled_days integer not null default 0,
  learning_steps integer not null default 0,
  reps           integer not null default 0,
  lapses         integer not null default 0,
  state          smallint not null default 0,
  last_review    timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists cards_sync on public.cards (user_id, updated_at);
create trigger cards_updated_at before update on public.cards
  for each row execute function public.definir_updated_at();
alter table public.cards enable row level security;
create policy "dono pode ler" on public.cards for select using (auth.uid() = user_id);
create policy "dono pode inserir" on public.cards for insert with check (auth.uid() = user_id);
create policy "dono pode alterar" on public.cards for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono pode apagar" on public.cards for delete using (auth.uid() = user_id);

create table if not exists public.revisoes (
  id         uuid primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_id        uuid not null,
  nota           smallint not null check (nota between 1 and 4),
  revisado_em    timestamptz not null,
  -- Estado do card ANTES da resposta (para estatísticas e calibrar o FSRS)
  state          smallint not null,
  stability      double precision not null,
  difficulty     double precision not null,
  elapsed_days   integer not null,
  scheduled_days integer not null,
  duracao_ms     integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists revisoes_sync on public.revisoes (user_id, updated_at);
create trigger revisoes_updated_at before update on public.revisoes
  for each row execute function public.definir_updated_at();
alter table public.revisoes enable row level security;
create policy "dono pode ler" on public.revisoes for select using (auth.uid() = user_id);
create policy "dono pode inserir" on public.revisoes for insert with check (auth.uid() = user_id);
create policy "dono pode alterar" on public.revisoes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono pode apagar" on public.revisoes for delete using (auth.uid() = user_id);
