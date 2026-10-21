import { supabase, mensajeConfiguracion } from "./supabase-client.js";

// Registro y acceso reales. Las contraseñas NUNCA se guardan en localStorage.
// Supabase Auth realiza la comprobación en el servidor.
const MIN_CLAVE = 6;
const $ = id => document.getElementById(id);
const normalizarCorreo = valor => valor.trim().toLowerCase();
const correoValido = valor => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
const redireccionConfirmacion = new URL("confirmacion-correo.html", window.location.href).href;
let correoPendiente = "";

function mensaje(elemento, texto, tipo = "error") {
    if (!elemento) return;
    elemento.textContent = texto;
    elemento.hidden = !texto;
    elemento.classList.remove("is-success", "is-error");
    if (texto) elemento.classList.add(tipo === "error" ? "is-error" : "is-success");
}

function errorLegible(error) {
    const codigo = error?.code || "";
    const texto = (error?.message || "").toLowerCase();
    if (codigo === "email_not_confirmed" || texto.includes("email not confirmed")) {
        return "Primero debes confirmar tu correo. Busca el mensaje de Supabase y abre el enlace de confirmación.";
    }
    if (codigo === "invalid_credentials" || texto.includes("invalid login credentials")) {
        return "El correo o la contraseña no son correctos.";
    }
    if (codigo === "email_address_not_authorized" || texto.includes("email address not authorized")) {
        return "Supabase no puede enviar correos a esta dirección con su servicio SMTP de prueba. Configura un proveedor SMTP propio en Supabase.";
    }
    if (codigo.includes("rate_limit") || codigo === "over_email_send_rate_limit" || error?.status === 429) {
        return "Se superó el límite temporal de solicitudes o correos. Espera antes de volver a intentarlo.";
    }
    if (codigo === "weak_password" || texto.includes("password should be")) {
        return "Supabase rechazó la contraseña. Revisa la longitud y los requisitos definidos en Authentication → Security and Protection.";
    }
    if (codigo === "signup_disabled") return "El registro de nuevos usuarios está deshabilitado en Supabase.";
    if (codigo === "user_already_exists" || texto.includes("already registered")) return "No se puede crear esta cuenta. Prueba iniciar sesión o recuperar tu acceso.";
    return "No se completó la operación. Comprueba la conexión y revisa los registros de Authentication en Supabase.";
}

function mostrarModal(modal) {
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    modal.querySelector("[data-modal-close]")?.focus();
}
function cerrarModal(modal) {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
}
document.querySelectorAll(".usuarios-modal").forEach(modal => {
    modal.addEventListener("click", event => {
        if (event.target === modal || event.target.closest("[data-modal-close]")) cerrarModal(modal);
    });
});
document.addEventListener("keydown", event => {
    if (event.key === "Escape") document.querySelectorAll(".usuarios-modal:not([hidden])").forEach(cerrarModal);
});

function comprobarConfiguracion(objetivo) {
    if (supabase) return true;
    mensaje(objetivo, mensajeConfiguracion);
    return false;
}

