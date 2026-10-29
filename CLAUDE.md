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
| **Tablas propias con prefijo `portal_`** (`portal_notificaciones`, `portal_eventos_click`); administradores y auditoría viven en `administradores` y `auditoria` de SANMI_APP | No mezclar datos del portal con las tablas de otros sistemas; lo compartido (admins, auditoría) lo definió el responsable de la BD. |
| **`ddl-auto: none` en la BD real** (perfil `cloud`), nunca `update` | La BD es compartida y la cuenta `SANMI_PORTAL_WEB` no tiene DDL: el portal no crea ni altera tablas. |
| **Los "tickets" del portal son la tabla `reclamos`** (`Ticket` → `reclamos`, `TicketRespuesta` → `reclamo_seguimientos`) | El nombre del código y de la interfaz se mantiene; lo que cambia es el mapeo. Ver `docs/Conexion_Portal_Oracle.md`. |
| **Columnas no permitidas con `updatable = false`** en las entidades | La cuenta solo puede actualizar algunas columnas; si Hibernate incluyera otra en un `UPDATE` daría `ORA-01031`. |
| **Bloqueo optimista (`@Version`) en `Ticket`** | La app móvil u otro sistema puede modificar un ticket mientras el admin lo tiene abierto; el cambio del admin se rechaza en vez de pisar datos. |
| **Clicks guardados de forma asíncrona (`@Async`)** | Generan mucho volumen; no deben frenar la navegación ni cargar la BD compartida. |
| **H2 en memoria con datos de ejemplo** en el prototipo | Poder probar sin acceso a la BD real. |

## 3. Stack

- Java 17, Spring Boot **3.5.15** (Maven, `spring-boot-starter-parent`).
- Spring Web, Thymeleaf (+ `thymeleaf-extras-springsecurity6`), Spring Security,
  Spring Data JPA, Validation, Mail (`spring-boot-starter-mail`), DevTools.
- Pruebas: GreenMail (`greenmail-junit5`, servidor SMTP falso) y Awaitility (esperar el envío `@Async`).
- H2 (prototipo y pruebas) y Oracle 19c (BD real, driver `ojdbc11`). Las contraseñas de los
  administradores son Argon2id: se verifican con `Argon2PasswordEncoder` (dependencia `bcprov-jdk18on`).
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

Perfil de la BD real (Oracle): `SPRING_PROFILES_ACTIVE=cloud` con las variables `DB_HOST`, `DB_PORT`,
`DB_SID`, `DB_USER`, `DB_PASSWORD` y `DB_SCHEMA` (en GitHub, como Secrets). Con ese perfil no se cargan
datos de ejemplo. La cuenta es `SANMI_PORTAL_WEB`; la conexión y lo que se verificó están en
`docs/Conexion_Portal_Oracle.md`.

Comprobar contra Oracle (no corre con `mvn test`; las escrituras se revierten):
`mvn test -Dtest=OracleConexionTests -Doracle=true`.

Perfil de correo real: `smtp` (se combina, p. ej. `cloud,smtp`) con `MAIL_HOST`, `MAIL_PORT`,
`MAIL_USERNAME` y `MAIL_PASSWORD`. Sin ese perfil el correo apunta a `localhost:1025` (no existe)
y nunca sale a internet. `CORREO_REDIRIGIR_A` manda todos los correos a una dirección de pruebas.

Una sola prueba: `mvn test -Dtest=EnvioCorreoTests` (o `-Dtest=Clase#metodo`).

Variables locales: se ponen en un `.env` en la raíz (ignorado por git); `application.yml` lo importa solo
(`spring.config.import`). Maven no está en el PATH de esta máquina: usar el de IntelliJ o
`C:\Users\aaron\.m2\wrapper\dists\apache-maven-3.9.11\...\bin\mvn.cmd`. Los documentos de
trabajo `docs/*.docx` (p. ej. `docs/Conexion_BD_Backend_Movil.docx`, referencia de la rama
`conexion-bd`) tampoco se suben.

### Usuarios de prueba con H2 (se crean al arrancar, solo fuera del perfil `cloud`)

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `admin` | Supervisor, Lucía Paredes (ve auditoría y la metadata de todos) |
| `admin2` | `admin` | Administrador, Jorge Huamán |
| `admin3` | `admin` | Operador, Carla Mendoza |

