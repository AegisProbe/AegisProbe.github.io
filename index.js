const formulario = document.getElementById("formulario-auditoria");
const confirmacion = document.getElementById("confirmacion");

formulario.addEventListener("submit", function(event) {
    event.preventDefault();

    alert(
        "¡Solicitud recibida con éxito!\n\n" +
        "No nos llames, nosotros te llamaremos."
    );

    formulario.reset();

    confirmacion.style.display = "flex";

    confirmacion.scrollIntoView({
        behavior: "smooth"
    });
});
