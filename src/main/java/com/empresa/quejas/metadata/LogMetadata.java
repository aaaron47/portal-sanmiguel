package com.empresa.quejas.metadata;

import com.empresa.quejas.auth.AdminUser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Registro de metadata de cada evento relevante: accesos, cierres de sesión y acciones sobre tickets.
 * Es una fila de la tabla auditoria de SANMI_APP, compartida con la app móvil: el portal escribe con
 * origen = 'WEB'. Navegador, sistema operativo, IP y sesión van dentro del JSON de la columna datos.
 * La tabla solo admite INSERT.
 */
@Entity
@Table(name = "auditoria")
public class LogMetadata {

    static final String ORIGEN_WEB = "WEB";
    private static final ObjectMapper JSON = new ObjectMapper();

    @Id
    @UuidGenerator
    @Column(length = 36)
    private String id;

    /** Quien hizo la acción. Es nulo si se intentó entrar con un usuario que no existe. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "administrador_id", updatable = false)
    private AdminUser administrador;

    @Column(nullable = false, length = 10, updatable = false)
    private String origen = ORIGEN_WEB;

    /** Nombre de un {@link TipoEvento}. */
    @Column(nullable = false, length = 60, updatable = false)
    private String accion;

    @Column(nullable = false, length = 60, updatable = false)
    private String entidad;

    @Column(name = "entidad_id", nullable = false, length = 36, updatable = false)
    private String entidadId;

    /** JSON: usuario, navegador, so, ip, sesion, user_agent y detalle. */
    @Lob
    @Column(updatable = false)
    private String datos;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    @Transient
    private JsonNode datosJson;

    protected LogMetadata() {
    }

    public LogMetadata(TipoEvento tipo, AdminUser administrador, String usuarioIndicado, RequestInfo info,
                       String detalle, String entidad, String entidadId) {
        this.accion = tipo.name();
        this.administrador = administrador;
        this.entidad = entidad;
        this.entidadId = entidadId;
        Map<String, Object> datos = new LinkedHashMap<>();
        datos.put("usuario", usuarioIndicado);
        if (info != null) {
            datos.put("navegador", info.navegador());
            datos.put("so", info.sistemaOperativo());
            datos.put("ip", info.ip());
            datos.put("sesion", info.sesion());
            datos.put("user_agent", info.userAgent());
        }
        datos.put("detalle", detalle);
        try {
            this.datos = JSON.writeValueAsString(datos);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("No se pudo armar el JSON de la auditoría", e);
        }
    }

    // ---------- Datos que lee la interfaz (salen del JSON) ----------

    /** Null si la acción no es una de las que genera el portal. */
    public TipoEvento getTipo() {
        try {
            return TipoEvento.valueOf(accion);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    public String getUsuario() {
        if (administrador != null) {
            return administrador.getUsername();
        }
        String indicado = texto("usuario");
        return indicado != null ? indicado : "(desconocido)";
    }

    public String getIp() { return texto("ip"); }
    public String getNavegador() { return texto("navegador"); }
    public String getSistemaOperativo() { return texto("so"); }
    public String getUserAgent() { return texto("user_agent"); }
    public String getSesion() { return texto("sesion"); }
    public String getDetalle() { return texto("detalle"); }

    private String texto(String campo) {
        if (datosJson == null) {
            try {
                datosJson = datos == null ? JSON.createObjectNode() : JSON.readTree(datos);
            } catch (JsonProcessingException e) {
                datosJson = JSON.createObjectNode();
            }
        }
        JsonNode valor = datosJson.get(campo);
        return valor == null || valor.isNull() ? null : valor.asText();
    }

    public String getId() { return id; }
    public AdminUser getAdministrador() { return administrador; }
    public String getOrigen() { return origen; }
    public String getAccion() { return accion; }
    public String getEntidad() { return entidad; }
    public String getEntidadId() { return entidadId; }
    public LocalDateTime getFecha() { return fecha; }

    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
}
