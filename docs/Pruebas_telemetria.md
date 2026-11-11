# Pruebas de telemetría (11/11/2026)

Pantallas probadas: **Control TI** → "Dashboard Telemetría App" y "Privacidad y Onboarding", y
**Admin** → "Control de Acceso" (interruptor de telemetría, *kill switch*). Código en
`controllers/telemetria.controller.ts`, `components/roles/control-ti/` y `components/roles/admin/acceso/`.
Versión probada: `main` en `f8543a7`.

## Resultado en una línea

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
