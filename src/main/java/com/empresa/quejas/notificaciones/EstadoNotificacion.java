package com.empresa.quejas.notificaciones;

public enum EstadoNotificacion {
    PENDIENTE("Enviando"),
    ENVIADO("Enviado"),
    FALLIDO("No se pudo enviar"),
    SIN_CORREO("Cliente sin correo");

    private final String etiqueta;

    EstadoNotificacion(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    public String getEtiqueta() {
        return etiqueta;
    }
}
