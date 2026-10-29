package com.empresa.quejas.notificaciones;

/** Valores de portal_notificaciones.estado (los fija una restricción CHECK de la BD). */
public enum EstadoNotificacion {
    PENDIENTE("Enviando"),
    ENVIADO("Enviado"),
    FALLIDO("No se pudo enviar");

    private final String etiqueta;

    EstadoNotificacion(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    public String getEtiqueta() {
        return etiqueta;
    }
}
