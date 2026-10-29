package com.empresa.quejas;

import com.empresa.quejas.auditoria.EventoClick;
import com.empresa.quejas.auditoria.EventoClickRepository;
import com.empresa.quejas.auditoria.TipoInteraccion;
import com.empresa.quejas.auth.AdminUser;
import com.empresa.quejas.auth.AdminUserDetailsService;
import com.empresa.quejas.auth.AdminUserRepository;
import com.empresa.quejas.metadata.LogMetadata;
import com.empresa.quejas.metadata.LogMetadataRepository;
import com.empresa.quejas.metadata.MetadataService;
import com.empresa.quejas.metadata.RequestInfo;
import com.empresa.quejas.metadata.TipoEvento;
import com.empresa.quejas.notificaciones.DatosRespuesta;
import com.empresa.quejas.notificaciones.Notificacion;
import com.empresa.quejas.notificaciones.NotificacionRepository;
import com.empresa.quejas.tickets.EstadoReclamo;
import com.empresa.quejas.tickets.EstadoTicket;
import com.empresa.quejas.tickets.Ticket;
import com.empresa.quejas.tickets.TicketRepository;
import com.empresa.quejas.tickets.TicketRespuesta;
import com.empresa.quejas.tickets.TicketService;
import com.empresa.quejas.tickets.Canal;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Comprobación contra la BD Oracle real (cuenta SANMI_PORTAL_WEB). No corre con "mvn test": hay que pedirla con
 *
 *     mvn test -Dtest=OracleConexionTests -Doracle=true
 *
 * y necesita las variables DB_HOST, DB_SID, DB_USER y DB_PASSWORD (en el .env de la raíz o en el entorno).
 *
 * Las pruebas de escritura hacen los cambios dentro de una transacción que SIEMPRE se revierte: comprueban
 * permisos, restricciones y triggers sin dejar datos en la base compartida.
 * Para comprobar además un login real: -Doracle.demoUser=supervisor.demo -Doracle.demoPassword=...
 */
@SpringBootTest
@ActiveProfiles("cloud")
@EnabledIfSystemProperty(named = "oracle", matches = "true")
class OracleConexionTests {

    @Autowired JdbcTemplate jdbc;
    @Autowired TicketRepository ticketRepository;
    @Autowired TicketService ticketService;
    @Autowired AdminUserRepository adminRepository;
    @Autowired AdminUserDetailsService detailsService;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired MetadataService metadataService;
    @Autowired LogMetadataRepository logRepository;
    @Autowired EventoClickRepository clickRepository;
    @Autowired NotificacionRepository notificacionRepository;
    @Autowired TransactionTemplate transaccion;
    @PersistenceContext EntityManager em;

    @Test
    void seConectaConLaCuentaDelPortalYElEsquemaCorrecto() {
        Map<String, Object> fila = jdbc.queryForMap(
                "SELECT USER AS usuario, SYS_CONTEXT('USERENV','CURRENT_SCHEMA') AS esquema FROM dual");
        assertThat(fila.get("USUARIO")).isEqualTo("SANMI_PORTAL_WEB");
        assertThat(fila.get("ESQUEMA")).isEqualTo("SANMI_APP");
    }

    @Test
    void leeLosReclamosYConvierteLasHorasDeUtcALaHoraLocal() {
        Ticket t = ticketRepository.findAll().stream()
                .filter(x -> x.getCodigo().equals("REC-2026-000001")).findFirst().orElseThrow();
        assertThat(t.getEstadoReclamo()).isEqualTo(EstadoReclamo.EN_REVISION);
        assertThat(t.getEstado()).isEqualTo(EstadoTicket.EN_ATENCION);
        assertThat(t.getCanal()).isEqualTo(Canal.APP_MOVIL);
        assertThat(t.getClienteNombre()).isNotBlank();
        assertThat(t.getCategoria()).isNotBlank();
        assertThat(t.getAsignadoA()).isNotNull();
        // En la BD está guardado 2026-10-18 15:20 UTC
        assertThat(t.getFechaCreacion())
                .isEqualTo(LocalDateTime.ofInstant(Instant.parse("2026-10-18T15:20:00Z"), ZoneId.systemDefault()));
        assertThat(t.getVersion()).isNotNull();
    }

