import { supabase, mensajeConfiguracion } from "./supabase-client.js";

const formulario = document.getElementById("formulario-auditoria");
const confirmacion = document.getElementById("confirmacion");
const mensaje = document.getElementById("mensaje-auditoria");
const boton = document.getElementById("boton-enviar-auditoria");

function informar(texto) {
    if (!mensaje) return;
    mensaje.textContent = texto;
    mensaje.hidden = !texto;
    if (texto) mensaje.focus();
}

if (formulario) {
    formulario.addEventListener("submit", async (event) => {
        event.preventDefault();
        informar("");
        if (!formulario.reportValidity()) return;
        if (!supabase) {
            informar(mensajeConfiguracion);
            return;
        }

        const datos = new FormData(formulario);
        const nombre = String(datos.get("nombre") ?? "").trim();
        const apellido = String(datos.get("apellido") ?? "").trim();
        const correo = String(datos.get("correo") ?? "").trim().toLowerCase();
        const mensajeProyecto = String(datos.get("mensaje") ?? "").trim();
        if (nombre.length < 2 || apellido.length < 2 || mensajeProyecto.length < 10) {
            informar("Revisa los campos: nombre y apellido (mínimo 2 caracteres), descripción (mínimo 10 caracteres).");
            return;
        }

        boton.disabled = true;
        boton.setAttribute("aria-busy", "true");
        try {
            const { data: { user } = {} } = await supabase.auth.getUser();
            const payload = {
                usuario_id: user?.id ?? null,
                nombre,
                apellido,
                empresa: String(datos.get("empresa") ?? "").trim() || null,
                correo,
                telefono: String(datos.get("telefono") ?? "").trim() || null,
                servicio: String(datos.get("servicio") ?? ""),
                alcance: datos.getAll("alcance").map(String),
                urgencia: String(datos.get("urgencia") ?? "normal"),
                mensaje: mensajeProyecto,
                acepta_privacidad: datos.get("privacidad") === "on"
            };
            const { error } = await supabase.from("solicitudes_auditoria").insert(payload);
            if (error) throw error;
            formulario.reset();
            if (confirmacion) {
                confirmacion.style.display = "flex";
                confirmacion.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        } catch (error) {
            console.error("No se pudo guardar la solicitud de auditoría:", error);
            informar("No pudimos enviar la solicitud. Comprueba la conexión e inténtalo de nuevo.");
        } finally {
            boton.disabled = false;
            boton.removeAttribute("aria-busy");
        }
    });
}
