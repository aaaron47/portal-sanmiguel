package com.empresa.quejas.tickets;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_respuestas")
public class TicketRespuesta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id")
    private Ticket ticket;

    @Column(nullable = false, length = 60)
    private String autor;

    @Column(nullable = false, length = 4000)
    private String mensaje;

    /** Las notas internas solo las ven los admins; no se envían al cliente. */
    @Column(name = "nota_interna", nullable = false)
    private boolean notaInterna;

    @Column(nullable = false)
    private LocalDateTime fecha;

    protected TicketRespuesta() {
    }

    TicketRespuesta(Ticket ticket, String autor, String mensaje, boolean notaInterna, LocalDateTime fecha) {
        this.ticket = ticket;
        this.autor = autor;
        this.mensaje = mensaje;
        this.notaInterna = notaInterna;
        this.fecha = fecha;
    }

    public Long getId() { return id; }
    public Ticket getTicket() { return ticket; }
    public String getAutor() { return autor; }
    public String getMensaje() { return mensaje; }
    public boolean isNotaInterna() { return notaInterna; }
    public LocalDateTime getFecha() { return fecha; }
}
