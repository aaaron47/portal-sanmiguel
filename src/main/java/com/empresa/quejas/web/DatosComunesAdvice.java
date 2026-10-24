package com.empresa.quejas.web;

import com.empresa.quejas.auth.AdminUserRepository;
import com.empresa.quejas.tickets.EstadoTicket;
import com.empresa.quejas.tickets.TicketService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

import java.util.Map;

/**
 * Datos que necesita el layout en todas las pantallas: usuario actual, ruta activa y contadores del menú.
 * Solo aplica a controladores de vistas (no a la API de clicks).
 */
@ControllerAdvice(annotations = Controller.class, basePackages = "com.empresa.quejas")
public class DatosComunesAdvice {

    private final AdminUserRepository adminRepository;
    private final TicketService ticketService;

    public DatosComunesAdvice(AdminUserRepository adminRepository, TicketService ticketService) {
        this.adminRepository = adminRepository;
        this.ticketService = ticketService;
    }

    @ModelAttribute
    public void datosComunes(Model model, HttpServletRequest request, Authentication auth) {
        String ruta = request.getRequestURI();
        model.addAttribute("rutaActual", ruta);
        if (auth == null || ruta.startsWith(request.getContextPath() + "/api/") || ruta.endsWith("/login")) {
            return;
        }
        adminRepository.findByUsername(auth.getName())
                .ifPresent(admin -> model.addAttribute("usuarioActual", admin));
        Map<EstadoTicket, Long> conteo = ticketService.conteoPorEstado();
        model.addAttribute("conteoNav", conteo);
        model.addAttribute("abiertosNav", conteo.get(EstadoTicket.PENDIENTE) + conteo.get(EstadoTicket.EN_ATENCION));
    }
}
