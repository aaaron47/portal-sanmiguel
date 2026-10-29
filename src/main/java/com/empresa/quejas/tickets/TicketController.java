package com.empresa.quejas.tickets;

import com.empresa.quejas.metadata.RequestInfo;
import com.empresa.quejas.notificaciones.NotificacionService;
import com.empresa.quejas.web.Filtros;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDate;
import java.util.function.Supplier;

@Controller
public class TicketController {

    private final TicketService ticketService;
    private final NotificacionService notificacionService;

    public TicketController(TicketService ticketService, NotificacionService notificacionService) {
        this.ticketService = ticketService;
        this.notificacionService = notificacionService;
    }

    // ---------- Bandeja: pendientes, por contestar, observados y resueltos ----------

    @GetMapping("/tickets")
    public String bandeja(@RequestParam(name = "estado", defaultValue = "PENDIENTE") EstadoTicket estado,
                          @RequestParam(name = "q", required = false) String q,
                          @RequestParam(name = "prioridad", required = false) Prioridad prioridad,
                          @RequestParam(name = "mios", defaultValue = "false") boolean mios,
                          @RequestParam(name = "page", defaultValue = "0") int page,
                          Authentication auth, Model model) {
        if (estado == EstadoTicket.ARCHIVADO) {
            return "redirect:/historial";
        }
        model.addAttribute("pagina", ticketService.buscarBandeja(estado, q, prioridad, mios, auth.getName(), page));
        model.addAttribute("estado", estado);
        model.addAttribute("estados", EstadoTicket.bandeja());
        model.addAttribute("prioridades", Prioridad.values());
        model.addAttribute("q", q);
        model.addAttribute("prioridad", prioridad);
        model.addAttribute("mios", mios);
        model.addAttribute("urlBase", "/tickets");
        model.addAttribute("filtros", Filtros.query("estado", estado, "q", q, "prioridad", prioridad, "mios", mios));
        return "tickets/bandeja";
    }

    // ---------- Historial de archivados ----------

