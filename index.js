"use strict";

// Formulario de auditoría: simulación visual sin envío a un servidor.
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

// Carrusel de reseñas de la página principal.
function configurarCarruselTestimonios() {
    const carrusel = document.getElementById("carrusel-testimonios");
    const pista = document.getElementById("grid-testimonios");
    const tarjetas = pista ? Array.from(pista.querySelectorAll(".testimonial-card")) : [];
    const botonAnterior = document.getElementById("testimonio-anterior");
    const botonSiguiente = document.getElementById("testimonio-siguiente");
    const contenedorPuntos = document.getElementById("puntos-testimonios");

    if (!carrusel || !pista || tarjetas.length === 0 || !botonAnterior || !botonSiguiente || !contenedorPuntos) {
        return;
    }

    let indiceActual = 0;
    let tarjetasVisibles = obtenerTarjetasVisibles();
    let totalPaginas = obtenerTotalPaginas();
    let intervaloAutomatico;

    function obtenerTarjetasVisibles() {
        if (window.innerWidth <= 650) return 1;
        if (window.innerWidth <= 950) return 2;
        return 3;
    }

    function obtenerTotalPaginas() {
        return Math.ceil(tarjetas.length / tarjetasVisibles);
    }

    function crearPuntos() {
        contenedorPuntos.innerHTML = "";

        for (let i = 0; i < totalPaginas; i++) {
            const punto = document.createElement("button");
            punto.type = "button";
            punto.className = "carousel-dot";
            punto.setAttribute("aria-label", `Ver grupo de reseñas ${i + 1}`);
            punto.addEventListener("click", function () {
                indiceActual = i;
                actualizarCarrusel();
                reiniciarAutomatico();
            });
            contenedorPuntos.appendChild(punto);
        }
    }

    function actualizarCarrusel() {
        const anchoTarjeta = tarjetas[0].getBoundingClientRect().width;
        const estilosPista = window.getComputedStyle(pista);
        const espacio = parseFloat(estilosPista.columnGap || estilosPista.gap || 0);
        const desplazamiento = indiceActual * tarjetasVisibles * (anchoTarjeta + espacio);

        pista.style.transform = `translateX(-${desplazamiento}px)`;

        tarjetas.forEach(function (tarjeta, indice) {
            const inicioVisible = indiceActual * tarjetasVisibles;
            const finVisible = inicioVisible + tarjetasVisibles;
            tarjeta.classList.toggle("is-active", indice >= inicioVisible && indice < finVisible);
        });

        Array.from(contenedorPuntos.children).forEach(function (punto, indice) {
            punto.classList.toggle("is-active", indice === indiceActual);
        });
    }

    function avanzar() {
        indiceActual = (indiceActual + 1) % totalPaginas;
        actualizarCarrusel();
    }

    function retroceder() {
        indiceActual = (indiceActual - 1 + totalPaginas) % totalPaginas;
        actualizarCarrusel();
    }

    function reiniciarAutomatico() {
        clearInterval(intervaloAutomatico);
        intervaloAutomatico = setInterval(avanzar, 5500);
    }

    botonSiguiente.addEventListener("click", function () {
        avanzar();
        reiniciarAutomatico();
    });

    botonAnterior.addEventListener("click", function () {
        retroceder();
        reiniciarAutomatico();
    });

    window.addEventListener("resize", function () {
        tarjetasVisibles = obtenerTarjetasVisibles();
        totalPaginas = obtenerTotalPaginas();

        if (indiceActual >= totalPaginas) {
            indiceActual = totalPaginas - 1;
        }

        crearPuntos();
        actualizarCarrusel();
    });

    carrusel.addEventListener("mouseenter", function () {
        clearInterval(intervaloAutomatico);
    });

    carrusel.addEventListener("mouseleave", function () {
        reiniciarAutomatico();
    });

    crearPuntos();
    actualizarCarrusel();
    reiniciarAutomatico();
}

configurarCarruselTestimonios();

// Compatibilidad con versiones antiguas de login/registro que usaban index.js.
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
