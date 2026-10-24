package com.empresa.quejas.metadata;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Registro de metadata de cada evento relevante: accesos, cierres de sesión y acciones sobre tickets.
 * Tabla propia de este módulo (no se mezcla con las tablas de otros sistemas).
 */
@Entity
@Table(name = "portal_log_metadata", indexes = {
        @Index(name = "ix_log_usuario_fecha", columnList = "usuario, fecha"),
        @Index(name = "ix_log_tipo_fecha", columnList = "tipo, fecha")
})
public class LogMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoEvento tipo;

    @Column(nullable = false, length = 60)
    private String usuario;

    @Column(length = 60)
    private String ip;

    @Column(length = 40)
    private String navegador;

    @Column(name = "sistema_operativo", length = 40)
    private String sistemaOperativo;

    @Column(name = "user_agent", length = 300)
    private String userAgent;

    /** Primeros caracteres del id de sesión: sirven para agrupar eventos sin exponer la sesión completa. */
    @Column(length = 12)
    private String sesion;

    @Column(length = 400)
    private String detalle;

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    protected LogMetadata() {
    }

    public LogMetadata(TipoEvento tipo, String usuario, RequestInfo info, String detalle) {
        this.tipo = tipo;
        this.usuario = usuario;
        this.detalle = detalle;
        if (info != null) {
            this.ip = info.ip();
            this.navegador = info.navegador();
            this.sistemaOperativo = info.sistemaOperativo();
            this.userAgent = info.userAgent();
            this.sesion = info.sesion();
        }
    }

    public Long getId() { return id; }
    public TipoEvento getTipo() { return tipo; }
    public String getUsuario() { return usuario; }
    public String getIp() { return ip; }
    public String getNavegador() { return navegador; }
    public String getSistemaOperativo() { return sistemaOperativo; }
    public String getUserAgent() { return userAgent; }
    public String getSesion() { return sesion; }
    public String getDetalle() { return detalle; }
    public LocalDateTime getFecha() { return fecha; }

    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
}
