# Telemetría y dashboard de uso (Req 3, 4 y 5): formato del backend y pendientes

Para el grupo de backend · 11/11/2026 (actualizado por la tarde)

**Estado:** el backend publicó los cuatro endpoints el 11/11 y el portal ya los usa (rama
`fix/telemetria-y-lint`). El backend usó un formato algo distinto al que propusimos en la mañana, así
que **adaptamos el portal al formato del backend**: no hace falta cambiar nada de lo publicado. Este
documento deja escrito ese formato, tal como lo lee el portal, y las dudas que quedan (sección 5).

Probado contra `http://32.200.209.224/api/v1/portal` con `analitica.demo` y `admin.demo`; detalle en
`docs/Pruebas_telemetria.md`, sección 7. Los tipos del portal están en `types/telemetria.types.ts`.

Permisos comprobados: sin sesión → 401. Leen **CONTROL_TI** (`ANALITICA_USO`) y **ADMIN**; SUPERVISOR,
FUNCIONARIO y REPORTES → 403. `PUT /telemetria/configuracion` solo ADMIN (CONTROL_TI → 403).

## 1. `GET /telemetria/resumen`

Query (todos opcionales; sin fechas el backend usa los últimos 30 días):

| Parámetro | Ejemplo | Nota |
|---|---|---|
| `fechaDesde`, `fechaHasta` | `2026-11-05`, `2026-11-11` | Hora de Perú, ambas incluidas. Máximo 366 días (422 si se pasa). |
| `canal` | `MOVIL` / `WEB` | App móvil o portal web. |
| `funcionalidad` | `DEUDAS` | Un código de `opcionesFiltro.funcionalidades` (422 si no existe). |
| `sistemaOperativo` | `ANDROID` | Un código de `opcionesFiltro.sistemasOperativos`. |
| `appVersion` | `0.0.0-PRUEBA` | |

Respuesta (resumida):

```json
{
  "onboarding": {
    "totalUsuariosRegistrados": 6, "onboardingCompletadoCount": 1, "onboardingTasaPorcentaje": 16.7, "onboardingOmitidoCount": 0,
    "aceptaAnaliticaCount": 1, "aceptaAnaliticaPorcentaje": 100.0, "rechazaAnaliticaCount": 0, "rechazaAnaliticaPorcentaje": 0.0,
    "sinDecisionAnaliticaCount": 5,
    "notificacionesPermitidasCount": 0, "notificacionesPermitidasPorcentaje": 0.0,
    "notificacionesBloqueadasCount": 0, "notificacionesBloqueadasPorcentaje": 0.0, "notificacionesDisponibles": false,
    "versionTerminosVigente": "1.0", "fechaRevisionTerminos": "2026-10-30", "mesesRetencionUso": 12, "telemetriaActiva": true,
    "embudoPasos": [{ "paso": 1, "nombre": "Instalación y primer uso", "descripcion": "…", "usuariosCount": 1, "porcentajeRetencion": 100.0, "porcentajeAbandono": 0.0 }]
  },
  "dispositivos": { "androidCount": 1, "iosCount": 0, "otrosCount": 1, "versionesMasUsadas": [{ "version": "0.0.0-PRUEBA", "porcentaje": 100.0 }] },
  "topPantallas": [{ "pantalla": "PRUEBA_BACKEND", "vistas": 3, "usuariosUnicos": 2, "tiempoPromedioSegundos": 3 }],
  "totalEventosUltimas24h": 10,
  "tasaErroresAppPorcentaje": 20.0,
  "filtros": { "fechaDesde": "2026-10-13", "fechaHasta": "2026-11-11", "funcionalidad": null, "sistemaOperativo": null, "appVersion": null, "canal": null },
  "opcionesFiltro": {
    "funcionalidades": ["AUTENTICACION", "INICIO", "DEUDAS", "LIQUIDACION", "PAGOS", "RECIBOS", "CONSTANCIAS", "RECLAMOS", "BANDEJA", "PERFIL", "PRIVACIDAD", "ONBOARDING", "REPORTES", "DASHBOARD", "ADMINISTRACION", "OTRA"],
    "sistemasOperativos": ["ANDROID", "IOS", "WINDOWS", "MACOS", "LINUX", "OTRO"],
    "versiones": ["0.0.0-PRUEBA"],
    "canales": ["MOVIL", "WEB"]
  },
  "sesiones": { "total": 2, "usuariosUnicos": 2, "instalacionesUnicas": 2, "duracionPromedioSegundos": 3 },
  "consultas": { "iniciadas": 2, "completadas": 1, "fallidas": 1, "porcentajeCompletadas": 50.0 },
  "funcionalidades": [{ "funcionalidad": "DEUDAS", "eventos": 3, "sesiones": 1, "usuariosUnicos": 1, "iniciadas": 1, "completadas": 1, "fallidas": 0, "porcentajeCompletadas": 100.0 }],
  "actividadPorDia": [{ "fecha": "2026-11-11", "eventos": 10, "sesiones": 2, "usuariosUnicos": 2 }],
  "actividadPorHora": [{ "hora": 12, "eventos": 10, "sesiones": 2 }],
  "actividadDiaHora": [{ "diaSemana": 3, "hora": 12, "eventos": 10 }],
  "ultimaActualizacion": "2026-11-11 12:30:32"
}
```

Cómo lo usa el portal:

- **Siguen los filtros:** `sesiones`, `consultas`, `funcionalidades`, `actividadPorDia` (un elemento por día
  del rango, con 0 si no hubo actividad), `actividadPorHora` (las 24 horas), `dispositivos`, `topPantallas`
  y `tasaErroresAppPorcentaje`. **No dependen de los filtros:** `onboarding` y `totalEventosUltimas24h`.
