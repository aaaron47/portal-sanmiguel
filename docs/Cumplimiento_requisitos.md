# Cumplimiento de requisitos – Portal web

Cómo cubre el **portal web** (este repositorio) las 5 funcionalidades que pidieron los JP en
"Nuevos requisitos" (Drive del grupo, `00_Gestion_y_Planificacion/Nuevos requisitos.docx`).
Corte: **11/11/2026**, `main` en `f8543a7` más la rama `fix/telemetria-y-lint` (marcado como *(rama)*).
Actualizado el 11/11 por la tarde: el backend publicó `/telemetria/*` y el portal se adaptó a su formato.

Las 5 funcionalidades abarcan la app móvil, el backend y el portal. Aquí se documenta la parte del
portal y, para cada criterio, si ya funciona con el backend real.

**Cómo se comprobó.** Revisión del código del portal; llamadas al backend real
(`http://32.200.209.224`, API `/api/v1/portal`) con las cuentas demo de cada rol, con lecturas y una sola
escritura (pausar y reanudar la telemetría, que quedó activa);
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
| 1 | Gestión y seguimiento de reclamos | ✅ *(rama)* | Los adjuntos que el ciudadano subió desde la app todavía no se pueden descargar (están en el almacenamiento del backend anterior) |
| 2 | Constancias de no adeudo | ✅ | Aprobar y desaprobar probados contra el backend real (`SOL-2026-001044` y `SOL-2026-001045`) |
| 3 | Registro de uso del sistema | ✅ *(rama)* | Ninguno en el portal. Hoy el backend solo tiene eventos de prueba |
| 4 | Dashboard de uso del sistema | ✅ *(rama)* | Ninguno. Falta confirmar con el backend las reglas de conteo |
| 5 | Onboarding y preferencias de privacidad | ✅ *(rama)* (el onboarding está en la app) | Activar otra versión del aviso espera un permiso en la BD (501) |

## Req 1. Gestión y seguimiento de reclamos

Pantallas: Funcionario → **Bandeja**; Supervisor → **Panorama**, **Por aprobar**, **Reasignación**;
detalle del expediente (`components/modals/TicketDetailModal.tsx`). Todas las acciones pasan por
`ticketsController.ejecutarAccion` (`POST /tickets/{id}/{acción}` con `version`) y los botones salen de
`accionesPermitidas`, que manda el backend.

| Criterio | Cómo lo cubre el portal | Estado |
|---|---|---|
| Registrar el reclamo con código único, ciudadano, fecha, tipo, motivo, adjuntos y canal | Lo registra la app o el SAC. El portal muestra folio (`REC-2026-…`), DNI y nombre, fecha, tipo, asunto, descripción, pedido y canal *(rama: "Canal del inconveniente")*. Sección **Adjuntos y evidencias** del expediente *(rama)*: nombre, origen, tamaño, quién y cuándo, con **Ver** y **Descargar** (`GET /tickets/{id}/adjuntos`). Los archivos del ciudadano que guardó el backend anterior de la app salen como "Archivo no disponible". | ✅ *(rama)* |
| Validar y clasificar (información tributaria, trámites, atención) | Acción **Validar y clasificar** con "Categoría del reclamo"; **Pedir información al ciudadano** con plazo. | ✅ |
| Derivar al área y funcionario, con plazos, fechas, prioridad y motivo de reasignación | **Asignar área y funcionario** (área, funcionario, prioridad, indicaciones); **Reasignar** con motivo; **Devolver al supervisor para reasignar**; fecha límite visible. Pestaña de **Reasignación** con la carga por funcionario. | ✅ |
| Registrar la evaluación: antecedentes, hallazgos y evidencias | **Registrar la evaluación del área** (antecedentes, hallazgos, conclusión) y **Adjuntar evidencia** *(rama)*: PDF, JPG o PNG de hasta 10 MB, hasta 5 por reclamo, solo si el backend lo permite (`ADJUNTAR_EVIDENCIA`). Queda unida a la última evaluación, con una nota interna y su auditoría. El ciudadano no la ve. | ✅ *(rama)* |
| Elaborar la respuesta con fundamentos y acciones correctivas, con revisión del supervisor cuando corresponda | **Elaborar la respuesta** (resultado, respuesta, fundamentos, acciones correctivas). Si la prioridad es ALTA o el tipo lo exige, pasa a **Por aprobar**: el supervisor **aprueba y envía** o **devuelve** con lo que hay que corregir. | ✅ |
| Comunicar por la bandeja del ciudadano y registrar constancia de envío, fecha de cierre y responsable | "Aprobar y enviar" y **Cerrar el caso**; cada paso queda en la línea de tiempo con fecha y responsable. La entrega en la bandeja del ciudadano la hacen el backend y la app. | ✅ / ➖ |
| Que el ciudadano consulte el avance y el personal revise expedientes anteriores | El ciudadano: en la app. El personal: el supervisor ve todos los reclamos, filtra por estado (incluidos los cerrados) y abre el expediente con su línea de tiempo. | ➖ / ✅ |
| Indicadores de volumen y desempeño | Control Municipal → **Dashboard General** (`GET /reportes/kpis` y `GET /reportes/areas`, que responden en el backend real con reclamos del período, tasa de resolución y cumplimiento por área) y los KPIs del supervisor y del funcionario. | ✅ |
| Estados y reglas: registrado, pendiente de validación, pendiente de asignación, en evaluación, respondido, cerrado e improcedente | Los 7 estados de la BD; las reglas las decide el backend (`accionesPermitidas`) y el portal solo muestra los botones permitidos (`puede()` en `utils/ticket.utils.ts`). | ✅ |