    @GetMapping("/historial")
    public String historial(@RequestParam(name = "q", required = false) String q,
                            @RequestParam(name = "canal", required = false) Canal canal,
                            @RequestParam(name = "desde", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
                            @RequestParam(name = "hasta", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
                            @RequestParam(name = "page", defaultValue = "0") int page,
                            Model model) {
        model.addAttribute("pagina", ticketService.buscarHistorial(q, canal, desde, hasta, page));
        model.addAttribute("canales", Canal.values());
        model.addAttribute("q", q);
        model.addAttribute("canal", canal);
        model.addAttribute("desde", desde);
        model.addAttribute("hasta", hasta);
        model.addAttribute("urlBase", "/historial");
        model.addAttribute("filtros", Filtros.query("q", q, "canal", canal, "desde", desde, "hasta", hasta));
        return "tickets/historial";
    }

    // ---------- Detalle (lo que el admin ve en pantalla al abrir un ticket) ----------

    @GetMapping("/tickets/{id}")
    public String detalle(@PathVariable("id") String id, Model model) {
        model.addAttribute("ticket", ticketService.detalle(id));
        model.addAttribute("correos", notificacionService.porRespuesta(id));
        model.addAttribute("resoluciones", EstadoReclamo.resoluciones());
        model.addAttribute("plazoSugerido", LocalDate.now().plusDays(10));
        model.addAttribute("maxMensaje", TicketService.MAX_MENSAJE);
        model.addAttribute("maxObservacion", TicketService.MAX_OBSERVACION);
        return "tickets/detalle";
    }

    // ---------- Acciones ----------

    @PostMapping("/tickets/{id}/tomar")
    public String tomar(@PathVariable("id") String id, @RequestParam(name = "version") Long version, Authentication auth,
                        HttpServletRequest request, RedirectAttributes flash) {
        return ejecutar(id, flash, "Ticket asignado a ti. Ya puedes atenderlo.",
                () -> ticketService.tomar(id, version, auth.getName(), RequestInfo.de(request)));
    }

    @PostMapping("/tickets/{id}/liberar")
    public String liberar(@PathVariable("id") String id, @RequestParam(name = "version") Long version, Authentication auth,
                          HttpServletRequest request, RedirectAttributes flash) {
        return ejecutar(id, flash, "Ticket liberado. Volvió a pendientes.",
                () -> ticketService.liberar(id, version, auth.getName(), RequestInfo.de(request)));
    }

    /** Nota interna: no cambia el estado y el contribuyente no la ve. */
    @PostMapping("/tickets/{id}/nota")
    public String nota(@PathVariable("id") String id, @RequestParam(name = "version") Long version,
                       @RequestParam(name = "mensaje") String mensaje, Authentication auth,
                       HttpServletRequest request, RedirectAttributes flash) {
        return ejecutar(id, flash, "Nota interna guardada.",
                () -> ticketService.agregarNota(id, version, auth.getName(), mensaje, RequestInfo.de(request)));
    }

    /** Pide información al contribuyente: el ticket pasa a observado. */
    @PostMapping("/tickets/{id}/observar")
    public String observar(@PathVariable("id") String id, @RequestParam(name = "version") Long version,
                           @RequestParam(name = "mensaje") String mensaje,
                           @RequestParam(name = "plazo", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate plazo,
                           Authentication auth, HttpServletRequest request, RedirectAttributes flash) {
        return ejecutar(id, flash,
                "Pedido guardado. El ticket quedó observado, esperando al contribuyente. "
                        + "Debajo del mensaje verás el estado del correo.",
                () -> ticketService.observar(id, version, auth.getName(), mensaje, plazo, RequestInfo.de(request)));
    }

    /** Responde y cierra el reclamo con una resolución. */
    @PostMapping("/tickets/{id}/resolver")
    public String resolver(@PathVariable("id") String id, @RequestParam(name = "version") Long version,
                           @RequestParam(name = "resolucion") EstadoReclamo resolucion,
                           @RequestParam(name = "mensaje") String mensaje, Authentication auth,
                           HttpServletRequest request, RedirectAttributes flash) {
        return ejecutar(id, flash,
                "Reclamo resuelto como " + resolucion.getEtiqueta().toLowerCase()
                        + ". Debajo del mensaje verás el estado del correo.",
                () -> ticketService.resolver(id, version, auth.getName(), resolucion, mensaje, RequestInfo.de(request)));
    }

    @PostMapping("/tickets/{id}/archivar")
    public String archivar(@PathVariable("id") String id, @RequestParam(name = "version") Long version, Authentication auth,
                           HttpServletRequest request, RedirectAttributes flash) {
        return ejecutar(id, flash, "Ticket archivado. Lo encontrarás en el historial.",
                () -> ticketService.archivar(id, version, auth.getName(), RequestInfo.de(request)));
    }

    private String ejecutar(String id, RedirectAttributes flash, String mensajeOk, Supplier<Ticket> accion) {
        try {
            Ticket ticket = accion.get();
            flash.addFlashAttribute("ok", mensajeOk);
            if (ticket.getClienteEmail() == null || ticket.getClienteEmail().isBlank()) {
                if (ticket.getEstadoReclamo() == EstadoReclamo.OBSERVADO || ticket.getEstadoReclamo().esResolucion()) {
                    flash.addFlashAttribute("aviso",
                            "El contribuyente no tiene correo registrado: no se envió ningún aviso. Contáctalo por teléfono.");
                }
            }
        } catch (ConflictoVersionException | IllegalStateException e) {
            flash.addFlashAttribute("error", e.getMessage());
        } catch (ObjectOptimisticLockingFailureException e) {
            flash.addFlashAttribute("error",
                    "Otro usuario o sistema modificó este ticket al mismo tiempo. Revisa los cambios y vuelve a intentarlo.");
        }
        return "redirect:/tickets/" + id;
    }
}