Los datos se regeneran en cada arranque.

### Usuarios de prueba en Oracle (perfil `cloud`)

`admin.demo` (ADMIN), `operador.demo` (OPERADOR) y `supervisor.demo` (SUPERVISOR). Las contraseñas están en el
documento del responsable de la BD, **no en el repositorio**. Los administradores los da de alta el responsable
de la BD; el portal no puede insertarlos.

5 intentos fallidos bloquean la cuenta 15 minutos (`portal.login.*` en `application.yml`).

## 5. Estructura del código

```
src/main/java/com/empresa/quejas/
├── PortalQuejasApplication.java   (@EnableAsync)
├── auth/        AdminUser (tabla administradores), Rol, EstadoAdmin, AdminDirectorio (usuario → id),
│                AdminUserDetailsService, LoginController, LoginExitosoHandler,
│                LoginFallidoHandler (bloqueo), LogoutAuditoriaHandler
├── tickets/     Ticket (tabla reclamos, reglas de estado), TicketRespuesta (reclamo_seguimientos),
│                Contribuyente y TipoReclamo (solo lectura), EstadoReclamo (valores de la BD),
│                EstadoTicket (grupos de la bandeja), Prioridad, Canal, NumeracionResoluciones,
│                TicketService, TicketController (bandeja, detalle, historial, acciones),
│                InicioController, excepciones de conflicto y no encontrado
├── auditoria/   EventoClick (portal_eventos_click), TipoInteraccion, ClickApiController (POST del tracker),
│                AuditoriaService (@Async + resumen por hora), AuditoriaController
├── metadata/    LogMetadata (tabla auditoria, origen WEB, JSON en datos), TipoEvento,
│                RequestInfo (IP, navegador, SO, sesión), MetadataService, MetadataController
├── notificaciones/ Notificacion (portal_notificaciones), EstadoNotificacion, DatosRespuesta,
│                NotificacionService (publica el evento NotificacionProgramada),
│                EnvioCorreo (arma el correo y el hilo), EnvioEnSegundoPlano (@Async + AFTER_COMMIT,
│                escucha NotificacionProgramada), NotificacionController (estado y reenviar)
├── config/      SecurityConfig, DatosDemo (@Profile("!cloud"))
└── web/         DatosComunesAdvice (usuario y contadores para el menú), Filtros (paginación)

src/main/resources/
├── application.yml / application-cloud.yml / application-smtp.yml
├── schema.sql   (solo H2: la secuencia seq_resolucion)
├── templates/   fragments/layout.html (head, menú, avisos, paginación, celda de antigüedad),
│                login, inicio, error, tickets/{bandeja,detalle,historial},
│                auditoria/{clicks,logs}, metadata/perfil, correos/respuesta,
│                tickets/correo (fragmento con el estado del correo)
└── static/      css/app.css, js/tracker.js, js/correos.js (estado del correo sin recargar)

src/test/java/.../PortalQuejasApplicationTests.java   (pruebas de humo con MockMvc y H2; incluye el flujo completo)
src/test/java/.../TicketsDePrueba.java                (crea reclamos propios para cada prueba)
src/test/java/.../notificaciones/                     EnvioCorreoTests, RedireccionCorreoTests (GreenMail)
src/test/java/.../OracleConexionTests.java            (contra Oracle real; solo con -Doracle=true, escrituras revertidas)
```

### Pantallas y permisos

| Ruta | Pantalla | Acceso |
|---|---|---|
| `/login` | Login | Público |
| `/` | Inicio: tickets por estado, vencidos, mis tickets | Admin y supervisor |
| `/tickets?estado=...` | Bandeja: pendientes, por contestar, observados, resueltos (`RESPONDIDO`) | Admin y supervisor |
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

Grupos de la bandeja (`EstadoTicket`) y su valor en `reclamos.estado` (`EstadoReclamo`):

