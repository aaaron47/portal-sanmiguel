package com.empresa.quejas.notificaciones;

import com.empresa.quejas.TicketsDePrueba;
import com.empresa.quejas.tickets.Ticket;
import com.empresa.quejas.tickets.TicketRepository;
import com.icegreen.greenmail.junit5.GreenMailExtension;
import com.icegreen.greenmail.util.ServerSetupTest;
import jakarta.mail.internet.MimeMessage;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * Con portal.correo.redirigir-a, ningún correo llega al contribuyente real: todos van a la dirección de pruebas.
 * Es lo que protege a los contribuyentes cuando se prueba con un servidor de correo real.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:redireccion;DB_CLOSE_DELAY=-1",
        "spring.mail.host=localhost",
        "spring.mail.port=3025",
        "portal.correo.redirigir-a=pruebas@example.com"})
@AutoConfigureMockMvc
class RedireccionCorreoTests {

    @RegisterExtension
    static GreenMailExtension servidorCorreo = new GreenMailExtension(ServerSetupTest.SMTP);

    @Autowired
    MockMvc mvc;

    @Autowired
    TicketRepository ticketRepository;

    @Autowired
    NotificacionRepository notificacionRepository;

    @Autowired
    TransactionTemplate transaccion;

    @PersistenceContext
    EntityManager em;

    @Test
    void conRedireccionElCorreoVaALaDireccionDePruebas() throws Exception {
        Ticket ticket = TicketsDePrueba.crear(transaccion, em, ticketRepository, "contribuyente.real@example.com", "admin2");

        pedirInformacion(ticket, "Necesitamos el comprobante.");
        await().atMost(Duration.ofSeconds(10)).until(() -> servidorCorreo.getReceivedMessages().length == 1);
        MimeMessage correo = servidorCorreo.getReceivedMessages()[0];
        assertThat(correo.getAllRecipients()).extracting(Object::toString).containsExactly("pruebas@example.com");
        assertThat(correo.getSubject())
                .isEqualTo("[Prueba, para contribuyente.real@example.com] [" + ticket.getCodigo() + "] Cargo que no reconozco");

        // El segundo correo debe seguir en el mismo hilo: "Re: " al inicio y el resto del asunto idéntico
        await().atMost(Duration.ofSeconds(10)).until(() -> notificacionRepository.findByReclamoId(ticket.getId()).stream()
                .allMatch(n -> n.getEstado() == EstadoNotificacion.ENVIADO));
        resolver(ticket, "Segunda respuesta.");
        await().atMost(Duration.ofSeconds(10)).until(() -> servidorCorreo.getReceivedMessages().length == 2);
        MimeMessage segundo = servidorCorreo.getReceivedMessages()[1];
        assertThat(segundo.getSubject()).isEqualTo("Re: " + correo.getSubject());
        assertThat(segundo.getHeader("In-Reply-To")[0]).isEqualTo(correo.getMessageID());
    }

    private void pedirInformacion(Ticket ticket, String mensaje) throws Exception {
        mvc.perform(post("/tickets/" + ticket.getId() + "/observar")
                .param("version", versionActual(ticket))
                .param("mensaje", mensaje)
                .with(user("admin2").roles("ADMIN")).with(csrf()));
    }

    private void resolver(Ticket ticket, String mensaje) throws Exception {
        mvc.perform(post("/tickets/" + ticket.getId() + "/resolver")
                .param("version", versionActual(ticket))
                .param("resolucion", "FUNDADO")
                .param("mensaje", mensaje)
                .with(user("admin2").roles("ADMIN")).with(csrf()));
    }

    private String versionActual(Ticket ticket) {
        return ticketRepository.findById(ticket.getId()).orElseThrow().getVersion().toString();
    }
}