const registro = $("form-registro");
if (registro) {
    const estado = $("mensaje-registro");
    const boton = $("boton-registro-demo");
    const zonaReenvio = $("zona-reenvio");
    registro.addEventListener("submit", async event => {
        event.preventDefault();
        mensaje(estado, "");
        if (!registro.reportValidity() || !comprobarConfiguracion(estado)) return;
        const nombre = $("registro-nombre").value.trim();
        const correo = normalizarCorreo($("registro-correo").value);
        const clave = $("registro-clave").value; // No modificar ni recortar contraseñas.
        const confirmar = $("registro-confirmar").value;
        if (nombre.length < 2 || !correoValido(correo)) {
            mensaje(estado, "Escribe un nombre de al menos 2 caracteres y un correo válido."); return;
        }
        if (clave.length < MIN_CLAVE) {
            mensaje(estado, `La contraseña debe tener al menos ${MIN_CLAVE} caracteres.`); return;
        }
        if (clave !== confirmar) {
            mensaje(estado, "Las contraseñas no coinciden."); return;
        }
        boton.disabled = true;
        boton.setAttribute("aria-busy", "true");
        try {
            const { data, error } = await supabase.auth.signUp({
                email: correo,
                password: clave,
                options: { data: { nombre }, emailRedirectTo: redireccionConfirmacion }
            });
            if (error) throw error;
            correoPendiente = correo;
            registro.reset();
            if (data?.session) {
                // Si Auth no exige confirmación, el usuario recibe sesión inmediatamente.
                $("modal-registro-titulo").textContent = "Cuenta creada";
                $("modal-registro-texto").textContent = "La cuenta se registró, pero Supabase permitió acceder sin verificar el correo. Activa Confirm Email en Authentication si quieres exigir confirmación.";
                zonaReenvio.hidden = true;
                mensaje(estado, "Cuenta creada. Activa Confirm Email en Supabase para exigir verificación.", "success");
            } else {
                $("modal-registro-titulo").textContent = "Revisa tu correo electrónico";
                $("modal-registro-texto").textContent = "Si esta dirección puede registrarse, recibirás un correo de confirmación. Abre el enlace antes de iniciar sesión.";
                zonaReenvio.hidden = false;
                mensaje(estado, "Solicitud recibida. Revisa tu correo (incluido spam) y confirma la dirección antes de iniciar sesión.", "success");
            }
            mostrarModal($("modal-registro-exitoso"));
        } catch (error) {
            console.error("Error de registro Supabase:", error);
            mensaje(estado, errorLegible(error));
        } finally {
            boton.disabled = false;
            boton.removeAttribute("aria-busy");
        }
    });

    $("reenviar-confirmacion")?.addEventListener("click", async () => {
        if (!comprobarConfiguracion(estado)) return;
        const botonReenvio = $("reenviar-confirmacion");
        const correo = correoPendiente || normalizarCorreo($("registro-correo").value);
        if (!correoValido(correo)) { mensaje(estado, "Vuelve a introducir un correo válido."); return; }
        botonReenvio.disabled = true;
        try {
            const { error } = await supabase.auth.resend({
                type: "signup", email: correo,
                options: { emailRedirectTo: redireccionConfirmacion }
            });
            if (error) throw error;
            mensaje(estado, "Si esta dirección tiene una confirmación pendiente, se solicitó un nuevo correo. Espera antes de reenviar.", "success");
        } catch (error) {
            console.error("Error al reenviar confirmación:", error);
            mensaje(estado, errorLegible(error));
        } finally {
            botonReenvio.disabled = false;
        }
    });
}

const login = $("form-login");
if (login) {
    const estado = $("mensaje-login");
    const boton = $("boton-login-demo");
    login.addEventListener("submit", async event => {
        event.preventDefault();
        mensaje(estado, "");
        if (!login.reportValidity() || !comprobarConfiguracion(estado)) return;
        const correo = normalizarCorreo($("login-correo").value);
        const clave = $("login-clave").value;
        if (!correoValido(correo) || clave.length < MIN_CLAVE) {
            mensaje(estado, "Introduce un correo válido y una contraseña de al menos 6 caracteres."); return;
        }
        boton.disabled = true;
        boton.setAttribute("aria-busy", "true");
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email: correo, password: clave });
            if (error) throw error;
            if (!data?.session) throw new Error("No se inició una sesión válida.");
            login.reset();
            mensaje(estado, "Inicio de sesión validado por Supabase.", "success");
            mostrarModal($("modal-login-exitoso"));
        } catch (error) {
            console.error("Error al iniciar sesión Supabase:", error);
            mensaje(estado, errorLegible(error));
        } finally {
            boton.disabled = false;
            boton.removeAttribute("aria-busy");
        }
    });
}
