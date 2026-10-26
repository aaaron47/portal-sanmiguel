# Portal de quejas – administración (prototipo)

Prototipo del portal web para que los administradores atiendan las quejas de los clientes.
Spring Boot 3.5 + Thymeleaf + Spring Security + Spring Data JPA. Usa una base de datos H2
en memoria con datos de ejemplo, así que no necesita nada instalado aparte de Java 17+ y Maven.

## Cómo ejecutarlo

**Desde IntelliJ:** abre la carpeta `portal-quejas-admin` (File > Open), espera a que Maven
descargue las dependencias y ejecuta `PortalQuejasApplication`.

**Desde la terminal:**

```bash
mvn spring-boot:run
```

Luego entra a http://localhost:8080

Para correr las pruebas: `mvn test`.

## Usuarios de prueba

| Usuario   | Contraseña | Rol           | Qué puede ver                               |
|-----------|------------|---------------|---------------------------------------------|
| `admin`   | `admin`    | Supervisor    | Todo, incluida la auditoría y la metadata de otros admins |
| `admin2`  | `admin`    | Administrador | Bandeja, historial y su propia metadata     |
| `admin3`  | `admin`    | Administrador | Bandeja, historial y su propia metadata     |

Tras 5 intentos fallidos la cuenta se bloquea 15 minutos (configurable en `application.yml`).

Los datos se regeneran cada vez que arranca la aplicación.

## Qué incluye

| Pantalla | Ruta | Descripción |
|---|---|---|
| Login | `/login` | Acceso de admins. Registra IP, navegador y resultado de cada intento. |
| Inicio | `/` | Distribución de tickets por estado, vencidos (>72 h) y tus tickets por contestar. |
| Bandeja | `/tickets` | Pestañas de pendientes, por contestar y respondidos, con búsqueda y filtros. |
| Detalle | `/tickets/{id}` | Lo que el admin ve en pantalla: queja, conversación, datos del cliente y acciones (tomar, responder, nota interna, archivar). |
| Historial | `/historial` | Tickets archivados, con filtros por canal y fechas. |
| Clicks de usuarios | `/auditoria/clicks` | Cada click y pantalla abierta, actividad por hora y elementos más usados. Solo supervisores. |
| Logs de metadata | `/auditoria/logs` | Accesos, intentos fallidos, cierres de sesión y acciones, con IP, navegador y sesión. Solo supervisores. |
| Mi metadata | `/metadata` | Datos de la cuenta, último acceso, accesos recientes y actividad. El supervisor puede ver la de cada admin. |

### Flujo de un ticket

```
PENDIENTE --tomar--> EN ATENCIÓN (por contestar) --responder--> RESPONDIDO --archivar--> ARCHIVADO
              <--devolver a pendientes--
```

Las notas internas no cambian el estado ni las ve el cliente.

### Correo al cliente

Cada respuesta al cliente (no las notas internas) le llega por correo. El correo sale recién
cuando la respuesta quedó guardada y se envía en segundo plano. Todos los correos de un ticket
forman un solo hilo en la bandeja del cliente. Bajo cada respuesta, el detalle muestra si el
correo se envió, si falló (con el botón **Reenviar correo**) o si el cliente no tiene correo.
Ese aviso se actualiza solo, sin recargar la página (`static/js/correos.js`).

Sin configurar nada, el portal apunta a un servidor de correo local que no existe, así que
**ningún correo sale a internet**: las respuestas aparecen como "No se pudo enviar el correo".
Las pruebas automáticas (`mvn test`) usan GreenMail, un servidor falso que recibe los correos
y permite revisarlos.

Para enviar correos de verdad (por ejemplo con una cuenta de Gmail del equipo), arranca con el
perfil `smtp` y estas variables de entorno:

| Variable | Ejemplo | Nota |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | `smtp` (o `cloud,smtp`) | |
| `MAIL_HOST` / `MAIL_PORT` | `smtp.gmail.com` / `587` | |
| `MAIL_USERNAME` | la cuenta de Gmail | También se usa como remitente. |
| `MAIL_PASSWORD` | contraseña de aplicación | En Gmail: activar la verificación en dos pasos y crear una "contraseña de aplicación". Nunca la contraseña normal ni en el repositorio. |
| `CORREO_REDIRIGIR_A` | tu propio correo | Opcional, para probar: todos los correos van a esa dirección en lugar de la del cliente. |

## Estructura

```
src/main/java/com/empresa/quejas/
├── auth/        login, usuarios admin, bloqueo por intentos, registro de acceso y salida
├── tickets/     bandeja, detalle, historial, reglas de negocio del ticket
├── auditoria/   registro de clicks (API + pantallas de auditoría)
├── metadata/    logs de metadata y pantalla de metadata del admin
├── notificaciones/  correo al cliente con cada respuesta (envío, hilo, reenvío)
├── config/      seguridad y datos de ejemplo
└── web/         utilidades comunes de las vistas
src/main/resources/
├── templates/   vistas Thymeleaf (fragments/layout.html tiene el menú y piezas comunes;
│                correos/ tiene la plantilla del correo al cliente)
└── static/      css/app.css y js/tracker.js (registro de clicks)
```

## Cómo funciona el registro de clicks

`static/js/tracker.js` se carga en todas las pantallas con sesión iniciada. Envía al servidor
una "vista" al abrir cada pantalla y un "click" por cada enlace, botón o elemento con
`data-track`. El servidor agrega el usuario, la IP y la hora (el navegador no puede falsearlos)
y lo guarda en segundo plano (`@Async`) para no hacer más lenta la navegación.

Para que un elemento aparezca con un nombre claro en los reportes, agrega `data-track="nombre"`.

## Pasar a la base de datos compartida en la nube

1. Agrega el driver de tu motor en `pom.xml` (hay un comentario con las opciones).
2. Define las variables de entorno `DB_URL`, `DB_USER` y `DB_PASSWORD`.
3. Arranca con el perfil `cloud`: `SPRING_PROFILES_ACTIVE=cloud`.
   Con ese perfil no se cargan datos de ejemplo y `ddl-auto` queda en `validate`.
4. Ajusta `@Table` y `@Column` de `Ticket` y `TicketRespuesta` a los nombres reales de las
   tablas que ya usan la app móvil y reportes.
5. Las tablas propias del portal (`portal_admin_usuarios`, `portal_log_metadata`,
   `portal_eventos_click`, `portal_notificaciones`) deben crearse con scripts revisados (por ejemplo, con Flyway),
   coordinados con los dueños de la base de datos.

**Concurrencia:** `Ticket` tiene `@Version`. Si la app móvil u otro sistema modifica un ticket
mientras el admin lo tiene abierto, la acción del admin se rechaza con un aviso en lugar de
pisar los cambios. Para que funcione en la BD real, la tabla necesita una columna de versión
y los otros sistemas deberían incrementarla al actualizar.

## Pendiente para producción

- Scripts de base de datos versionados (Flyway) para las tablas propias.
- Notificación en la app móvil (el correo ya está; falta el buzón de la app).
- Gestión de usuarios admin (alta, baja, cambio de contraseña).
- Política de retención para los clicks (crecen rápido) y guardado por lotes si el volumen es alto.
- Pipeline de despliegue en `.github/workflows/ci.yml` cuando se defina el proveedor.
