package com.empresa.quejas.metadata;

public enum TipoEvento {
    LOGIN_EXITOSO("Inicio de sesión", "ok"),
    LOGIN_FALLIDO("Intento de acceso fallido", "error"),
    CUENTA_BLOQUEADA("Cuenta bloqueada", "error"),
    LOGOUT("Cierre de sesión", "neutro"),
    TICKET_TOMADO("Tomó un ticket", "accion"),
    TICKET_LIBERADO("Liberó un ticket", "accion"),
    TICKET_RESPONDIDO("Respondió un ticket", "accion"),
    TICKET_ARCHIVADO("Archivó un ticket", "accion"),
    CONFLICTO_VERSION("Cambio rechazado por conflicto", "error"),
    CORREO_ENVIADO("Correo enviado al cliente", "ok"),
    CORREO_FALLIDO("Correo no enviado", "error"),
    CORREO_REENVIADO("Reenvió un correo", "accion");

    private final String etiqueta;
    private final String clase;

    TipoEvento(String etiqueta, String clase) {
        this.etiqueta = etiqueta;
        this.clase = clase;
    }

    public String getEtiqueta() {
        return etiqueta;
    }

    /** Clase CSS para pintar el evento. */
    public String getClase() {
        return clase;
    }
}
