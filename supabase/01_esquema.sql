-- AegisProbe · Estructura inicial para un proyecto nuevo de Supabase.
-- Ejecutar una vez desde Database > SQL Editor, con rol administrador.
-- Autenticación: la administra Supabase Auth (auth.users).
-- No se almacenan contraseñas en tablas públicas.

-- Información pública mínima de cada usuario autenticado.
create table if not exists public.perfiles (
    id uuid primary key references auth.users(id) on delete cascade,
    nombre text not null check (char_length(trim(nombre)) between 2 and 120),
    creado_en timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);

-- Registro de solicitudes del formulario de la página principal.
create table if not exists public.solicitudes_auditoria (
    id uuid primary key default gen_random_uuid(),
    usuario_id uuid references auth.users(id) on delete set null,
    nombre text not null check (char_length(trim(nombre)) between 2 and 100),
    apellido text not null check (char_length(trim(apellido)) between 2 and 100),
    empresa text check (empresa is null or char_length(empresa) <= 160),
    correo text not null check (char_length(correo) between 5 and 254 and position('@' in correo) > 1),
    telefono text check (telefono is null or char_length(telefono) <= 40),
    servicio text not null check (servicio in (
        'pentesting-web', 'pentesting-movil', 'infraestructura',
        'red-team', 'auditoria', 'ingenieria-social'
    )),
    alcance text[] not null default '{}',
    urgencia text not null default 'normal' check (urgencia in ('normal','alta','critica')),
    mensaje text not null check (char_length(trim(mensaje)) between 10 and 5000),
    acepta_privacidad boolean not null check (acepta_privacidad = true),
    estado text not null default 'pendiente' check (estado in (
        'pendiente', 'en_revision', 'contactado', 'cerrado'
    )),
    creado_en timestamptz not null default now()
);

create index if not exists solicitudes_usuario_fecha_idx
    on public.solicitudes_auditoria(usuario_id, creado_en desc);
create index if not exists solicitudes_estado_fecha_idx
    on public.solicitudes_auditoria(estado, creado_en desc);

-- Crea automáticamente un perfil al registrar un usuario en Supabase Auth.
create or replace function public.crear_perfil_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.perfiles(id, nombre)
    values (
        new.id,
        left(coalesce(nullif(trim(new.raw_user_meta_data->>'nombre'), ''),
                      split_part(coalesce(new.email, 'usuario'), '@', 1)), 120)
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

revoke all on function public.crear_perfil_usuario() from public, anon, authenticated;

drop trigger if exists al_crear_usuario_aegisprobe on auth.users;
create trigger al_crear_usuario_aegisprobe
    after insert on auth.users
    for each row execute function public.crear_perfil_usuario();

-- Repetir política explícita de mínimos privilegios para los roles del navegador.
alter table public.perfiles enable row level security;
alter table public.solicitudes_auditoria enable row level security;

revoke all on table public.perfiles from anon, authenticated;
revoke all on table public.solicitudes_auditoria from anon, authenticated;

grant select on public.perfiles to authenticated;
grant update (nombre) on public.perfiles to authenticated;

grant insert (
    usuario_id, nombre, apellido, empresa, correo, telefono,
    servicio, alcance, urgencia, mensaje, acepta_privacidad
) on public.solicitudes_auditoria to anon, authenticated;
grant select on public.solicitudes_auditoria to authenticated;

-- Si vuelves a ejecutar el script, los nombres no colisionan.
drop policy if exists perfiles_leer_propio on public.perfiles;
drop policy if exists perfiles_editar_propio on public.perfiles;
drop policy if exists auditorias_insertar_anonimo on public.solicitudes_auditoria;
drop policy if exists auditorias_insertar_usuario on public.solicitudes_auditoria;
drop policy if exists auditorias_leer_propias on public.solicitudes_auditoria;

create policy perfiles_leer_propio
    on public.perfiles for select to authenticated
    using (id = (select auth.uid()));

create policy perfiles_editar_propio
    on public.perfiles for update to authenticated
    using (id = (select auth.uid()))
    with check (id = (select auth.uid()));

-- Los visitantes pueden enviar una solicitud, pero NO listar las solicitudes.
-- IMPORTANTE: en producción añadir CAPTCHA / Turnstile + Edge Function
-- y limitación de frecuencia para evitar spam.
create policy auditorias_insertar_anonimo
    on public.solicitudes_auditoria for insert to anon
    with check (usuario_id is null);

create policy auditorias_insertar_usuario
    on public.solicitudes_auditoria for insert to authenticated
    with check (usuario_id = (select auth.uid()));

create policy auditorias_leer_propias
    on public.solicitudes_auditoria for select to authenticated
    using (usuario_id = (select auth.uid()));

-- No se conceden UPDATE / DELETE a visitantes ni a usuarios normales.
-- El propietario administra y revisa las solicitudes desde Supabase Dashboard.