```
PENDIENTE        REGISTRADO   --tomar-->            EN_ATENCION (por contestar) = EN_REVISION
   ^                                                  |        |           |
   +------------- devolver a pendientes --------------+        |           |
                                                     pedir información   resolver
                                                              v           v
                                OBSERVADO <--(la app móvil lo devuelve a EN_REVISION)
                                      |                     RESPONDIDO (resueltos) = FUNDADO,
                                      +-------resolver----> FUNDADO_EN_PARTE, INFUNDADO o IMPROCEDENTE
                                                              |
                                                          archivar
                                                              v
                                                          ARCHIVADO
```

- Las reglas viven en la entidad `Ticket` (`tomar`, `liberar`, `agregarNota`, `observar`, `resolver`, `archivar`).
- Una **nota interna** no cambia el estado ni la ve el contribuyente.
- **Pedir información** y **resolver** crean un aviso en `portal_notificaciones` dentro de la misma
  transacción; el correo sale después del commit (`EnvioEnSegundoPlano`). Si la acción falla,
  no sale nada. Los correos de un ticket van en un solo hilo (`Message-ID`, `In-Reply-To`,
  `References`) y el cuerpo solo lleva el nuevo mensaje. El pie indica que el correo no recibe
  respuestas y que el contribuyente siga por la app. Mientras dice "Enviando", `correos.js` consulta el
  estado cada 1,5 s y lo actualiza sin recargar (máximo un minuto). Si el contribuyente no tiene correo
  no se crea el aviso (la tabla exige destinatario): queda `CORREO_FALLIDO` en la auditoría y el admin ve un aviso.
- Plazo: se usa `reclamos.fecha_limite_atencion`. **Alerta** si faltan 3 días o menos
  (`Ticket.DIAS_ALERTA`), **vencido** si ya pasó. Solo corre en `REGISTRADO` y `EN_REVISION`.
- Todas las reglas, columnas y permisos están explicados en `docs/Conexion_Portal_Oracle.md`.

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
  (agregar el valor en `TipoEvento`). La tabla `auditoria` es compartida con la app móvil: el portal
  solo escribe y lee las acciones de `TipoEvento` con `origen = 'WEB'`. No guardar contraseñas, hashes
  ni tokens en `datos`.
- **Entidades sobre Oracle:** ids UUID como `String` (`@UuidGenerator`); instantes en UTC en la BD y
  `LocalDateTime` local en Java (`hibernate.jdbc.time_zone: UTC`); toda columna que la cuenta no puede
  actualizar lleva `updatable = false`; no usar `orphanRemoval` ni borrar (no hay `DELETE`).
  Las tablas de otros sistemas (`Contribuyente`, `TipoReclamo`) son `@Immutable` y solo mapean lo que el portal lee.
- **Acciones sobre tickets:** los formularios envían la `version` del ticket; el servicio la
  compara antes de modificar (`cargarVerificandoVersion`).
- **Clicks:** para que un elemento aparezca con nombre claro en los reportes, agregar
  `data-track="nombre-claro"` en el HTML. El usuario, la IP y la hora los pone el servidor,
  nunca el navegador.
- **Datos de ejemplo:** solo en `DatosDemo`, que nunca corre con el perfil `cloud`. Los correos
  de ejemplo usan `@example.com` (dominio reservado, nunca llega a un buzón real).
- **Pruebas:** las pruebas normales usan H2 y nunca tocan Oracle. `OracleConexionTests` solo corre con
  `-Doracle=true` y todo lo que escribe lo revierte. No poner contraseñas en pruebas ni documentos.
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
- **Dos enums que se referencian entre sí** (`EstadoTicket` y `EstadoReclamo`) rompen el arranque
  (`ExceptionInInitializerError` → "Could not create DynamicParameterizedType"). Solo `EstadoTicket` apunta a
  `EstadoReclamo` en su constructor; `EstadoReclamo.getGrupo()` busca el grupo al usarlo.
- **`ORA-01031` al guardar:** Hibernate incluyó en el `UPDATE` una columna que la cuenta no puede actualizar.
  Marcarla `updatable = false` (ver la tabla de permisos en `docs/Conexion_Portal_Oracle.md`).
- **Scripts largos en la terminal de Git Bash:** si un `python` o `cat` con heredoc falla con "unexpected EOF",
  no aplicó nada; crear los archivos con el editor en lugar de la terminal.

## 8. Bitácora de avance

