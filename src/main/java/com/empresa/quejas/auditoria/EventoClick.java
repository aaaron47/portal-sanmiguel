package com.empresa.quejas.auditoria;

import com.empresa.quejas.auth.AdminUser;
import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

/**
 * Cada click (o vista de pantalla) que hace un administrador dentro del portal: tabla portal_eventos_click.
 * Genera mucho volumen, por eso se guarda de forma asíncrona. Solo se inserta, nunca se modifica.
 */
@Entity
@Table(name = "portal_eventos_click")
public class EventoClick {

    @Id
    @UuidGenerator
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "administrador_id", nullable = false, updatable = false)
    private AdminUser administrador;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10, updatable = false)
    private TipoInteraccion tipo;

    /** Pantalla donde ocurrió (ruta + parámetros). */
    @Column(nullable = false, length = 300, updatable = false)
    private String ruta;

    /** Identificador del elemento: atributo data-track o etiqueta#id. */
    @Column(length = 120, updatable = false)
    private String elemento;

    /** Texto visible del elemento (recortado). */
    @Column(length = 150, updatable = false)
    private String texto;

    @Column(length = 60, updatable = false)
    private String ip;

    @Column(length = 12, updatable = false)
    private String sesion;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    protected EventoClick() {
    }

    public EventoClick(TipoInteraccion tipo, AdminUser administrador, String ruta, String elemento, String texto,
                       String ip, String sesion) {
        this.tipo = tipo;
        this.administrador = administrador;
        this.ruta = ruta;
        this.elemento = elemento;
        this.texto = texto;
        this.ip = ip;
        this.sesion = sesion;
    }

    public String getUsuario() { return administrador.getUsername(); }

    public String getId() { return id; }
    public AdminUser getAdministrador() { return administrador; }
    public TipoInteraccion getTipo() { return tipo; }
    public String getRuta() { return ruta; }
    public String getElemento() { return elemento; }
    public String getTexto() { return texto; }
    public String getIp() { return ip; }
    public String getSesion() { return sesion; }
    public LocalDateTime getFecha() { return fecha; }

    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
}
