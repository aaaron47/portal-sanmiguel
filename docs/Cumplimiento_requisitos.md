# Cumplimiento de requisitos – Portal web

Cómo cubre el **portal web** (este repositorio) las 5 funcionalidades que pidieron los JP en
"Nuevos requisitos" (Drive del grupo, `00_Gestion_y_Planificacion/Nuevos requisitos.docx`).
Corte: **11/11/2026**, `main` en `f8543a7` más la rama `fix/telemetria-y-lint` (marcado como *(rama)*).

Las 5 funcionalidades abarcan la app móvil, el backend y el portal. Aquí se documenta la parte del
portal y, para cada criterio, si ya funciona con el backend real.

**Cómo se comprobó.** Revisión del código del portal; llamadas al backend real
(`http://32.200.209.224`, API `/api/v1/portal`) con las cuentas demo de cada rol, **solo con lecturas**;
y pruebas en el navegador (detalle en `docs/Pruebas_telemetria.md`). El flujo de reclamos se probó
de punta a punta el 05/11 (rama `feature/flujo-reclamos`; 57 pruebas según la revisión de la semana 12).

**Estados**

| | Significado |
|---|---|
| ✅ | Hecho en el portal y funcionando con el backend real. |
| 🟡 | Hecho en el portal, pero el backend real aún no lo entrega (se ve solo en modo demo) o falta un detalle. |
| ❌ | Falta en el portal. |
| ➖ | No le toca al portal: es de la app móvil o del backend. |

## Resumen

| Req | Funcionalidad | Portal | Bloqueo principal |
|---|---|---|---|
| 1 | Gestión y seguimiento de reclamos | ✅ casi completo | No se ven los adjuntos ni se pueden adjuntar evidencias |
| 2 | Constancias de no adeudo | 🟡 parcial | No hay acción para evaluar la solicitud; el registro de constancias no tiene endpoint |
| 3 | Registro de uso del sistema | 🟡 parcial | Sin endpoints de telemetría en el backend (404) |
| 4 | Dashboard de uso del sistema | 🟡 pantalla completa *(rama)* | Sin datos del backend (`uso` en `/telemetria/resumen`) |
| 5 | Onboarding y preferencias de privacidad | 🟡 (el onboarding está en la app) | Sin endpoints de telemetría para ver los consentimientos |

## Req 1. Gestión y seguimiento de reclamos

Pantallas: Funcionario → **Bandeja**; Supervisor → **Panorama**, **Por aprobar**, **Reasignación**;
detalle del expediente (`components/modals/TicketDetailModal.tsx`). Todas las acciones pasan por
`ticketsController.ejecutarAccion` (`POST /tickets/{id}/{acción}` con `version`) y los botones salen de
`accionesPermitidas`, que manda el backend.

| Criterio | Cómo lo cubre el portal | Estado |
|---|---|---|
| Registrar el reclamo con código único, ciudadano, fecha, tipo, motivo, adjuntos y canal | Lo registra la app o el SAC. El portal muestra folio (`REC-2026-…`), DNI y nombre, fecha, tipo, asunto, descripción, pedido y canal *(rama: "Canal del inconveniente")*. **No muestra los adjuntos.** | ✅ / 🟡 adjuntos |
| Validar y clasificar (información tributaria, trámites, atención) | Acción **Validar y clasificar** con "Categoría del reclamo"; **Pedir información al ciudadano** con plazo. | ✅ |
| Derivar al área y funcionario, con plazos, fechas, prioridad y motivo de reasignación | **Asignar área y funcionario** (área, funcionario, prioridad, indicaciones); **Reasignar** con motivo; **Devolver al supervisor para reasignar**; fecha límite visible. Pestaña de **Reasignación** con la carga por funcionario. | ✅ |
| Registrar la evaluación: antecedentes, hallazgos y evidencias | **Registrar la evaluación del área** (antecedentes, hallazgos, conclusión). **No se pueden adjuntar evidencias.** | ✅ / ❌ evidencias |
| Elaborar la respuesta con fundamentos y acciones correctivas, con revisión del supervisor cuando corresponda | **Elaborar la respuesta** (resultado, respuesta, fundamentos, acciones correctivas). Si la prioridad es ALTA o el tipo lo exige, pasa a **Por aprobar**: el supervisor **aprueba y envía** o **devuelve** con lo que hay que corregir. | ✅ |
| Comunicar por la bandeja del ciudadano y registrar constancia de envío, fecha de cierre y responsable | "Aprobar y enviar" y **Cerrar el caso**; cada paso queda en la línea de tiempo con fecha y responsable. La entrega en la bandeja del ciudadano la hacen el backend y la app. | ✅ / ➖ |
| Que el ciudadano consulte el avance y el personal revise expedientes anteriores | El ciudadano: en la app. El personal: el supervisor ve todos los reclamos, filtra por estado (incluidos los cerrados) y abre el expediente con su línea de tiempo. | ➖ / ✅ |
| Indicadores de volumen y desempeño | Control Municipal → **Dashboard General** (`GET /reportes/kpis` y `GET /reportes/areas`, que responden en el backend real con reclamos del período, tasa de resolución y cumplimiento por área) y los KPIs del supervisor y del funcionario. | ✅ |
| Estados y reglas: registrado, pendiente de validación, pendiente de asignación, en evaluación, respondido, cerrado e improcedente | Los 7 estados de la BD; las reglas las decide el backend (`accionesPermitidas`) y el portal solo muestra los botones permitidos (`puede()` en `utils/ticket.utils.ts`). | ✅ |