Comprobado en el backend real el 11/11: `GET /tickets` responde a Funcionario (5), Supervisor (10) y
Control Municipal (10, lectura); Admin recibe 403 (no ve reclamos, como acordó el grupo). La auditoría
del backend registra los cambios (`RECLAMO_VALIDADO`, `RECLAMO_ASIGNADO`, `RESPUESTA_APROBADA`,
`RECLAMO_CERRADO`…).

**Falta:** que la app móvil envíe sus adjuntos al backend único; hasta entonces, los del ciudadano no se pueden
descargar desde el portal (hoy son 6 archivos en 5 reclamos). Probado contra el backend real (solo lectura) y el simulado.

## Req 2. Solicitud y emisión de constancias de no adeudo

| Criterio | Cómo lo cubre el portal | Estado |
|---|---|---|
| El ciudadano solicita la constancia | App móvil. | ➖ |
| El responsable municipal evalúa y aprueba o desaprueba | Funcionario → **Evaluación de Constancias** y Supervisor → **Constancias de No Adeudo**: conteos por estado, búsqueda, filtro y paginación en el servidor (`GET /constancias`); el detalle (`GET /constancias/{id}`) muestra contribuyente, predio, tasa, deuda y cuotas. **Aprobar** (comentario opcional; emite la constancia y la envía a la bandeja del ciudadano) y **Desaprobar** (motivo obligatorio, máximo 255) salen de `accionesPermitidas`; si no se puede aprobar, la pantalla dice por qué (tasa sin pagar o deuda). | ✅ *(rama)* |
| Flujo de pago simulado | App y backend. | ➖ |
| Generar y enviar la constancia | Backend: al aprobar emite la constancia con su código de verificación y la deja en la bandeja del ciudadano; el portal muestra el código, la vigencia y el enlace de verificación. | ✅ / ➖ |
| Reportes para la municipalidad | Dashboard General: constancias emitidas, aprobadas, observadas y pendientes (`/reportes/kpis`, ✅ en el backend real). Control Municipal → **Constancias de No Adeudo** (registro con PDF): `GET /reportes/constancias` ya responde y la pantalla muestra los datos reales. | ✅ |
| Reportes para el ciudadano | App móvil. | ➖ |

**Probado:** backend simulado 40/40 (aprobar, desaprobar, errores `invalid_state`, `fee_required` y
`outstanding_debts`, 404, paginación, búsqueda, CSV, supervisor), backend real 9/9 (solo lectura: hoy hay 9 solicitudes
y ninguna en verificación) y modo demo 3/3. **Backend real, con escritura (11/11, solicitudes de prueba del backend):
21/21.** `funcionario.demo` aprobó `SOL-2026-001044` (sin deuda): quedó emitida con su código de verificación y vigencia.
`supervisor.demo` desaprobó `SOL-2026-001045` (S/ 5,065.80 en 15 cuotas, 13 vencidas): la pantalla mostró las 15 cuotas
del detalle y explicó por qué no se podía aprobar; aprobar a la fuerza dio 409 `outstanding_debts`, repetir dio 409
`invalid_state` y Control Municipal recibe 403. Antes, el portal trataba la constancia como una marca del reclamo (`tieneConstancia`); en el backend es
una solicitud aparte (`SOL-…`), así que se quitaron esa columna, ese filtro y esa tarjeta de la bandeja de reclamos.

