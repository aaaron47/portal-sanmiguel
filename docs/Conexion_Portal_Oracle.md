# Conexión del portal a Oracle (SANMI_APP)

Registro de cómo quedó conectado el portal a la base de datos real, qué se verificó y qué decisiones se tomaron.
Fecha: 28/10/2026 · Rama: `conexion-bd`.

> **La contraseña de la cuenta no se escribe aquí ni en el repositorio.** Va en el `.env` local (ignorado por git)
> o en GitHub Secrets. El documento del responsable de la BD ("Base de datos Oracle – Portal de reclamos",
> 28/10/2026) es la fuente de las credenciales y de las cuentas de prueba.

## 1. Estado

El responsable de la BD respondió a `docs/datos_faltantes.md`: creó la cuenta del portal, las tablas
propias y las columnas pedidas. Se comprobó todo desde esta máquina (ver sección 5). **No hay datos
de producción**: las cuentas y los 5 reclamos de la base son de prueba.

| Dato | Valor |
|---|---|
| Motor | Oracle Database 19c Standard Edition 2 (AWS RDS) |
| Host / puerto / SID | `dboracle.cyokhc3gxdmj.us-east-1.rds.amazonaws.com` / `1521` / `SMORCLDP` (por SID, no service name) |
| Cuenta del portal | `SANMI_PORTAL_WEB` (rol `SANMI_PORTAL_ROLE`; `origen = 'WEB'` en `sesiones` y `auditoria`) |
| Esquema de las tablas | `SANMI_APP` (se fija con `ALTER SESSION SET CURRENT_SCHEMA` en cada conexión) |
| Cuenta de la app móvil | `SANMI_API_MOVIL`: **no se usa en el portal** (no puede atender reclamos) |

## 2. Cómo se conecta

`.env` en la raíz (ignorado por git; `application.yml` lo importa con `spring.config.import`):

```
DB_HOST=dboracle.cyokhc3gxdmj.us-east-1.rds.amazonaws.com
DB_PORT=1521
DB_SID=SMORCLDP
DB_USER=SANMI_PORTAL_WEB
DB_PASSWORD=<se entrega por canal seguro>
DB_SCHEMA=SANMI_APP
```

Arranque: `SPRING_PROFILES_ACTIVE=cloud mvn spring-boot:run`. El perfil `cloud`
(`application-cloud.yml`) usa el driver `ojdbc11`, `ddl-auto: none` y no carga datos de ejemplo.
La IP desde la que se conecta debe estar habilitada en AWS (desde la PC de desarrollo ya funciona).

## 3. Cómo se mapeó el modelo

El portal sigue llamando "tickets" a los reclamos en el código y en la interfaz.

| En el portal | Tabla / columnas de Oracle | Notas |
|---|---|---|
| `AdminUser` | `administradores` | Login con Argon2id (`Argon2PasswordEncoder`, dependencia `bcprov`). Estado `ACTIVO` es el único que entra. El usuario se busca en minúsculas. |
| `Ticket` | `reclamos` (+ `contribuyentes`, `tipos_reclamo`) | El portal no inserta reclamos. Número visible = `numero`. |
| `TicketRespuesta` | `reclamo_seguimientos` | Nota interna = `visible_contribuyente = 0`. Solo INSERT. |
| `Notificacion` | `portal_notificaciones` | Un aviso por seguimiento. |
| `EventoClick` | `portal_eventos_click` | Solo INSERT, asíncrono. |
| `LogMetadata` | `auditoria` (`origen = 'WEB'`) | Navegador, SO, IP y sesión van en el JSON de `datos`. El portal solo lee las acciones de `TipoEvento`. |

### Estados

La bandeja agrupa los 8 valores de `reclamos.estado` (`EstadoReclamo`) en 5 grupos (`EstadoTicket`):

| Grupo en la bandeja | Valores en Oracle |
|---|---|
| Pendientes | `REGISTRADO` |
| Por contestar | `EN_REVISION` |
| Observados | `OBSERVADO` (se pidió información al contribuyente) |
| Resueltos (ruta `?estado=RESPONDIDO`) | `FUNDADO`, `FUNDADO_EN_PARTE`, `INFUNDADO`, `IMPROCEDENTE` |
| Archivados (historial) | `ARCHIVADO` |

### Acciones sobre un ticket

| Acción | Cambio en Oracle | Aviso por correo |
|---|---|---|
| Tomar | `REGISTRADO` → `EN_REVISION`, `asignado_a`, seguimiento visible "Reclamo en evaluación." y `fecha_primera_respuesta` (igual que los reclamos de prueba) | No |
| Devolver a pendientes | `EN_REVISION` → `REGISTRADO`, seguimiento interno | No |
| Nota interna | Seguimiento con `visible_contribuyente = 0`, mismo estado | No |
| Pedir información | `EN_REVISION` → `OBSERVADO`, `observacion` (máx. 1000), `plazo_subsanacion_hasta` (10 días si no se indica) | Sí |
| Resolver | → estado final, `respuesta`, `numero_resolucion` (`RES-RCL-AAAA-NNNNNN` con `seq_resolucion`), `resuelto_por`, `resuelto_en` | Sí |
| Archivar | estado final → `ARCHIVADO` | No |

