document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY = "aegisprobe_usuarios";

    const getUsuarios = () => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch (error) {
            return [];
        }
    };

    const saveUsuarios = (usuarios) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarios));
    };

    const normalizarCorreo = (correo) => correo.trim().toLowerCase();

    const correoValido = (correo) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
    };

    const mostrarMensaje = (elemento, texto, tipo = "success") => {
        if (!elemento) return;

        elemento.textContent = texto;
        elemento.hidden = false;
        elemento.classList.remove("is-success", "is-error");
        elemento.classList.add(tipo === "error" ? "is-error" : "is-success");
        elemento.focus();
    };

    const ocultarMensaje = (elemento) => {
        if (!elemento) return;

        elemento.textContent = "";
        elemento.hidden = true;
        elemento.classList.remove("is-success", "is-error");
    };

    const abrirModal = (modal) => {
        if (!modal) return;

        modal.hidden = false;
        document.body.classList.add("modal-open");

        const botonCerrar = modal.querySelector("[data-modal-close]");
        if (botonCerrar) {
            botonCerrar.focus();
        }
    };

    const cerrarModal = (modal) => {
        if (!modal) return;

        modal.hidden = true;
        document.body.classList.remove("modal-open");
    };

    document.querySelectorAll(".usuarios-modal").forEach((modal) => {
        modal.addEventListener("click", (event) => {
            if (event.target === modal || event.target.matches("[data-modal-close]")) {
                cerrarModal(modal);
            }
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;

        document.querySelectorAll(".usuarios-modal:not([hidden])").forEach((modal) => {
            cerrarModal(modal);
        });
    });

    const formRegistro = document.getElementById("form-registro");
    const mensajeRegistro = document.getElementById("mensaje-registro");
    const modalRegistro = document.getElementById("modal-registro-exitoso");

    if (formRegistro) {
        formRegistro.addEventListener("submit", (event) => {
            event.preventDefault();
            ocultarMensaje(mensajeRegistro);

            const nombre = document.getElementById("registro-nombre").value.trim();
            const correo = normalizarCorreo(document.getElementById("registro-correo").value);
            const clave = document.getElementById("registro-clave").value.trim();
            const confirmar = document.getElementById("registro-confirmar").value.trim();

            if (!nombre || !correo || !clave || !confirmar) {
                mostrarMensaje(mensajeRegistro, "Completa todos los campos para registrar la cuenta.", "error");
                return;
            }

            if (!correoValido(correo)) {
                mostrarMensaje(mensajeRegistro, "Ingresa un correo electrónico válido.", "error");
                return;
            }

            if (clave.length < 6) {
                mostrarMensaje(mensajeRegistro, "La contraseña debe tener como mínimo 6 caracteres.", "error");
                return;
            }

            if (clave !== confirmar) {
                mostrarMensaje(mensajeRegistro, "Las contraseñas no coinciden.", "error");
                return;
            }

            const usuarios = getUsuarios();
            const yaExiste = usuarios.some((usuario) => usuario.correo === correo);

            if (yaExiste) {
                mostrarMensaje(mensajeRegistro, "Este correo ya está registrado. Puedes iniciar sesión.", "error");
                return;
            }

            usuarios.push({
                nombre,
                correo,
                clave
            });

            saveUsuarios(usuarios);
            formRegistro.reset();

            mostrarMensaje(mensajeRegistro, "Registro exitoso. Tu cuenta fue creada correctamente.", "success");
            abrirModal(modalRegistro);
        });
    }

    const formLogin = document.getElementById("form-login");
    const mensajeLogin = document.getElementById("mensaje-login");
    const modalLogin = document.getElementById("modal-login-exitoso");

    if (formLogin) {
        formLogin.addEventListener("submit", (event) => {
            event.preventDefault();
            ocultarMensaje(mensajeLogin);

            const correo = normalizarCorreo(document.getElementById("login-correo").value);
            const clave = document.getElementById("login-clave").value.trim();

            if (!correo || !clave) {
                mostrarMensaje(mensajeLogin, "Ingresa tu correo y contraseña para iniciar sesión.", "error");
                return;
            }

            if (!correoValido(correo)) {
                mostrarMensaje(mensajeLogin, "Ingresa un correo electrónico válido.", "error");
                return;
            }

            const usuarios = getUsuarios();
            const usuarioEncontrado = usuarios.find((usuario) => {
                return usuario.correo === correo && usuario.clave === clave;
            });

            if (!usuarioEncontrado) {
                mostrarMensaje(mensajeLogin, "Correo o contraseña incorrectos. Registra una cuenta primero.", "error");
                return;
            }

            formLogin.reset();

            mostrarMensaje(mensajeLogin, `Inicio de sesión exitoso. Bienvenido, ${usuarioEncontrado.nombre}.`, "success");
            abrirModal(modalLogin);
        });
    }
});