## Req 3. Registro de uso del sistema

La captura de los eventos la hacen la app y el backend. El portal los lee (`types/telemetria.types.ts`)
y los muestra en Control TI. Desde el 11/11 el backend real entrega `GET /telemetria/eventos`,
`/resumen` y `/consentimientos`; por ahora solo con eventos de prueba (`PRUEBA_BACKEND`).

| Criterio | Cómo lo cubre el portal | Estado |
|---|---|---|
| Registrar inicios de sesión y sesiones de uso | Del personal: `LOGIN`, `LOGOUT`, `LOGIN_FALLIDO` y `CUENTA_BLOQUEADA` en Admin → **Auditoría**. De todos (app y portal): eventos `INICIO_SESION` y `CIERRE_SESION` con su `sesionId`, en la tabla **Eventos de uso recientes**. | ✅ *(rama)* |
| Fecha, hora e identificador seudónimo, sin nombre, correo ni DNI | La tabla muestra fecha y hora (hora de Perú) y el **ID seudónimo** (`dispositivoAnonimoId`). El backend no envía nombre, correo ni DNI. | ✅ *(rama)* |
| Pantallas visitadas, acciones y resultados (completadas y fallidas) | Columnas **Tipo de evento**, **Funcionalidad / Pantalla** y **Resultado** (Iniciada, Completada, Fallida, con el código de error si lo hay). | ✅ *(rama)* |
| Sistema operativo y versión de la app | Columnas **Plataforma** (sistema y canal: app móvil o portal web) y **Versión**. | ✅ *(rama)* |
| Excluir credenciales y datos tributarios, y definir un plazo de conservación | Los eventos no traen credenciales ni datos tributarios. Retención de 12 meses (`mesesRetencionUso`, la envía el backend), solo lectura. | ✅ *(rama)* |

El backend registra el uso de la **app móvil** (`canal` `MOVIL`) y también el del **portal web** (`WEB`,
personal municipal). El dashboard deja filtrar por canal.

## Req 4. Dashboard de uso del sistema

Pantalla: Control TI → **Dashboard Telemetría App** (`components/roles/control-ti/`), hecha en la rama
`fix/telemetria-y-lint` y probada contra el backend real el 11/11: cada indicador coincide con lo que
responde `GET /telemetria/resumen` (`docs/Pruebas_telemetria.md`, sección 7).

| Criterio | Cómo lo cubre el portal | Estado |
|---|---|---|
| Usuarios únicos y sesiones, con reglas de conteo | Indicadores **Usuarios únicos** y **Sesiones**, y el texto "Cómo se cuenta". La regla de sesión (30 minutos sin actividad) la escribió el portal: **falta que el backend la confirme**. | ✅ *(rama)* / 🟡 regla |
| Actividad por día y hora de Perú | Gráficos **Actividad por día** y **Actividad por hora** (hora de Perú), con tooltip, teclado y vista de tabla. | ✅ *(rama)* |
| Funcionalidades más usadas y consultas completadas o fallidas | Tabla **Funcionalidades más usadas** (eventos, iniciadas, completadas, fallidas), ordenada por uso, e indicador **Consultas fallidas**. | ✅ *(rama)* |
| % de consultas completadas respecto de las iniciadas | Indicador **Consultas completadas** (%) y % por funcionalidad. | ✅ *(rama)* |
| Filtros por período, funcionalidad, sistema operativo y versión | Fila de filtros: período (hoy, 7 días, 30 días, este mes), canal, funcionalidad, sistema operativo y versión. Se envían al backend como `fechaDesde`, `fechaHasta`, `canal`, `funcionalidad`, `sistemaOperativo` y `appVersion`. | ✅ *(rama)* |
| Última actualización | "Último dato registrado: dd/mm/aaaa, hh:mm (hora de Perú)", según `ultimaActualizacion` (el último evento guardado). | ✅ *(rama)* |
| Restringir el acceso a perfiles autorizados | El menú solo aparece al rol CONTROL_TI. En el backend: sin sesión → 401; SUPERVISOR, FUNCIONARIO y CONTROL_MUNICIPAL → 403; leen CONTROL_TI y ADMIN. | ✅ |