Comprobado en el backend real el 11/11: `GET /tickets` responde a Funcionario (5), Supervisor (10) y
Control Municipal (10, lectura); Admin recibe 403 (no ve reclamos, como acordó el grupo). La auditoría
del backend registra los cambios (`RECLAMO_VALIDADO`, `RECLAMO_ASIGNADO`, `RESPUESTA_APROBADA`,
`RECLAMO_CERRADO`…).

**Falta:** mostrar los adjuntos del reclamo y permitir adjuntar evidencias a la evaluación (requiere
endpoint de adjuntos en el backend).

## Req 2. Solicitud y emisión de constancias de no adeudo

| Criterio | Cómo lo cubre el portal | Estado |
|---|---|---|
| El ciudadano solicita la constancia | App móvil. | ➖ |
| El responsable municipal evalúa y aprueba o desaprueba | Funcionario → **Constancias** lista los casos, pero el botón "Evaluar Constancia" abre el detalle del reclamo y **ahí no hay acción para aprobar o desaprobar**. El backend del portal no tiene endpoint de constancias (`GET /constancias` → 404). | ❌ |
| Flujo de pago simulado | App y backend. | ➖ |
| Generar y enviar la constancia | Backend (la emisión ya funciona desde la base, según la semana 12). | ➖ |
| Reportes para la municipalidad | Dashboard General: constancias emitidas, aprobadas, observadas y pendientes (`/reportes/kpis`, ✅ en el backend real). Control Municipal → **Constancias de No Adeudo** (registro con PDF): `GET /reportes/constancias` da **404**, se ve solo en modo demo. | ✅ / 🟡 |
| Reportes para el ciudadano | App móvil. | ➖ |

**Falta:** definir con el backend el endpoint para que el responsable municipal apruebe o desapruebe la
solicitud, y conectarlo en la pestaña Constancias; publicar `GET /reportes/constancias`.

## Req 3. Registro de uso del sistema

La captura de los eventos de la app la hacen la app y el backend. El portal define qué datos espera
leer (`types/telemetria.types.ts`) y los muestra en Control TI.

| Criterio | Cómo lo cubre el portal | Estado |
|---|---|---|
| Registrar inicios de sesión y sesiones de uso | Del personal: el backend ya guarda `LOGIN`, `LOGOUT`, `LOGIN_FALLIDO` y `CUENTA_BLOQUEADA`, y se ven en Admin → **Auditoría** (✅ en el backend real). De los ciudadanos en la app: backend. | ✅ / ➖ |
| Fecha, hora e identificador seudónimo, sin nombre, correo ni DNI | El contrato usa `dispositivoAnonimoId` y `dispositivoHash`, sin datos personales. Sin datos reales todavía. | 🟡 |
| Pantallas visitadas, acciones y resultados (completadas y fallidas) | El contrato tiene `pantalla`, `tipoEvento` y `componenteId`, y *(rama)* se propuso al backend `resultado` (`COMPLETADA`/`FALLIDA`) y `sesionId` (`docs/Solicitud_backend_telemetria.md`). El portal no registra su propio uso (pendiente: "qué significa clicks de los usuarios"). | 🟡 |
| Sistema operativo y versión de la app | `sistemaOperativo` y `appVersion` en el contrato; el dashboard los muestra. | 🟡 |
| Excluir credenciales y datos tributarios, y definir un plazo de conservación | Retención de 12 meses mostrada como solo lectura (`RETENCION_USO_MESES`); hoy el número es fijo del front porque el backend no responde. | 🟡 |

**Bloqueo:** los endpoints `/telemetria/*` responden 404 en el backend real (ver
`docs/Pruebas_telemetria.md`).

## Req 4. Dashboard de uso del sistema

Pantalla: Control TI → **Dashboard Telemetría App** (`components/roles/control-ti/`). En la rama
`fix/telemetria-y-lint` se agregó el dashboard de uso; funciona con datos demo y con un backend simulado.
Espera que el backend mande `uso` en `GET /telemetria/resumen` (formato en `docs/Solicitud_backend_telemetria.md`).

