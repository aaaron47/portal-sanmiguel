package com.empresa.quejas.tickets;

import com.empresa.quejas.auth.AdminUser;
import com.empresa.quejas.auth.AdminUserRepository;
import com.empresa.quejas.metadata.MetadataService;
import com.empresa.quejas.metadata.RequestInfo;
import com.empresa.quejas.metadata.TipoEvento;
import com.empresa.quejas.notificaciones.DatosRespuesta;
import com.empresa.quejas.notificaciones.NotificacionService;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class TicketService {

    private static final int TAMANO_PAGINA = 12;
    /** Largo máximo del mensaje: reclamo_seguimientos.comentario admite 2000 caracteres. */
    public static final int MAX_MENSAJE = 2000;
    /** reclamos.observacion admite 1000 caracteres. */
    public static final int MAX_OBSERVACION = 1000;
    /** Días para que el contribuyente complete la información, si el admin no indica una fecha. */
    private static final int DIAS_SUBSANACION = 10;

    private final TicketRepository repository;
    private final TicketRespuestaRepository respuestaRepository;
    private final AdminUserRepository adminRepository;
    private final MetadataService metadataService;
    private final NotificacionService notificacionService;
    private final NumeracionResoluciones numeracionResoluciones;

    public TicketService(TicketRepository repository, TicketRespuestaRepository respuestaRepository,
                         AdminUserRepository adminRepository, MetadataService metadataService,
                         NotificacionService notificacionService, NumeracionResoluciones numeracionResoluciones) {
        this.repository = repository;
        this.respuestaRepository = respuestaRepository;
        this.adminRepository = adminRepository;
        this.metadataService = metadataService;
        this.notificacionService = notificacionService;
        this.numeracionResoluciones = numeracionResoluciones;
    }

    // ---------- Consultas ----------

    @Transactional(readOnly = true)
    public Page<Ticket> buscarBandeja(EstadoTicket estado, String texto, Prioridad prioridad,
                                      boolean soloMios, String usuario, int pagina) {
        Specification<Ticket> spec = (root, query, cb) -> {
            List<Predicate> filtros = new ArrayList<>();
            filtros.add(root.get("estadoReclamo").in(estado.getEstadosReclamo()));
            if (prioridad != null) {
                filtros.add(cb.equal(root.get("prioridad"), prioridad));
            }
            if (soloMios) {
                filtros.add(cb.equal(root.get("asignado").get("username"), usuario));
            }
            agregarFiltroTexto(texto, root, cb, filtros);
            return cb.and(filtros.toArray(new Predicate[0]));
        };
        // Lo que vence antes, primero en lo que falta atender; lo resuelto más reciente, primero en lo ya resuelto.
        Sort orden = estado == EstadoTicket.RESPONDIDO
                ? Sort.by(Sort.Direction.DESC, "resueltoEn")
                : Sort.by(Sort.Direction.ASC, "fechaLimiteAtencion", "fechaCreacion");
        return repository.findAll(spec, PageRequest.of(Math.max(pagina, 0), TAMANO_PAGINA, orden));
    }

    @Transactional(readOnly = true)
    public Page<Ticket> buscarHistorial(String texto, Canal canal, LocalDate desde, LocalDate hasta, int pagina) {
        Specification<Ticket> spec = (root, query, cb) -> {
            List<Predicate> filtros = new ArrayList<>();
            filtros.add(cb.equal(root.get("estadoReclamo"), EstadoReclamo.ARCHIVADO));
            if (canal != null) {
                filtros.add(cb.equal(root.get("canal"), canal));
            }
            if (desde != null) {
                filtros.add(cb.greaterThanOrEqualTo(root.<LocalDateTime>get("fechaArchivado"), desde.atStartOfDay()));
            }
            if (hasta != null) {
                filtros.add(cb.lessThan(root.<LocalDateTime>get("fechaArchivado"), hasta.plusDays(1).atStartOfDay()));
            }
            agregarFiltroTexto(texto, root, cb, filtros);
            return cb.and(filtros.toArray(new Predicate[0]));
        };
        return repository.findAll(spec,
                PageRequest.of(Math.max(pagina, 0), TAMANO_PAGINA, Sort.by(Sort.Direction.DESC, "fechaArchivado")));
    }

    private static void agregarFiltroTexto(String texto, jakarta.persistence.criteria.Root<Ticket> root,
                                           jakarta.persistence.criteria.CriteriaBuilder cb, List<Predicate> filtros) {
        if (texto == null || texto.isBlank()) {
            return;
        }
        String patron = "%" + texto.trim().toLowerCase() + "%";
        filtros.add(cb.or(
                cb.like(cb.lower(root.<String>get("codigo")), patron),
                cb.like(cb.lower(root.get("contribuyente").<String>get("nombreCompleto")), patron),
                cb.like(cb.lower(root.get("contribuyente").<String>get("numeroDocumento")), patron),
                cb.like(cb.lower(root.<String>get("asunto")), patron)));
    }

    @Transactional(readOnly = true)
    public Ticket detalle(String id) {
        return repository.findConRespuestas(id)
                .orElseThrow(() -> new TicketNoEncontradoException(id));
    }

    /** Tickets por grupo de la bandeja. Siempre trae todas las claves del enum. */
    @Transactional(readOnly = true)
    public Map<EstadoTicket, Long> conteoPorEstado() {
        Map<EstadoTicket, Long> conteo = new EnumMap<>(EstadoTicket.class);
        for (EstadoTicket estado : EstadoTicket.values()) {
            conteo.put(estado, 0L);
        }
        for (Object[] fila : repository.contarPorEstadoReclamo()) {
            EstadoTicket grupo = ((EstadoReclamo) fila[0]).getGrupo();
            conteo.merge(grupo, ((Number) fila[1]).longValue(), Long::sum);
        }
        return conteo;
    }

    @Transactional(readOnly = true)
    public ResumenInicio resumenInicio(String usuario) {
        LocalDate hoy = LocalDate.now();
        List<EstadoReclamo> conPlazo = EstadoTicket.conPlazoCorriendo();
        return new ResumenInicio(
                conteoPorEstado(),
                repository.countByEstadoReclamoInAndFechaLimiteAtencionBefore(conPlazo, hoy),
                repository.countByEstadoReclamoInAndFechaLimiteAtencionBetween(conPlazo, hoy,
                        hoy.plusDays(Ticket.DIAS_ALERTA)),
                repository.countByEstadoReclamoInAndAsignadoUsername(EstadoTicket.EN_ATENCION.getEstadosReclamo(), usuario),
                repository.contarArchivadosDesde(hoy.atStartOfDay()),
                repository.findTop6ByEstadoReclamoInOrderByFechaLimiteAtencionAsc(EstadoTicket.PENDIENTE.getEstadosReclamo()),
                repository.findTop6ByEstadoReclamoInAndAsignadoUsernameOrderByFechaLimiteAtencionAsc(
                        EstadoTicket.EN_ATENCION.getEstadosReclamo(), usuario));
    }

    @Transactional(readOnly = true)
    public long respuestasEnviadasPor(String usuario) {
        return respuestaRepository.contarRespuestasEnviadasPor(usuario);
    }

    // ---------- Acciones ----------

    @Transactional
    public Ticket tomar(String id, Long version, String usuario, RequestInfo info) {
        Ticket ticket = cargarVerificandoVersion(id, version, usuario, info);
        ticket.tomar(admin(usuario), LocalDateTime.now());
        metadataService.registrar(TipoEvento.TICKET_TOMADO, usuario, info, ticket.getCodigo(), "reclamos", ticket.getId());
        return ticket;
    }

    @Transactional
    public Ticket liberar(String id, Long version, String usuario, RequestInfo info) {
        Ticket ticket = cargarVerificandoVersion(id, version, usuario, info);
        ticket.liberar(admin(usuario), LocalDateTime.now());
        metadataService.registrar(TipoEvento.TICKET_LIBERADO, usuario, info, ticket.getCodigo(), "reclamos", ticket.getId());
        return ticket;
    }

    /** Nota interna: el contribuyente no la ve y no se le envía correo. */
    @Transactional
    public Ticket agregarNota(String id, Long version, String usuario, String mensaje, RequestInfo info) {
        String texto = validarMensaje(mensaje, MAX_MENSAJE, "la nota");
        Ticket ticket = cargarVerificandoVersion(id, version, usuario, info);
        ticket.agregarNota(admin(usuario), texto, LocalDateTime.now());
        metadataService.registrar(TipoEvento.TICKET_NOTA, usuario, info, ticket.getCodigo(), "reclamos", ticket.getId());
        return ticket;
    }

    /** Pide información al contribuyente: queda OBSERVADO y se le avisa por correo. */
    @Transactional
    public Ticket observar(String id, Long version, String usuario, String mensaje, LocalDate plazoHasta,
                           RequestInfo info) {
        String texto = validarMensaje(mensaje, MAX_OBSERVACION, "lo que pides al contribuyente");
        LocalDate plazo = plazoHasta != null ? plazoHasta : LocalDate.now().plusDays(DIAS_SUBSANACION);
        if (plazo.isBefore(LocalDate.now())) {
            throw new IllegalStateException("La fecha para completar la información no puede ser anterior a hoy.");
        }
        Ticket ticket = cargarVerificandoVersion(id, version, usuario, info);
        AdminUser autor = admin(usuario);
        TicketRespuesta seguimiento = ticket.observar(autor, texto, plazo, LocalDateTime.now());
        metadataService.registrar(TipoEvento.TICKET_OBSERVADO, usuario, info, ticket.getCodigo(), "reclamos", ticket.getId());
        avisarAlContribuyente(ticket, seguimiento, autor);
        return ticket;
    }

    /** Responde y cierra el reclamo con una resolución; se le avisa al contribuyente por correo. */
    @Transactional
    public Ticket resolver(String id, Long version, String usuario, EstadoReclamo resolucion, String mensaje,
                           RequestInfo info) {
        String texto = validarMensaje(mensaje, MAX_MENSAJE, "la respuesta");
        if (resolucion == null || !resolucion.esResolucion()) {
            throw new IllegalStateException("Elige cómo se resuelve el reclamo: fundado, fundado en parte, infundado o improcedente.");
        }
        Ticket ticket = cargarVerificandoVersion(id, version, usuario, info);
        AdminUser autor = admin(usuario);
        LocalDateTime ahora = LocalDateTime.now();
        TicketRespuesta seguimiento = ticket.resolver(autor, resolucion, texto,
                numeracionResoluciones.siguiente(ahora), ahora);
        metadataService.registrar(TipoEvento.TICKET_RESUELTO, usuario, info,
                ticket.getCodigo() + " (" + resolucion.getEtiqueta() + ")", "reclamos", ticket.getId());
        avisarAlContribuyente(ticket, seguimiento, autor);
        return ticket;
    }

    @Transactional
    public Ticket archivar(String id, Long version, String usuario, RequestInfo info) {
        Ticket ticket = cargarVerificandoVersion(id, version, usuario, info);
        ticket.archivar(admin(usuario), LocalDateTime.now());
        metadataService.registrar(TipoEvento.TICKET_ARCHIVADO, usuario, info, ticket.getCodigo(), "reclamos", ticket.getId());
        return ticket;
    }

    /**
     * Guarda el seguimiento ya (para conocer su id) y deja el aviso listo; el correo sale recién cuando
     * se confirma la transacción.
     */
    private void avisarAlContribuyente(Ticket ticket, TicketRespuesta seguimiento, AdminUser autor) {
        respuestaRepository.save(seguimiento);
        notificacionService.programarRespuesta(new DatosRespuesta(ticket.getId(), ticket.getCodigo(),
                ticket.getAsunto(), ticket.getClienteNombre(), ticket.getClienteEmail(), seguimiento.getId(),
                seguimiento.getMensaje(), autor));
    }

    private static String validarMensaje(String mensaje, int maximo, String queEs) {
        if (mensaje == null || mensaje.isBlank()) {
            throw new IllegalStateException("Escribe " + queEs + " antes de enviarlo.");
        }
        String texto = mensaje.trim();
        if (texto.length() > maximo) {
            throw new IllegalStateException("Escribe " + queEs + " en menos de " + maximo
                    + " caracteres (ahora tiene " + texto.length() + ").");
        }
        return texto;
    }

    private AdminUser admin(String usuario) {
        return adminRepository.findByUsername(usuario)
                .orElseThrow(() -> new IllegalStateException("Tu usuario ya no existe en el sistema. Vuelve a iniciar sesión."));
    }

    private Ticket cargarVerificandoVersion(String id, Long version, String usuario, RequestInfo info) {
        Ticket ticket = repository.findById(id).orElseThrow(() -> new TicketNoEncontradoException(id));
        if (version != null && !version.equals(ticket.getVersion())) {
            metadataService.registrar(TipoEvento.CONFLICTO_VERSION, usuario, info, ticket.getCodigo(), "reclamos", ticket.getId());
            throw new ConflictoVersionException(ticket.getCodigo());
        }
        return ticket;
    }

    public record ResumenInicio(Map<EstadoTicket, Long> conteo,
                                long vencidos,
                                long enAlerta,
                                long misPorContestar,
                                long archivadosHoy,
                                List<Ticket> pendientesAntiguos,
                                List<Ticket> misTickets) {

        /** Tickets que siguen en la bandeja: todo menos los archivados. */
        public long getTotalActivos() {
            long total = 0;
            for (EstadoTicket estado : EstadoTicket.bandeja()) {
                total += conteo.get(estado);
            }
            return total;
        }

        /** Porcentaje del estado sobre el total activo, para la franja de distribución del inicio. */
        public int porcentaje(EstadoTicket estado) {
            long total = getTotalActivos();
            return total == 0 ? 0 : (int) Math.round(conteo.get(estado) * 100.0 / total);
        }
    }
}
