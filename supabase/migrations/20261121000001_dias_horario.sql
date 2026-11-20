-- Migração 005 — perguntas da tela diária (versão 0.4.1)
-- As perguntas passam a ser "dormi no horário esperado?" e "acordei no horário esperado?".
-- As colunas antigas (acordou_madrugada, prejuizo, prejuizo_texto) ficam, sem uso.
alter table public.dias add column if not exists dormiu_no_horario boolean;
alter table public.dias add column if not exists acordou_no_horario boolean;
