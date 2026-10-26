package com.empresa.quejas.notificaciones;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {

    List<Notificacion> findByTicketId(Long ticketId);

    /** Correos ya enviados del ticket, del más antiguo al más reciente, para armar el hilo. */
    List<Notificacion> findByTicketIdAndEstadoAndIdNotOrderByFechaEnvioAsc(Long ticketId, EstadoNotificacion estado,
                                                                           Long excluir);
}
