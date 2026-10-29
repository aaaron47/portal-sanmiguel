package com.empresa.quejas.notificaciones;

import com.empresa.quejas.auth.AdminUser;
import com.empresa.quejas.metadata.RequestInfo;
import com.empresa.quejas.tickets.Ticket;
import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

/**
 * Aviso al contribuyente de una respuesta a su reclamo: tabla portal_notificaciones, propia del portal.
 *
 * Se guarda en la misma transacción que la respuesta: si la respuesta no se guarda, tampoco queda
 * el aviso. El envío ocurre después, y su resultado (enviado o fallido) queda registrado aquí.
 */
@Entity
@Table(name = "portal_notificaciones")
public class Notificacion {

    @Id
    @UuidGenerator
    @Column(length = 36)
    private String id;

    @Column(name = "reclamo_id", nullable = false, length = 36, updatable = false)
    private String reclamoId;

    /** El reclamo, solo para leer su número y asunto al armar el correo. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reclamo_id", insertable = false, updatable = false)
    private Ticket reclamo;

    /** Una respuesta genera un solo aviso; los reenvíos reutilizan esta misma fila. */
    @Column(name = "seguimiento_id", nullable = false, unique = true, length = 36, updatable = false)
    private String seguimientoId;

    /** Correo del contribuyente al momento del envío. */
    @Column(nullable = false, length = 254)
    private String destinatario;

    /** Copia de lo enviado: permite reenviar y deja constancia de qué recibió el contribuyente. */
    @Column(nullable = false, length = 4000, updatable = false)
    private String mensaje;

    /** Admin que escribió la respuesta. */
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "autor_admin_id", nullable = false, updatable = false)
    private AdminUser autor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private EstadoNotificacion estado;

    @Column(nullable = false)
    private int intentos;

    @Column(name = "ultimo_error", length = 500)
    private String ultimoError;

    /** Identificador del correo enviado; los siguientes correos del reclamo lo citan para quedar en el mismo hilo. */
    @Column(name = "message_id", length = 250)
    private String messageId;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "enviado_en")
    private LocalDateTime fechaEnvio;

    /** Lo mantiene un trigger de la BD. */
    @Column(name = "actualizado_en", nullable = false, updatable = false)
    private LocalDateTime actualizadoEn;

    /** Evita que dos admins reenvíen el mismo correo a la vez; un trigger suma 1 en cada UPDATE. */
    @Version
    private Long version;

    protected Notificacion() {
    }

    /** El contribuyente debe tener correo: quien llama lo verifica antes. */
    public Notificacion(DatosRespuesta datos, LocalDateTime cuando) {
        this.reclamoId = datos.ticketId();
        this.seguimientoId = datos.seguimientoId();
        this.destinatario = datos.clienteEmail().trim();
        this.mensaje = datos.mensaje();
        this.autor = datos.autor();
        this.estado = EstadoNotificacion.PENDIENTE;
        this.fechaCreacion = cuando;
        this.actualizadoEn = cuando;
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

    // ---------- Datos del reclamo para armar el correo ----------

    public String getTicketId() { return reclamoId; }
    public String getTicketCodigo() { return reclamo != null ? reclamo.getCodigo() : null; }
    public String getTicketAsunto() { return reclamo != null ? reclamo.getAsunto() : null; }
    public String getClienteNombre() { return reclamo != null ? reclamo.getClienteNombre() : null; }

    // ---------- Getters ----------

    public String getId() { return id; }
    public String getSeguimientoId() { return seguimientoId; }
    public String getDestinatario() { return destinatario; }
    public String getMensaje() { return mensaje; }
    public AdminUser getAutor() { return autor; }
    public EstadoNotificacion getEstado() { return estado; }
    public int getIntentos() { return intentos; }
    public String getUltimoError() { return ultimoError; }
    public String getMessageId() { return messageId; }
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public LocalDateTime getFechaEnvio() { return fechaEnvio; }
    public Long getVersion() { return version; }
}
