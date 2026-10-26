package com.empresa.quejas.notificaciones;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Envía el correo recién cuando la respuesta quedó guardada en la BD (AFTER_COMMIT): si la respuesta
 * falla, el cliente nunca recibe un mensaje que no existe en el sistema. Es asíncrono para que el
 * admin no espere al servidor de correo.
 */
@Component
public class EnvioEnSegundoPlano {

    private final NotificacionService notificacionService;

    public EnvioEnSegundoPlano(NotificacionService notificacionService) {
        this.notificacionService = notificacionService;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void alConfirmarRespuesta(NotificacionProgramada evento) {
        notificacionService.enviar(evento.notificacionId());
    }
}
