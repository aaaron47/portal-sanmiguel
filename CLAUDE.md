# CLAUDE.md – Portal de quejas (administración)

Guía del proyecto para retomar el trabajo: contexto, decisiones tomadas, cómo está armado
el código, convenciones y lo que falta. Mantenerla al día cuando cambie algo importante.

## 1. Contexto del negocio

- Módulo web para que los **administradores atiendan las quejas** (tickets) de los clientes.
- Las quejas viven en una **base de datos compartida en la nube**. Esa misma BD la usan
  otros sistemas que **se conectan directamente** (sin API intermedia):
  - la app móvil de los clientes,
  - el módulo de reportes de estados de cuenta de los empleados,
  - otros sistemas internos.
- **Alcance actual (solo el portal admin):**
  - Tickets pendientes y por contestar, y lo que el admin ve en pantalla al abrir uno.
  - Historial de tickets archivados.
  - Login del admin.
  - Registro de los clicks de los usuarios y auditoría.
  - Logs de metadata.
  - Módulo para mostrar la metadata del admin.
- **Supuesto a confirmar:** "clicks de los usuarios" se interpretó como los clicks de los
  **admins dentro del portal**. Si se refería a los clientes en la app móvil, esos datos los
  tendría que generar la app móvil y quedan fuera de este portal.

## 2. Decisiones de arquitectura

| Decisión | Motivo |
|---|---|
| **Una sola aplicación Spring Boot + Thymeleaf** (sin separar front y back) | Como los otros sistemas siguen yendo directo a la BD, una API aparte no sería la "dueña" de los datos y duplicaría trabajo. Si más adelante la empresa decide que todos pasen por una API, se extrae desde la capa de servicios. |
| **Código organizado por funcionalidad** (`auth`, `tickets`, `auditoria`, `metadata`) y no por capa | Cada módulo queda aislado y se podría separar en el futuro. |
| **Un solo repositorio** en GitHub con un pipeline (`.github/workflows/ci.yml`) | Alcance pequeño; un solo artefacto que desplegar. |
| **Tablas propias con prefijo `portal_`** para auditoría, metadata y usuarios admin | No mezclar datos del portal con las tablas de otros sistemas. |
| **`ddl-auto: validate` en la BD real** (perfil `cloud`), nunca `update` | La BD es compartida: el portal no debe crear ni alterar tablas. |
| **Bloqueo optimista (`@Version`) en `Ticket`** | La app móvil u otro sistema puede modificar un ticket mientras el admin lo tiene abierto; el cambio del admin se rechaza en vez de pisar datos. |
| **Clicks guardados de forma asíncrona (`@Async`)** | Generan mucho volumen; no deben frenar la navegación ni cargar la BD compartida. |
| **H2 en memoria con datos de ejemplo** en el prototipo | Poder probar sin acceso a la BD real. |

## 3. Stack

- Java 17, Spring Boot **3.5.15** (Maven, `spring-boot-starter-parent`).
- Spring Web, Thymeleaf (+ `thymeleaf-extras-springsecurity6`), Spring Security,
  Spring Data JPA, Validation, Mail (`spring-boot-starter-mail`), DevTools.
- Pruebas: GreenMail (`greenmail-junit5`, servidor SMTP falso) y Awaitility (esperar el envío `@Async`).
- H2 (prototipo). El driver de la BD real se agrega cuando se confirme el motor
  (hay un comentario en `pom.xml` con las opciones).
- Front: HTML con Thymeleaf, `static/css/app.css` y `static/js/tracker.js`, sin frameworks JS.
  Tipografía IBM Plex Sans desde Google Fonts.

## 4. Comandos

```bash
mvn spring-boot:run          # levantar en http://localhost:8080
mvn test                     # pruebas de humo (arrancan la app completa con H2)
mvn -B verify                # lo mismo que corre el pipeline de GitHub
```

En IntelliJ: ejecutar `PortalQuejasApplication`. Tras cambiar plantillas, si no se ven los
cambios, detener y volver a ejecutar.

