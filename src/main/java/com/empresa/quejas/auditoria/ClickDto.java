package com.empresa.quejas.auditoria;

/**
 * Lo que envía el navegador (static/js/tracker.js) por cada click o vista de pantalla.
 * El usuario, la IP y la fecha NO vienen del navegador: los pone el servidor.
 */
public record ClickDto(String tipo, String ruta, String elemento, String texto) {
}
