package com.empresa.quejas.metadata;

import java.util.Arrays;
import java.util.List;

/**
 * Eventos que el portal deja en la tabla auditoria (columna accion). La tabla es compartida: también guarda
 * eventos de la app móvil y del sistema, por eso el portal solo lee las acciones que están en esta lista.
 */
public enum TipoEvento {
    LOGIN_EXITOSO("Inicio de sesión", "ok"),
    LOGIN_FALLIDO("Intento de acceso fallido", "error"),
    CUENTA_BLOQUEADA("Cuenta bloqueada", "error"),
    LOGOUT("Cierre de sesión", "neutro"),
    TICKET_TOMADO("Tomó un ticket", "accion"),
    TICKET_LIBERADO("Liberó un ticket", "accion"),
    TICKET_NOTA("Escribió una nota interna", "accion"),
    TICKET_OBSERVADO("Pidió información al contribuyente", "accion"),
    TICKET_RESUELTO("Resolvió un ticket", "accion"),
    TICKET_ARCHIVADO("Archivó un ticket", "accion"),
    CONFLICTO_VERSION("Cambio rechazado por conflicto", "error"),
    CORREO_ENVIADO("Correo enviado al contribuyente", "ok"),
    CORREO_FALLIDO("Correo no enviado", "error"),
    CORREO_REENVIADO("Reenvió un correo", "accion");

    private static final List<String> NOMBRES = Arrays.stream(values()).map(Enum::name).toList();

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

    /** Valores de auditoria.accion que genera el portal. */
    public static List<String> nombres() {
        return NOMBRES;
    }
}
