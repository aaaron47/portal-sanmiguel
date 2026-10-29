package com.empresa.quejas.tickets;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TicketRespuestaRepository extends JpaRepository<TicketRespuesta, String> {

    /** Respuestas que el admin envió al contribuyente: las que piden información o resuelven el reclamo. */
    @Query("""
            select count(r) from TicketRespuesta r
            where r.administrador.username = :usuario and r.visibleContribuyente = true
              and r.estadoNuevo not in (com.empresa.quejas.tickets.EstadoReclamo.REGISTRADO,
                                        com.empresa.quejas.tickets.EstadoReclamo.EN_REVISION,
                                        com.empresa.quejas.tickets.EstadoReclamo.ARCHIVADO)
            """)
    long contarRespuestasEnviadasPor(@Param("usuario") String usuario);
}
