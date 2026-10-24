package com.empresa.quejas.tickets;

import jakarta.persistence.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Queja registrada por un cliente.
 *
 * En la BD compartida esta tabla también la usan la app móvil y reportes:
 * cuando se conecte a la BD real, ajusta @Table y @Column a los nombres existentes.
 */
@Entity
@Table(name = "tickets", indexes = {
        @Index(name = "ix_ticket_estado_fecha", columnList = "estado, fecha_creacion")
})
public class Ticket {

    /** Horas a partir de las cuales un ticket abierto se considera atrasado. */
    public static final int HORAS_ALERTA = 24;
    public static final int HORAS_VENCIDO = 72;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String codigo;

    @Column(name = "cliente_nombre", nullable = false, length = 120)
    private String clienteNombre;

    @Column(name = "cliente_documento", length = 20)
    private String clienteDocumento;

    @Column(name = "cliente_email", length = 120)
    private String clienteEmail;

    @Column(name = "cliente_telefono", length = 20)
    private String clienteTelefono;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Canal canal;

    @Column(nullable = false, length = 60)
    private String categoria;

    @Column(nullable = false, length = 150)
    private String asunto;

    @Column(nullable = false, length = 4000)
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Prioridad prioridad;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoTicket estado = EstadoTicket.PENDIENTE;

    @Column(name = "asignado_a", length = 60)
    private String asignadoA;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @Column(name = "fecha_primera_respuesta")
    private LocalDateTime fechaPrimeraRespuesta;

    @Column(name = "fecha_archivado")
    private LocalDateTime fechaArchivado;

    /**
     * Bloqueo optimista: si la app móvil u otro sistema modificó el ticket mientras el admin lo
     * tenía abierto, el cambio del admin se rechaza en lugar de pisar los datos.
     */
    @Version
    private Long version;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("fecha ASC")
    private List<TicketRespuesta> respuestas = new ArrayList<>();

    protected Ticket() {
    }

    public Ticket(String codigo, String clienteNombre, String clienteDocumento, String clienteEmail,
                  String clienteTelefono, Canal canal, String categoria, String asunto, String descripcion,
                  Prioridad prioridad, LocalDateTime fechaCreacion) {
        this.codigo = codigo;
        this.clienteNombre = clienteNombre;
        this.clienteDocumento = clienteDocumento;
        this.clienteEmail = clienteEmail;
        this.clienteTelefono = clienteTelefono;
        this.canal = canal;
        this.categoria = categoria;
        this.asunto = asunto;
        this.descripcion = descripcion;
        this.prioridad = prioridad;
        this.fechaCreacion = fechaCreacion;
        this.fechaActualizacion = fechaCreacion;
    }

    // ---------- Reglas de negocio ----------

    public void tomar(String usuario, LocalDateTime cuando) {
        exigirEstado(EstadoTicket.PENDIENTE, "Solo se pueden tomar tickets pendientes.");
        this.estado = EstadoTicket.EN_ATENCION;
        this.asignadoA = usuario;
        this.fechaActualizacion = cuando;
    }

    public void liberar(LocalDateTime cuando) {
        exigirEstado(EstadoTicket.EN_ATENCION, "Solo se pueden liberar tickets en atención.");
        this.estado = EstadoTicket.PENDIENTE;
        this.asignadoA = null;
        this.fechaActualizacion = cuando;
    }

    public TicketRespuesta responder(String usuario, String mensaje, boolean notaInterna, LocalDateTime cuando) {
        if (estado != EstadoTicket.EN_ATENCION && estado != EstadoTicket.RESPONDIDO) {
            throw new IllegalStateException("Toma el ticket antes de responderlo.");
        }
        TicketRespuesta respuesta = new TicketRespuesta(this, usuario, mensaje, notaInterna, cuando);
        respuestas.add(respuesta);
        if (!notaInterna) {
            this.estado = EstadoTicket.RESPONDIDO;
            if (fechaPrimeraRespuesta == null) {
                fechaPrimeraRespuesta = cuando;
            }
        }
        this.fechaActualizacion = cuando;
        return respuesta;
    }

    public void archivar(LocalDateTime cuando) {
        exigirEstado(EstadoTicket.RESPONDIDO, "Solo se pueden archivar tickets respondidos.");
        this.estado = EstadoTicket.ARCHIVADO;
        this.fechaArchivado = cuando;
        this.fechaActualizacion = cuando;
    }

    private void exigirEstado(EstadoTicket esperado, String mensaje) {
        if (this.estado != esperado) {
            throw new IllegalStateException(mensaje);
        }
    }

    // ---------- Datos calculados para las vistas ----------

    public long getHorasAbierto() {
        LocalDateTime fin = fechaPrimeraRespuesta != null ? fechaPrimeraRespuesta : LocalDateTime.now();
        return Duration.between(fechaCreacion, fin).toHours();
    }

    /** reciente / alerta / vencido según el tiempo sin respuesta. */
    public String getNivelAntiguedad() {
        if (fechaPrimeraRespuesta != null) {
            return "atendido";
        }
        long horas = getHorasAbierto();
        if (horas >= HORAS_VENCIDO) return "vencido";
        if (horas >= HORAS_ALERTA) return "alerta";
        return "reciente";
    }

    /** Proporción (0–100) usada para la barra de antigüedad; se llena al llegar al límite de vencido. */
    public int getPorcentajeAntiguedad() {
        long horas = getHorasAbierto();
        return (int) Math.min(100, Math.max(4, horas * 100 / HORAS_VENCIDO));
    }

    public String getAntiguedadTexto() {
        return formatearHoras(Duration.between(fechaCreacion, LocalDateTime.now()).toHours());
    }

    public String getTiempoRespuestaTexto() {
        if (fechaPrimeraRespuesta == null) return "Sin respuesta";
        return formatearHoras(Duration.between(fechaCreacion, fechaPrimeraRespuesta).toHours());
    }

    private static String formatearHoras(long horas) {
        if (horas < 1) return "menos de 1 h";
        if (horas < 48) return horas + " h";
        return (horas / 24) + " días";
    }

    // ---------- Getters ----------

    public Long getId() { return id; }
    public String getCodigo() { return codigo; }
    public String getClienteNombre() { return clienteNombre; }
    public String getClienteDocumento() { return clienteDocumento; }
    public String getClienteEmail() { return clienteEmail; }
    public String getClienteTelefono() { return clienteTelefono; }
    public Canal getCanal() { return canal; }
    public String getCategoria() { return categoria; }
    public String getAsunto() { return asunto; }
    public String getDescripcion() { return descripcion; }
    public Prioridad getPrioridad() { return prioridad; }
    public EstadoTicket getEstado() { return estado; }
    public String getAsignadoA() { return asignadoA; }
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public LocalDateTime getFechaPrimeraRespuesta() { return fechaPrimeraRespuesta; }
    public LocalDateTime getFechaArchivado() { return fechaArchivado; }
    public Long getVersion() { return version; }
    public List<TicketRespuesta> getRespuestas() { return respuestas; }
}
