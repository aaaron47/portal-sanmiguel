# Portal de quejas – administración (prototipo)

Portal web para que los administradores atiendan los reclamos (quejas) de los contribuyentes.
Spring Boot 3.5 + Thymeleaf + Spring Security + Spring Data JPA. Por defecto usa una base de datos H2
en memoria con datos de ejemplo, así que no necesita nada instalado aparte de Java 17+ y Maven.
Con el perfil `cloud` se conecta a la base de datos real (Oracle): ver [`docs/Conexion_Portal_Oracle.md`](docs/Conexion_Portal_Oracle.md).

## Cómo ejecutarlo

**Desde IntelliJ:** abre la carpeta `portal-quejas-admin` (File > Open), espera a que Maven
descargue las dependencias y ejecuta `PortalQuejasApplication`.

**Desde la terminal:**

```bash
mvn spring-boot:run
```

Luego entra a http://localhost:8080

Para correr las pruebas: `mvn test`.

## Usuarios de prueba (con H2)

| Usuario   | Contraseña | Rol           | Qué puede ver                               |
|-----------|------------|---------------|---------------------------------------------|
| `admin`   | `admin`    | Supervisor    | Todo, incluida la auditoría y la metadata de otros admins |
| `admin2`  | `admin`    | Administrador | Bandeja, historial y su propia metadata     |
| `admin3`  | `admin`    | Operador      | Bandeja, historial y su propia metadata     |

Tras 5 intentos fallidos la cuenta se bloquea 15 minutos (configurable en `application.yml`).

Los datos se regeneran cada vez que arranca la aplicación. Con la base Oracle real las cuentas son
`admin.demo`, `operador.demo` y `supervisor.demo`; sus contraseñas las entrega el responsable de la base de datos.

## Qué incluye

| Pantalla | Ruta | Descripción |
|---|---|---|
| Login | `/login` | Acceso de admins. Registra IP, navegador y resultado de cada intento. |
| Inicio | `/` | Distribución de tickets por estado, vencidos y por vencer (fecha límite de atención) y tus tickets por contestar. |
| Bandeja | `/tickets` | Pestañas de pendientes, por contestar, observados y resueltos, con búsqueda y filtros. |
| Detalle | `/tickets/{id}` | Lo que el admin ve en pantalla: reclamo, conversación, datos del contribuyente y acciones (tomar, pedir información, resolver, nota interna, archivar). |
| Historial | `/historial` | Tickets archivados, con filtros por canal y fechas. |
| Clicks de usuarios | `/auditoria/clicks` | Cada click y pantalla abierta, actividad por hora y elementos más usados. Solo supervisores. |
| Logs de metadata | `/auditoria/logs` | Accesos, intentos fallidos, cierres de sesión y acciones, con IP, navegador y sesión. Solo supervisores. |
| Mi metadata | `/metadata` | Datos de la cuenta, último acceso, accesos recientes y actividad. El supervisor puede ver la de cada admin. |

### Flujo de un ticket

```
PENDIENTE --tomar--> POR CONTESTAR --resolver--> RESUELTO --archivar--> ARCHIVADO
          <--devolver a pendientes--     |
                                  pedir información
                                         v
                                     OBSERVADO --resolver--> RESUELTO
```

"Resuelto" puede ser fundado, fundado en parte, infundado o improcedente (los estados finales de
`reclamos.estado`). Las notas internas no cambian el estado ni las ve el contribuyente.

### Correo al contribuyente

Cuando el admin **pide información** o **resuelve**, el contribuyente recibe un correo (las notas internas no se
envían). El correo sale recién cuando la acción quedó guardada y se envía en segundo plano. Todos los correos de un
ticket forman un solo hilo en su bandeja. Bajo cada mensaje, el detalle muestra si el correo se envió o si falló
(con el botón **Reenviar correo**). Si el contribuyente no tiene correo registrado, no se crea el aviso y el admin
ve una advertencia para que lo contacte por otro medio.
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
├── auth/        login (Argon2id), administradores, bloqueo por intentos, registro de acceso y salida
├── tickets/     bandeja, detalle, historial, reglas de negocio del ticket (tabla reclamos)
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

Ya está hecho: el portal usa la base Oracle `SANMI_APP` con la cuenta `SANMI_PORTAL_WEB`.

1. Crea un archivo `.env` en la raíz (git lo ignora) con `DB_HOST`, `DB_PORT`, `DB_SID`, `DB_USER`,
   `DB_PASSWORD` y `DB_SCHEMA`. La contraseña te la entrega el responsable de la base de datos.
2. Arranca con el perfil `cloud`: `SPRING_PROFILES_ACTIVE=cloud`. No se cargan datos de ejemplo y
   `ddl-auto` queda en `none` (la cuenta no puede crear ni alterar tablas).
3. Tu IP pública debe estar habilitada en AWS; si no, la conexión falla por tiempo de espera.

Qué tablas usa, qué permisos tiene la cuenta y cómo se verificó: [`docs/Conexion_Portal_Oracle.md`](docs/Conexion_Portal_Oracle.md).
Para comprobar la conexión: `mvn test -Dtest=OracleConexionTests -Doracle=true` (las escrituras se revierten).

**Concurrencia:** `Ticket` tiene `@Version`. Si la app móvil u otro sistema modifica un ticket
mientras el admin lo tiene abierto, la acción del admin se rechaza con un aviso en lugar de
pisar los cambios. En la base real, un trigger suma 1 a `reclamos.version` en cada actualización,
venga del portal o de la app.

## Pendiente para producción

- Notificación en la app móvil (el correo ya está; falta el buzón de la app).
- Gestión de usuarios admin: hoy las altas, bajas y contraseñas las hace el responsable de la base de datos.
- Adjuntos del reclamo y datos del predio/deuda en el detalle.
- Política de retención para los clicks (crecen rápido) y guardado por lotes si el volumen es alto.
- Pipeline de despliegue en `.github/workflows/ci.yml` cuando se defina el proveedor.