| Criterio | Cómo lo cubre el portal | Estado |
|---|---|---|
| Usuarios únicos y sesiones, con reglas de conteo | Indicadores **Usuarios únicos** y **Sesiones**, y el texto "Cómo se cuenta" con las reglas (usuario único = identificador seudónimo; sesión = termina tras 30 min sin actividad). Las reglas las debe confirmar el backend. | 🟡 *(rama)* |
| Actividad por día y hora de Perú | Gráficos **Actividad por día** y **Actividad por hora** (hora de Perú), con tooltip, teclado y vista de tabla. | 🟡 *(rama)* |
| Funcionalidades más usadas y consultas completadas o fallidas | Tabla **Funcionalidades más usadas** (iniciadas, completadas, fallidas) e indicador **Consultas fallidas**. | 🟡 *(rama)* |
| % de consultas completadas respecto de las iniciadas | Indicador **Consultas completadas** (%) y % por funcionalidad. | 🟡 *(rama)* |
| Filtros por período, funcionalidad, sistema operativo y versión | Fila de filtros: período (hoy, 7 días, 30 días, este mes), funcionalidad, sistema operativo y versión; se envían al backend. | 🟡 *(rama)* |
| Última actualización | "Última actualización: dd/mm/aaaa, hh:mm (hora de Perú)" según `actualizadoEn`. | 🟡 *(rama)* |
| Restringir el acceso a perfiles autorizados | El menú solo aparece al rol CONTROL_TI y el backend pide sesión (401 sin token). El permiso por rol se comprobará cuando existan los endpoints. | ✅ / 🟡 |

🟡 aquí significa que la pantalla está hecha pero el backend real todavía no entrega los datos: hoy
Control TI muestra "Las métricas de uso de la app todavía no están disponibles en el servidor".

También hay un tablero de Superset "Telemetría y Rendimiento App Ciudadana" definido para Control TI en
`controllers/ia-dashboards.controller.ts`, pero el centro de dashboards solo se muestra en Control
Municipal, así que **Control TI no lo ve**.

## Req 5. Onboarding y preferencias de privacidad

El onboarding y la elección de analítica son de la **app móvil** (hecho el 05/11, según la semana 12).
El portal muestra lo que decidieron los ciudadanos y deja administrar la telemetría.

| Criterio | Cómo lo cubre el portal | Estado |
|---|---|---|
| Presentar propósito y funcionalidades en el primer uso; permitir omitirlo y no repetirlo | App móvil. | ➖ |
| Explicar qué datos de uso se recopilan y para qué, con acceso al aviso de privacidad | App móvil. El portal muestra la versión vigente del aviso (Control TI → **Privacidad y Onboarding**). | ➖ / 🟡 |
| Pedir por separado la aceptación de la analítica opcional (aceptar o rechazar) | App móvil. El portal muestra cuántos aceptan y rechazan, y el embudo del onboarding. | ➖ / 🟡 |
| Analítica desactivada hasta que se acepte, sin impedir el servicio | App y backend. El portal tiene además el interruptor general (*kill switch*) en Admin → **Control de Acceso**, que exige escribir "realizar cambios" y queda en auditoría. | ➖ / 🟡 |
| Recordar la elección y permitir cambiarla en la configuración | App móvil. | ➖ |
| Registrar la decisión, su fecha y la versión del aviso | Control TI muestra la tabla de consentimientos (hash del dispositivo, analítica, notificaciones, versión del aviso y fecha) y la exporta a CSV. Sin datos reales todavía. | 🟡 |

**Bloqueo:** `GET /telemetria/consentimientos` y `GET /telemetria/resumen` responden 404. Lo que falta para
la versión del aviso y el *kill switch* está en `docs/Solicitud_backend_control_acceso.md`.

## Otras funciones del portal (fuera de los 5 requisitos)

| Función | Estado con el backend real |
|---|---|
| Admin → Usuarios (alta con contraseña temporal, activar y desactivar) | ✅ `GET /usuarios` responde |
| Admin → Auditoría | ✅ `GET /auditoria` responde |
| Admin → Control de Acceso | ❌ endpoints pendientes (`docs/Solicitud_backend_control_acceso.md`) |
| Control Municipal → Reportes tributarios R1–R11 | 🟡 `GET /reportes/tributarios/{código}` → 404 (solo demo) |
| Control Municipal → Superset y dashboards de IA | 🟡 `GET /ia/dashboards` → 404 (solo demo) |

## Pendientes para cerrar los requisitos

| # | Qué | Quién | Req |
|---|---|---|---|
| 1 | Endpoints `/telemetria/*` | Backend | 3, 4, 5 |
| 2 | Agregar "resultado" (completada o fallida) y sesión a los eventos de uso (propuesto en `docs/Solicitud_backend_telemetria.md`) | Backend + app | 3, 4 |
| 3 | ~~Dashboard: sesiones, usuarios únicos, actividad por día y hora, % completadas, filtros y última actualización~~ Hecho en la rama; falta `uso` del backend | Backend | 4 |
| 4 | Endpoint para aprobar o desaprobar constancias y conectarlo en Funcionario → Constancias | Backend + portal | 2 |
| 5 | `GET /reportes/constancias` | Backend | 2 |
| 6 | Mostrar adjuntos y adjuntar evidencias en la evaluación (el canal ya se muestra en la rama) | Backend + portal | 1 |
| 7 | Endpoints de Control de Acceso | Backend | 5 |
| 8 | ~~Arreglar los 2 errores de lint de `f8543a7`~~ Hecho en la rama | Portal | — |