| Fecha | Avance |
|---|---|
| 23/10/2026 | Se definió el alcance y la arquitectura (monolito Spring Boot + Thymeleaf, BD compartida). |
| 23/10/2026 | Se creó el prototipo completo: login con bloqueo, inicio, bandeja, detalle con acciones, historial, auditoría de clicks, logs de metadata, metadata del admin, datos de ejemplo, pruebas de humo, pipeline de CI y README. |
| 23/10/2026 | Primera ejecución en local: el login funciona. Se corrigió el error de la pantalla de Inicio (mapas con enum en SpEL). |
| 26/10/2026 | Rama `feature/envio-correos`: correo al cliente con cada respuesta (hilo, reenvío, estado en el detalle), perfil `smtp` y pruebas con GreenMail. |
| 27/10/2026 | Rama `conexion-bd`: se documenta la conexión a Oracle (cuenta de la app móvil) y se piden al responsable de la BD la cuenta del portal y las tablas que faltan (`docs/datos_faltantes.md`). |
| 28/10/2026 | El responsable de la BD entrega la cuenta `SANMI_PORTAL_WEB`, `administradores`, `portal_notificaciones`, `portal_eventos_click` y las columnas nuevas de `reclamos`. El portal se conecta a Oracle: entidades sobre las tablas reales, login Argon2id, estados nuevos (observado, resuelto), tres acciones de atención (nota, pedir información, resolver), plazo por `fecha_limite_atencion`, auditoría en `auditoria`. 21 pruebas con H2 y 8 contra Oracle pasan. Detalle en `docs/Conexion_Portal_Oracle.md`. |

**Estado actual:** el portal funciona con H2 (por defecto) y con la BD Oracle real (perfil `cloud`). Se probó
en Oracle el login, las 10 pantallas y las escrituras dentro de transacciones revertidas. No se probó el envío
de correo con un SMTP real ni escrituras confirmadas sobre los reclamos de prueba.

## 9. Pendientes

**Por confirmar con el equipo**
- [ ] Qué significa "clicks de los usuarios": admins en el portal (supuesto actual) o clientes en la app.
- [x] Motor de la BD: Oracle 19c en AWS RDS (28/10/2026).
- [x] Nombres reales de las tablas y columnas: `reclamos`, `reclamo_seguimientos`, etc. (28/10/2026).
- [ ] ¿"Tomar" debe ser visible para el contribuyente? (hoy sí, como en los reclamos de prueba; "devolver" y "archivar" son internos).
- [ ] Formato de `numero_resolucion` (se copió `RES-RCL-AAAA-NNNNNN` de los reclamos de prueba).
- [ ] Quién devuelve un reclamo de `OBSERVADO` a `EN_REVISION` (hoy lo supone la app móvil al subsanar).
- [ ] Habilitar en AWS la IP del servidor donde se despliegue el portal.

**Siguientes pasos técnicos**
- [x] Verificar todas las pantallas y correr `mvn test`.
- [ ] Crear el repositorio en GitHub, subir el código y proteger la rama `main`.
- [x] Ajustar las entidades a la BD real, agregar el driver y la columna de versión (la agregó el responsable de la BD, con trigger).
- [ ] Probar escrituras confirmadas (commit) sobre reclamos de prueba acordándolo con quien usa la app móvil.
- [ ] Adjuntos del reclamo (`reclamo_adjuntos`): el portal tiene permiso de leer e insertar, pero aún no los muestra ni los sube.
- [ ] Datos del predio, deuda y valor del reclamo en la pantalla de detalle (el portal puede leer esas tablas).
- [x] Envío de la respuesta al cliente por correo (rama `feature/envio-correos`).
- [ ] Probar el correo con un servidor real (cuenta Gmail del equipo + `CORREO_REDIRIGIR_A`).
- [ ] Notificación en la app móvil cuando tenga su buzón de reclamos.
- [ ] Reintento automático de correos fallidos (hoy solo se reenvía a mano).
- [ ] Gestión de usuarios admin: hoy la hace el responsable de la BD (la cuenta del portal no puede insertar ni cambiar contraseñas).
- [ ] Política de retención de clicks y guardado por lotes si el volumen es alto.
- [ ] Paso de despliegue en el pipeline cuando se defina el proveedor.
