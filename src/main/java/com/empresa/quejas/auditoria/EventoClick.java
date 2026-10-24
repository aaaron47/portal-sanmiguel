package com.empresa.quejas.auditoria;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Cada click (o vista de pantalla) que hace un usuario dentro del portal.
 * Tabla propia de este módulo; genera mucho volumen, por eso se guarda de forma asíncrona.
 */
@Entity
@Table(name = "portal_eventos_click", indexes = {
        @Index(name = "ix_click_usuario_fecha", columnList = "usuario, fecha"),
        @Index(name = "ix_click_fecha", columnList = "fecha")
})
public class EventoClick {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TipoInteraccion tipo;

    @Column(nullable = false, length = 60)
    private String usuario;

    /** Pantalla donde ocurrió (ruta + parámetros). */
    @Column(nullable = false, length = 300)
    private String ruta;

    /** Identificador del elemento: atributo data-track o etiqueta#id. */
    @Column(length = 120)
    private String elemento;

    /** Texto visible del elemento (recortado). */
    @Column(length = 150)
    private String texto;

    @Column(length = 60)
    private String ip;

    @Column(length = 12)
    private String sesion;

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    protected EventoClick() {
    }

    public EventoClick(TipoInteraccion tipo, String usuario, String ruta, String elemento, String texto,
                       String ip, String sesion) {
        this.tipo = tipo;
        this.usuario = usuario;
        this.ruta = ruta;
        this.elemento = elemento;
        this.texto = texto;
        this.ip = ip;
        this.sesion = sesion;
    }

    public Long getId() { return id; }
    public TipoInteraccion getTipo() { return tipo; }
    public String getUsuario() { return usuario; }
    public String getRuta() { return ruta; }
    public String getElemento() { return elemento; }
    public String getTexto() { return texto; }
    public String getIp() { return ip; }
    public String getSesion() { return sesion; }
    public LocalDateTime getFecha() { return fecha; }

    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
}
