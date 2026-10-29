# Datos que faltan para conectar el Portal de quejas a Oracle

> **Atendido el 28/10/2026.** El responsable de la BD creó la cuenta `SANMI_PORTAL_WEB`, las tablas
> `portal_notificaciones` y `portal_eventos_click` y las columnas pedidas. Lo entregado, cómo se conectó el portal y lo que
> se verificó están en `docs/Conexion_Portal_Oracle.md`. Este documento queda como registro de lo que se pidió.

Solicitud para el responsable de la base de datos `SANMI_APP` · 27/10/2026

El portal de administración atiende los **reclamos** de los contribuyentes (`reclamos` y
`reclamo_seguimientos`). La cuenta entregada, `SANMI_API_MOVIL`, es la del backend de la app móvil y
no alcanza para que un funcionario atienda reclamos (ver `docs/Conexion_BD.md`, sección 4). Este
documento lista lo que el portal necesita y la base no tiene hoy.

## 1. Cuenta propia del portal

Pedimos una cuenta para el panel web (por ejemplo `SANMI_PORTAL_WEB`), con `origen = 'WEB'` en
sesiones y auditoría, y la IP del servidor del portal habilitada en AWS.

| Tabla | Leer | Insertar | Actualizar | Para qué |
|---|---|---|---|---|
| administradores | Sí | No | Solo: intentos_fallidos, bloqueado_hasta, ultimo_acceso (y las del punto 2) | Login, bloqueo por intentos, perfil del admin |
| reclamos | Sí | No | estado, prioridad, asignado_a, observacion, plazo_subsanacion_hasta, respuesta, numero_resolucion, resuelto_por, resuelto_en | Tomar, liberar, responder, observar y cerrar |
| reclamo_seguimientos | Sí | Sí | No | Respuestas al contribuyente y notas internas |
| reclamo_adjuntos | Sí | Sí | No | Ver sustentos y adjuntar la respuesta |
| tipos_reclamo, contribuyentes, predios, deudas, valores | Sí | No | No | Datos del reclamo en pantalla |
| auditoria | **Sí** | Sí | No | La pantalla "Logs de metadata" necesita leerla |
| sesiones | Sí | Sí | Solo: revocado_en | Opcional: registrar sesiones del panel |
| portal_* (punto 3) | Sí | Sí | Sí | Tablas propias del portal |

Sin DDL ni DELETE, igual que el resto de cuentas.

## 2. Estructura de `administradores`

El Word la menciona, pero no describe sus columnas. Necesitamos su estructura y saber si tiene, o
se le pueden agregar, estos datos que hoy usa el portal:

| Dato del portal | Uso |
|---|---|
| usuario (login) | Iniciar sesión |
| hash de contraseña | Verificar la contraseña. **¿Qué algoritmo?** El portal usa BCrypt; los contribuyentes usan Argon2id. |
| nombre completo, correo | Menú, perfil, firma de las respuestas |
| rol: ADMINISTRADOR / SUPERVISOR | El supervisor ve auditoría y la metadata de todos |
| activo | Desactivar sin borrar |
| intentos_fallidos, bloqueado_hasta | Bloqueo: 5 intentos → 15 minutos |
| ultimo_acceso, acceso_anterior, ultima_ip | Pantalla "Mi metadata" |

También: quién da de alta a los administradores y cómo se entregan las contraseñas iniciales.

## 3. Tablas nuevas del portal (no existen en SANMI_APP)

Solo las usa el portal. Pedimos que el responsable de BD las cree (nuestra cuenta no tiene DDL).
Los tipos se adaptarán a las convenciones de la base (UUID en `VARCHAR2(36)`, instantes en UTC).

**`portal_notificaciones`**: correo enviado al contribuyente con cada respuesta.

| Columna | Tipo sugerido | Nota |
|---|---|---|
| id | VARCHAR2(36) | UUID |
| reclamo_id | VARCHAR2(36) | FK reclamos.id |
| seguimiento_id | VARCHAR2(36) | FK reclamo_seguimientos.id, único |
| destinatario | VARCHAR2(254) | Correo del contribuyente al momento del envío |
| mensaje | VARCHAR2(4000) | Texto enviado |
| autor_admin_id | VARCHAR2(36) | FK administradores.id |
| estado | VARCHAR2(15) | PENDIENTE / ENVIADO / FALLIDO |
| intentos | NUMBER(3) | |
| ultimo_error | VARCHAR2(500) | |
| message_id | VARCHAR2(250) | Para enlazar los correos del mismo reclamo en un hilo |
| version | NUMBER(10) | Bloqueo optimista |
| creado_en / enviado_en | TIMESTAMP UTC | |

