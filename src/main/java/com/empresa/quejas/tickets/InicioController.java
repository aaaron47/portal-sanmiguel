package com.empresa.quejas.tickets;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class InicioController {

    private final TicketService ticketService;

    public InicioController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @GetMapping("/")
    public String inicio(Model model, Authentication auth) {
        model.addAttribute("resumen", ticketService.resumenInicio(auth.getName()));
        model.addAttribute("estados", EstadoTicket.bandeja());
        return "inicio";
    }
}
