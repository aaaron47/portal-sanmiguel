package com.empresa.quejas.notificaciones;

import com.empresa.quejas.tickets.Canal;
import com.empresa.quejas.tickets.Prioridad;
import com.empresa.quejas.tickets.Ticket;
import com.empresa.quejas.tickets.TicketRepository;
import com.icegreen.greenmail.junit5.GreenMailExtension;
import com.icegreen.greenmail.util.ServerSetupTest;
import jakarta.mail.BodyPart;
import jakarta.mail.Multipart;
import jakarta.mail.Part;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.flash;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Envío de la respuesta al cliente por correo. GreenMail hace de servidor de correo dentro de la
 * prueba: recibe los correos sin enviarlos a nadie y permite revisar exactamente lo que salió.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:correos;DB_CLOSE_DELAY=-1",
        "spring.mail.host=localhost",
        "spring.mail.port=3025",
        "portal.correo.remitente=portal@example.com"})
@AutoConfigureMockMvc
class EnvioCorreoTests {

    @RegisterExtension
    static GreenMailExtension servidorCorreo = new GreenMailExtension(ServerSetupTest.SMTP);

    private static final AtomicInteger SECUENCIA = new AtomicInteger();
    private static final Duration ESPERA = Duration.ofSeconds(10);

    @Autowired
    MockMvc mvc;

    @Autowired
    TicketRepository ticketRepository;

    @Autowired
    NotificacionRepository notificacionRepository;

    @Autowired
    NotificacionService notificacionService;

    @Autowired
    TransactionTemplate transaccion;

    @Test
    void laRespuestaAlClienteLlegaPorCorreo() throws Exception {
        Ticket ticket = ticketEnAtencion("cliente@example.com");

        responder(ticket, "Revisamos su caso.\nEl ajuste se vera en 48 horas.", false);

        Notificacion notificacion = esperarResultado(ticket);
        assertThat(notificacion.getEstado()).isEqualTo(EstadoNotificacion.ENVIADO);
        assertThat(notificacion.getIntentos()).isEqualTo(1);

        MimeMessage correo = unicoCorreoRecibido();
        assertThat(correo.getAllRecipients()).extracting(Object::toString).containsExactly("cliente@example.com");
        assertThat(((InternetAddress) correo.getFrom()[0]).getAddress()).isEqualTo("portal@example.com");
        assertThat(correo.getSubject()).isEqualTo("[" + ticket.getCodigo() + "] " + ticket.getAsunto());
        assertThat(correo.getMessageID()).isEqualTo(notificacion.getMessageId());

        String texto = textoPlano(correo);
        assertThat(texto).contains("Revisamos su caso.\nEl ajuste se vera en 48 horas.");
        assertThat(texto).contains(EnvioCorreo.TEXTO_PIE);

        mvc.perform(get("/tickets/" + ticket.getId()).with(user("admin2").roles("ADMIN")))
                .andExpect(content().string(containsString("Correo enviado a cliente@example.com")))
                .andExpect(content().string(containsString("/js/correos.js")));
    }

