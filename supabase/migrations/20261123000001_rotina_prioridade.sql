-- Migração 007 — extras da Rotina (versão 0.6.0)
-- • tarefas.prioridade: 1 a 4 (1 = nem importante nem urgente, 2 = urgente,
--   3 = importante, 4 = importante e urgente).
-- • tarefas.fixada: fica no topo da Agenda.
-- • tarefas.nao_planejada: registrada depois de feita ("Tarefa não planejada").
-- • habitos.gatilho_habito_id: o gatilho do hábito pode ser outro hábito.
-- Só acrescenta colunas; nada existente é alterado.
alter table public.tarefas add column if not exists prioridade smallint not null default 1 check (prioridade between 1 and 4);
alter table public.tarefas add column if not exists fixada boolean not null default false;
alter table public.tarefas add column if not exists nao_planejada boolean not null default false;
alter table public.habitos add column if not exists gatilho_habito_id uuid;