    @Test
    void laBandejaElHistorialYElDetalleFuncionanConConsultasReales() {
        for (EstadoTicket estado : EstadoTicket.bandeja()) {
            ticketService.buscarBandeja(estado, null, null, false, "operador.demo", 0).getContent()
                    .forEach(t -> assertThat(t.getEstado()).isEqualTo(estado));
        }
        assertThat(ticketService.buscarBandeja(EstadoTicket.PENDIENTE, "REC-2026", null, false, "x", 0)).isNotNull();
        assertThat(ticketService.buscarHistorial(null, null, null, null, 0)).isNotNull();
        assertThat(ticketService.conteoPorEstado()).containsKeys(EstadoTicket.values());
        assertThat(ticketService.resumenInicio("operador.demo").conteo()).isNotEmpty();
        assertThat(ticketService.respuestasEnviadasPor("operador.demo")).isGreaterThanOrEqualTo(0);

        String id = ticketRepository.findAll().stream().filter(x -> x.getCodigo().equals("REC-2026-000001"))
                .findFirst().orElseThrow().getId();
        Ticket detalle = ticketService.detalle(id);
        assertThat(detalle.getRespuestas()).isNotEmpty();
    }

    @Test
    void leeLosAdministradoresConHashArgon2id() {
        assertThat(adminRepository.findAll()).extracting(AdminUser::getUsername)
                .contains("admin.demo", "operador.demo", "supervisor.demo");
        AdminUser admin = adminRepository.findByUsername("supervisor.demo").orElseThrow();
        assertThat(admin.getPasswordHash()).startsWith("$argon2id$");
        assertThat(admin.isActivo()).isTrue();
        assertThat(detailsService.loadUserByUsername("Supervisor.Demo").getAuthorities())
                .extracting(Object::toString).containsExactly("ROLE_SUPERVISOR");
    }

    @Test
    void laContrasenaDeUnaCuentaDemoCoincideConElHash() {
        String usuario = System.getProperty("oracle.demoUser");
        String contrasena = System.getProperty("oracle.demoPassword");
        org.junit.jupiter.api.Assumptions.assumeTrue(usuario != null && contrasena != null,
                "Falta -Doracle.demoUser y -Doracle.demoPassword");
        AdminUser admin = adminRepository.findByUsername(usuario).orElseThrow();
        assertThat(passwordEncoder.matches(contrasena, admin.getPasswordHash())).isTrue();
        assertThat(passwordEncoder.matches(contrasena + "x", admin.getPasswordHash())).isFalse();
    }

    @Test
    void laAuditoriaYLosClicksSeLeenSinErrores() {
        assertThat(metadataService.buscar(null, null, null, 0)).isNotNull();
        assertThat(metadataService.buscar(TipoEvento.LOGIN_EXITOSO, "operador.demo", null, 0)).isNotNull();
        assertThat(metadataService.actividadReciente("operador.demo")).isNotNull();
        assertThat(metadataService.accesosHoy()).isGreaterThanOrEqualTo(0);
        assertThat(clickRepository.contarUsuariosActivos(LocalDateTime.now().minusDays(1))).isGreaterThanOrEqualTo(0);
        assertThat(clickRepository.count()).isGreaterThanOrEqualTo(0);
    }

    @Test
    void laSecuenciaDeResolucionesSeConsultaConElSqlDeOracle() {
        String sql = em.getEntityManagerFactory().unwrap(SessionFactoryImplementor.class).getJdbcServices()
                .getDialect().getSequenceSupport().getSequenceNextValString("seq_resolucion");
        assertThat(sql.toLowerCase()).contains("seq_resolucion.nextval").contains("from dual");
        // No se ejecuta: gastaría un número de la secuencia compartida.
    }

