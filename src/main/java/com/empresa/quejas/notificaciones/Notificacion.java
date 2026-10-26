package com.empresa.quejas.notificaciones;

import com.empresa.quejas.metadata.RequestInfo;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Aviso al cliente de una respuesta a su ticket. Tabla propia de este módulo.
 *
 * Se guarda en la misma transacción que la respuesta: si la respuesta no se guarda, tampoco queda
 * el aviso. El envío ocurre después, y su resultado (enviado o fallido) queda registrado aquí.
 */
@Entity
@Table(name = "portal_notificaciones", indexes = {
        @Index(name = "ix_notificacion_ticket", columnList = "ticket_id, fecha_creacion")
})
public class Notificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_id", nullable = false)
    private Long ticketId;

    /** Una respuesta genera un solo aviso; los reenvíos reutilizan esta misma fila. */
    @Column(name = "respuesta_id", nullable = false, unique = true)
    private Long respuestaId;

    // Copia de lo enviado: permite reenviar y deja constancia de qué recibió el cliente.
    @Column(name = "ticket_codigo", nullable = false, length = 20)
    private String ticketCodigo;

    @Column(name = "ticket_asunto", nullable = false, length = 150)
    private String ticketAsunto;

    @Column(name = "cliente_nombre", nullable = false, length = 120)
    private String clienteNombre;

    @Column(length = 120)
    private String destinatario;

    @Column(nullable = false, length = 4000)
    private String mensaje;

    /** Admin que escribió la respuesta. */
    @Column(nullable = false, length = 60)
    private String autor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private EstadoNotificacion estado;

    @Column(nullable = false)
    private int intentos;

    @Column(name = "ultimo_error", length = 500)
    private String ultimoError;

    /** Identificador del correo enviado; los siguientes correos del ticket lo citan para quedar en el mismo hilo. */
    @Column(name = "message_id", length = 250)
    private String messageId;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_envio")
    private LocalDateTime fechaEnvio;

    /** Evita que dos admins reenvíen el mismo correo a la vez. */
    @Version
    private Long version;

    protected Notificacion() {
    }

    public Notificacion(DatosRespuesta datos, LocalDateTime cuando) {
        this.ticketId = datos.ticketId();
        this.respuestaId = datos.respuestaId();
        this.ticketCodigo = datos.ticketCodigo();
        this.ticketAsunto = datos.ticketAsunto();
        this.clienteNombre = datos.clienteNombre();
        this.destinatario = datos.clienteEmail() == null || datos.clienteEmail().isBlank()
                ? null : datos.clienteEmail().trim();
        this.mensaje = datos.mensaje();
        this.autor = datos.autor();
        this.estado = destinatario == null ? EstadoNotificacion.SIN_CORREO : EstadoNotificacion.PENDIENTE;
        this.fechaCreacion = cuando;
    }

    // ---------- Reglas ----------

    public void marcarEnviado(String messageId, LocalDateTime cuando) {
        this.intentos++;
        this.estado = EstadoNotificacion.ENVIADO;
        this.messageId = messageId;
        this.fechaEnvio = cuando;
        this.ultimoError = null;
    }

    public void marcarFallido(String error, LocalDateTime cuando) {
        this.intentos++;
        this.estado = EstadoNotificacion.FALLIDO;
        this.ultimoError = RequestInfo.recortar(error, 500);
        this.fechaEnvio = null;
    }

    public void prepararReenvio() {
        if (estado != EstadoNotificacion.FALLIDO) {
            throw new IllegalStateException("Este correo ya no está pendiente de reenvío. Actualiza la página para ver su estado.");
        }
        this.estado = EstadoNotificacion.PENDIENTE;
    }

    // ---------- Getters ----------

    public Long getId() { return id; }
    public Long getTicketId() { return ticketId; }
    public Long getRespuestaId() { return respuestaId; }
    public String getTicketCodigo() { return ticketCodigo; }
    public String getTicketAsunto() { return ticketAsunto; }
    public String getClienteNombre() { return clienteNombre; }
    public String getDestinatario() { return destinatario; }
    public String getMensaje() { return mensaje; }
    public String getAutor() { return autor; }
    public EstadoNotificacion getEstado() { return estado; }
    public int getIntentos() { return intentos; }
    public String getUltimoError() { return ultimoError; }
    public String getMessageId() { return messageId; }
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public LocalDateTime getFechaEnvio() { return fechaEnvio; }
    public Long getVersion() { return version; }
}
