package com.empresa.quejas.auth;

/** Estado de la cuenta en la tabla administradores: solo ACTIVO puede entrar. */
public enum EstadoAdmin {
    ACTIVO,
    BLOQUEADO,
    INACTIVO
}
