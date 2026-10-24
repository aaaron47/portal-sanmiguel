package com.empresa.quejas.metadata;

import com.empresa.quejas.auditoria.AuditoriaService;
import com.empresa.quejas.auth.AdminUser;
import com.empresa.quejas.auth.AdminUserRepository;
import com.empresa.quejas.auth.Rol;
import com.empresa.quejas.tickets.TicketService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Metadata del admin: accesos, desde dónde se conecta y qué ha hecho.
 * Cada admin ve la suya; el supervisor puede ver la de cualquiera.
 */
@Controller
public class MetadataController {

    private final AdminUserRepository adminRepository;
    private final MetadataService metadataService;
    private final AuditoriaService auditoriaService;
    private final TicketService ticketService;

    public MetadataController(AdminUserRepository adminRepository, MetadataService metadataService,
                              AuditoriaService auditoriaService, TicketService ticketService) {
        this.adminRepository = adminRepository;
        this.metadataService = metadataService;
        this.auditoriaService = auditoriaService;
        this.ticketService = ticketService;
    }

    @GetMapping("/metadata")
    public String miMetadata(Authentication auth, Model model) {
        return mostrar(auth.getName(), auth, model);
    }

    @GetMapping("/metadata/admin/{username}")
    public String metadataDeAdmin(@PathVariable("username") String username, Authentication auth, Model model) {
        return mostrar(username, auth, model);
    }

    private String mostrar(String username, Authentication auth, Model model) {
        AdminUser admin = adminRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Administrador no encontrado"));

        List<LogMetadata> accesos = metadataService.ultimosAccesos(username);
        boolean esSupervisor = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + Rol.SUPERVISOR.name()));

        model.addAttribute("admin", admin);
        model.addAttribute("esPropio", username.equals(auth.getName()));
        model.addAttribute("accesoActual", accesos.isEmpty() ? null : accesos.get(0));
        model.addAttribute("ultimosAccesos", accesos);
        model.addAttribute("actividad", metadataService.actividadReciente(username));
        model.addAttribute("totalAccesos", metadataService.contar(username, TipoEvento.LOGIN_EXITOSO));
        model.addAttribute("fallidos30d", metadataService.contarDesde(username, TipoEvento.LOGIN_FALLIDO,
                LocalDateTime.now().minusDays(30)));
        model.addAttribute("respuestasEnviadas", ticketService.respuestasEnviadasPor(username));
        model.addAttribute("clicksHoy", auditoriaService.clicksHoy(username));
        if (esSupervisor) {
            model.addAttribute("admins", adminRepository.findAllByOrderByNombreCompletoAsc());
        }
        return "metadata/perfil";
    }
}