    /** Recorre las acciones sobre reclamos y comprueba permisos de columna, restricciones CHECK y triggers. */
    @Test
    void lasEscriturasDelPortalFuncionanYSeRevierten() {
        transaccion.executeWithoutResult(estado -> {
            estado.setRollbackOnly();
            AdminUser admin = adminRepository.findByUsername("operador.demo").orElseThrow();
            LocalDateTime ahora = LocalDateTime.now();

            // Administrador: solo las cinco columnas de acceso
            admin.registrarAccesoExitoso("127.0.0.1");
            em.flush();

            // REGISTRADO -> tomar -> EN_REVISION -> pedir información -> OBSERVADO
            Ticket pendiente = ticketRepository.findAll().stream()
                    .filter(t -> t.getEstadoReclamo() == EstadoReclamo.REGISTRADO).findFirst().orElseThrow();
            long versionAntes = versionEnBd(pendiente.getId());
            pendiente.tomar(admin, ahora);
            em.flush();
            assertThat(versionEnBd(pendiente.getId()))
                    .as("el trigger de la BD debe sumar 1 a version en cada UPDATE (y Hibernate espera lo mismo)")
                    .isEqualTo(versionAntes + 1)
                    .isEqualTo(pendiente.getVersion());
            TicketRespuesta aviso = pendiente.observar(admin, "Adjunte el comprobante.", ahora.toLocalDate().plusDays(10), ahora);
            em.flush();
            assertThat(jdbc.queryForObject("SELECT estado FROM reclamos WHERE id = ?", String.class, pendiente.getId()))
                    .isEqualTo("OBSERVADO");

            // Aviso por correo (portal_notificaciones) ligado a ese seguimiento
            Notificacion notificacion = notificacionRepository.save(new Notificacion(new DatosRespuesta(pendiente.getId(),
                    pendiente.getCodigo(), pendiente.getAsunto(), pendiente.getClienteNombre(), "prueba@example.com",
                    aviso.getId(), "Adjunte el comprobante.", admin), ahora));
            em.flush();
            notificacion.marcarFallido("prueba", ahora);
            notificacionRepository.saveAndFlush(notificacion);

            // EN_REVISION -> resolver -> FUNDADO -> archivar -> ARCHIVADO
            Ticket enRevision = ticketRepository.findAll().stream()
                    .filter(t -> t.getEstadoReclamo() == EstadoReclamo.EN_REVISION).findFirst().orElseThrow();
            enRevision.resolver(admin, EstadoReclamo.FUNDADO, "Se reconoce el reclamo.", "RES-RCL-PRUEBA-0", ahora);
            em.flush();
            enRevision.archivar(admin, ahora.plusMinutes(1));
            em.flush();
            em.clear();
            Ticket archivado = ticketRepository.findById(enRevision.getId()).orElseThrow();
            assertThat(archivado.getEstadoReclamo()).isEqualTo(EstadoReclamo.ARCHIVADO);
            assertThat(archivado.getFechaArchivado()).as("fórmula de la fecha de archivado").isNotNull();
            assertThat(ticketService.buscarHistorial(null, null, ahora.toLocalDate(), ahora.toLocalDate(), 0)
                    .getContent()).extracting(Ticket::getId).contains(archivado.getId());

            // Auditoría y clicks
            logRepository.saveAndFlush(new LogMetadata(TipoEvento.TICKET_TOMADO, admin, admin.getUsername(),
                    new RequestInfo("127.0.0.1", "prueba", "Chrome", "Windows", "abc"), "prueba", "reclamos",
                    pendiente.getId()));
            clickRepository.saveAndFlush(new EventoClick(TipoInteraccion.CLICK, admin, "/prueba", "prueba", "Prueba",
                    "127.0.0.1", UUID.randomUUID().toString().substring(0, 8)));
            assertThat(logRepository.count()).isGreaterThan(0);
        });
        // Quedó todo como estaba
        assertThat(ticketRepository.findAll().stream().filter(t -> t.getEstadoReclamo() == EstadoReclamo.OBSERVADO)
                .noneMatch(t -> "Adjunte el comprobante.".equals(t.getObservacion()))).isTrue();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM reclamos WHERE numero_resolucion = 'RES-RCL-PRUEBA-0'",
                Integer.class)).isZero();
    }

    private long versionEnBd(String id) {
        return jdbc.queryForObject("SELECT version FROM reclamos WHERE id = ?", Long.class, id);
    }
}
