package com.empresa.quejas.notificaciones;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.MailPreparationException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.UnsupportedEncodingException;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Arma y envía el correo con la respuesta al cliente.
 *
 * Todos los correos de un ticket forman un solo hilo: llevan el mismo asunto y citan a los anteriores
 * (cabeceras In-Reply-To y References), así el cliente ve la conversación completa en su bandeja.
 */
@Component
public class EnvioCorreo {

    static final String TEXTO_PIE = "Este correo es solo informativo y no recibe respuestas. "
            + "Para agregar información o continuar con su reclamo, ingrese a la app.";

    private final JavaMailSender mailSender;
    private final TemplateEngine plantillas;
    private final String remitente;
    private final String nombreRemitente;
    private final String redirigirA;

    public EnvioCorreo(JavaMailSender mailSender, TemplateEngine plantillas,
                       @Value("${portal.correo.remitente}") String remitente,
                       @Value("${portal.correo.nombre-remitente}") String nombreRemitente,
                       @Value("${portal.correo.redirigir-a:}") String redirigirA) {
        this.mailSender = mailSender;
        this.plantillas = plantillas;
        this.remitente = remitente;
        this.nombreRemitente = nombreRemitente;
        this.redirigirA = redirigirA == null || redirigirA.isBlank() ? null : redirigirA.trim();
    }

    /**
     * @param anteriores Message-ID de los correos ya enviados del mismo ticket, del más antiguo al más reciente
     * @return el Message-ID del correo enviado
     */
    public String enviar(Notificacion notificacion, List<String> anteriores) throws MailException {
        MimeMessage correo = mailSender.createMimeMessage();
        String messageId = "<portal." + notificacion.getId() + "." + UUID.randomUUID() + "@" + dominioRemitente() + ">";
        try {
            MimeMessageHelper helper = new MimeMessageHelper(correo, true, "UTF-8");
            helper.setFrom(remitente, nombreRemitente);
            helper.setTo(redirigirA != null ? redirigirA : notificacion.getDestinatario());
            helper.setSubject(asunto(notificacion, !anteriores.isEmpty()));
            helper.setText(textoPlano(notificacion), html(notificacion));

            // JavaMailSender respeta un Message-ID puesto a mano; así lo conocemos antes de enviar.
            correo.setHeader("Message-ID", messageId);
            if (!anteriores.isEmpty()) {
                correo.setHeader("In-Reply-To", anteriores.get(anteriores.size() - 1));
                correo.setHeader("References", String.join(" ", anteriores));
            }
        } catch (MessagingException | UnsupportedEncodingException e) {
            throw new MailPreparationException("No se pudo armar el correo: " + e.getMessage(), e);
        }
        mailSender.send(correo);
        return messageId;
    }

    private String asunto(Notificacion n, boolean continuaHilo) {
        String asunto = "[" + n.getTicketCodigo() + "] " + n.getTicketAsunto();
        if (continuaHilo) {
            asunto = "Re: " + asunto;
        }
        if (redirigirA != null) {
            asunto = "[Prueba, para " + n.getDestinatario() + "] " + asunto;
        }
        return asunto;
    }

    private String html(Notificacion n) {
        Context contexto = new Context(Locale.forLanguageTag("es-PE"));
        contexto.setVariable("n", n);
        contexto.setVariable("lineas", n.getMensaje().split("\\R", -1));
        contexto.setVariable("pie", TEXTO_PIE);
        return plantillas.process("correos/respuesta", contexto);
    }

    private static String textoPlano(Notificacion n) {
        return "Respuesta a su reclamo " + n.getTicketCodigo() + ": " + n.getTicketAsunto() + "\n\n"
                + n.getMensaje() + "\n\n"
                + "--\n" + TEXTO_PIE + "\n";
    }

    private String dominioRemitente() {
        int arroba = remitente.lastIndexOf('@');
        return arroba >= 0 ? remitente.substring(arroba + 1) : "portal.local";
    }
}
