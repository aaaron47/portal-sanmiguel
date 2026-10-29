package com.empresa.quejas.tickets;

import com.empresa.quejas.auth.AdminUser;
import jakarta.persistence.*;
import org.hibernate.annotations.Formula;
import org.hibernate.annotations.UuidGenerator;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * Reclamo (queja) de un contribuyente: tabla reclamos de SANMI_APP, que también usa la app móvil.
 *
 * La cuenta del portal solo puede actualizar once columnas (estado, prioridad, asignado_a, observación,
 * plazo de subsanación, respuesta, número de resolución, resuelto_por, resuelto_en, version y
 * fecha_primera_respuesta). El resto va con updatable = false: Hibernate nunca lo incluye en un UPDATE.
 * El portal no inserta reclamos: los registran la app móvil o el personal de ventanilla.
 */
@Entity
@Table(name = "reclamos")
public class Ticket {

    /** Días antes de la fecha límite desde los que un reclamo abierto se marca en alerta. */
    public static final int DIAS_ALERTA = 3;

    @Id
    @UuidGenerator
    @Column(length = 36)
    private String id;

    /** Número visible, por ejemplo REC-2026-001001. */
    @Column(name = "numero", nullable = false, unique = true, length = 30, updatable = false)
    private String codigo;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "contribuyente_id", nullable = false, updatable = false)
    private Contribuyente contribuyente;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "tipo_reclamo_id", nullable = false, updatable = false)
    private TipoReclamo tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12, updatable = false)
    private Canal canal;

    @Column(nullable = false, length = 150, updatable = false)
    private String asunto;

    @Column(nullable = false, length = 4000, updatable = false)
    private String descripcion;

    /** Lo que el contribuyente pide que se haga. */
    @Column(nullable = false, length = 1000, updatable = false)
    private String pedido;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 5)
    private Prioridad prioridad;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoReclamo estadoReclamo = EstadoReclamo.REGISTRADO;

    /** Plazo de atención: fecha de registro más los días hábiles del tipo de reclamo. */
    @Column(name = "fecha_limite_atencion", nullable = false, updatable = false)
    private LocalDate fechaLimiteAtencion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "asignado_a")
    private AdminUser asignado;

    /** Qué se le pidió al contribuyente; obligatoria en estado OBSERVADO. */
    @Column(length = 1000)
    private String observacion;

    @Column(name = "plazo_subsanacion_hasta")
    private LocalDate plazoSubsanacionHasta;

    /** Respuesta final; obligatoria en los estados finales. */
    @Column(length = 4000)
    private String respuesta;

    @Column(name = "numero_resolucion", length = 40)
    private String numeroResolucion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "resuelto_por")
    private AdminUser resueltoPor;

    @Column(name = "resuelto_en")
    private LocalDateTime resueltoEn;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    /** Lo mantiene un trigger de la BD. */
    @Column(name = "actualizado_en", nullable = false, updatable = false)
    private LocalDateTime fechaActualizacion;

    /** Primera respuesta visible de un funcionario al contribuyente. Se llena una vez y no se sobrescribe. */
    @Column(name = "fecha_primera_respuesta")
    private LocalDateTime fechaPrimeraRespuesta;

    /** El reclamo no tiene fecha de archivado propia: es la del seguimiento que lo pasó a ARCHIVADO. */
    @Formula("(select max(s.creado_en) from reclamo_seguimientos s where s.reclamo_id = id and s.estado_nuevo = 'ARCHIVADO')")
    private LocalDateTime fechaArchivado;

    /**
     * Bloqueo optimista: un trigger de la BD suma 1 en cada UPDATE, venga del portal o de la app. Si la app
     * móvil u otro sistema modificó el reclamo mientras el admin lo tenía abierto, el cambio se rechaza.
     */
    @Version
    private Long version;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.PERSIST)
    @OrderBy("fecha ASC")
    private List<TicketRespuesta> respuestas = new ArrayList<>();

    protected Ticket() {
    }

    /** Solo para los datos de ejemplo (H2): en la BD real el portal no inserta reclamos. */
    public Ticket(String codigo, Contribuyente contribuyente, TipoReclamo tipo, Canal canal, String asunto,
                  String descripcion, String pedido, Prioridad prioridad, LocalDateTime fechaCreacion) {
        this.codigo = codigo;
        this.contribuyente = contribuyente;
        this.tipo = tipo;
        this.canal = canal;
        this.asunto = asunto;
        this.descripcion = descripcion;
        this.pedido = pedido;
        this.prioridad = prioridad;
        this.fechaCreacion = fechaCreacion;
        this.fechaActualizacion = fechaCreacion;
        this.fechaLimiteAtencion = fechaCreacion.toLocalDate().plusDays(tipo.getPlazoAtencionDias());
    }

    // ---------- Reglas de negocio ----------

    public void tomar(AdminUser admin, LocalDateTime cuando) {
        exigirEstado("Solo se pueden tomar tickets pendientes.", EstadoReclamo.REGISTRADO);
        this.asignado = admin;
        this.fechaActualizacion = cuando;
        // Como en los reclamos existentes: tomarlo deja constancia visible para el contribuyente ("en evaluación").
        cambiarEstado(admin, EstadoReclamo.EN_REVISION, "Reclamo en evaluación.", true, cuando);
        marcarPrimeraRespuesta(cuando);
    }

    public void liberar(AdminUser admin, LocalDateTime cuando) {
        exigirEstado("Solo se pueden liberar tickets por contestar.", EstadoReclamo.EN_REVISION);
        this.asignado = null;
        cambiarEstado(admin, EstadoReclamo.REGISTRADO, "Reclamo devuelto a pendientes.", false, cuando);
    }

    /** Nota interna: no cambia el estado ni la ve el contribuyente. */
    public TicketRespuesta agregarNota(AdminUser admin, String mensaje, LocalDateTime cuando) {
        exigirEstado("Toma el ticket antes de escribir en él.", EstadoReclamo.EN_REVISION, EstadoReclamo.OBSERVADO);
        TicketRespuesta nota = new TicketRespuesta(this, admin, estadoReclamo, estadoReclamo, mensaje, false, cuando);
        respuestas.add(nota);
        return nota;
    }

    /** Pide información al contribuyente: pasa a OBSERVADO y queda esperando su respuesta. */
    public TicketRespuesta observar(AdminUser admin, String mensaje, LocalDate plazoHasta, LocalDateTime cuando) {
        exigirEstado("Solo se puede pedir información en tickets por contestar.", EstadoReclamo.EN_REVISION);
        this.observacion = mensaje;
        this.plazoSubsanacionHasta = plazoHasta;
        TicketRespuesta seguimiento = cambiarEstado(admin, EstadoReclamo.OBSERVADO, mensaje, true, cuando);
        marcarPrimeraRespuesta(cuando);
        return seguimiento;
    }

    /** Responde y cierra el reclamo con una resolución (fundado, fundado en parte, infundado o improcedente). */
    public TicketRespuesta resolver(AdminUser admin, EstadoReclamo resolucion, String mensaje,
                                    String numeroResolucion, LocalDateTime cuando) {
        exigirEstado("Solo se pueden resolver tickets por contestar u observados.",
                EstadoReclamo.EN_REVISION, EstadoReclamo.OBSERVADO);
        if (resolucion == null || !resolucion.esResolucion()) {
            throw new IllegalStateException("Elige cómo se resuelve el reclamo: fundado, fundado en parte, infundado o improcedente.");
        }
        this.respuesta = mensaje;
        this.numeroResolucion = numeroResolucion;
        this.resueltoPor = admin;
        this.resueltoEn = cuando;
        TicketRespuesta seguimiento = cambiarEstado(admin, resolucion, mensaje, true, cuando);
        marcarPrimeraRespuesta(cuando);
        return seguimiento;
    }

    public void archivar(AdminUser admin, LocalDateTime cuando) {
        if (!estadoReclamo.esResolucion()) {
            throw new IllegalStateException("Solo se pueden archivar tickets resueltos.");
        }
        cambiarEstado(admin, EstadoReclamo.ARCHIVADO, "Reclamo archivado.", false, cuando);
    }

    private TicketRespuesta cambiarEstado(AdminUser admin, EstadoReclamo nuevo, String comentario, boolean visible,
                                          LocalDateTime cuando) {
        TicketRespuesta seguimiento = new TicketRespuesta(this, admin, estadoReclamo, nuevo, comentario, visible, cuando);
        respuestas.add(seguimiento);
        this.estadoReclamo = nuevo;
        this.fechaActualizacion = cuando;
        return seguimiento;
    }

    private void marcarPrimeraRespuesta(LocalDateTime cuando) {
        if (fechaPrimeraRespuesta == null) {
            fechaPrimeraRespuesta = cuando;
        }
    }

    private void exigirEstado(String mensaje, EstadoReclamo... permitidos) {
        for (EstadoReclamo e : permitidos) {
            if (estadoReclamo == e) {
                return;
            }
        }
        throw new IllegalStateException(mensaje);
    }

    // ---------- Datos calculados para las vistas ----------

    /** Grupo de la bandeja al que pertenece (pendiente, por contestar, observado, resuelto o archivado). */
    public EstadoTicket getEstado() {
        return estadoReclamo.getGrupo();
    }

    /** El plazo de atención corre mientras el reclamo está pendiente o por contestar. */
    public boolean isPlazoCorriendo() {
        return estadoReclamo == EstadoReclamo.REGISTRADO || estadoReclamo == EstadoReclamo.EN_REVISION;
    }

    public long getDiasRestantes() {
        return ChronoUnit.DAYS.between(LocalDate.now(), fechaLimiteAtencion);
    }

    public boolean isFueraDePlazo() {
        return isPlazoCorriendo() && getDiasRestantes() < 0;
    }

    /** reciente / alerta / vencido según los días que faltan para la fecha límite; "atendido" si ya no corre el plazo. */
    public String getNivelAntiguedad() {
        if (!isPlazoCorriendo()) {
            return "atendido";
        }
        long dias = getDiasRestantes();
        if (dias < 0) return "vencido";
        if (dias <= DIAS_ALERTA) return "alerta";
        return "reciente";
    }

    /** Proporción (0–100) del plazo ya consumido, para la barra de antigüedad. */
    public int getPorcentajeAntiguedad() {
        if (!isPlazoCorriendo()) {
            return 100;
        }
        long total = Math.max(1, ChronoUnit.DAYS.between(fechaCreacion.toLocalDate(), fechaLimiteAtencion));
        long transcurrido = ChronoUnit.DAYS.between(fechaCreacion.toLocalDate(), LocalDate.now());
        return (int) Math.min(100, Math.max(4, transcurrido * 100 / total));
    }

    public String getAntiguedadTexto() {
        return formatearHoras(Duration.between(fechaCreacion, LocalDateTime.now()).toHours());
    }

    /** Texto bajo la barra de antigüedad: lo que falta para el plazo, o cuánto tardó si ya está resuelto. */
    public String getPlazoTexto() {
        if (isPlazoCorriendo()) {
            long dias = getDiasRestantes();
            if (dias < 0) return "Vencido hace " + (-dias) + (dias == -1 ? " día" : " días");
            if (dias == 0) return "Vence hoy";
            return "Vence en " + dias + (dias == 1 ? " día" : " días");
        }
        if (estadoReclamo == EstadoReclamo.OBSERVADO) {
            return "Esperando al contribuyente";
        }
        if (resueltoEn != null) {
            return "Resuelto en " + formatearHoras(Duration.between(fechaCreacion, resueltoEn).toHours());
        }
        return estadoReclamo.getEtiqueta();
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

    // ---------- Datos del contribuyente y del tipo (las vistas los leen como propios del ticket) ----------

    public String getClienteNombre() { return contribuyente.getNombreCompleto(); }
    public String getClienteDocumento() { return contribuyente.getNumeroDocumento(); }
    public String getClienteEmail() { return contribuyente.getCorreo(); }
    public String getClienteTelefono() { return contribuyente.getTelefono(); }
    public String getCategoria() { return tipo.getNombre(); }

    /** Usuario del admin que lo atiende, o null si no está asignado. */
    public String getAsignadoA() { return asignado != null ? asignado.getUsername() : null; }

    /** Nombre del admin que lo atiende, para mostrar. */
    public String getAsignadoNombre() { return asignado != null ? asignado.getNombreCompleto() : null; }

    /** Solo las líneas con texto: los cambios de estado sin comentario no se muestran en la conversación. */
    public List<TicketRespuesta> getRespuestas() {
        return respuestas.stream().filter(r -> r.getMensaje() != null && !r.getMensaje().isBlank()).toList();
    }

    // ---------- Getters ----------

    public String getId() { return id; }
    public String getCodigo() { return codigo; }
    public Contribuyente getContribuyente() { return contribuyente; }
    public TipoReclamo getTipo() { return tipo; }
    public Canal getCanal() { return canal; }
    public String getAsunto() { return asunto; }
    public String getDescripcion() { return descripcion; }
    public String getPedido() { return pedido; }
    public Prioridad getPrioridad() { return prioridad; }
    public EstadoReclamo getEstadoReclamo() { return estadoReclamo; }
    public LocalDate getFechaLimiteAtencion() { return fechaLimiteAtencion; }
    public AdminUser getAsignado() { return asignado; }
    public String getObservacion() { return observacion; }
    public LocalDate getPlazoSubsanacionHasta() { return plazoSubsanacionHasta; }
    public String getRespuesta() { return respuesta; }
    public String getNumeroResolucion() { return numeroResolucion; }
    public AdminUser getResueltoPor() { return resueltoPor; }
    public LocalDateTime getResueltoEn() { return resueltoEn; }
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public LocalDateTime getFechaPrimeraRespuesta() { return fechaPrimeraRespuesta; }
    public LocalDateTime getFechaArchivado() { return fechaArchivado; }
    public Long getVersion() { return version; }
}
