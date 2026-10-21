import { supabase } from "./supabase-client.js";

// Muestra 'Mi cuenta' y 'Cerrar sesión' solo si existe un usuario autenticado.
if (supabase) {
    const login = document.getElementById("link-login");
    const registro = document.getElementById("link-registro");

    async function actualizarMenu() {
        const { data: { user } = {} } = await supabase.auth.getUser();
        if (login) {
            login.textContent = user ? "Mi cuenta" : "Iniciar sesión";
            login.href = user ? "mi-cuenta.html" : "login.html";
        }
        if (registro) {
            registro.textContent = user ? "Cerrar sesión" : "Registrarse";
            registro.href = user ? "#cerrar-sesion" : "registro.html";
        }
    }

    registro?.addEventListener("click", async (evento) => {
        if (registro.textContent !== "Cerrar sesión") return;
        evento.preventDefault();
        const { error } = await supabase.auth.signOut();
        if (error) {
            alert("No se pudo cerrar la sesión. Vuelve a intentarlo.");
            return;
        }
        if (window.location.pathname.endsWith("mi-cuenta.html")) {
            window.location.href = "index.html";
        } else {
            await actualizarMenu();
        }
    });
    actualizarMenu();
    supabase.auth.onAuthStateChange(() => { setTimeout(actualizarMenu, 0); });
}
