# Solicitud al backend: telemetría y dashboard de uso (Req 3, 4 y 5)

Para el grupo de backend · 11/11/2026

Las pantallas de **Control TI** ("Dashboard Telemetría App" y "Privacidad y Onboarding") y el
interruptor de telemetría de **Admin → Control de Acceso** ya están hechas en el portal y probadas con
un backend simulado (`docs/Pruebas_telemetria.md`). En el backend real (`/api/v1/portal`) los cuatro
endpoints responden **404**. El formato exacto está en `types/telemetria.types.ts` del repositorio del
portal; aquí va lo necesario para implementarlos.

Todos piden sesión. Lectura: **CONTROL_TI** (en el backend, `ANALITICA_USO`) y **ADMIN**. Otro rol → 403.
Errores con el formato de siempre: `{"error": {"code", "message"}}`.

## 1. `GET /telemetria/resumen`

Query opcional (la manda el dashboard; Control de Acceso la llama sin query):

| Parámetro | Ejemplo | Nota |
|---|---|---|
| `desde`, `hasta` | `2026-11-05`, `2026-11-11` | Fechas en **hora de Perú**, ambas incluidas. |
| `funcionalidad` | `Nuevo reclamo` | Una de `uso.filtrosDisponibles.funcionalidades`. |
| `sistemaOperativo` | `Android` / `iOS` | |
| `appVersion` | `v2.4.1` | |

Respuesta (`TelemetriaResumen`):

```json
{
  "onboarding": {
    "totalUsuariosRegistrados": 12450, "onboardingCompletadoCount": 11180, "onboardingTasaPorcentaje": 89.8,
    "aceptaAnaliticaCount": 8832, "aceptaAnaliticaPorcentaje": 79.0,
    "rechazaAnaliticaCount": 2348, "rechazaAnaliticaPorcentaje": 21.0,
    "notificacionesPermitidasCount": 9680, "notificacionesPermitidasPorcentaje": 77.8,
    "notificacionesBloqueadasCount": 2770, "notificacionesBloqueadasPorcentaje": 22.2,
    "versionTerminosVigente": "1.3", "fechaRevisionTerminos": "2026-10-15",
    "mesesRetencionUso": 12, "telemetriaActiva": true,
    "embudoPasos": [
      { "paso": 1, "nombre": "Bienvenida", "descripcion": "…", "usuariosCount": 12450, "porcentajeRetencion": 100, "porcentajeAbandono": 0 }
    ]
  },
  "dispositivos": { "androidCount": 9460, "iosCount": 2990, "versionesMasUsadas": [{ "version": "v2.4.1", "porcentaje": 68 }] },
  "topPantallas": [{ "pantalla": "HomeCiudadano", "vistas": 42300, "usuariosUnicos": 9800, "tiempoPromedioSegundos": 45 }],
  "totalEventosUltimas24h": 38490,
  "tasaErroresAppPorcentaje": 0.42,
  "uso": {
    "usuariosUnicos": 1850, "sesiones": 4869,
    "consultasIniciadas": 6239, "consultasCompletadas": 5805, "consultasFallidas": 434, "porcentajeCompletadas": 93.0,
    "actividadPorDia": [{ "fecha": "2026-11-10", "eventos": 3231, "sesiones": 788 }],
    "actividadPorHora": [{ "hora": 20, "eventos": 1440, "sesiones": 351 }],
    "funcionalidades": [{ "funcionalidad": "Nuevo reclamo", "iniciadas": 1050, "completadas": 924, "fallidas": 126 }],
    "filtrosDisponibles": { "funcionalidades": ["Consulta de deuda", "Nuevo reclamo"], "sistemasOperativos": ["Android", "iOS"], "versiones": ["v2.4.1", "v2.3.0"] },
    "actualizadoEn": "2026-11-11T15:30:00Z"
  }
}
```

- `uso` (Req 4) se calcula con los filtros de la query. `onboarding`, `dispositivos`, `topPantallas` y los
  totales de 24 h son el estado general y no dependen de los filtros.
- `mesesRetencionUso` desde `configuracion_sistema.RETENCION_USO_MESES`.
- `actividadPorDia` trae un elemento por día del rango (con 0 si no hubo actividad); `actividadPorHora`,
  las 24 horas (0–23, hora de Perú).
- `actualizadoEn`: cuándo se calcularon los datos (UTC). El portal lo muestra en hora de Perú.
- Si `uso` no llega, el dashboard avisa "El servidor todavía no envía los datos de uso" y muestra el resto.

**Reglas de conteo** (las muestra el dashboard; confírmenlas o dígannos las suyas):

| Dato | Regla |
|---|---|
| Usuario único | Identificador seudónimo distinto en el período. Nunca nombre, correo ni DNI. |
| Sesión | Uso continuo de un dispositivo; termina tras **30 minutos** sin eventos. |
| Consulta completada / fallida | Evento de acción con `resultado` `COMPLETADA` o `FALLIDA`. |
| % completadas | `consultasCompletadas / consultasIniciadas × 100`, con un decimal. |

## 2. `GET /telemetria/eventos?limite=15`

Lista de los últimos eventos, el más reciente primero (`TelemetriaEvento[]`):

```json
[{ "id": "…", "dispositivoAnonimoId": "anon-7f8e1a", "tipoEvento": "CLICK_BOTON", "pantalla": "NuevoReclamo",
   "componenteId": "btn_adjuntar_foto", "sistemaOperativo": "iOS", "appVersion": "v2.4.1",
   "fechaRegistro": "2026-11-11 10:14:02", "resultado": "COMPLETADA", "sesionId": "s-91ab" }]
```

`tipoEvento`: `PANTALLA_VISTA`, `CLICK_BOTON`, `ERROR_APP` o `ENVIO_FORMULARIO`. **Nuevos, para el Req 3:**
`resultado` (`COMPLETADA` / `FALLIDA`, en acciones) y `sesionId` (seudónimo). Sin ellos no se pueden
contar sesiones ni el % de consultas completadas. Sin credenciales ni datos tributarios en ningún campo.

## 3. `GET /telemetria/consentimientos`

Decisiones de privacidad de la app (Req 5), la más reciente primero (`ConsentimientoAuditoriaLog[]`):

```json
[{ "id": "…", "dispositivoHash": "e3b0c442…", "aceptaAnalitica": true, "permiteNotificaciones": true,
   "versionTerminos": "1.3", "fechaDecision": "2026-10-30 19:42:15", "ipAnonimizada": "190.237.xxx.xxx" }]
```

## 4. `PUT /telemetria/configuracion` (solo ADMIN)

Cuerpo: `{ "telemetriaActiva": false, "versionTerminosVigente": "1.4" }`. Respuesta: el objeto
`onboarding` actualizado. Debe registrar su propia auditoría. Con `telemetriaActiva = false`, el backend
móvil deja de guardar eventos de uso. Más detalle en `docs/Solicitud_backend_control_acceso.md`.

## 5. Dudas

1. ¿`/api/v1/analitica/*` es por donde la app envía los eventos? (Hoy no acepta las sesiones del portal.)
2. ¿Qué nombres de funcionalidad usarán? El filtro del portal muestra los que lleguen en
   `uso.filtrosDisponibles.funcionalidades`.
