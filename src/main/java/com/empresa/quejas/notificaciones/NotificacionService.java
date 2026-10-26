package com.empresa.quejas.notificaciones;

import com.empresa.quejas.metadata.MetadataService;
import com.empresa.quejas.metadata.RequestInfo;
import com.empresa.quejas.metadata.TipoEvento;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.mail.MailException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class NotificacionService {

    private static final Logger log = LoggerFactory.getLogger(NotificacionService.class);

    private final NotificacionRepository repository;
    private final EnvioCorreo envioCorreo;
    private final MetadataService metadataService;
    private final ApplicationEventPublisher eventos;

    public NotificacionService(NotificacionRepository repository, EnvioCorreo envioCorreo,
                               MetadataService metadataService, ApplicationEventPublisher eventos) {
        this.repository = repository;
        this.envioCorreo = envioCorreo;
        this.metadataService = metadataService;
        this.eventos = eventos;
    }

    /**
     * Registra el aviso dentro de la transacción de la respuesta. El correo sale recién cuando esa
     * transacción se confirma (ver {@link EnvioEnSegundoPlano}); si se revierte, no se envía nada.
     */
    @Transactional
    public Notificacion programarRespuesta(DatosRespuesta datos) {
        Notificacion notificacion = repository.save(new Notificacion(datos, LocalDateTime.now()));
        if (notificacion.getEstado() == EstadoNotificacion.SIN_CORREO) {
            metadataService.registrar(TipoEvento.CORREO_FALLIDO, datos.autor(), null,
                    datos.ticketCodigo() + ": el cliente no tiene correo registrado");
        } else {
            eventos.publishEvent(new NotificacionProgramada(notificacion.getId()));
        }
        return notificacion;
    }

    /**
     * Sin transacción a propósito: no se retiene una conexión a la BD compartida mientras se espera
     * al servidor de correo. Cada lectura y guardado usa su propia transacción corta.
     */
    public void enviar(Long id) {
        repository.findById(id)
                .filter(n -> n.getEstado() == EstadoNotificacion.PENDIENTE)
                .ifPresent(this::intentarEnvio);
    }

    /** Reintento manual desde el detalle del ticket, cuando el envío automático falló. */
    public boolean reenviar(Long ticketId, Long id, String usuario, RequestInfo info) {
        Notificacion notificacion = buscar(ticketId, id)
                .orElseThrow(() -> new IllegalStateException(
                        "No encontramos ese correo. Actualiza la página e inténtalo de nuevo."));
        notificacion.prepararReenvio();
        notificacion = repository.save(notificacion);
        metadataService.registrar(TipoEvento.CORREO_REENVIADO, usuario, info, notificacion.getTicketCodigo());
        return intentarEnvio(notificacion);
    }

    public Optional<Notificacion> buscar(Long ticketId, Long id) {
        return repository.findById(id).filter(n -> n.getTicketId().equals(ticketId));
    }

    /** Avisos del ticket por id de respuesta, para mostrar el estado del correo bajo cada mensaje. */
    public Map<Long, Notificacion> porRespuesta(Long ticketId) {
        return repository.findByTicketId(ticketId).stream()
                .collect(Collectors.toMap(Notificacion::getRespuestaId, Function.identity()));
    }

    private boolean intentarEnvio(Notificacion notificacion) {
        List<String> anteriores = repository
                .findByTicketIdAndEstadoAndIdNotOrderByFechaEnvioAsc(notificacion.getTicketId(),
                        EstadoNotificacion.ENVIADO, notificacion.getId())
                .stream().map(Notificacion::getMessageId).toList();
        try {
            String messageId = envioCorreo.enviar(notificacion, anteriores);
            notificacion.marcarEnviado(messageId, LocalDateTime.now());
            repository.save(notificacion);
            metadataService.registrar(TipoEvento.CORREO_ENVIADO, notificacion.getAutor(), null,
                    notificacion.getTicketCodigo());
            return true;
        } catch (MailException e) {
            log.warn("No se pudo enviar el correo del ticket {}: {}", notificacion.getTicketCodigo(), e.getMessage());
            notificacion.marcarFallido(e.getMessage(), LocalDateTime.now());
            repository.save(notificacion);
            metadataService.registrar(TipoEvento.CORREO_FALLIDO, notificacion.getAutor(), null,
                    notificacion.getTicketCodigo() + ": " + e.getMessage());
            return false;
        }
    }
}
