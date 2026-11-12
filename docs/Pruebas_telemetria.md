# Pruebas de telemetría (11/11/2026)

Pantallas probadas: **Control TI** → "Dashboard Telemetría App" y "Privacidad y Onboarding", y
**Admin** → "Control de Acceso" (interruptor de telemetría, *kill switch*). Código en
`controllers/telemetria.controller.ts`, `components/roles/control-ti/` y `components/roles/admin/acceso/`.
Versión probada: `main` en `f8543a7`.

## Resultado en una línea

> **Actualización del 11/11 por la tarde:** el backend publicó los endpoints de telemetría y se repitieron
> las pruebas con el portal adaptado a su formato: **demo 48/48, backend simulado 108/108 y backend real
> 92/92**. Ver la **sección 7**. Lo que sigue (secciones 1 a 6) es el estado de la mañana, cuando respondían 404.

El front funciona bien con los datos demo y con un backend que respete el contrato
(`types/telemetria.types.ts`), pero **el backend real todavía no tiene ningún endpoint de telemetría**:
los cuatro responden 404. Es el bloqueador "Registro y dashboard de uso (Req 3 y 4) sin backend" de la
revisión de la semana 12.

| Prueba | Comprobaciones | Resultado |
|---|---|---|
| API del backend real (EC2) | 11 | 8 OK; los 3 GET de telemetría dan **404** |
| Navegador, modo demo (sin backend) | 26 | 26 OK |
| Navegador, backend simulado con el contrato (respuestas correctas y errores 401/403/500) | 36 | 36 OK |
| Navegador, backend real | 19 | 19 OK (el front muestra el error y no inventa datos) |

Además: `npx tsc --noEmit` y `npm run build` OK; `npm run lint` daba 2 errores en `main` (sección 4), ya corregidos en `fix/telemetria-y-lint` (sección 5).

## 1. API del backend real

Login en `POST /api/v1/portal/auth/login` con las cuentas demo del backend. `analitica.demo` entra con el
rol `CONTROL_TI` (en el backend, `ANALITICA_USO`).

| Endpoint | Sin sesión | Con sesión (CONTROL_TI, ADMIN, SUPERVISOR, FUNCIONARIO, CONTROL_MUNICIPAL) |
|---|---|---|
| `GET /telemetria/resumen` | 401 ✔ | **404 `not_found`** |
| `GET /telemetria/eventos?limite=15` | 401 ✔ | **404** |
| `GET /telemetria/consentimientos` | 401 ✔ | **404** |
| `PUT /telemetria/configuracion` | 401 ✔ | **404** |
| `GET /seguridad/politicas-acceso` | 401 ✔ | **404** |

También se buscó la telemetría en otras rutas (`/api/v1/admin/...`, `/analitica/...`, `/uso/...`): no
existe. `/api/v1/analitica/*` existe pero no acepta las sesiones del portal ni las de la API de
administración (responde `invalid_session`); parece ser la ruta por la que la app móvil **envía** sus
eventos, no la que los consulta. Hay que confirmarlo con el grupo de backend.

Nota: las pruebas dejaron filas `LOGIN` en la auditoría del backend (con `userAgent` de curl y de Edge).

## 2. Navegador

Playwright con Microsoft Edge, desde una carpeta fuera del repositorio (como en las pruebas anteriores).

### 2.1 Modo demo (26/26)

- Dashboard: KPIs (onboarding 89.8 %, analítica, 38 490 eventos en 24 h, errores 0.42 %), dispositivos
  y versiones, pantallas más vistas. "Actualizar Métricas" vuelve a pedir el resumen.
- Privacidad y Onboarding: embudo de 4 pasos, retención de 12 meses, telemetría ACTIVA, versión de
  términos, tabla de consentimientos y exportación a CSV.
- Control de Acceso: el *kill switch* marca "Modificado"; el modal resume el cambio; "Aceptar" solo se
  habilita con la frase "realizar cambios" (sin distinguir mayúsculas); al guardar avisa y cierra.
  Al cambiar a Control TI, la telemetría aparece EN PAUSA.
- Sin errores de JavaScript.

### 2.2 Backend simulado con el contrato (36/36)

