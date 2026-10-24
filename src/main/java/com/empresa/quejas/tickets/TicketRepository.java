package com.empresa.quejas.tickets;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long>, JpaSpecificationExecutor<Ticket> {

    /** Carga el ticket con su conversación en una sola consulta (open-in-view está desactivado). */
    @Query("select distinct t from Ticket t left join fetch t.respuestas where t.id = :id")
    Optional<Ticket> findConRespuestas(@Param("id") Long id);

    long countByEstado(EstadoTicket estado);

    long countByEstadoAndAsignadoA(EstadoTicket estado, String asignadoA);

    long countByEstadoAndFechaArchivadoAfter(EstadoTicket estado, LocalDateTime desde);

    long countByEstadoInAndFechaCreacionBefore(List<EstadoTicket> estados, LocalDateTime antes);

    List<Ticket> findTop6ByEstadoOrderByFechaCreacionAsc(EstadoTicket estado);

    List<Ticket> findTop6ByEstadoAndAsignadoAOrderByFechaCreacionAsc(EstadoTicket estado, String asignadoA);
}