    @Test
    void elEstadoDelCorreoSePuedeConsultarSinRecargarLaPagina() throws Exception {
        Ticket ticket = ticketEnAtencion("estado@example.com");
        // Aviso guardado sin disparar el envío: se queda "Enviando", como en el instante después de responder
        Notificacion pendiente = notificacionRepository.save(new Notificacion(new DatosRespuesta(ticket.getId(),
                ticket.getCodigo(), ticket.getAsunto(), ticket.getClienteNombre(), ticket.getClienteEmail(),
                888_888L, "Respuesta en camino.", "admin2"), LocalDateTime.now()));
        String url = "/tickets/" + ticket.getId() + "/correos/" + pendiente.getId();

        mvc.perform(get(url).with(user("admin2").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Enviando correo a estado@example.com")))
                .andExpect(content().string(containsString("data-pendiente=\"true\"")));

        notificacionService.enviar(pendiente.getId());

        mvc.perform(get(url).with(user("admin2").roles("ADMIN")))
                .andExpect(content().string(containsString("Correo enviado a estado@example.com")))
                .andExpect(content().string(not(containsString("data-pendiente"))));

        // El correo de un ticket no se puede consultar desde la ruta de otro
        Ticket otro = ticketEnAtencion("otro@example.com");
        mvc.perform(get("/tickets/" + otro.getId() + "/correos/" + pendiente.getId()).with(user("admin2").roles("ADMIN")))
                .andExpect(status().isNotFound());
    }

    @Test
    void laSegundaRespuestaContinuaElMismoHilo() throws Exception {
        Ticket ticket = ticketEnAtencion("hilo@example.com");

        responder(ticket, "Primera respuesta.", false);
        await().atMost(ESPERA).until(() -> servidorCorreo.getReceivedMessages().length == 1);
        await().atMost(ESPERA).until(() -> estados(ticket).equals(List.of(EstadoNotificacion.ENVIADO)));
        responder(ticket, "Segunda respuesta.", false);
        await().atMost(ESPERA).until(() -> servidorCorreo.getReceivedMessages().length == 2);

        MimeMessage primero = servidorCorreo.getReceivedMessages()[0];
        MimeMessage segundo = servidorCorreo.getReceivedMessages()[1];
        assertThat(segundo.getSubject()).isEqualTo("Re: " + primero.getSubject());
        assertThat(segundo.getHeader("In-Reply-To")[0]).isEqualTo(primero.getMessageID());
        assertThat(segundo.getHeader("References")[0]).contains(primero.getMessageID());
        assertThat(textoPlano(segundo)).contains("Segunda respuesta.").doesNotContain("Primera respuesta.");
    }

    @Test
    void unaNotaInternaNoEnviaCorreo() throws Exception {
        Ticket ticket = ticketEnAtencion("nota@example.com");

        responder(ticket, "Pedir sustento a operaciones.", true);

        assertThat(notificacionRepository.findByTicketId(ticket.getId())).isEmpty();
        assertThat(servidorCorreo.waitForIncomingEmail(1000, 1)).isFalse();
        // Una respuesta sin aviso de correo se muestra sin el bloque de estado
        mvc.perform(get("/tickets/" + ticket.getId()).with(user("admin2").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(content().string(not(containsString("class=\"correo"))));
    }

    @Test
    void siLaRespuestaSeRechazaPorConflictoNoSaleCorreo() throws Exception {
        Ticket ticket = ticketEnAtencion("conflicto@example.com");

        mvc.perform(post("/tickets/" + ticket.getId() + "/responder")
                        .param("version", String.valueOf(ticket.getVersion() + 5))
                        .param("mensaje", "No debería llegar.")
                        .with(user("admin2").roles("ADMIN")).with(csrf()))
                .andExpect(flash().attributeExists("error"));

        assertThat(notificacionRepository.findByTicketId(ticket.getId())).isEmpty();
        assertThat(servidorCorreo.waitForIncomingEmail(1000, 1)).isFalse();
    }

    @Test
    void siLaTransaccionDeLaRespuestaSeRevierteNoSaleCorreo() {
        Ticket ticket = ticketEnAtencion("revertido@example.com");

        // Simula un fallo al guardar la respuesta (por ejemplo, otro sistema cambió el ticket al mismo tiempo)
        transaccion.executeWithoutResult(estado -> {
            notificacionService.programarRespuesta(new DatosRespuesta(ticket.getId(), ticket.getCodigo(),
                    ticket.getAsunto(), ticket.getClienteNombre(), ticket.getClienteEmail(), 999_999L,
                    "Respuesta que nunca se guardó.", "admin2"));
            estado.setRollbackOnly();
        });

        assertThat(notificacionRepository.findByTicketId(ticket.getId())).isEmpty();
        assertThat(servidorCorreo.waitForIncomingEmail(1000, 1)).isFalse();
    }

    @Test
    void siElClienteNoTieneCorreoSeAvisaAlAdmin() throws Exception {
        Ticket ticket = ticketEnAtencion(null);

        responder(ticket, "Respuesta para un cliente sin correo.", false);

        assertThat(estados(ticket)).containsExactly(EstadoNotificacion.SIN_CORREO);
        assertThat(servidorCorreo.waitForIncomingEmail(1000, 1)).isFalse();
        mvc.perform(get("/tickets/" + ticket.getId()).with(user("admin2").roles("ADMIN")))
                .andExpect(content().string(containsString("el cliente no tiene uno registrado")));
    }

    @Test
    void siFallaElServidorDeCorreoSePuedeReenviar() throws Exception {
        Ticket ticket = ticketEnAtencion("reintento@example.com");
        servidorCorreo.stop();

        responder(ticket, "Respuesta que no sale a la primera.", false);

        Notificacion fallida = esperarResultado(ticket);
        assertThat(fallida.getEstado()).isEqualTo(EstadoNotificacion.FALLIDO);
        assertThat(fallida.getUltimoError()).isNotBlank();
        mvc.perform(get("/tickets/" + ticket.getId()).with(user("admin2").roles("ADMIN")))
                .andExpect(content().string(containsString("Reenviar correo")));

        servidorCorreo.start();
        mvc.perform(post("/tickets/" + ticket.getId() + "/correos/" + fallida.getId() + "/reenviar")
                        .with(user("admin3").roles("ADMIN")).with(csrf()))
                .andExpect(flash().attribute("ok", "Correo reenviado al cliente."));

        Notificacion reenviada = notificacionRepository.findById(fallida.getId()).orElseThrow();
        assertThat(reenviada.getEstado()).isEqualTo(EstadoNotificacion.ENVIADO);
        assertThat(reenviada.getIntentos()).isEqualTo(2);
        assertThat(unicoCorreoRecibido().getAllRecipients()[0].toString()).isEqualTo("reintento@example.com");

        // Ya enviado: un segundo reenvío se rechaza
        mvc.perform(post("/tickets/" + ticket.getId() + "/correos/" + fallida.getId() + "/reenviar")
                        .with(user("admin3").roles("ADMIN")).with(csrf()))
                .andExpect(flash().attributeExists("error"));
    }

    // ---------- Ayudas ----------

    /** Ticket propio de cada prueba, ya tomado por un admin, para no depender de los datos de ejemplo. */
    private Ticket ticketEnAtencion(String email) {
        Ticket ticket = new Ticket("T-" + SECUENCIA.incrementAndGet(), "Cliente de prueba", "40000000", email,
                "900000000", Canal.WEB, "Cobro indebido", "Cargo que no reconozco", "Descripción de prueba.",
                Prioridad.MEDIA, LocalDateTime.now().minusHours(2));
        ticket.tomar("admin2", LocalDateTime.now().minusHours(1));
        return ticketRepository.save(ticket);
    }

    private void responder(Ticket ticket, String mensaje, boolean notaInterna) throws Exception {
        Long version = ticketRepository.findById(ticket.getId()).orElseThrow().getVersion();
        mvc.perform(post("/tickets/" + ticket.getId() + "/responder")
                        .param("version", version.toString())
                        .param("mensaje", mensaje)
                        .param("notaInterna", String.valueOf(notaInterna))
                        .with(user("admin2").roles("ADMIN")).with(csrf()))
                .andExpect(flash().attributeExists("ok"));
    }

    private List<EstadoNotificacion> estados(Ticket ticket) {
        return notificacionRepository.findByTicketId(ticket.getId()).stream().map(Notificacion::getEstado).toList();
    }

    /** El envío ocurre en segundo plano: espera a que deje de estar pendiente. */
    private Notificacion esperarResultado(Ticket ticket) {
        await().atMost(ESPERA).until(() -> {
            List<EstadoNotificacion> estados = estados(ticket);
            return estados.size() == 1 && estados.get(0) != EstadoNotificacion.PENDIENTE;
        });
        return notificacionRepository.findByTicketId(ticket.getId()).get(0);
    }

    private MimeMessage unicoCorreoRecibido() {
        await().atMost(ESPERA).until(() -> servidorCorreo.getReceivedMessages().length == 1);
        return servidorCorreo.getReceivedMessages()[0];
    }

    /** Busca la versión en texto plano dentro del correo (que también trae una versión HTML). */
    static String textoPlano(Part parte) throws Exception {
        if (parte.isMimeType("text/plain")) {
            return ((String) parte.getContent()).replace("\r\n", "\n");
        }
        if (parte.getContent() instanceof Multipart multipart) {
            for (int i = 0; i < multipart.getCount(); i++) {
                BodyPart hija = multipart.getBodyPart(i);
                String texto = textoPlano(hija);
                if (texto != null) {
                    return texto;
                }
            }
        }
        return null;
    }
}