Perfil de la BD real: `SPRING_PROFILES_ACTIVE=cloud` con las variables `DB_URL`, `DB_USER`
y `DB_PASSWORD` (en GitHub, como Secrets). Con ese perfil no se cargan datos de ejemplo.

Perfil de correo real: `smtp` (se combina, p. ej. `cloud,smtp`) con `MAIL_HOST`, `MAIL_PORT`,
`MAIL_USERNAME` y `MAIL_PASSWORD`. Sin ese perfil el correo apunta a `localhost:1025` (no existe)
y nunca sale a internet. `CORREO_REDIRIGIR_A` manda todos los correos a una dirección de pruebas.

Una sola prueba: `mvn test -Dtest=EnvioCorreoTests` (o `-Dtest=Clase#metodo`).

Variables locales: se pueden poner en un `.env` en la raíz (ignorado por git). Los documentos de
trabajo `docs/*.docx` (p. ej. `docs/Conexion_BD_Backend_Movil.docx`, referencia de la rama
`conexion-bd`) tampoco se suben.

### Usuarios de prueba (se crean al arrancar, solo fuera del perfil `cloud`)

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `admin` | Supervisor, Lucía Paredes (ve auditoría y la metadata de todos) |
| `admin2` | `admin` | Administrador, Jorge Huamán |
| `admin3` | `admin` | Administrador, Carla Mendoza |

5 intentos fallidos bloquean la cuenta 15 minutos (`portal.login.*` en `application.yml`).
Los datos se regeneran en cada arranque.

## 5. Estructura del código

```
src/main/java/com/empresa/quejas/
├── PortalQuejasApplication.java   (@EnableAsync)
├── auth/        AdminUser, Rol, AdminUserDetailsService, LoginController,
│                LoginExitosoHandler, LoginFallidoHandler (bloqueo), LogoutAuditoriaHandler
├── tickets/     Ticket (reglas de estado), TicketRespuesta, EstadoTicket, Prioridad, Canal,
│                TicketService, TicketController (bandeja, detalle, historial, acciones),
│                InicioController, excepciones de conflicto y no encontrado
├── auditoria/   EventoClick, TipoInteraccion, ClickApiController (POST del tracker),
│                AuditoriaService (@Async + resumen por hora), AuditoriaController
├── metadata/    LogMetadata, TipoEvento, RequestInfo (IP, navegador, SO, sesión),
│                MetadataService, MetadataController (perfil del admin)
├── notificaciones/ Notificacion (portal_notificaciones), EstadoNotificacion, DatosRespuesta,
│                NotificacionService (publica el evento NotificacionProgramada),
│                EnvioCorreo (arma el correo y el hilo), EnvioEnSegundoPlano (@Async + AFTER_COMMIT,
│                escucha NotificacionProgramada), NotificacionController (estado y reenviar)
├── config/      SecurityConfig, DatosDemo (@Profile("!cloud"))
└── web/         DatosComunesAdvice (usuario y contadores para el menú), Filtros (paginación)

src/main/resources/
├── application.yml / application-cloud.yml / application-smtp.yml
├── templates/   fragments/layout.html (head, menú, avisos, paginación, celda de antigüedad),
│                login, inicio, error, tickets/{bandeja,detalle,historial},
│                auditoria/{clicks,logs}, metadata/perfil, correos/respuesta,
│                tickets/correo (fragmento con el estado del correo)
└── static/      css/app.css, js/tracker.js, js/correos.js (estado del correo sin recargar)

src/test/java/.../PortalQuejasApplicationTests.java   (pruebas de humo con MockMvc)
src/test/java/.../notificaciones/                     EnvioCorreoTests, RedireccionCorreoTests (GreenMail)
```

### Pantallas y permisos

