package com.empresa.quejas.tickets;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.Immutable;

/**
 * Quien presentó el reclamo. Tabla contribuyentes: el portal solo la lee (solo se mapean las columnas que usa).
 */
@Entity
@Immutable
@Table(name = "contribuyentes")
public class Contribuyente {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, length = 30)
    private String codigo;

    @Column(name = "nombre_completo", nullable = false, length = 180)
    private String nombreCompleto;

    @Column(name = "numero_documento", nullable = false, length = 20)
    private String numeroDocumento;

    @Column(length = 254)
    private String correo;

    @Column(length = 25)
    private String telefono;

    protected Contribuyente() {
    }

    /** Solo para los datos de ejemplo (H2). */
    public Contribuyente(String id, String codigo, String nombreCompleto, String numeroDocumento, String correo,
                         String telefono) {
        this.id = id;
        this.codigo = codigo;
        this.nombreCompleto = nombreCompleto;
        this.numeroDocumento = numeroDocumento;
        this.correo = correo;
        this.telefono = telefono;
    }

    public String getId() { return id; }
    public String getCodigo() { return codigo; }
    public String getNombreCompleto() { return nombreCompleto; }
    public String getNumeroDocumento() { return numeroDocumento; }
    public String getCorreo() { return correo; }
    public String getTelefono() { return telefono; }
}
