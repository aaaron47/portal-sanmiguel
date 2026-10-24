package com.empresa.quejas.auth;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Usuario administrador del portal. Tabla propia de este módulo.
 */
@Entity
@Table(name = "portal_admin_usuarios")
public class AdminUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String username;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(name = "nombre_completo", nullable = false, length = 120)
    private String nombreCompleto;

    @Column(length = 120)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Rol rol;

    @Column(nullable = false)
    private boolean activo = true;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    /** Inicio de la sesión actual (o la última, si no está conectado). */
    @Column(name = "ultimo_acceso")
    private LocalDateTime ultimoAcceso;

    /** Inicio de la sesión anterior, para mostrar "tu acceso anterior fue...". */
    @Column(name = "acceso_anterior")
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

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getPasswordHash() { return passwordHash; }
    public String getNombreCompleto() { return nombreCompleto; }
    public String getEmail() { return email; }
    public Rol getRol() { return rol; }
    public boolean isActivo() { return activo; }
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public LocalDateTime getUltimoAcceso() { return ultimoAcceso; }
    public LocalDateTime getAccesoAnterior() { return accesoAnterior; }
    public String getUltimaIp() { return ultimaIp; }
    public int getIntentosFallidos() { return intentosFallidos; }
    public LocalDateTime getBloqueadoHasta() { return bloqueadoHasta; }

    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
    public void setUltimoAcceso(LocalDateTime ultimoAcceso) { this.ultimoAcceso = ultimoAcceso; }
    public void setAccesoAnterior(LocalDateTime accesoAnterior) { this.accesoAnterior = accesoAnterior; }
    public void setUltimaIp(String ultimaIp) { this.ultimaIp = ultimaIp; }
}
