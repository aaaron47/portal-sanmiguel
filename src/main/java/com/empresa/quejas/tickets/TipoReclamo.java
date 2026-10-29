package com.empresa.quejas.tickets;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.Immutable;

/**
 * Catálogo de tipos de reclamo (tabla tipos_reclamo). El portal solo lo lee.
 */
@Entity
@Immutable
@Table(name = "tipos_reclamo")
public class TipoReclamo {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, length = 40)
    private String codigo;

    @Column(nullable = false, length = 120)
    private String nombre;

    @Column(name = "plazo_atencion_dias", nullable = false)
    private int plazoAtencionDias;

    protected TipoReclamo() {
    }

    /** Solo para los datos de ejemplo (H2). */
    public TipoReclamo(String id, String codigo, String nombre, int plazoAtencionDias) {
        this.id = id;
        this.codigo = codigo;
        this.nombre = nombre;
        this.plazoAtencionDias = plazoAtencionDias;
    }

    public String getId() { return id; }
    public String getCodigo() { return codigo; }
    public String getNombre() { return nombre; }
    public int getPlazoAtencionDias() { return plazoAtencionDias; }
}
