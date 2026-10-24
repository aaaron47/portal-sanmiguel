/*
 * Registro de clicks y vistas de pantalla del portal.
 *
 * - Envía una "VISTA" al cargar cada página y un "CLICK" por cada click en enlaces, botones
 *   o elementos con atributo data-track.
 * - Usa el token CSRF de la página (Spring Security lo exige en los POST).
 * - keepalive permite que el envío termine aunque el click navegue a otra página.
 * - Si el envío falla, no interrumpe al usuario: la auditoría nunca debe bloquear el trabajo.
 *
 * Para nombrar un elemento en los reportes agrega data-track="nombre-claro" en el HTML.
 */
(function () {
    'use strict';

    function meta(nombre) {
        var el = document.querySelector('meta[name="' + nombre + '"]');
        return el ? el.getAttribute('content') : null;
    }

    var url = meta('tracker-url');
    var token = meta('_csrf');
    var header = meta('_csrf_header');
    if (!url || !token || !header || !window.fetch) {
        return;
    }

    var SELECTOR = 'a, button, [data-track], input[type="submit"], input[type="checkbox"], select, summary';

    function enviar(datos) {
        var cabeceras = { 'Content-Type': 'application/json' };
        cabeceras[header] = token;
        try {
            fetch(url, {
                method: 'POST',
                headers: cabeceras,
                body: JSON.stringify(datos),
                keepalive: true,
                credentials: 'same-origin'
            }).catch(function () { /* se ignora */ });
        } catch (e) { /* se ignora */ }
    }

    function rutaActual() {
        return window.location.pathname + window.location.search;
    }

    function nombreElemento(el) {
        if (el.dataset && el.dataset.track) return el.dataset.track;
        var tag = el.tagName.toLowerCase();
        if (el.id) return tag + '#' + el.id;
        if (el.name) return tag + '[' + el.name + ']';
        return tag;
    }

    function textoElemento(el) {
        var texto = el.innerText || el.value || el.getAttribute('aria-label') || el.getAttribute('title') || '';
        return texto.replace(/\s+/g, ' ').trim().slice(0, 150);
    }

    // Vista de pantalla
    enviar({ tipo: 'VISTA', ruta: rutaActual(), elemento: 'pagina', texto: document.title });

    // Clicks (fase de captura para registrar incluso si otro código detiene el evento)
    document.addEventListener('click', function (ev) {
        var el = ev.target && ev.target.closest ? ev.target.closest(SELECTOR) : null;
        if (!el) return;
        enviar({
            tipo: 'CLICK',
            ruta: rutaActual(),
            elemento: nombreElemento(el),
            texto: textoElemento(el)
        });
    }, true);
})();
