package com.empresa.quejas.tickets;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketRespuestaRepository extends JpaRepository<TicketRespuesta, Long> {

    long countByAutorAndNotaInternaFalse(String autor);
}
