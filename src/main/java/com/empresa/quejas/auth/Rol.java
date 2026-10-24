package com.empresa.quejas.auth;

public enum Rol {
    ADMIN("Administrador"),
    SUPERVISOR("Supervisor");

    private final String etiqueta;

    Rol(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    public String getEtiqueta() {
        return etiqueta;
    }
}