| Ruta | Pantalla | Acceso |
|---|---|---|
| `/login` | Login | Público |
| `/` | Inicio: tickets por estado, vencidos, mis tickets | Admin y supervisor |
| `/tickets?estado=...` | Bandeja: pendientes, por contestar, respondidos | Admin y supervisor |
| `/tickets/{id}` | Detalle y acciones del ticket | Admin y supervisor |
| `GET /tickets/{id}/correos/{n}` | Fragmento con el estado del correo (lo consulta `correos.js`) | Admin y supervisor |
| `POST /tickets/{id}/correos/{n}/reenviar` | Reenvía un correo que falló | Admin y supervisor |
| `/historial` | Tickets archivados | Admin y supervisor |
| `/metadata` | Mi metadata | Admin y supervisor |
| `/metadata/admin/{usuario}` | Metadata de otro admin | Solo supervisor |
| `/auditoria/clicks` | Clicks de usuarios | Solo supervisor |
| `/auditoria/logs` | Logs de metadata | Solo supervisor |
| `POST /api/auditoria/clicks` | Recibe eventos del tracker | Sesión iniciada + CSRF |

### Flujo de un ticket

```
PENDIENTE --tomar--> EN_ATENCION ("por contestar") --responder--> RESPONDIDO --archivar--> ARCHIVADO
    ^                     |
    +--- liberar ---------+
```

- Las reglas viven en la entidad `Ticket` (`tomar`, `liberar`, `responder`, `archivar`).
- Una **nota interna** no cambia el estado ni la ve el cliente.
- Cada **respuesta al cliente** crea un aviso en `portal_notificaciones` dentro de la misma
  transacción; el correo sale después del commit (`EnvioEnSegundoPlano`). Si la respuesta falla,
  no sale nada. Los correos de un ticket van en un solo hilo (`Message-ID`, `In-Reply-To`,
  `References`) y el cuerpo solo lleva la nueva respuesta. El pie indica que el correo no recibe
  respuestas y que el cliente siga por la app. Mientras dice "Enviando", `correos.js` consulta el
  estado cada 1,5 s y lo actualiza sin recargar (máximo un minuto).
- Antigüedad: alerta a las **24 h** y vencido a las **72 h** sin primera respuesta
  (`Ticket.HORAS_ALERTA`, `Ticket.HORAS_VENCIDO`).

## 6. Convenciones

- **Idioma:** nombres de clases, métodos, variables, tablas y textos de la interfaz en español.
- **Textos de la interfaz:** en lenguaje simple, sin tecnicismos; los errores dicen qué pasó
  y cómo resolverlo; los botones dicen la acción exacta ("Tomar ticket", "Archivar").
- **Controladores:** siempre con nombre explícito en `@RequestParam(name = "...")` y
  `@PathVariable("...")`.
- **`open-in-view: false`:** si una vista necesita relaciones, cargarlas en el servicio
  (ver `TicketRepository.findConRespuestas`, con `join fetch`).
- **Auditoría:** `MetadataService.registrar` usa `REQUIRES_NEW` para que el registro se guarde
  aunque la acción falle. Toda acción nueva sobre tickets debe registrar su evento
  (agregar el valor en `TipoEvento`).
- **Acciones sobre tickets:** los formularios envían la `version` del ticket; el servicio la
  compara antes de modificar (`cargarVerificandoVersion`).
- **Clicks:** para que un elemento aparezca con nombre claro en los reportes, agregar
  `data-track="nombre-claro"` en el HTML. El usuario, la IP y la hora los pone el servidor,
  nunca el navegador.
- **Datos de ejemplo:** solo en `DatosDemo`, que nunca corre con el perfil `cloud`. Los correos
  de ejemplo usan `@example.com` (dominio reservado, nunca llega a un buzón real).
- **Correos:** la plantilla HTML lleva estilos en línea y colores copiados de `app.css` (los
  clientes de correo no leen variables CSS). El envío no abre transacción para no retener
  conexiones de la BD compartida mientras se espera al servidor SMTP.
- **Credenciales:** nunca en el repositorio; solo variables de entorno o GitHub Secrets.

### Diseño visual

- Base fría (`--fondo #F2F4F6`, `--acento #12606B`). El color fuerte se reserva para el
  **tiempo de espera**: verde `--reciente`, ámbar `--alerta`, rojo `--vencido`.