Cada acción registra su evento en `auditoria`. El paso de `OBSERVADO` otra vez a `EN_REVISION` lo hace la app
móvil cuando el contribuyente completa la información; el portal no lo hace.

### Plazos

Se usa `reclamos.fecha_limite_atencion`: **en alerta** si faltan 3 días o menos, **vencido** si ya pasó.
Solo corre el plazo mientras está `REGISTRADO` o `EN_REVISION`. Reemplaza la regla anterior de 24 h y 72 h.

### Reglas técnicas que salen de los permisos

- La cuenta solo puede actualizar algunas columnas. Las demás van con `updatable = false` en las entidades:
  si Hibernate las incluyera en un `UPDATE` daría `ORA-01031`.
- Sin `DELETE` ni DDL: por eso no hay `orphanRemoval` y `ddl-auto` es `none`.
- Fechas en UTC en la BD; el portal las muestra en hora local (`hibernate.jdbc.time_zone: UTC`).
- Los triggers de la BD suman 1 a `version` en cada `UPDATE` (reclamos y notificaciones) y mantienen
  `actualizado_en`. `@Version` coincide con ese valor (comprobado).
- `reclamo_seguimientos.comentario` admite 2000 caracteres; `reclamos.respuesta`, 4000. El formulario limita a 2000
  (1000 al pedir información).
- `reclamos` no tiene fecha de archivado: se calcula como la fecha del seguimiento que pasó a `ARCHIVADO`
  (`@Formula` en `Ticket.fechaArchivado`).
- `portal_notificaciones.destinatario` es obligatorio: si el contribuyente no tiene correo no se crea el aviso; se
  registra `CORREO_FALLIDO` en la auditoría y el admin ve un aviso en pantalla.

## 4. Datos de ejemplo

- **Con `cloud`:** los de la base (3 cuentas `*.demo` y 5 reclamos `REC-2026-000001` a `000005`). Sus contraseñas están
  en el documento del responsable de la BD, no en el repositorio.
- **Sin perfil (H2):** `DatosDemo` crea administradores `admin`, `admin2`, `admin3` (contraseña `admin`), 8 tipos de reclamo,
  16 contribuyentes y 48 reclamos en todos los estados.

## 5. Verificación (28/10/2026)

| Comprobación | Resultado |
|---|---|
| `mvn test` (H2): 21 pruebas | Pasan |
| `mvn test -Dtest=OracleConexionTests -Doracle=true` (Oracle): 8 pruebas | Pasan |
| Cuenta, esquema, lectura de reclamos, bandeja, historial, detalle, auditoría | Funcionan con datos reales |
| Hora: `2026-10-18 15:20 UTC` en la BD | Se muestra `18/10/2026 10:20` (Lima) |
| Escrituras (tomar, pedir información, resolver, archivar, notificación, auditoría, click, acceso del admin) | Aceptadas por permisos y restricciones; **dentro de una transacción que siempre se revierte** |
| Trigger de `version` | Suma 1, igual que Hibernate |
| Hash de `supervisor.demo` | Es Argon2id y la contraseña del documento lo verifica |
| Aplicación real con perfil `cloud`: login, 10 pantallas y cierre de sesión | Todo responde bien |

Esa última prueba dejó en Oracle un registro de acceso y de cierre de sesión (`auditoria`, `origen = 'WEB'`) y actualizó
`ultimo_acceso_en` y `ultima_ip` de `supervisor.demo`. **No se cambió ningún reclamo.**

**No verificado:** el envío real de correo con un SMTP de verdad, y las escrituras confirmadas (commit) sobre
reclamos: solo se probaron dentro de transacciones revertidas para no alterar los reclamos que usa la app móvil.

## 6. Cómo repetir la verificación contra Oracle

```bash
# Necesita el .env con DB_HOST, DB_SID, DB_USER y DB_PASSWORD
mvn test -Dtest=OracleConexionTests -Doracle=true

# Comprobar además el login de una cuenta demo (la contraseña no se guarda en ningún archivo)
mvn test -Dtest=OracleConexionTests#laContrasenaDeUnaCuentaDemoCoincideConElHash \
    "-DargLine=-Doracle=true -Doracle.demoUser=supervisor.demo -Doracle.demoPassword=..."
```

Sin `-Doracle=true` esa clase se omite, así que `mvn test` y el pipeline de GitHub nunca tocan Oracle.

## 7. Pendiente

- Confirmar con el equipo si "Tomar" debe ser visible para el contribuyente (hoy sí, como en los reclamos de prueba) y
  si "Archivar" y "Devolver a pendientes" deben quedar internos (hoy sí).
- Confirmar el formato de `numero_resolucion` (se copió `RES-RCL-AAAA-NNNNNN` de los dos reclamos resueltos).
- Habilitar en AWS la IP del servidor donde se despliegue el portal.
- Probar el correo con un SMTP real (`smtp` + `CORREO_REDIRIGIR_A`).
- Altas y bajas de administradores: las hace el responsable de la BD; el portal no puede insertarlos.
- Retención de `portal_eventos_click` (crece rápido).
