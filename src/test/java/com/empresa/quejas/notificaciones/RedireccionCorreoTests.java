package com.empresa.quejas.notificaciones;

import com.empresa.quejas.tickets.Canal;
import com.empresa.quejas.tickets.Prioridad;
import com.empresa.quejas.tickets.Ticket;
import com.empresa.quejas.tickets.TicketRepository;
import com.icegreen.greenmail.junit5.GreenMailExtension;
import com.icegreen.greenmail.util.ServerSetupTest;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Duration;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * Con portal.correo.redirigir-a, ningún correo llega al cliente real: todos van a la dirección de pruebas.
 * Es lo que protege a los clientes cuando se prueba con un servidor de correo real.
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

    @Test
    void conRedireccionElCorreoVaALaDireccionDePruebas() throws Exception {
        Ticket ticket = new Ticket("T-REDIR-1", "Cliente real", "40000000", "cliente.real@example.com", "900000000",
                Canal.WEB, "Cobro indebido", "Cargo que no reconozco", "Descripción.", Prioridad.MEDIA,
                LocalDateTime.now().minusHours(2));
        ticket.tomar("admin2", LocalDateTime.now().minusHours(1));
        ticket = ticketRepository.save(ticket);

        mvc.perform(post("/tickets/" + ticket.getId() + "/responder")
                .param("version", ticket.getVersion().toString())
                .param("mensaje", "Respuesta de prueba.")
                .with(user("admin2").roles("ADMIN")).with(csrf()));

        await().atMost(Duration.ofSeconds(10)).until(() -> servidorCorreo.getReceivedMessages().length == 1);
        MimeMessage correo = servidorCorreo.getReceivedMessages()[0];
        assertThat(correo.getAllRecipients()).extracting(Object::toString).containsExactly("pruebas@example.com");
        assertThat(correo.getSubject()).startsWith("[Prueba, para cliente.real@example.com] ");
    }
}
