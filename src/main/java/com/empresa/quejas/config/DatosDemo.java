package com.empresa.quejas.config;

import com.empresa.quejas.auditoria.EventoClick;
import com.empresa.quejas.auditoria.EventoClickRepository;
import com.empresa.quejas.auditoria.TipoInteraccion;
import com.empresa.quejas.auth.AdminUser;
import com.empresa.quejas.auth.AdminUserRepository;
import com.empresa.quejas.auth.Rol;
import com.empresa.quejas.metadata.LogMetadata;
import com.empresa.quejas.metadata.LogMetadataRepository;
import com.empresa.quejas.metadata.RequestInfo;
import com.empresa.quejas.metadata.TipoEvento;
import com.empresa.quejas.tickets.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Datos de ejemplo para el prototipo. NO se ejecuta con el perfil "cloud",
 * así nunca escribe datos falsos en la base de datos real.
 */
@Component
@Profile("!cloud")
public class DatosDemo implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatosDemo.class);

    private static final String UA_CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            + "(KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
    private static final String UA_EDGE = UA_CHROME + " Edg/141.0.0.0";
    private static final String UA_FIREFOX = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0";

    private final AdminUserRepository adminRepository;
    private final TicketRepository ticketRepository;
    private final LogMetadataRepository logRepository;
    private final EventoClickRepository clickRepository;
    private final PasswordEncoder passwordEncoder;
    private final Random rnd = new Random(42);

    public DatosDemo(AdminUserRepository adminRepository, TicketRepository ticketRepository,
                     LogMetadataRepository logRepository, EventoClickRepository clickRepository,
                     PasswordEncoder passwordEncoder) {
        this.adminRepository = adminRepository;
        this.ticketRepository = ticketRepository;
        this.logRepository = logRepository;
        this.clickRepository = clickRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (adminRepository.count() > 0) {
            return;
        }
        List<AdminUser> admins = crearAdmins();
        crearTickets(admins);
        crearHistorialAccesos(admins);
        crearClicks(admins);
        log.info("Datos de ejemplo cargados: {} admins, {} tickets. Usuarios de prueba en el README.",
                admins.size(), ticketRepository.count());
    }

    // ---------- Administradores ----------

    private List<AdminUser> crearAdmins() {
        List<AdminUser> admins = new ArrayList<>();
        admins.add(nuevoAdmin("admin", "admin", "Lucía Paredes Ríos", Rol.SUPERVISOR, 400));
        admins.add(nuevoAdmin("admin2", "admin", "Jorge Huamán Quispe", Rol.ADMIN, 210));
        admins.add(nuevoAdmin("admin3", "admin", "Carla Mendoza Salas", Rol.ADMIN, 95));
        return adminRepository.saveAll(admins);
    }

    private AdminUser nuevoAdmin(String username, String password, String nombre, Rol rol, int diasAntiguedad) {
        AdminUser admin = new AdminUser(username, passwordEncoder.encode(password), nombre,
                username + "@empresa.com.pe", rol);
        admin.setFechaCreacion(LocalDateTime.now().minusDays(diasAntiguedad));
        return admin;
    }

    // ---------- Tickets ----------

    private record Plantilla(String categoria, String asunto, String descripcion, Prioridad prioridad) {
    }

    private static final List<Plantilla> PLANTILLAS = List.of(
            new Plantilla("Cobro indebido", "Me cobraron dos veces la cuota de octubre",
                    "Revisando mis movimientos veo dos cargos por la misma cuota del préstamo, con un día de diferencia. "
                            + "Solicito la devolución del cobro duplicado.", Prioridad.ALTA),
            new Plantilla("Estado de cuenta", "El estado de cuenta no refleja mi último pago",
                    "Pagué en agencia el día 5 y tengo el voucher, pero en la app sigue apareciendo la deuda como vencida "
                            + "y me están llegando mensajes de cobranza.", Prioridad.ALTA),
            new Plantilla("Problema con la app", "La app se cierra al intentar pagar",
                    "Cada vez que entro a la opción de pagar con tarjeta la aplicación se cierra. Ya la reinstalé y sigue "
                            + "pasando. Uso un Android actualizado.", Prioridad.MEDIA),
            new Plantilla("Demora en atención", "Esperé más de una hora en agencia",
                    "Fui a la agencia del centro para una consulta simple y tuve que esperar más de una hora. Había solo "
                            + "una ventanilla atendiendo.", Prioridad.BAJA),
            new Plantilla("Trato del personal", "El asesor no quiso registrar mi reclamo",
                    "Pedí registrar un reclamo por un cobro y el asesor me dijo que lo hiciera por la web. Considero que "
                            + "debían atenderme en ese momento.", Prioridad.MEDIA),
            new Plantilla("Información incorrecta", "Me informaron una tasa distinta a la del contrato",
                    "Al solicitar el crédito me indicaron una tasa y en el contrato figura otra más alta. Quiero que "
                            + "revisen la grabación de la llamada.", Prioridad.ALTA),
            new Plantilla("Tarjeta", "No me llega la tarjeta solicitada hace tres semanas",
                    "Solicité la reposición de mi tarjeta por robo y hasta ahora no me la entregan. No puedo usar mi "
                            + "cuenta con normalidad.", Prioridad.MEDIA),
            new Plantilla("Problema con la app", "No puedo actualizar mis datos desde la app",
                    "Intento cambiar mi número de celular y me sale un error genérico. Necesito actualizarlo para recibir "
                            + "los códigos de seguridad.", Prioridad.BAJA),
            new Plantilla("Cobro indebido", "Cargo por un seguro que no contraté",
                    "En mi estado de cuenta aparece un cargo mensual por seguro de desgravamen adicional que nunca "
                            + "acepté. Pido la anulación y devolución.", Prioridad.ALTA),
            new Plantilla("Demora en atención", "Mi solicitud de devolución sigue sin respuesta",
                    "Hace diez días me dijeron que la devolución tardaría 48 horas y todavía no la veo reflejada. "
                            + "Nadie me da información.", Prioridad.MEDIA));

    private static final String[] NOMBRES = {
            "María Fernanda Quispe", "Luis Alberto Ramos", "Rosa Elena Huamaní", "Carlos Eduardo Vargas",
            "Ana Lucía Torres", "Pedro Pablo Chávez", "Gabriela Rojas Soto", "Miguel Ángel Flores",
            "Sofía Valeria Castillo", "José Manuel Gutiérrez", "Daniela Paz Romero", "Renzo Javier Salazar",
            "Patricia Inés Cárdenas", "Diego Alonso Medina", "Valeria Noemí Ríos", "Fernando José Aguilar"};

    private static final String[] RESPUESTAS = {
            "Estimado(a) cliente, revisamos su caso y procedimos con la corrección. El ajuste se verá reflejado en un "
                    + "plazo máximo de 48 horas hábiles.",
            "Hemos validado la información con el área responsable. Le enviamos el detalle por correo y quedamos atentos "
                    + "a cualquier consulta adicional.",
            "Lamentamos la experiencia. Registramos su comentario y lo derivamos a la jefatura de la agencia para "
                    + "tomar las acciones correspondientes.",
            "Su solicitud fue atendida. Puede verificar el cambio desde la app en la sección Mis movimientos."};

    private void crearTickets(List<AdminUser> admins) {
        LocalDateTime ahora = LocalDateTime.now();
        int anio = LocalDate.now().getYear();
        List<Ticket> tickets = new ArrayList<>();

        for (int i = 0; i < 48; i++) {
            Plantilla p = PLANTILLAS.get(rnd.nextInt(PLANTILLAS.size()));
            String nombre = NOMBRES[rnd.nextInt(NOMBRES.length)];
            int horas;
            if (i < 10) horas = 1 + rnd.nextInt(110);           // pendientes (algunos ya vencidos)
            else if (i < 18) horas = 3 + rnd.nextInt(120);      // por contestar
            else if (i < 26) horas = 12 + rnd.nextInt(200);     // respondidos
            else horas = 72 + rnd.nextInt(24 * 50);             // archivados

            LocalDateTime creado = ahora.minusHours(horas).minusMinutes(rnd.nextInt(60));
            Ticket t = new Ticket(
                    String.format("Q-%d-%04d", anio, 1200 + i),
                    nombre,
                    String.valueOf(40000000 + rnd.nextInt(39999999)),
                    correo(nombre),
                    "9" + (10000000 + rnd.nextInt(89999999)),
                    Canal.values()[rnd.nextInt(Canal.values().length)],
                    p.categoria(), p.asunto(), p.descripcion(), p.prioridad(),
                    creado);

            if (i >= 10) {
                String agente = admins.get(rnd.nextInt(admins.size())).getUsername();
                t.tomar(agente, creado.plusMinutes(20 + rnd.nextInt(200)));
                if (i >= 18) {
                    int horasRespuesta = 1 + rnd.nextInt(Math.max(2, Math.min(horas - 1, 90)));
                    LocalDateTime respondido = creado.plusHours(horasRespuesta);
                    if (rnd.nextInt(3) == 0) {
                        t.responder(agente, "Se solicitó el sustento al área de operaciones.", true,
                                respondido.minusMinutes(30));
                    }
                    t.responder(agente, RESPUESTAS[rnd.nextInt(RESPUESTAS.length)], false, respondido);
                    if (i >= 26) {
                        LocalDateTime archivado = respondido.plusHours(24 + rnd.nextInt(48));
                        t.archivar(archivado.isAfter(ahora) ? ahora.minusMinutes(5) : archivado);
                    }
                }
            }
            tickets.add(t);
        }
        ticketRepository.saveAll(tickets);
    }

    private static String correo(String nombre) {
        String[] partes = java.text.Normalizer.normalize(nombre.toLowerCase(), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").split(" ");
        return partes[0] + "." + partes[partes.length - 1] + "@correo.pe";
    }

    // ---------- Metadata: accesos de los últimos días ----------

    private void crearHistorialAccesos(List<AdminUser> admins) {
        String[] uas = {UA_CHROME, UA_EDGE, UA_FIREFOX};
        List<LogMetadata> logs = new ArrayList<>();

        for (int a = 0; a < admins.size(); a++) {
            AdminUser admin = admins.get(a);
            String ua = uas[a % uas.length];
            String ip = "10.20.1." + (21 + a);
            LocalDateTime anterior = null;
            LocalDateTime ultimo = null;

            for (int dia = 12; dia >= 1; dia--) {
                if (rnd.nextInt(5) == 0) continue; // algunos días sin conexión
                LocalDateTime entrada = LocalDate.now().minusDays(dia).atTime(8 + rnd.nextInt(2), rnd.nextInt(60));
                RequestInfo info = new RequestInfo(ip, ua, RequestInfo.detectarNavegador(ua), "Windows", sesion());

                if (rnd.nextInt(6) == 0) {
                    logs.add(conFecha(new LogMetadata(TipoEvento.LOGIN_FALLIDO, admin.getUsername(), info,
                            "Credenciales incorrectas"), entrada.minusMinutes(2)));
                }
                logs.add(conFecha(new LogMetadata(TipoEvento.LOGIN_EXITOSO, admin.getUsername(), info,
                        "Acceso desde " + info.navegador() + " en Windows"), entrada));
                logs.add(conFecha(new LogMetadata(TipoEvento.TICKET_TOMADO, admin.getUsername(), info,
                        String.format("Q-%d-%04d", LocalDate.now().getYear(), 1200 + 10 + rnd.nextInt(38))),
                        entrada.plusMinutes(15 + rnd.nextInt(60))));
                logs.add(conFecha(new LogMetadata(TipoEvento.TICKET_RESPONDIDO, admin.getUsername(), info,
                        "Respuesta al cliente"), entrada.plusHours(2).plusMinutes(rnd.nextInt(60))));
                logs.add(conFecha(new LogMetadata(TipoEvento.LOGOUT, admin.getUsername(), info,
                        "Cierre de sesión manual"), entrada.plusHours(8 + rnd.nextInt(2))));
                anterior = ultimo;
                ultimo = entrada;
            }
            admin.setAccesoAnterior(anterior);
            admin.setUltimoAcceso(ultimo);
            admin.setUltimaIp(ip);
        }
        // Un intento sospechoso de un usuario que no existe
        RequestInfo externo = new RequestInfo("181.65.12.204", UA_CHROME, "Chrome", "Windows", null);
        logs.add(conFecha(new LogMetadata(TipoEvento.LOGIN_FALLIDO, "intruso", externo, "Credenciales incorrectas"),
                LocalDateTime.now().minusHours(3)));
        logRepository.saveAll(logs);
        adminRepository.saveAll(admins);
    }

    private static LogMetadata conFecha(LogMetadata log, LocalDateTime fecha) {
        log.setFecha(fecha);
        return log;
    }

    private String sesion() {
        return Integer.toHexString(0x10000000 + rnd.nextInt(0x6fffffff)).toUpperCase();
    }

    // ---------- Clicks de ejemplo ----------

    private record Click(String ruta, String elemento, String texto) {
    }

    private static final List<Click> CLICKS = List.of(
            new Click("/tickets?estado=PENDIENTE", "tab-estado", "Pendientes"),
            new Click("/tickets?estado=PENDIENTE", "abrir-ticket", "Ver ticket"),
            new Click("/tickets?estado=EN_ATENCION", "tab-estado", "Por contestar"),
            new Click("/tickets/12", "tomar-ticket", "Tomar ticket"),
            new Click("/tickets/12", "enviar-respuesta", "Enviar respuesta"),
            new Click("/tickets/7", "archivar-ticket", "Archivar"),
            new Click("/historial", "buscar-historial", "Buscar"),
            new Click("/", "menu-bandeja", "Bandeja"),
            new Click("/", "menu-historial", "Historial"),
            new Click("/tickets?estado=PENDIENTE", "filtrar-bandeja", "Filtrar"));

    private void crearClicks(List<AdminUser> admins) {
        List<EventoClick> eventos = new ArrayList<>();
        LocalDateTime ahora = LocalDateTime.now();
        long minutosHoy = java.time.Duration.between(LocalDate.now().atStartOfDay(), ahora).toMinutes();

        for (int i = 0; i < 260; i++) {
            AdminUser admin = admins.get(rnd.nextInt(admins.size()));
            Click c = CLICKS.get(rnd.nextInt(CLICKS.size()));
            LocalDateTime fecha;
            if (i < 120 && minutosHoy > 10) {
                // Hoy, concentrado en horario de oficina cuando aplica
                long inicio = minutosHoy > 8 * 60 ? 8 * 60 : 0;
                fecha = LocalDate.now().atStartOfDay().plusMinutes(inicio + (long) (rnd.nextDouble() * (minutosHoy - inicio)));
            } else {
                fecha = LocalDate.now().minusDays(1 + rnd.nextInt(6)).atTime(8 + rnd.nextInt(10), rnd.nextInt(60));
            }
            boolean vista = rnd.nextInt(4) == 0;
            EventoClick e = new EventoClick(
                    vista ? TipoInteraccion.VISTA : TipoInteraccion.CLICK,
                    admin.getUsername(),
                    c.ruta(),
                    vista ? "pagina" : c.elemento(),
                    vista ? "Portal de quejas" : c.texto(),
                    "10.20.1." + (21 + admins.indexOf(admin)),
                    sesion());
            e.setFecha(fecha);
            eventos.add(e);
        }
        clickRepository.saveAll(eventos);
    }
}
