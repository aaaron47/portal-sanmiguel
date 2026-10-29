package com.empresa.quejas.tickets;

import com.empresa.quejas.auth.AdminUser;
import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

/**
 * Una línea de la conversación de un ticket: tabla reclamo_seguimientos.
 *
 * Cada cambio de estado o respuesta deja una fila. Si {@code visibleContribuyente} es falso es una nota
 * interna: el contribuyente no la ve. Las filas sin comentario (cambios de estado sin texto) no se muestran
 * en la conversación. La tabla solo admite INSERT: nunca se modifica ni se borra una fila.
 */
@Entity
@Table(name = "reclamo_seguimientos")
public class TicketRespuesta {

    @Id
    @UuidGenerator
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reclamo_id", nullable = false, updatable = false)
    private Ticket ticket;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_anterior", length = 20, updatable = false)
    private EstadoReclamo estadoAnterior;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_nuevo", nullable = false, length = 20, updatable = false)
    private EstadoReclamo estadoNuevo;

    @Column(length = 2000, updatable = false)
    private String comentario;

    @Column(name = "visible_contribuyente", nullable = false, updatable = false)
    private boolean visibleContribuyente;

    /** Quien lo escribió. Es nulo cuando lo escribió el contribuyente desde la app (usuario_id). */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "administrador_id", updatable = false)
    private AdminUser administrador;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime fecha;

    protected TicketRespuesta() {
    }

    TicketRespuesta(Ticket ticket, AdminUser administrador, EstadoReclamo estadoAnterior, EstadoReclamo estadoNuevo,
                    String comentario, boolean visibleContribuyente, LocalDateTime fecha) {
        this.ticket = ticket;
        this.administrador = administrador;
        this.estadoAnterior = estadoAnterior;
        this.estadoNuevo = estadoNuevo;
        this.comentario = comentario;
        this.visibleContribuyente = visibleContribuyente;
        this.fecha = fecha;
    }

    /** Autor para mostrar en la conversación. */
    public String getAutor() {
        return administrador != null ? administrador.getNombreCompleto() : "Contribuyente";
    }

    public boolean isDeAdmin() { return administrador != null; }

    public boolean isNotaInterna() { return !visibleContribuyente; }

    public String getMensaje() { return comentario; }

    public String getId() { return id; }
    public Ticket getTicket() { return ticket; }
    public EstadoReclamo getEstadoAnterior() { return estadoAnterior; }
    public EstadoReclamo getEstadoNuevo() { return estadoNuevo; }
    public boolean isVisibleContribuyente() { return visibleContribuyente; }
    public AdminUser getAdministrador() { return administrador; }
    public LocalDateTime getFecha() { return fecha; }
}