- Los códigos se muestran con nombres (`DEUDAS` → "Consulta de deuda", `IOS` → "iOS", `MOVIL` → "App
  móvil"); la tabla está en `utils/telemetria.utils.ts`. Un código nuevo se ve como texto ("Func nueva x")
  hasta que se le ponga nombre.
- `ultimaActualizacion` se muestra como "Último dato registrado", sin convertir la hora (ya es de Perú).
- `notificacionesDisponibles: false` → el portal muestra "—" y "El servidor todavía no registra el permiso
  de notificaciones", en vez de 0 %.
- `actividadDiaHora` todavía no se usa.

## 2. `GET /telemetria/eventos?limite=15`

Últimos eventos, el más reciente primero. `limite` de 1 a un máximo (0 y 1000 → 422).

```json
[{ "id": "3610d02f-…", "dispositivoAnonimoId": "3d257f17f56c", "tipoEvento": "CONSULTA", "pantalla": "PRUEBA_BACKEND",
   "componenteId": "PRUEBA_CONSULTA", "sistemaOperativo": "Android", "appVersion": "0.0.0-PRUEBA",
   "fechaRegistro": "2026-11-11 12:30:29", "resultado": "FALLIDA", "sesionId": "92f7fa5e-…", "funcionalidad": "RECIBOS",
   "codigoError": null, "duracionMs": 9000, "canal": "MOVIL", "tipoActor": "CIUDADANO" }]
```

Valores vistos: `tipoEvento` = `PANTALLA`, `CONSULTA`, `INICIO_SESION`, `CIERRE_SESION`; `resultado` =
`INICIADA`, `COMPLETADA`, `FALLIDA`, `NO_APLICA`; `tipoActor` = `CIUDADANO`, `PERSONAL`.

## 3. `GET /telemetria/consentimientos`

```json
[{ "id": "e6f4acf7-…", "dispositivoHash": "c0003b78…", "aceptaAnalitica": true, "permiteNotificaciones": false,
   "versionTerminos": "1.0", "fechaDecision": "2026-11-11 12:30:26", "ipAnonimizada": null, "origen": "ONBOARDING", "canal": "MOVIL" }]
```

## 4. `PUT /telemetria/configuracion` (solo ADMIN)

El portal envía **solo lo que cambió**: `{ "telemetriaActiva": false }`. Responde el objeto `onboarding`
actualizado y el backend registra la auditoría (`CONFIGURACION_TELEMETRIA`, "Telemetría opcional en
pausa" / "activada"); por eso el portal ya no llama a `POST /auditoria` para este cambio.

## 5. Dudas y pendientes para el backend

> **Respuestas del backend (11/11, noche):** (1) una sesión termina con `CIERRE_SESION` o tras
> `SESION_USO_INACTIVIDAD_MINUTOS` (30) sin eventos, y se cuenta en el período en que tuvo eventos; el dashboard ya lo
> dice así. (5) `versionTerminosVigente` en este `PUT` solo se acepta si es la vigente (otra → 501): el portal dejó de
> enviarlo; la versión se cambia con `PUT /documentos-versiones/{id}/activar`. (7) La app **todavía no** envía
> eventos: guarda el consentimiento solo en el teléfono; se integrará cuando pase al backend único. (8) Con
> `telemetriaActiva = false` el backend deja de guardar pantallas, acciones y consultas y solo guarda inicio y cierre
> de sesión; el portal lo explica en el interruptor. Retención: sale de `RETENCION_USO_MESES` y la purga es diaria.
> Siguen abiertas la 2, 3, 4 y 6.

| # | Pregunta o pedido | Por qué |
|---|---|---|
| 1 | **Reglas de conteo.** ¿Cuándo termina una sesión (¿30 minutos sin eventos?) y cómo se cuenta un usuario único (¿`dispositivoAnonimoId` distinto?, ¿`instalacionesUnicas` es otra cosa?). | El Req 4 pide mostrar las reglas. El dashboard hoy dice "termina tras 30 minutos sin actividad", que fue una propuesta nuestra. Dígannos el texto correcto. |
| 2 | ¿`ultimaActualizacion` es la fecha del último evento guardado? | El portal la muestra como "Último dato registrado". |
| 3 | Lista completa de valores de `tipoEvento`. | Para ponerles nombre en la tabla de eventos. |
| 4 | `tasaErroresAppPorcentaje`: ¿fallidas / (completadas + fallidas)? | Para explicarlo en la pantalla. |
| 5 | ¿`PUT /telemetria/configuracion` acepta `versionTerminosVigente`? Si llega una versión que no existe, ¿qué pasa? | El botón "Preparar Re-Aceptación" del portal todavía usa textos fijos. No lo probamos contra el backend real para no cambiar la versión vigente. Ver `docs/Solicitud_backend_control_acceso.md`, sección 4. |
| 6 | Permiso de notificaciones (`notificacionesDisponibles: false`) e `ipAnonimizada` (`null`): ¿se van a registrar? | Si no, quitamos esa tarjeta y la columna del CSV. |
| 7 | Datos reales: hoy solo hay 10 eventos de prueba (`PRUEBA_BACKEND`, versión `0.0.0-PRUEBA`). ¿La app móvil ya envía eventos a este backend? | Para la demostración del Req 4. |
| 8 | ¿Con `telemetriaActiva = false` el backend deja de guardar los eventos que manda la app? | Es el efecto que promete el *kill switch*. En la prueba solo lo pausamos unos segundos. |
