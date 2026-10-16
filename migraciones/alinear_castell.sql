-- ═══════════════════════════════════════════════════════════════
--  alinear_castell.sql — SOLO para la base de Castell Tech
--
--  Deja la base real igual a 000_base.sql (versión 0):
--    · crea la tabla version_esquema y registra la versión 0
--    · cierra la escritura anónima sobre productos_publicos
--      (si ya lo corriste antes, repetirlo no hace daño)
--
--  Se corre UNA vez. No borra ni cambia ningún dato.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.version_esquema (
  version     integer primary key,
  descripcion text not null,
  aplicada_en timestamptz not null default now()
);

alter table public.version_esquema enable row level security;

drop policy if exists leer_version on public.version_esquema;
create policy leer_version on public.version_esquema
  for select to anon, authenticated using (true);

insert into public.version_esquema (version, descripcion)
values (0, 'Esquema base de Castell Tech (16-oct-2026)')
on conflict (version) do nothing;

revoke all on public.productos_publicos from anon, authenticated;
grant select on public.productos_publicos to anon, authenticated;

-- Comprobación: debe devolver una fila con version = 0
select * from public.version_esquema;