También hay un tablero de Superset "Telemetría y Rendimiento App Ciudadana" definido para Control TI en
`controllers/ia-dashboards.controller.ts`, pero el centro de dashboards solo se muestra en Control
Municipal, así que **Control TI no lo ve**.

## Req 5. Onboarding y preferencias de privacidad

El onboarding y la elección de analítica son de la **app móvil** (hecho el 05/11, según la semana 12).
El portal muestra lo que decidieron los ciudadanos y deja administrar la telemetría.

| Criterio | Cómo lo cubre el portal | Estado |
|---|---|---|
| Presentar propósito y funcionalidades en el primer uso; permitir omitirlo y no repetirlo | App móvil. | ➖ |
| Explicar qué datos de uso se recopilan y para qué, con acceso al aviso de privacidad | App móvil. El portal muestra la versión vigente del aviso (Control TI → **Privacidad y Onboarding**). | ➖ / ✅ *(rama)* |
| Pedir por separado la aceptación de la analítica opcional (aceptar o rechazar) | App móvil. El portal muestra cuántos aceptan y rechazan, y el embudo del onboarding. | ➖ / ✅ *(rama)* |
| Analítica desactivada hasta que se acepte, sin impedir el servicio | App y backend. El portal tiene además el interruptor general (*kill switch*) en Admin → **Control de Acceso**: exige escribir "realizar cambios", y el backend lo guarda y lo registra en auditoría (`CONFIGURACION_TELEMETRIA`). Probado con el backend real. | ➖ / ✅ *(rama)* |
| Recordar la elección y permitir cambiarla en la configuración | App móvil. | ➖ |
| Registrar la decisión, su fecha y la versión del aviso | Control TI muestra la tabla de consentimientos (hash del dispositivo, analítica, versión del aviso y fecha) y la exporta a CSV. | ✅ *(rama)* |

**Falta en el backend:** cambiar la versión del aviso (`PUT /documentos-versiones/{id}/activar` responde 501 hasta que
la BD dé el permiso). El permiso de notificaciones no se va a registrar (la BD no tiene dónde), así que el portal ya no
lo muestra.

## Otras funciones del portal (fuera de los 5 requisitos)

| Función | Estado con el backend real |
|---|---|
| Admin → Usuarios (alta con contraseña temporal, activar y desactivar) | ✅ `GET /usuarios` responde |
| Admin → Auditoría | ✅ `GET /auditoria` responde |
| Admin → Control de Acceso | ✅ *(rama)* Políticas del personal (inactividad, intentos, bloqueo, longitud mínima) leídas y guardadas en el backend, que las aplica; *kill switch*; versiones del aviso de analítica (activar responde 501 hasta que la BD dé el permiso). Cambio de contraseña desde el menú de la cuenta. |
| Control Municipal → Reportes tributarios R1–R11 | 🟡 `GET /reportes/tributarios/{código}` → 404 (solo demo) |
| Control Municipal → Superset y dashboards de IA | 🟡 `GET /ia/dashboards` → 404 (solo demo) |

## Pendientes para cerrar los requisitos

| # | Qué | Quién | Req |
|---|---|---|---|
| 1 | ~~Endpoints `/telemetria/*`~~ Publicados el 11/11; el portal ya los usa *(rama)* | — | 3, 4, 5 |
| 2 | ~~Agregar "resultado" y sesión a los eventos de uso~~ Hecho en el backend. Falta que la app móvil envíe eventos reales y confirmar las reglas de conteo (`docs/Solicitud_backend_telemetria.md`) | Backend + app | 3, 4 |
| 3 | ~~Dashboard: sesiones, usuarios únicos, actividad por día y hora, % completadas, filtros y última actualización~~ Hecho en la rama y probado con el backend real | — | 4 |
| 4 | ~~Endpoint para aprobar o desaprobar constancias y conectarlo~~ Hecho y probado contra el backend real | — | 2 |
| 5 | ~~`GET /reportes/constancias`~~ Publicado; Control Municipal ya lo muestra | — | 2 |
| 6 | ~~Mostrar adjuntos y adjuntar evidencias~~ Hecho en la rama. Falta que la app suba sus adjuntos al backend único | App | 1 |
| 7 | ~~Endpoints de Control de Acceso~~ Hechos y usados en la rama. Falta el permiso `UPDATE (activo)` en `documentos_versiones` | Responsable de la BD | 5 |
| 8 | ~~Arreglar los 2 errores de lint de `f8543a7`~~ Hecho en la rama | Portal | — |