- El elemento distintivo es la **barra de antigüedad** de cada ticket (fragmento
  `antiguedad(t)` en `layout.html`), repetida como firma en la pantalla de login.
- Todos los colores están como variables en `:root` de `app.css`; no usar colores sueltos.
- Responsive: el menú lateral pasa a barra superior por debajo de 860 px; las tablas se
  desplazan horizontalmente.

## 7. Errores conocidos y cómo evitarlos

- **IntelliJ marca errores que Maven no tiene:** tras cambiar el `pom.xml` hay que recargar Maven
  (ventana Maven > *Reload All Maven Projects*, o el ícono flotante *Load Maven Changes*).
- **`th:replace` se evalúa antes que `th:if`** en el mismo elemento: poner el `th:if` en un
  `th:block` que envuelva al `th:replace` (ver el estado del correo en `tickets/detalle.html`).

- **Mapas con claves enum en Thymeleaf/SpEL:** usar `mapa.get(e)`, **no** `mapa[e]`.
  Con corchetes, SpEL toma `e` como texto literal y falla con
  `No enum constant EstadoTicket.e`. Este error rompió la pantalla de Inicio el 23/10/2026
  y se corrigió en `inicio.html` y `tickets/bandeja.html`.
- **Records en plantillas:** los componentes de un `record` se leen con sintaxis de método,
  por ejemplo `${resumen.conteo()}`, `${resumen.vencidos()}`.

## 8. Bitácora de avance

| Fecha | Avance |
|---|---|
| 23/10/2026 | Se definió el alcance y la arquitectura (monolito Spring Boot + Thymeleaf, BD compartida). |
| 23/10/2026 | Se creó el prototipo completo: login con bloqueo, inicio, bandeja, detalle con acciones, historial, auditoría de clicks, logs de metadata, metadata del admin, datos de ejemplo, pruebas de humo, pipeline de CI y README. |
| 23/10/2026 | Primera ejecución en local: el login funciona. Se corrigió el error de la pantalla de Inicio (mapas con enum en SpEL). |
| 26/10/2026 | Rama `feature/envio-correos`: correo al cliente con cada respuesta (hilo, reenvío, estado en el detalle), perfil `smtp` y pruebas con GreenMail. |

**Estado actual:** prototipo funcionando en local con H2. Falta verificar el resto de las
pantallas en el navegador y correr `mvn test` en la máquina local.

## 9. Pendientes

**Por confirmar con el equipo**
- [ ] Qué significa "clicks de los usuarios": admins en el portal (supuesto actual) o clientes en la app.
- [ ] Motor de la BD (PostgreSQL, MySQL, SQL Server, Oracle) y proveedor de nube.
- [ ] Nombres reales de las tablas y columnas de tickets que usan la app móvil y reportes.

**Siguientes pasos técnicos**
- [ ] Verificar todas las pantallas y correr `mvn test`.
- [ ] Crear el repositorio en GitHub, subir el código y proteger la rama `main`.
- [ ] Ajustar `@Table`/`@Column` de `Ticket` y `TicketRespuesta` a la BD real y agregar el driver.
- [ ] Agregar columna de versión a la tabla de tickets (coordinar con los otros sistemas).
- [ ] Scripts versionados (Flyway) para las tablas `portal_*`.
- [x] Envío de la respuesta al cliente por correo (rama `feature/envio-correos`).
- [ ] Probar el correo con un servidor real (cuenta Gmail del equipo + `CORREO_REDIRIGIR_A`).
- [ ] Notificación en la app móvil cuando tenga su buzón de reclamos.
- [ ] Reintento automático de correos fallidos (hoy solo se reenvía a mano).
- [ ] Gestión de usuarios admin (alta, baja, cambio de contraseña).
- [ ] Política de retención de clicks y guardado por lotes si el volumen es alto.
- [ ] Paso de despliegue en el pipeline cuando se defina el proveedor.
