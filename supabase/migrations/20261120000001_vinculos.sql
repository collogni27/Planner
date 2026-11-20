-- Migração 003 — baralhos e conteúdos compartilhados entre objetivos (versão 0.3.4)
-- • objetivo_baralhos: quais baralhos aparecem em cada objetivo (e em que ordem).
-- • objetivo_conteudos: em quais objetivos cada conteúdo aparece (e a ordem na fila de cada um).
-- • micrometas.baralho_id: o baralho do conteúdo (onde ficam os cards dele).
-- Nada é apagado. As áreas deixam de ser usadas pelo app, mas a tabela continua.
-- A conversão dos dados existentes é feita pelo próprio app ao atualizar.

alter table public.micrometas add column if not exists baralho_id uuid;

create table if not exists public.objetivo_baralhos (
  id          uuid primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  objetivo_id uuid not null,
  baralho_id  uuid not null,
  ordem       double precision not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table if not exists public.objetivo_conteudos (
  id           uuid primary key,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  objetivo_id  uuid not null,
  micrometa_id uuid not null,
  ordem        double precision not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create index if not exists objetivo_baralhos_sync on public.objetivo_baralhos (user_id, updated_at);
create index if not exists objetivo_conteudos_sync on public.objetivo_conteudos (user_id, updated_at);

create trigger objetivo_baralhos_updated_at before update on public.objetivo_baralhos
  for each row execute function public.definir_updated_at();
create trigger objetivo_conteudos_updated_at before update on public.objetivo_conteudos
  for each row execute function public.definir_updated_at();

alter table public.objetivo_baralhos enable row level security;
alter table public.objetivo_conteudos enable row level security;

create policy "dono pode ler" on public.objetivo_baralhos for select using (auth.uid() = user_id);
create policy "dono pode inserir" on public.objetivo_baralhos for insert with check (auth.uid() = user_id);
create policy "dono pode alterar" on public.objetivo_baralhos for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono pode apagar" on public.objetivo_baralhos for delete using (auth.uid() = user_id);

create policy "dono pode ler" on public.objetivo_conteudos for select using (auth.uid() = user_id);
create policy "dono pode inserir" on public.objetivo_conteudos for insert with check (auth.uid() = user_id);
create policy "dono pode alterar" on public.objetivo_conteudos for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono pode apagar" on public.objetivo_conteudos for delete using (auth.uid() = user_id);
