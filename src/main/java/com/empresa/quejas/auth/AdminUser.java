package com.empresa.quejas.auth;

import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

/**
 * Administrador del portal. Tabla administradores de SANMI_APP (la crea y la llena el responsable de la BD).
 *
 * La cuenta del portal solo puede actualizar cinco columnas (intentos, bloqueo, accesos e IP): el resto va
 * con updatable = false para que Hibernate nunca las incluya en un UPDATE (daría ORA-01031).
 */
@Entity
@Table(name = "administradores")
public class AdminUser {

    @Id
    @UuidGenerator
    @Column(length = 36)
    private String id;

    @Column(name = "usuario", nullable = false, unique = true, length = 60, updatable = false)
    private String username;

    /** Hash Argon2id. */
    @Column(name = "hash_contrasena", nullable = false, length = 255, updatable = false)
    private String passwordHash;

    @Column(name = "nombre_completo", nullable = false, length = 180, updatable = false)
    private String nombreCompleto;

    @Column(name = "correo", nullable = false, unique = true, length = 254, updatable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15, updatable = false)
    private Rol rol;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15, updatable = false)
    private EstadoAdmin estado = EstadoAdmin.ACTIVO;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    /** Lo mantiene un trigger de la BD. */
    @Column(name = "actualizado_en", nullable = false, updatable = false)
    private LocalDateTime actualizadoEn = LocalDateTime.now();

    /** Inicio de la sesión actual (o la última, si no está conectado). */
    @Column(name = "ultimo_acceso_en")
    private LocalDateTime ultimoAcceso;

    /** Inicio de la sesión anterior, para mostrar "tu acceso anterior fue...". */
    @Column(name = "acceso_anterior_en")
    private LocalDateTime accesoAnterior;

    @Column(name = "ultima_ip", length = 60)
    private String ultimaIp;

    @Column(name = "intentos_fallidos", nullable = false)
    private int intentosFallidos = 0;

    @Column(name = "bloqueado_hasta")
    private LocalDateTime bloqueadoHasta;

    protected AdminUser() {
    }

    public AdminUser(String username, String passwordHash, String nombreCompleto, String email, Rol rol) {
        this.username = username;
        this.passwordHash = passwordHash;
        this.nombreCompleto = nombreCompleto;
        this.email = email;
        this.rol = rol;
    }

    public boolean estaBloqueado() {
        return bloqueadoHasta != null && bloqueadoHasta.isAfter(LocalDateTime.now());
    }

    /** Solo las cuentas en estado ACTIVO pueden entrar. */
    public boolean isActivo() {
        return estado == EstadoAdmin.ACTIVO;
    }

    public void registrarAccesoExitoso(String ip) {
        this.accesoAnterior = this.ultimoAcceso;
        this.ultimoAcceso = LocalDateTime.now();
        this.ultimaIp = ip;
        this.intentosFallidos = 0;
        this.bloqueadoHasta = null;
    }

    /** @return true si con este intento la cuenta quedó bloqueada */
    public boolean registrarIntentoFallido(int maxIntentos, int minutosBloqueo) {
        this.intentosFallidos++;
        if (this.intentosFallidos >= maxIntentos) {
            this.bloqueadoHasta = LocalDateTime.now().plusMinutes(minutosBloqueo);
            this.intentosFallidos = 0;
            return true;
        }
        return false;
    }

    public String getIniciales() {
        String[] partes = nombreCompleto.trim().split("\\s+");
        String ini = partes[0].substring(0, 1);
        if (partes.length > 1) {
            ini += partes[1].substring(0, 1);
        }
        return ini.toUpperCase();
    }

    public String getId() { return id; }
    public String getUsername() { return username; }
    public String getPasswordHash() { return passwordHash; }
    public String getNombreCompleto() { return nombreCompleto; }
    public String getEmail() { return email; }
    public Rol getRol() { return rol; }
    public EstadoAdmin getEstado() { return estado; }
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public LocalDateTime getUltimoAcceso() { return ultimoAcceso; }
    public LocalDateTime getAccesoAnterior() { return accesoAnterior; }
    public String getUltimaIp() { return ultimaIp; }
    public int getIntentosFallidos() { return intentosFallidos; }
    public LocalDateTime getBloqueadoHasta() { return bloqueadoHasta; }

    // Solo para los datos de ejemplo (H2): en la BD real el portal no crea administradores.
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
    public void setUltimoAcceso(LocalDateTime ultimoAcceso) { this.ultimoAcceso = ultimoAcceso; }
    public void setAccesoAnterior(LocalDateTime accesoAnterior) { this.accesoAnterior = accesoAnterior; }
    public void setUltimaIp(String ultimaIp) { this.ultimaIp = ultimaIp; }
}
