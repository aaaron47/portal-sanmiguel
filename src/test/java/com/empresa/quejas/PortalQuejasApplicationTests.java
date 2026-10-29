package com.empresa.quejas;

import com.empresa.quejas.auditoria.EventoClickRepository;
import com.empresa.quejas.auth.AdminUserRepository;
import com.empresa.quejas.tickets.EstadoReclamo;
import com.empresa.quejas.tickets.EstadoTicket;
import com.empresa.quejas.tickets.Ticket;
import com.empresa.quejas.tickets.TicketRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestBuilders.formLogin;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.response.SecurityMockMvcResultMatchers.authenticated;
import static org.springframework.security.test.web.servlet.response.SecurityMockMvcResultMatchers.unauthenticated;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Pruebas de humo: arrancan la app completa con H2 y los datos de ejemplo,
 * y recorren cada pantalla como lo haría un usuario.
 */
@SpringBootTest
@AutoConfigureMockMvc
class PortalQuejasApplicationTests {

    @Autowired
    MockMvc mvc;

    @Autowired
    TicketRepository ticketRepository;

    @Autowired
    AdminUserRepository adminRepository;

    @Autowired
    EventoClickRepository clickRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    TransactionTemplate transaccion;

    @PersistenceContext
    EntityManager em;

    @Test
    void sinSesionRedirigeAlLogin() throws Exception {
        mvc.perform(get("/tickets"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrlPattern("**/login"));
    }

    @Test
    void loginMuestraFormulario() throws Exception {
        mvc.perform(get("/login"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Portal de quejas")));
    }

    @Test
    void loginCorrectoYErroneo() throws Exception {
        mvc.perform(formLogin().user("admin2").password("admin"))
                .andExpect(authenticated().withUsername("admin2"));
        mvc.perform(formLogin().user("admin2").password("incorrecta"))
                .andExpect(unauthenticated())
                .andExpect(redirectedUrl("/login?error"));
    }

    @Test
    void elUsuarioSeAceptaEnMayusculasPorqueLaBdLoGuardaEnMinusculas() throws Exception {
        mvc.perform(formLogin().user("Admin2").password("admin"))
                .andExpect(authenticated().withUsername("admin2"));
    }

    @Test
    void lasContrasenasSeGuardanConArgon2id() {
        String hash = adminRepository.findByUsername("admin2").orElseThrow().getPasswordHash();
        assertThat(hash).startsWith("$argon2id$");
        assertThat(passwordEncoder.matches("admin", hash)).isTrue();
    }

    @Test
    void supervisorVeTodasLasPantallas() throws Exception {
        var supervisor = user("admin").roles("SUPERVISOR");
        String idTicket = ticketRepository.findAll().get(0).getId();
        String[] rutas = {
                "/", "/tickets", "/tickets?estado=EN_ATENCION&mios=true", "/tickets?estado=OBSERVADO",
                "/tickets?estado=RESPONDIDO&q=cobro", "/tickets/" + idTicket, "/historial", "/historial?canal=WEB",
                "/auditoria/clicks", "/auditoria/logs", "/auditoria/logs?tipo=LOGIN_FALLIDO", "/metadata",
                "/metadata/admin/admin2"};
        for (String ruta : rutas) {
            mvc.perform(get(ruta).with(supervisor))
                    .andExpect(status().isOk());
        }
    }

    @Test
    void cadaEstadoDeLaBandejaMuestraSusTickets() {
        for (EstadoTicket estado : EstadoTicket.values()) {
            long enLaBd = ticketRepository.findAll().stream().filter(t -> t.getEstado() == estado).count();
            assertThat(enLaBd).as("tickets de ejemplo en " + estado).isGreaterThan(0);
        }
    }

    @Test
    void adminNoVeAuditoria() throws Exception {
        mvc.perform(get("/auditoria/clicks").with(user("admin2").roles("ADMIN")))
                .andExpect(status().isForbidden());
    }

    @Test
    void tomarTicketPendienteYDetectarConflicto() throws Exception {
        Ticket ticket = TicketsDePrueba.crear(transaccion, em, ticketRepository, "tomar@example.com", null);
        String url = "/tickets/" + ticket.getId() + "/tomar";

        mvc.perform(post(url).param("version", ticket.getVersion().toString())
                        .with(user("admin3").roles("OPERADOR")).with(csrf()))
                .andExpect(status().is3xxRedirection())
                .andExpect(flash().attributeExists("ok"));

        Ticket tomado = ticketRepository.findById(ticket.getId()).orElseThrow();
        assertThat(tomado.getEstado()).isEqualTo(EstadoTicket.EN_ATENCION);
        assertThat(tomado.getAsignadoA()).isEqualTo("admin3");

        // Misma versión antigua: debe rechazarse por conflicto
        mvc.perform(post(url).param("version", ticket.getVersion().toString())
                        .with(user("admin2").roles("ADMIN")).with(csrf()))
                .andExpect(flash().attributeExists("error"));
    }

    @Test
    void recorreElFlujoCompletoHastaArchivar() throws Exception {
        var admin = user("admin2").roles("ADMIN");
        Ticket ticket = TicketsDePrueba.crear(transaccion, em, ticketRepository, "flujo@example.com", "admin2");
        String base = "/tickets/" + ticket.getId();

        mvc.perform(post(base + "/observar").param("version", version(ticket))
                        .param("mensaje", "Adjunte el comprobante.").with(admin).with(csrf()))
                .andExpect(flash().attributeExists("ok"));
        Ticket observado = ticketRepository.findById(ticket.getId()).orElseThrow();
        assertThat(observado.getEstadoReclamo()).isEqualTo(EstadoReclamo.OBSERVADO);
        assertThat(observado.getObservacion()).isEqualTo("Adjunte el comprobante.");
        assertThat(observado.getPlazoSubsanacionHasta()).isNotNull();

        mvc.perform(post(base + "/resolver").param("version", version(ticket)).param("resolucion", "FUNDADO_EN_PARTE")
                        .param("mensaje", "Se reconoce una parte del cobro.").with(admin).with(csrf()))
                .andExpect(flash().attributeExists("ok"));
        Ticket resuelto = ticketRepository.findById(ticket.getId()).orElseThrow();
        assertThat(resuelto.getEstadoReclamo()).isEqualTo(EstadoReclamo.FUNDADO_EN_PARTE);
        assertThat(resuelto.getEstado()).isEqualTo(EstadoTicket.RESPONDIDO);
        assertThat(resuelto.getRespuesta()).isEqualTo("Se reconoce una parte del cobro.");
        assertThat(resuelto.getNumeroResolucion()).matches("RES-RCL-\\d{4}-\\d{6}");
        assertThat(resuelto.getResueltoPor().getUsername()).isEqualTo("admin2");
        assertThat(resuelto.getResueltoEn()).isNotNull();

        mvc.perform(post(base + "/archivar").param("version", version(ticket)).with(admin).with(csrf()))
                .andExpect(flash().attributeExists("ok"));
        Ticket archivado = ticketRepository.findById(ticket.getId()).orElseThrow();
        assertThat(archivado.getEstadoReclamo()).isEqualTo(EstadoReclamo.ARCHIVADO);
        assertThat(archivado.getFechaArchivado()).isNotNull();

        mvc.perform(get("/historial").param("q", ticket.getCodigo()).with(admin))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString(ticket.getCodigo())));
        // Archivado: no admite más cambios
        mvc.perform(post(base + "/tomar").param("version", version(ticket)).with(admin).with(csrf()))
                .andExpect(flash().attributeExists("error"));
    }

    @Test
    void noSePuedeResolverSinElegirResultadoNiConMensajeVacio() throws Exception {
        var admin = user("admin2").roles("ADMIN");
        Ticket ticket = TicketsDePrueba.crear(transaccion, em, ticketRepository, "vacio@example.com", "admin2");

        mvc.perform(post("/tickets/" + ticket.getId() + "/resolver").param("version", version(ticket))
                        .param("resolucion", "ARCHIVADO").param("mensaje", "Texto").with(admin).with(csrf()))
                .andExpect(flash().attributeExists("error"));
        mvc.perform(post("/tickets/" + ticket.getId() + "/resolver").param("version", version(ticket))
                        .param("resolucion", "FUNDADO").param("mensaje", "   ").with(admin).with(csrf()))
                .andExpect(flash().attributeExists("error"));
        assertThat(ticketRepository.findById(ticket.getId()).orElseThrow().getEstadoReclamo())
                .isEqualTo(EstadoReclamo.EN_REVISION);
    }

    @Test
    void registraClicksDesdeElNavegador() throws Exception {
        long antes = clickRepository.count();
        mvc.perform(post("/api/auditoria/clicks")
                        .with(user("admin2").roles("ADMIN")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tipo\":\"CLICK\",\"ruta\":\"/tickets\",\"elemento\":\"tomar-ticket\",\"texto\":\"Tomar ticket\"}"))
                .andExpect(status().isAccepted());
        // Se guarda en segundo plano
        await().atMost(Duration.ofSeconds(10)).until(() -> clickRepository.count() > antes);
    }

    private String version(Ticket ticket) {
        return ticketRepository.findById(ticket.getId()).orElseThrow().getVersion().toString();
    }
}
