package com.empresa.quejas.tickets;

public enum Canal {
    APP_MOVIL("App móvil"),
    WEB("Web"),
    PRESENCIAL("Presencial"),
    CALL_CENTER("Call center"),
    AGENCIA("Agencia");

    private final String etiqueta;

    Canal(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    public String getEtiqueta() {
        return etiqueta;
    }
}
