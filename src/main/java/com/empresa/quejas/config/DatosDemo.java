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
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
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
import java.util.UUID;

/**
 * Datos de ejemplo para el prototipo con H2. NO se ejecuta con el perfil "cloud",
 * así nunca escribe datos falsos en la base de datos real (que ya trae sus propios datos de prueba).
 */
@Component
@Profile("!cloud")
public class DatosDemo implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatosDemo.class);

    private static final String UA_CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            + "(KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
    private static final String UA_EDGE = UA_CHROME + " Edg/141.0.0.0";
    private static final String UA_FIREFOX = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0";

    @PersistenceContext
    private EntityManager entityManager;

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
        List<Ticket> tickets = crearTickets(admins);
        crearHistorialAccesos(admins, tickets);
        crearClicks(admins);
        log.info("Datos de ejemplo cargados: {} admins, {} tickets. Usuarios de prueba en el README.",
                admins.size(), ticketRepository.count());
    }

    // ---------- Administradores ----------

    private List<AdminUser> crearAdmins() {
        List<AdminUser> admins = new ArrayList<>();
        admins.add(nuevoAdmin("admin", "admin", "Lucía Paredes Ríos", Rol.SUPERVISOR, 400));
        admins.add(nuevoAdmin("admin2", "admin", "Jorge Huamán Quispe", Rol.ADMIN, 210));
        admins.add(nuevoAdmin("admin3", "admin", "Carla Mendoza Salas", Rol.OPERADOR, 95));
        return adminRepository.saveAll(admins);
    }

    private AdminUser nuevoAdmin(String username, String password, String nombre, Rol rol, int diasAntiguedad) {
        AdminUser admin = new AdminUser(username, passwordEncoder.encode(password), nombre,
                username + "@empresa.com.pe", rol);
        admin.setFechaCreacion(LocalDateTime.now().minusDays(diasAntiguedad));
        return admin;
    }

    // ---------- Tipos de reclamo y contribuyentes ----------

    /** Los mismos tipos (y plazos en días) que la tabla tipos_reclamo de la BD real. */
    private static final String[][] TIPOS = {
            {"PAGO_NO_REGISTRADO", "Pago realizado no reflejado", "15"},
            {"BENEFICIO_NO_APLICADO", "Beneficio o descuento no aplicado", "15"},
            {"ERROR_DATOS_CONTRIBUYENTE", "Datos personales incorrectos", "10"},
            {"COBRO_INDEBIDO", "Cobro indebido o duplicado", "30"},
            {"ERROR_DATOS_PREDIO", "Datos del predio incorrectos", "30"},
            {"IMPUGNACION_VALOR", "Impugnación de orden de pago o resolución", "45"},
            {"CONSTANCIA_NO_ADEUDO", "Problema con constancia de no adeudo", "10"},
            {"ATENCION_SERVICIO", "Queja por atención o servicio", "15"}};

    private static final String[] NOMBRES = {
            "María Fernanda Quispe", "Luis Alberto Ramos", "Rosa Elena Huamaní", "Carlos Eduardo Vargas",
            "Ana Lucía Torres", "Pedro Pablo Chávez", "Gabriela Rojas Soto", "Miguel Ángel Flores",
            "Sofía Valeria Castillo", "José Manuel Gutiérrez", "Daniela Paz Romero", "Renzo Javier Salazar",
            "Patricia Inés Cárdenas", "Diego Alonso Medina", "Valeria Noemí Ríos", "Fernando José Aguilar"};

    private List<TipoReclamo> crearTipos() {
        List<TipoReclamo> tipos = new ArrayList<>();
        for (String[] t : TIPOS) {
            TipoReclamo tipo = new TipoReclamo(UUID.randomUUID().toString(), t[0], t[1], Integer.parseInt(t[2]));
            entityManager.persist(tipo);
            tipos.add(tipo);
        }
        return tipos;
    }

    private List<Contribuyente> crearContribuyentes() {
        List<Contribuyente> contribuyentes = new ArrayList<>();
        for (int i = 0; i < NOMBRES.length; i++) {
            Contribuyente c = new Contribuyente(UUID.randomUUID().toString(), String.format("CON-%05d", 100 + i),
                    NOMBRES[i], String.valueOf(40000000 + rnd.nextInt(39999999)), correo(NOMBRES[i]),
                    "9" + (10000000 + rnd.nextInt(89999999)));
            entityManager.persist(c);
            contribuyentes.add(c);
        }
        return contribuyentes;
    }

    // ---------- Reclamos ----------

    /** tipo: posición en TIPOS. Los tres primeros tienen plazo corto: sirven para mostrar reclamos vencidos. */
    private record Plantilla(int tipo, String asunto, String descripcion, String pedido, Prioridad prioridad) {
    }

    private static final List<Plantilla> PLANTILLAS = List.of(
            new Plantilla(0, "Pagué mi arbitrio en agencia y sigue como deuda",
                    "Pagué el arbitrio del mes pasado en la agencia del centro y tengo el voucher, pero en la app "
                            + "sigue apareciendo la deuda como vencida.", "Que se registre mi pago y se actualice la deuda.",
                    Prioridad.ALTA),
            new Plantilla(1, "No se aplicó el descuento por pronto pago",
                    "Cancelé la totalidad del año dentro de la fecha del beneficio, pero el descuento no figura en mi "
                            + "estado de cuenta.", "Que se aplique el descuento al que tengo derecho.", Prioridad.MEDIA),
            new Plantilla(2, "Mi apellido está mal escrito en el sistema",
                    "En mis recibos aparece un apellido con una letra equivocada. Necesito corregirlo para otros trámites.",
                    "Que corrijan mis datos personales.", Prioridad.BAJA),
            new Plantilla(3, "Me cobraron dos veces la misma cuota",
                    "Revisando mis movimientos veo dos cargos por la misma cuota, con un día de diferencia.",
                    "Que me devuelvan o abonen el cobro duplicado.", Prioridad.ALTA),
            new Plantilla(4, "El área de mi predio no coincide con la escritura",
                    "En el sistema figura un área mayor a la de mi escritura, y por eso el impuesto sale más alto.",
                    "Que revisen y corrijan el área registrada.", Prioridad.MEDIA),
            new Plantilla(5, "No estoy de acuerdo con la orden de pago",
                    "Recibí una orden de pago por un predio que vendí hace dos años. Adjunto la minuta de venta.",
                    "Que se deje sin efecto la orden de pago.", Prioridad.ALTA),
            new Plantilla(6, "La constancia de no adeudo sale con deuda",
                    "Estoy al día en mis pagos, pero al solicitar la constancia de no adeudo el sistema la rechaza.",
                    "Que revisen mi cuenta y emitan la constancia.", Prioridad.MEDIA),
            new Plantilla(7, "Esperé más de una hora en la ventanilla",
                    "Fui a una consulta simple y tuve que esperar más de una hora. Había una sola ventanilla atendiendo.",
                    "Que se mejore la atención en horas punta.", Prioridad.BAJA));

    private static final String[] RESPUESTAS = {
            "Estimado(a) contribuyente, revisamos su caso y procedimos con la corrección. El ajuste se verá reflejado "
                    + "en un plazo máximo de 48 horas hábiles.",
            "Hemos validado la información con el área responsable. Le enviamos el detalle por correo y quedamos atentos "
                    + "a cualquier consulta adicional.",
            "Lamentamos la experiencia. Registramos su comentario y lo derivamos a la jefatura para tomar las acciones "
                    + "correspondientes.",
            "Su solicitud fue atendida. Puede verificar el cambio desde la app en la sección Mis movimientos."};

    private static final String[] PEDIDOS_INFO = {
            "Para continuar necesitamos el comprobante del pago (voucher o constancia del banco).",
            "Por favor adjunte una copia de su DNI y del documento que sustenta su reclamo."};

    private List<Ticket> crearTickets(List<AdminUser> admins) {
        List<TipoReclamo> tipos = crearTipos();
        List<Contribuyente> contribuyentes = crearContribuyentes();
        LocalDateTime ahora = LocalDateTime.now();
        int anio = LocalDate.now().getYear();
        List<Ticket> tickets = new ArrayList<>();

        for (int i = 0; i < 48; i++) {
            Plantilla p = i < 3 ? PLANTILLAS.get(i) : PLANTILLAS.get(rnd.nextInt(PLANTILLAS.size()));
            int horas;
            if (i < 3) horas = 24 * (16 + i * 3);                // pendientes ya vencidos
            else if (i < 10) horas = 1 + rnd.nextInt(110);        // pendientes
            else if (i < 18) horas = 3 + rnd.nextInt(120);        // por contestar
            else if (i < 22) horas = 24 + rnd.nextInt(200);       // observados
            else if (i < 32) horas = 12 + rnd.nextInt(200);       // resueltos
            else horas = 72 + rnd.nextInt(24 * 50);               // archivados

            LocalDateTime creado = ahora.minusHours(horas).minusMinutes(rnd.nextInt(60));
            Ticket t = new Ticket(
                    String.format("REC-%d-%06d", anio, 1001 + i),
                    contribuyentes.get(rnd.nextInt(contribuyentes.size())),
                    tipos.get(p.tipo()),
                    Canal.values()[rnd.nextInt(Canal.values().length)],
                    p.asunto(), p.descripcion(), p.pedido(), p.prioridad(), creado);

            if (i >= 10) {
                AdminUser agente = admins.get(rnd.nextInt(admins.size()));
                LocalDateTime tomado = creado.plusMinutes(20 + rnd.nextInt(200));
                t.tomar(agente, tomado);
                if (i >= 18 && i < 22) {
                    t.agregarNota(agente, "Falta el sustento del pago; se pide al contribuyente.", tomado.plusMinutes(10));
                    t.observar(agente, PEDIDOS_INFO[rnd.nextInt(PEDIDOS_INFO.length)],
                            ahora.toLocalDate().plusDays(5 + rnd.nextInt(8)), tomado.plusMinutes(30));
                } else if (i >= 22) {
                    int horasRespuesta = 1 + rnd.nextInt(Math.max(2, Math.min(horas - 1, 90)));
                    LocalDateTime resuelto = creado.plusHours(horasRespuesta);
                    if (rnd.nextInt(3) == 0) {
                        t.agregarNota(agente, "Se solicitó el sustento al área de operaciones.", resuelto.minusMinutes(30));
                    }
                    EstadoReclamo[] resoluciones = EstadoReclamo.resoluciones();
                    t.resolver(agente, resoluciones[rnd.nextInt(resoluciones.length)],
                            RESPUESTAS[rnd.nextInt(RESPUESTAS.length)],
                            String.format("RES-RCL-%d-%06d", anio, 1 + i), resuelto);
                    if (i >= 32) {
                        LocalDateTime archivado = resuelto.plusHours(24 + rnd.nextInt(48));
                        t.archivar(agente, archivado.isAfter(ahora) ? ahora.minusMinutes(5) : archivado);
                    }
                }
            }
            tickets.add(t);
        }
        return ticketRepository.saveAll(tickets);
    }

    private static String correo(String nombre) {
        String[] partes = java.text.Normalizer.normalize(nombre.toLowerCase(), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").split(" ");
        // example.com está reservado para ejemplos: nunca llega a un buzón real.
        return partes[0] + "." + partes[partes.length - 1] + "@example.com";
    }

    // ---------- Metadata: accesos de los últimos días ----------

    private void crearHistorialAccesos(List<AdminUser> admins, List<Ticket> tickets) {
        String[] uas = {UA_CHROME, UA_EDGE, UA_FIREFOX};
        List<LogMetadata> logs = new ArrayList<>();

        for (int a = 0; a < admins.size(); a++) {
            AdminUser admin = admins.get(a);
            String usuario = admin.getUsername();
            String ua = uas[a % uas.length];
            String ip = "10.20.1." + (21 + a);
            LocalDateTime anterior = null;
            LocalDateTime ultimo = null;

            for (int dia = 12; dia >= 1; dia--) {
                if (rnd.nextInt(5) == 0) continue; // algunos días sin conexión
                LocalDateTime entrada = LocalDate.now().minusDays(dia).atTime(8 + rnd.nextInt(2), rnd.nextInt(60));
                RequestInfo info = new RequestInfo(ip, ua, RequestInfo.detectarNavegador(ua), "Windows", sesion());
                Ticket ticket = tickets.get(10 + rnd.nextInt(tickets.size() - 10));

                if (rnd.nextInt(6) == 0) {
                    logs.add(conFecha(new LogMetadata(TipoEvento.LOGIN_FALLIDO, admin, usuario, info,
                            "Credenciales incorrectas", "administradores", admin.getId()), entrada.minusMinutes(2)));
                }
                logs.add(conFecha(new LogMetadata(TipoEvento.LOGIN_EXITOSO, admin, usuario, info,
                        "Acceso desde " + info.navegador() + " en Windows", "administradores", admin.getId()), entrada));
                logs.add(conFecha(new LogMetadata(TipoEvento.TICKET_TOMADO, admin, usuario, info,
                        ticket.getCodigo(), "reclamos", ticket.getId()), entrada.plusMinutes(15 + rnd.nextInt(60))));
                logs.add(conFecha(new LogMetadata(TipoEvento.TICKET_RESUELTO, admin, usuario, info,
                        ticket.getCodigo() + " (Fundado)", "reclamos", ticket.getId()),
                        entrada.plusHours(2).plusMinutes(rnd.nextInt(60))));
                logs.add(conFecha(new LogMetadata(TipoEvento.LOGOUT, admin, usuario, info,
                        "Cierre de sesión manual", "administradores", admin.getId()), entrada.plusHours(8 + rnd.nextInt(2))));
                anterior = ultimo;
                ultimo = entrada;
            }
            admin.setAccesoAnterior(anterior);
            admin.setUltimoAcceso(ultimo);
            admin.setUltimaIp(ip);
        }
        // Un intento sospechoso de un usuario que no existe
        RequestInfo externo = new RequestInfo("181.65.12.204", UA_CHROME, "Chrome", "Windows", null);
        logs.add(conFecha(new LogMetadata(TipoEvento.LOGIN_FALLIDO, null, "intruso", externo,
                "Credenciales incorrectas", "administradores", "desconocido"), LocalDateTime.now().minusHours(3)));
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
            new Click("/tickets/12", "resolver-ticket", "Resolver reclamo"),
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
                    admin,
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
