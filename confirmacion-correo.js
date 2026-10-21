import { supabase, mensajeConfiguracion } from "./supabase-client.js";

const titulo = document.getElementById("titulo-confirmacion-email");
const detalle = document.getElementById("detalle-confirmacion");
const accion = document.getElementById("accion-confirmacion");

const parametroError = new URLSearchParams(location.search).get("error_description") ||
    new URLSearchParams(location.hash.replace(/^#/, "")).get("error_description");

async function verificarConfirmacion() {
    if (!supabase) {
        titulo.textContent = "Falta configurar Supabase";
        detalle.textContent = mensajeConfiguracion;
        return;
    }
    if (parametroError) {
        titulo.textContent = "No se pudo confirmar el correo";
        detalle.textContent = "El enlace no se pudo validar, expiró o ya fue utilizado. Solicita otro desde la página de registro.";
        return;
    }
    try {
        // Supabase-js recupera los tokens enviados en el fragmento de la URL
        // gracias a detectSessionInUrl. No se simula una confirmación local.
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const usuario = data?.session?.user;
        if (usuario?.email_confirmed_at || usuario?.confirmed_at) {
            titulo.textContent = "Correo confirmado correctamente";
            detalle.textContent = "Tu dirección de correo ha sido verificada. Ya puedes acceder a tu cuenta.";
            accion.hidden = false;
        } else if (usuario) {
            titulo.textContent = "Sesión iniciada";
            detalle.textContent = "Hay una sesión activa, pero no se pudo verificar el estado de confirmación del correo.";
            accion.hidden = false;
        } else {
            titulo.textContent = "No se encontró una confirmación válida";
            detalle.textContent = "Abre el enlace recibido por correo. Si ya lo utilizaste, intenta iniciar sesión; de lo contrario, solicita un nuevo enlace.";
        }
    } catch (error) {
        console.error("Error en confirmación Supabase:", error);
        titulo.textContent = "No se pudo comprobar el correo";
        detalle.textContent = "Comprueba tu conexión e intenta abrir nuevamente el enlace de confirmación.";
    }
}
verificarConfirmacion();
