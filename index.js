"use strict";

// Envío real de auditorías: auditorias.js (módulo Supabase).

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

/* Carrusel automático accesible de la sección «Nuestra misión». */
(function configurarCarruselMision() {
    const raiz = document.getElementById('carrusel-mision');
    if (!raiz) return;
    const slides = Array.from(raiz.querySelectorAll('.mission-slide'));
    const dots = Array.from(raiz.querySelectorAll('.mission-dot'));
    const prev = raiz.querySelector('.mission-prev');
    const next = raiz.querySelector('.mission-next');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let current = 0;
    let timer = null;
    function show(index) {
        current = (index + slides.length) % slides.length;
        slides.forEach((slide, i) => {
            const active = i === current;
            slide.classList.toggle('is-active', active);
            slide.setAttribute('aria-hidden', String(!active));
        });
        dots.forEach((dot, i) => {
            dot.classList.toggle('is-active', i === current);
            if (i === current) dot.setAttribute('aria-current', 'true');
            else dot.removeAttribute('aria-current');
        });
    }
    function stop() { if (timer !== null) {window.clearInterval(timer); timer = null;} }
    function start() {
        stop();
        if (reducedMotion.matches || document.hidden) return;
        timer = window.setInterval(() => show(current + 1), 5000);
    }
    prev.addEventListener('click', () => {show(current - 1); start();});
    next.addEventListener('click', () => {show(current + 1); start();});
    dots.forEach((dot, i) => dot.addEventListener('click', () => {show(i); start();}));
    raiz.addEventListener('mouseenter', stop);
    raiz.addEventListener('mouseleave', start);
    raiz.addEventListener('focusin', stop);
    raiz.addEventListener('focusout', event => {if (!raiz.contains(event.relatedTarget)) start();});
    raiz.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft') {event.preventDefault(); show(current - 1);}
        if (event.key === 'ArrowRight') {event.preventDefault(); show(current + 1);}
    });
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    if (typeof reducedMotion.addEventListener === 'function') reducedMotion.addEventListener('change', start);
    show(0);
    start();
})();
