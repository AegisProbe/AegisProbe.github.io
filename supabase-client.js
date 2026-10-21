import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./supabase-config.js";

export const configurado = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(SUPABASE_URL)
    && !SUPABASE_URL.includes("TU-PROYECTO")
    && SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_")
    && SUPABASE_PUBLISHABLE_KEY !== "sb_publishable_REEMPLAZAR";

export const supabase = configurado
    ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    })
    : null;

export const mensajeConfiguracion =
    "Aún falta configurar Supabase. Abre supabase-config.js y agrega la URL y la clave pública de tu proyecto.";
