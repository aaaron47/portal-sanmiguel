package com.empresa.quejas.notificaciones;

import com.empresa.quejas.metadata.RequestInfo;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class NotificacionController {

    private final NotificacionService notificacionService;

    public NotificacionController(NotificacionService notificacionService) {
        this.notificacionService = notificacionService;
    }

    /** Fragmento con el estado del correo; lo consulta js/correos.js mientras dice "Enviando". */
    @GetMapping("/tickets/{ticketId}/correos/{id}")
    public String estado(@PathVariable("ticketId") String ticketId, @PathVariable("id") String id, Model model) {
        Notificacion notificacion = notificacionService.buscar(ticketId, id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        model.addAttribute("c", notificacion);
        model.addAttribute("ticketId", ticketId);
        return "tickets/correo :: estado";
    }

    @PostMapping("/tickets/{ticketId}/correos/{id}/reenviar")
    public String reenviar(@PathVariable("ticketId") String ticketId, @PathVariable("id") String id,
                           Authentication auth, HttpServletRequest request, RedirectAttributes flash) {
        try {
            if (notificacionService.reenviar(ticketId, id, auth.getName(), RequestInfo.de(request))) {
                flash.addFlashAttribute("ok", "Correo reenviado al cliente.");
            } else {
                flash.addFlashAttribute("error",
                        "No se pudo enviar el correo otra vez. Inténtalo en unos minutos; si sigue fallando, "
                                + "avisa al cliente por teléfono.");
            }
        } catch (IllegalStateException e) {
            flash.addFlashAttribute("error", e.getMessage());
        } catch (ObjectOptimisticLockingFailureException e) {
            flash.addFlashAttribute("error", "Otro admin ya está reenviando este correo. Actualiza la página para ver el resultado.");
        }
        return "redirect:/tickets/" + ticketId;
    }
}
