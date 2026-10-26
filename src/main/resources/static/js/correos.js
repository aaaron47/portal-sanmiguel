/*
 * Estado del correo al cliente en el detalle del ticket, sin recargar la página.
 *
 * - Mientras un correo dice "Enviando", pregunta al servidor por su estado cada 1,5 segundos.
 * - El servidor devuelve el mismo fragmento HTML que pinta el detalle (tickets/correo.html), así el
 *   texto y el botón "Reenviar correo" salen de una sola plantilla.
 * - Se actualiza el contenido del aviso y no el elemento, para que los lectores de pantalla
 *   anuncien el cambio (aria-live).
 * - Deja de preguntar después de un minuto o si la sesión venció.
 */
(function () {
    'use strict';

    var INTERVALO_MS = 1500;
    var MAX_CONSULTAS = 40;

    if (!window.fetch || !window.HTMLTemplateElement) {
        return;
    }

    function detener(aviso, texto) {
        aviso.removeAttribute('data-pendiente');
        aviso.querySelector('span').textContent = texto;
    }

    function seguir(aviso, consulta) {
        if (consulta >= MAX_CONSULTAS) {
            detener(aviso, 'El envío está tardando más de lo normal. Actualiza la página en unos minutos para ver el resultado.');
            return;
        }
        setTimeout(function () {
            fetch(aviso.getAttribute('data-url'), { credentials: 'same-origin', headers: { 'Accept': 'text/html' } })
                .then(function (respuesta) {
                    // Si la sesión venció, el servidor redirige al login: no hay nada que mostrar.
                    if (!respuesta.ok || respuesta.redirected) {
                        throw new Error('sin estado');
                    }
                    return respuesta.text();
                })
                .then(function (html) {
                    var plantilla = document.createElement('template');
                    plantilla.innerHTML = html.trim();
                    var nuevo = plantilla.content.querySelector('.correo');
                    if (!nuevo) {
                        throw new Error('sin estado');
                    }
                    aviso.className = nuevo.className;
                    aviso.innerHTML = nuevo.innerHTML;
                    if (nuevo.hasAttribute('data-pendiente')) {
                        seguir(aviso, consulta + 1);
                    } else {
                        aviso.removeAttribute('data-pendiente');
                    }
                })
                .catch(function (error) {
                    if (error.message === 'sin estado') {
                        detener(aviso, 'No pudimos consultar el estado del correo. Actualiza la página para verlo.');
                    } else {
                        seguir(aviso, consulta + 1); // corte de red momentáneo: volver a intentar
                    }
                });
        }, INTERVALO_MS);
    }

    document.querySelectorAll('.correo[data-pendiente]').forEach(function (aviso) {
        seguir(aviso, 0);
    });
})();
