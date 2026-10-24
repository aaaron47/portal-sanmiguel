package com.empresa.quejas.auditoria;

public enum TipoInteraccion {
    CLICK("Click"),
    VISTA("Vista de pantalla");

    private final String etiqueta;

    TipoInteraccion(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    public String getEtiqueta() {
        return etiqueta;
    }
}
