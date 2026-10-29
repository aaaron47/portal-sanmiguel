package com.empresa.quejas.tickets;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, String>, JpaSpecificationExecutor<Ticket> {

    /** Carga el ticket con su conversación en una sola consulta (open-in-view está desactivado). */
    @Query("select distinct t from Ticket t left join fetch t.respuestas where t.id = :id")
    Optional<Ticket> findConRespuestas(@Param("id") String id);

    /** Cantidad de tickets por estado de la BD; el servicio los agrupa por estado de bandeja. */
    @Query("select t.estadoReclamo, count(t) from Ticket t group by t.estadoReclamo")
    List<Object[]> contarPorEstadoReclamo();

    long countByEstadoReclamoInAndAsignadoUsername(Collection<EstadoReclamo> estados, String usuario);

    long countByEstadoReclamoInAndFechaLimiteAtencionBefore(Collection<EstadoReclamo> estados, LocalDate antes);

    long countByEstadoReclamoInAndFechaLimiteAtencionBetween(Collection<EstadoReclamo> estados, LocalDate desde,
                                                             LocalDate hasta);

    @Query("select count(t) from Ticket t where t.estadoReclamo = com.empresa.quejas.tickets.EstadoReclamo.ARCHIVADO "
            + "and t.fechaArchivado >= :desde")
    long contarArchivadosDesde(@Param("desde") java.time.LocalDateTime desde);

    List<Ticket> findTop6ByEstadoReclamoInOrderByFechaLimiteAtencionAsc(Collection<EstadoReclamo> estados);

    List<Ticket> findTop6ByEstadoReclamoInAndAsignadoUsernameOrderByFechaLimiteAtencionAsc(
            Collection<EstadoReclamo> estados, String usuario);
}
