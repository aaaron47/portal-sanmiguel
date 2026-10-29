package com.empresa.quejas.notificaciones;

/** Se publica al registrar un aviso; lo recibe {@link EnvioEnSegundoPlano}. */
public record NotificacionProgramada(String notificacionId) {
}
