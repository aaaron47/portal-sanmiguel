package com.empresa.quejas.auth;

/**
 * Roles de la tabla administradores. ADMIN y OPERADOR son el "administrador" del portal;
 * SUPERVISOR además ve la auditoría y la metadata de todos.
 */
public enum Rol {
    ADMIN("Administrador"),
    OPERADOR("Operador"),
    SUPERVISOR("Supervisor");

    private final String etiqueta;

    Rol(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    public String getEtiqueta() {
        return etiqueta;
    }
}