Un servidor local que responde con datos distintos a los del modo demo, para comprobar que la pantalla
muestra lo que manda el backend:

- Se ven los valores del backend y ninguno de los datos demo.
- Las llamadas llevan el token (`Authorization: Bearer …`) y `eventos` pide `limite=15`.
- Errores: 500 → "No se pudieron cargar las métricas…"; 401 → "Tu sesión venció…"; 403 → "No tienes
  permiso…".
- Control de Acceso lee el estado del *kill switch* del backend (EN PAUSA). Al guardar envía
  `PUT /telemetria/configuracion` `{"telemetriaActiva": true, "versionTerminosVigente": …}`, luego
  `PUT /seguridad/politicas-acceso` y luego `POST /auditoria` con el resumen del cambio.
- Si el guardado falla (403), avisa y el modal queda abierto con lo escrito.

### 2.3 Backend real (19/19)

- `analitica.demo` entra y ve el menú de Control TI.
- Dashboard y Onboarding **no muestran datos inventados**: avisan el error y la pantalla queda vacía.
- Control de Acceso (`admin.demo`): al guardar, la primera llamada (`PUT /telemetria/configuracion`)
  da 404, avisa el error, el modal queda abierto y no se hace ninguna otra llamada. No se cambió nada en
  el backend.

## 3. Lo que hay que corregir

**En el backend** (lo que bloquea):

1. Implementar `GET /telemetria/resumen`, `GET /telemetria/eventos`, `GET /telemetria/consentimientos` y
   `PUT /telemetria/configuracion` con el formato de `types/telemetria.types.ts`. Lo de Control de Acceso
   está en `docs/Solicitud_backend_control_acceso.md`.

El formato completo que espera el portal está en `docs/Solicitud_backend_telemetria.md`.

**En el front** (encontrado en estas pruebas; **resuelto en la rama `fix/telemetria-y-lint`**, sección 5):

2. ✅ Con el 404, Control TI decía "No encontramos este registro…". Ahora: "Las métricas de uso de la app
   todavía no están disponibles en el servidor", y la pantalla muestra una tarjeta en vez de quedar en blanco.
3. ✅ Control de Acceso ignoraba el error de lectura y mostraba valores fijos como si fueran reales. Ahora
   avisa qué no se pudo leer y no deja guardar.
4. ✅ Control de Acceso decía siempre "Error al guardar las políticas"; ahora usa `mensajeErrorApi` (403,
   409…) y avisa si la telemetría se guardó pero las políticas no.
5. ✅ Los eventos anónimos se pedían pero no se mostraban; ahora hay una tabla en el dashboard.
6. ✅ El dashboard no cubría el Req 4; ahora tiene usuarios únicos, sesiones, actividad por día y por hora
   (hora de Perú), consultas completadas y fallidas con su porcentaje, filtros y la fecha de última
   actualización. Falta que el backend mande los datos (`uso`).

## 4. Otros hallazgos

- `npm run lint` fallaba con 2 errores `react-hooks/set-state-in-effect` en
  `components/roles/control-municipal/superset/SupersetEmbedViewer.tsx:112` y
  `components/roles/control-municipal/tributarios/ReportesTributariosView.tsx:48`, más 2 importaciones sin
  usar. Venían de `f8543a7`. ✅ Corregido en `fix/telemetria-y-lint` sin cambiar el comportamiento.
- Para probar en local contra el backend real se usa el mismo reenvío que Vercel:
  `BACKEND_URL=http://32.200.209.224` y `NEXT_PUBLIC_API_URL=/api/v1/portal`. **En Git Bash** hay que poner
  `MSYS_NO_PATHCONV=1`; si no, convierte `/api/v1/portal` en `C:/Program Files/Git/api/v1/portal` y el
  login dice "No se pudo conectar con el servidor".

## 5. Cambios de la rama `fix/telemetria-y-lint` (11/11/2026)

