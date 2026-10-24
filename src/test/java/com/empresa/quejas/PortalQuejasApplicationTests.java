package com.empresa.quejas;

import com.empresa.quejas.tickets.EstadoTicket;
import com.empresa.quejas.tickets.TicketRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
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
    void supervisorVeTodasLasPantallas() throws Exception {
        var supervisor = user("admin").roles("SUPERVISOR");
        String[] rutas = {
                "/", "/tickets", "/tickets?estado=EN_ATENCION&mios=true", "/tickets?estado=RESPONDIDO&q=cobro",
                "/tickets/1", "/historial", "/historial?canal=WEB", "/auditoria/clicks", "/auditoria/logs",
                "/auditoria/logs?tipo=LOGIN_FALLIDO", "/metadata", "/metadata/admin/admin2"};
        for (String ruta : rutas) {
            mvc.perform(get(ruta).with(supervisor))
                    .andExpect(status().isOk());
        }
    }

    @Test
    void adminNoVeAuditoria() throws Exception {
        mvc.perform(get("/auditoria/clicks").with(user("admin2").roles("ADMIN")))
                .andExpect(status().isForbidden());
    }

    @Test
    void tomarTicketPendienteYDetectarConflicto() throws Exception {
        var ticket = ticketRepository.findAll().stream()
                .filter(t -> t.getEstado() == EstadoTicket.PENDIENTE)
                .findFirst().orElseThrow();
        String url = "/tickets/" + ticket.getId() + "/tomar";

        mvc.perform(post(url).param("version", ticket.getVersion().toString())
                        .with(user("admin3").roles("ADMIN")).with(csrf()))
                .andExpect(status().is3xxRedirection())
                .andExpect(flash().attributeExists("ok"));

        assertThat(ticketRepository.findById(ticket.getId()).orElseThrow().getEstado())
                .isEqualTo(EstadoTicket.EN_ATENCION);

        // Misma versión antigua: debe rechazarse por conflicto
        mvc.perform(post(url).param("version", ticket.getVersion().toString())
                        .with(user("admin2").roles("ADMIN")).with(csrf()))
                .andExpect(flash().attributeExists("error"));
    }

    @Test
    void registraClicksDesdeElNavegador() throws Exception {
        mvc.perform(post("/api/auditoria/clicks")
                        .with(user("admin2").roles("ADMIN")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tipo\":\"CLICK\",\"ruta\":\"/tickets\",\"elemento\":\"tomar-ticket\",\"texto\":\"Tomar ticket\"}"))
                .andExpect(status().isAccepted());
    }
}
