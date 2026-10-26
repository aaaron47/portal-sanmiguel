package com.empresa.quejas.tickets;

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

    private final TicketRepository repository;
    private final TicketRespuestaRepository respuestaRepository;
    private final MetadataService metadataService;
    private final NotificacionService notificacionService;

    public TicketService(TicketRepository repository, TicketRespuestaRepository respuestaRepository,
                         MetadataService metadataService, NotificacionService notificacionService) {
        this.repository = repository;
        this.respuestaRepository = respuestaRepository;
        this.metadataService = metadataService;
        this.notificacionService = notificacionService;
    }

    // ---------- Consultas ----------

    @Transactional(readOnly = true)
    public Page<Ticket> buscarBandeja(EstadoTicket estado, String texto, Prioridad prioridad,
                                      boolean soloMios, String usuario, int pagina) {
        Specification<Ticket> spec = (root, query, cb) -> {
            List<Predicate> filtros = new ArrayList<>();
            filtros.add(cb.equal(root.get("estado"), estado));
            if (prioridad != null) {
                filtros.add(cb.equal(root.get("prioridad"), prioridad));
            }
            if (soloMios) {
                filtros.add(cb.equal(root.get("asignadoA"), usuario));
            }
            agregarFiltroTexto(texto, root, cb, filtros);
            return cb.and(filtros.toArray(new Predicate[0]));
        };
        // Lo más antiguo primero en lo que falta atender; lo más reciente primero en lo ya respondido.
        Sort orden = estado == EstadoTicket.RESPONDIDO
                ? Sort.by(Sort.Direction.DESC, "fechaActualizacion")
                : Sort.by(Sort.Direction.ASC, "fechaCreacion");
        return repository.findAll(spec, PageRequest.of(Math.max(pagina, 0), TAMANO_PAGINA, orden));
    }

    @Transactional(readOnly = true)
    public Page<Ticket> buscarHistorial(String texto, Canal canal, LocalDate desde, LocalDate hasta, int pagina) {
        Specification<Ticket> spec = (root, query, cb) -> {
            List<Predicate> filtros = new ArrayList<>();
            filtros.add(cb.equal(root.get("estado"), EstadoTicket.ARCHIVADO));
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
                cb.like(cb.lower(root.<String>get("clienteNombre")), patron),
                cb.like(cb.lower(root.<String>get("clienteDocumento")), patron),
                cb.like(cb.lower(root.<String>get("asunto")), patron)));
    }

    @Transactional(readOnly = true)
    public Ticket detalle(Long id) {
        return repository.findConRespuestas(id)
                .orElseThrow(() -> new TicketNoEncontradoException(id));
    }

    @Transactional(readOnly = true)
    public Map<EstadoTicket, Long> conteoPorEstado() {
        Map<EstadoTicket, Long> conteo = new EnumMap<>(EstadoTicket.class);
        for (EstadoTicket estado : EstadoTicket.values()) {
            conteo.put(estado, repository.countByEstado(estado));
        }
        return conteo;
    }

    @Transactional(readOnly = true)
    public ResumenInicio resumenInicio(String usuario) {
        LocalDateTime hace24h = LocalDateTime.now().minusHours(Ticket.HORAS_ALERTA);
        LocalDateTime hace72h = LocalDateTime.now().minusHours(Ticket.HORAS_VENCIDO);
        List<EstadoTicket> abiertos = List.of(EstadoTicket.PENDIENTE, EstadoTicket.EN_ATENCION);
        return new ResumenInicio(
                conteoPorEstado(),
                repository.countByEstadoInAndFechaCreacionBefore(abiertos, hace72h),
                repository.countByEstadoInAndFechaCreacionBefore(abiertos, hace24h),
                repository.countByEstadoAndAsignadoA(EstadoTicket.EN_ATENCION, usuario),
                repository.countByEstadoAndFechaArchivadoAfter(EstadoTicket.ARCHIVADO, LocalDate.now().atStartOfDay()),
                repository.findTop6ByEstadoOrderByFechaCreacionAsc(EstadoTicket.PENDIENTE),
                repository.findTop6ByEstadoAndAsignadoAOrderByFechaCreacionAsc(EstadoTicket.EN_ATENCION, usuario));
    }

    @Transactional(readOnly = true)
    public long respuestasEnviadasPor(String usuario) {
        return respuestaRepository.countByAutorAndNotaInternaFalse(usuario);
    }

    // ---------- Acciones ----------

    @Transactional
    public Ticket tomar(Long id, Long version, String usuario, RequestInfo info) {
        Ticket ticket = cargarVerificandoVersion(id, version, usuario, info);
        ticket.tomar(usuario, LocalDateTime.now());
        metadataService.registrar(TipoEvento.TICKET_TOMADO, usuario, info, ticket.getCodigo());
        return ticket;
    }

    @Transactional
    public Ticket liberar(Long id, Long version, String usuario, RequestInfo info) {
        Ticket ticket = cargarVerificandoVersion(id, version, usuario, info);
        ticket.liberar(LocalDateTime.now());
        metadataService.registrar(TipoEvento.TICKET_LIBERADO, usuario, info, ticket.getCodigo());
        return ticket;
    }

    @Transactional
    public Ticket responder(Long id, Long version, String usuario, String mensaje, boolean notaInterna,
                            RequestInfo info) {
        if (mensaje == null || mensaje.isBlank()) {
            throw new IllegalStateException("Escribe un mensaje antes de enviarlo.");
        }
        Ticket ticket = cargarVerificandoVersion(id, version, usuario, info);
        TicketRespuesta respuesta = ticket.responder(usuario, mensaje.trim(), notaInterna, LocalDateTime.now());
        metadataService.registrar(TipoEvento.TICKET_RESPONDIDO, usuario, info,
                ticket.getCodigo() + (notaInterna ? " (nota interna)" : " (respuesta al cliente)"));
        if (!notaInterna) {
            // Se guarda ya para conocer su id; el correo sale recién cuando se confirma la transacción.
            respuestaRepository.save(respuesta);
            notificacionService.programarRespuesta(new DatosRespuesta(ticket.getId(), ticket.getCodigo(),
                    ticket.getAsunto(), ticket.getClienteNombre(), ticket.getClienteEmail(), respuesta.getId(),
                    respuesta.getMensaje(), usuario));
        }
        return ticket;
    }

    @Transactional
    public Ticket archivar(Long id, Long version, String usuario, RequestInfo info) {
        Ticket ticket = cargarVerificandoVersion(id, version, usuario, info);
        ticket.archivar(LocalDateTime.now());
        metadataService.registrar(TipoEvento.TICKET_ARCHIVADO, usuario, info, ticket.getCodigo());
        return ticket;
    }

    private Ticket cargarVerificandoVersion(Long id, Long version, String usuario, RequestInfo info) {
        Ticket ticket = repository.findById(id).orElseThrow(() -> new TicketNoEncontradoException(id));
        if (version != null && !version.equals(ticket.getVersion())) {
            metadataService.registrar(TipoEvento.CONFLICTO_VERSION, usuario, info, ticket.getCodigo());
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

        public long getTotalActivos() {
            return conteo.get(EstadoTicket.PENDIENTE) + conteo.get(EstadoTicket.EN_ATENCION)
                    + conteo.get(EstadoTicket.RESPONDIDO);
        }

        /** Porcentaje del estado sobre el total activo, para la franja de distribución del inicio. */
        public int porcentaje(EstadoTicket estado) {
            long total = getTotalActivos();
            return total == 0 ? 0 : (int) Math.round(conteo.get(estado) * 100.0 / total);
        }
    }
}
