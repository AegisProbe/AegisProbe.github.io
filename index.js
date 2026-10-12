"use strict";

// Formulario de auditoría original: simulación visual sin envío a un servidor.
// La comprobación permite reutilizar index.js en las tres páginas.
const formulario = document.getElementById("formulario-auditoria");
const confirmacion = document.getElementById("confirmacion");

if (formulario && confirmacion) {
    formulario.addEventListener("submit", function (event) {
        event.preventDefault();

        alert(
            "¡Solicitud recibida con éxito!\n\n" +
            "No nos llames, nosotros te llamaremos."
        );

        formulario.reset();
        confirmacion.style.display = "flex";
        confirmacion.scrollIntoView({ behavior: "smooth" });
    });
}

// Los botones de login y registro solo muestran un aviso de demostración.
// No se leen campos, se crean usuarios ni se almacena información.
function configurarBotonDemo(idBoton, idMensaje, texto) {
    const boton = document.getElementById(idBoton);
    const mensaje = document.getElementById(idMensaje);

    if (boton && mensaje) {
        boton.addEventListener("click", function () {
            mensaje.textContent = texto;
            mensaje.hidden = false;
            mensaje.focus();
        });
    }
}

configurarBotonDemo(
    "boton-login-demo",
    "mensaje-login",
    "Esta es una vista de demostración. No se ha iniciado una sesión ni se han enviado datos."
);

configurarBotonDemo(
    "boton-registro-demo",
    "mensaje-registro",
    "Esta es una vista de demostración. No se ha creado una cuenta ni se han enviado datos."
);