**`portal_eventos_click`**: clicks de los administradores dentro del portal (alto volumen; definir
retención).

| Columna | Tipo sugerido |
|---|---|
| id | VARCHAR2(36) o NUMBER con secuencia |
| administrador_id | VARCHAR2(36) |
| tipo | VARCHAR2(10) |
| ruta | VARCHAR2(300) |
| elemento | VARCHAR2(120) |
| texto | VARCHAR2(150) |
| ip | VARCHAR2(60) |
| sesion | VARCHAR2(12) |
| creado_en | TIMESTAMP UTC |

**`portal_log_metadata`**: solo si no se nos da lectura sobre `auditoria`. Si se da, los eventos van a
`auditoria` con `origen = 'WEB'`, y navegador, sistema operativo, IP y sesión van dentro de `datos`
(JSON).

## 4. Columnas que faltan en `reclamos`

| Dato | Por qué | Alternativa si no se agrega |
|---|---|---|
| version (NUMBER) | Bloqueo optimista: si la app modifica el reclamo mientras el funcionario lo tiene abierto, se rechaza el cambio del funcionario en vez de pisar datos | Comparar `actualizado_en` (lo mantiene el trigger) |
| fecha_primera_respuesta (TIMESTAMP UTC) | Indicadores de tiempo de respuesta en bandeja e historial | Calcularla del primer `reclamo_seguimientos` visible hecho por un administrador |

## 5. Equivalencias que hay que confirmar

**Estados.** Propuesta:

| Portal | reclamos.estado |
|---|---|
| Pendiente | REGISTRADO |
| Por contestar | EN_REVISION |
| Respondido | OBSERVADO (espera al contribuyente) o un estado final |
| Archivado | ARCHIVADO, FUNDADO, FUNDADO_EN_PARTE, INFUNDADO, IMPROCEDENTE |

Preguntas abiertas:
- ¿Responder al contribuyente sin cerrar el reclamo debe dejarlo en EN_REVISION o en OBSERVADO?
- ¿El portal debe pedir el tipo de resolución (fundado, infundado, etc.) al cerrar?

**Canales.** El portal tiene CALL_CENTER y AGENCIA, y Oracle solo tiene PRESENCIAL. Propuesta: ambos
pasan a PRESENCIAL. ¿O se agregan a la lista permitida?

**Plazos.** El portal alerta a las 24 h y marca vencido a las 72 h. Oracle trae
`fecha_limite_atencion` en días hábiles según el tipo. Propuesta: usar el plazo de Oracle.

## 6. Datos que muestran las pantallas y la base no tiene

| Pantalla | Dato | Situación |
|---|---|---|
| Bandeja e historial | Fecha de primera respuesta y tiempo de respuesta | Falta (punto 4) |
| Detalle | Versión para el bloqueo optimista | Falta (punto 4) |
| Detalle | Canal Call center / Agencia | Falta (punto 5) |
| Detalle | Estado del correo y botón "Reenviar" | Falta `portal_notificaciones` |
| Detalle | Nombre del funcionario asignado y autor de cada respuesta | Requiere leer `administradores` |
| Mi metadata | Rol, IP, acceso anterior, bloqueo | Depende del punto 2 |
| Auditoría de clicks | Todo | Falta `portal_eventos_click` |
| Logs de metadata | Navegador, SO, IP, sesión | Requiere leer `auditoria` o `portal_log_metadata` |

## 7. Datos que la base sí tiene y el portal aún no muestra

Para planificar mejoras de pantalla (no bloquean la conexión): `pedido`, `monto_reclamado`, predio,
deuda o valor reclamado, `observacion` y `plazo_subsanacion_hasta`, adjuntos (`reclamo_adjuntos`),
`numero_resolucion`, y si el reclamo lo registró el contribuyente (`usuario_id`) o un funcionario
(`registrado_por_admin_id`).

## 8. Otros

- **Datos de prueba:** ¿hay administradores de prueba en `administradores`? El portal no insertará
  datos de ejemplo en Oracle.
- **Entornos:** ¿existe una base de desarrollo aparte, o el portal se prueba sobre la misma
  `SANMI_APP` que usa la app?
- **Correo de contacto:** el correo sale a `contribuyentes.correo`; confirmar que es el dato
  vigente.
