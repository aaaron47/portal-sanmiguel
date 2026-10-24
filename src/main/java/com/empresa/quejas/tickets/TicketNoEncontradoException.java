package com.empresa.quejas.tickets;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class TicketNoEncontradoException extends RuntimeException {

    public TicketNoEncontradoException(Long id) {
        super("No existe el ticket " + id);
    }
}