| Cambio | Archivos |
|---|---|
| Lint en 0: efectos de Superset y de reportes tributarios sin `setState` síncrono; 2 importaciones sin usar | `SupersetEmbedViewer.tsx`, `ReportesTributariosView.tsx`, `DashboardGeneralControl.tsx`, `SupersetReportesView.tsx` |
| Dashboard de uso (Req 4): filtros, indicadores, reglas de conteo, actividad por día y hora, funcionalidades, última actualización | `control-ti/dashboard/parts/UsoFiltros.tsx`, `UsoSistemaPanel.tsx`, `GraficoColumnas.tsx`, `useControlTi.ts`, `utils/fecha-peru.utils.ts`, `types/telemetria.types.ts`, `controllers/telemetria.controller.ts`, token `--chart-uso` |
| Tabla de eventos anónimos en el dashboard | `ControlTiView.tsx`, `EventosAnonimosTable.tsx` |
| Mensajes claros cuando el servidor no tiene la telemetría | `useControlTi.ts`, `PrivacidadOnboardingPanel.tsx` |
| Control de Acceso: lee las políticas (`GET /seguridad/politicas-acceso`), avisa si no puede leer, envía `version` y mensajes de guardado precisos | `controllers/seguridad.controller.ts`, `types/seguridad.types.ts`, `useControlAcceso.ts`, `ControlAccesoPanel.tsx`, `ControlAccesoToolbar.tsx` |
| Canal del reclamo en el expediente | `ExpedienteMetadatos.tsx` |

Pruebas en el navegador de estos cambios: **demo 34/34, backend simulado 31/31, backend real 13/13**, y
Control Municipal (Superset y reportes tributarios siguen cargando) 4/4. `tsc`, `lint` (0 errores y 0
advertencias) y `build` OK. El color de las columnas pasa el validador de contraste en modo claro y oscuro.

## 6. Cómo repetirlas cuando el backend tenga los endpoints

1. API: con un token de `analitica.demo`, los cuatro endpoints de la sección 1 deben responder 200 con los
   campos de `types/telemetria.types.ts`; `PUT /telemetria/configuracion` solo con ADMIN (otro rol → 403).
2. Navegador: entrar como `analitica.demo` y revisar las dos pestañas de Control TI; entrar como
   `admin.demo`, cambiar el *kill switch*, guardar y volver a Control TI para ver el cambio. **Volver a
   dejar la telemetría ACTIVA**: es el interruptor real de la app.

## 7. Repetición con los endpoints publicados (11/11/2026, tarde)

El backend publicó `GET /telemetria/resumen`, `/eventos`, `/consentimientos` y `PUT /telemetria/configuracion`.
Su formato difiere del que propusimos (filtros `fechaDesde`/`fechaHasta`/`canal`, códigos como `DEUDAS` o
`ANDROID`, y `sesiones`, `consultas`, `funcionalidades`… en la raíz en lugar de un objeto `uso`), así que se
adaptó el portal; el formato quedó escrito en `docs/Solicitud_backend_telemetria.md`.

### 7.1 API del backend real

| Comprobación | Resultado |
|---|---|
| Sin sesión | 401 en los cuatro endpoints |
| Lectura con CONTROL_TI (`analitica.demo`) y ADMIN | 200 |
| Lectura con SUPERVISOR, FUNCIONARIO y CONTROL_MUNICIPAL (`reportes.demo`) | 403 `forbidden` |
| `PUT /telemetria/configuracion` con FUNCIONARIO, SUPERVISOR o CONTROL_TI | 403 |
| `PUT` con ADMIN | 200, devuelve `onboarding`; al cambiar el valor registra `CONFIGURACION_TELEMETRIA` en auditoría |
| Filtros `canal`, `funcionalidad`, `sistemaOperativo`, `appVersion`, `fechaDesde`, `fechaHasta` | Cambian sesiones, consultas, funcionalidades, dispositivos, pantallas y tasa de errores |
| Validación | 422 con mensaje: funcionalidad inexistente, fecha mal escrita, `fechaDesde` posterior a `fechaHasta`, más de 366 días, `limite` 0 o 1000 |
| Datos | 10 eventos de prueba (`PRUEBA_BACKEND`), 1 consentimiento, 6 usuarios registrados |

Siguen en 404: `GET /seguridad/politicas-acceso`, `GET /documentos-versiones`, `GET /reportes/constancias` y
`GET /tickets/{id}/adjuntos`.

