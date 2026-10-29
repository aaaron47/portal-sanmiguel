package com.empresa.quejas.notificaciones;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificacionRepository extends JpaRepository<Notificacion, String> {

    List<Notificacion> findByReclamoId(String reclamoId);

    /** Correos ya enviados del reclamo, del más antiguo al más reciente, para armar el hilo. */
    List<Notificacion> findByReclamoIdAndEstadoAndIdNotOrderByFechaEnvioAsc(String reclamoId, EstadoNotificacion estado,
                                                                            String excluir);
}