### 7.2 Navegador

Playwright con Microsoft Edge. En cada escenario se revisa el dashboard (filtros, indicadores, gráficos,
tabla de funcionalidades, eventos y dispositivos), Privacidad y Onboarding, y Control de Acceso.

| Escenario | Resultado | Lo más importante |
|---|---|---|
| Modo demo | 48/48 | Los datos demo usan los mismos códigos y el mismo formato que el backend. |
| Backend simulado con el formato real | 108/108 | Indicadores iguales a la respuesta con cada filtro; códigos sin nombre se muestran legibles; un error 500 al recargar mantiene los datos anteriores; guardado por secciones en Control de Acceso (solo telemetría, solo políticas y conflicto 409). |
| Backend real | 92/92 | Cada indicador coincide con la respuesta del servidor con 7 días, canal móvil, canal web, funcionalidad, Android y 30 días. |

En el backend real, además:

- **Control de Acceso** avisa que no pudo leer las políticas de sesión y contraseña (404), deja esa sección
  deshabilitada y **sí deja guardar la telemetría**.
- **Kill switch de punta a punta:** `admin.demo` pausa la telemetría (`PUT` con `{"telemetriaActiva": false}`),
  `analitica.demo` la ve EN PAUSA en Privacidad y Onboarding, y luego se reanuda y se ve ACTIVA.
  **Quedó ACTIVA** (comprobado por API al terminar) y la versión de términos no se tocó (`1.0`).
- El portal ya no duplica la auditoría: la fila `CONFIGURACION_TELEMETRIA` la escribe el backend.

Las pruebas dejaron en la auditoría del backend filas `LOGIN` de las cuentas demo, 4 `CONFIGURACION_TELEMETRIA`
(dos pausas y dos reanudaciones) y 2 `ACTUALIZACION_POLITICA` de la primera ronda, antes de quitar el
registro duplicado. También hubo un intento de ingreso fallido con un usuario de prueba que no existe
(`ti.mock`), por lanzar una ronda del backend simulado con el servidor local todavía apuntando al real.

`npx tsc --noEmit`, `npm run lint` (0 errores y 0 advertencias) y `npm run build`: OK.

### 7.3 Cambios en el portal

| Cambio | Archivos |
|---|---|
| Tipos y controlador con el formato del backend; datos demo con el mismo formato | `types/telemetria.types.ts`, `controllers/telemetria.controller.ts` |
| Nombres legibles para los códigos y armado del uso a partir del resumen | `utils/telemetria.utils.ts` (nuevo) |
| Filtro de canal; filtros con `fechaDesde`/`fechaHasta` y códigos del backend | `useControlTi.ts`, `UsoFiltros.tsx` |
| Tabla de funcionalidades con eventos, ordenada por uso | `UsoSistemaPanel.tsx` |
| Tabla de eventos con funcionalidad, resultado, código de error y canal | `EventosAnonimosTable.tsx` |
| Dispositivos con "Otros" (portal web); dispositivos y pantallas junto a lo que sigue los filtros | `DispositivosCard.tsx`, `ControlTiView.tsx` |
| Sin tarjeta ni columna de notificaciones (el backend no las registra; quitadas el 11/11) | `PrivacidadOnboardingPanel.tsx` |
| "Último dato registrado" sin convertir la hora (el backend ya la envía en hora de Perú) | `utils/fecha-peru.utils.ts` |
| Control de Acceso por secciones: se guarda lo que se pudo leer, se envía solo lo que cambió y no se duplica la auditoría | `useControlAcceso.ts`, `ControlAccesoPanel.tsx`, `types/auditoria.types.ts` |

### 7.4 Lo que queda

- Las dudas sobre la telemetría ya están respondidas (`docs/Solicitud_backend_telemetria.md`, sección 5).
- Repetir la prueba cuando la app móvil envíe eventos reales.
- Control de Acceso y adjuntos ya tienen endpoint y el portal los usa (`docs/Solicitud_backend_control_acceso.md`,
  `docs/Solicitud_backend_adjuntos.md`). Las constancias salen en el próximo despliegue del backend.
