# Solicitud al backend: pantalla "Control de Acceso" (Admin)

Para el grupo de backend · 11/11/2026

La pantalla **Admin → Control de Acceso** (`components/roles/admin/acceso/`) deja al administrador
cambiar las políticas de sesión y contraseña, apagar la telemetría de la app y preparar una nueva
versión de los términos. Hoy **casi nada de eso llega al backend**: la pantalla muestra valores
fijos del front y, al guardar, llama a endpoints que no sabemos si existen. Este documento lista lo
que falta para que la pantalla diga la verdad.

> **Respondido y desplegado (11/11, noche).** El backend respondió con
> `Control de Acceso y adjuntos del reclamo: contrato y respuestas al portal` (rama `feature/adjuntos-control-acceso`)
> y ya está desplegado. Resumen de lo que usa el portal *(rama `fix/telemetria-y-lint`)*:
>
> - `GET`/`PUT /seguridad/politicas-acceso`: `sessionTimeoutMinutes` (15, 30, 45, 60, 120), `maxFailedLogins` (3, 5, 10),
>   `lockoutMinutes` (5, 15, 30, 60, **nuevo**) y `minPasswordLength` (8, 10, 12), con `version`. El portal envía
>   **solo los campos que cambiaron** y la `version`; el backend audita (`ACTUALIZACION_POLITICA`), así que el portal
>   **ya no llama a `POST /auditoria`**. Se aplican: bloqueo del personal, cierre por inactividad (`401 invalid_session`)
>   y longitud mínima al cambiar la contraseña.
> - **Quitados de la pantalla y del envío:** `passwordExpirationDays`, `require2FAForPrivileged`,
>   `restrictToMunicipalNetwork` y `allowSimultaneousSessions` (el backend no los implementa).
> - `POST /auth/cambiar-contrasena`: menú de la cuenta → **Cambiar contraseña** (todo el personal). Muestra el
>   mensaje del backend (`password_too_short` trae el mínimo).
> - `GET /documentos-versiones?tipo=AVISO_ANALITICA`: el ciudadano acepta el **aviso de analítica** en el onboarding.
>   La pantalla lista sus versiones y permite elegir la activa; `PUT /documentos-versiones/{id}/activar` responde
>   **501** hasta que el responsable de la BD dé `UPDATE (activo)`, y el portal lo explica. El botón de textos fijos
>   ("v1.4") se quitó, y `versionTerminosVigente` ya no va en `PUT /telemetria/configuracion`.
> - `account_locked`: el portal muestra el mensaje del backend (trae los minutos configurados).
>
> Probado: backend simulado con este contrato, 56/56 (incluye 409, 501, 422 y fallas de lectura por sección);
> backend real **solo lecturas**, 9/9 (políticas 30/5/15/8, aviso 1.0 activo). No se guardó nada en el backend real.
>
> **Dudas que quedan:** ¿`PUT …/activar` registrará auditoría cuando funcione? ¿`GET /documentos-versiones` puede
> devolver también el título o un enlace al texto, para mostrarlo en la pantalla?

> **Actualización del 11/11 por la tarde:** el backend ya publicó `GET /telemetria/resumen` y
> `PUT /telemetria/configuracion`. El *kill switch* funciona de punta a punta y el backend registra su
> auditoría (`CONFIGURACION_TELEMETRIA`). La tabla de la sección 7 tiene el estado nuevo. Siguen pendientes
> las políticas de sesión y contraseña (sección 2) y las versiones del aviso (sección 4).

Comprobado el 11/11 por la mañana en el backend real (`/api/v1/portal`, con `admin.demo`):
`GET /seguridad/politicas-acceso`, `GET /telemetria/resumen`, `PUT /telemetria/configuracion` y
`GET /documentos-versiones` responden **404**. Lo que sí existe y usa esta pantalla es `POST /auditoria`
(el `GET` responde). Les pedimos que completen la última columna de la tabla de la sección 7 si algo ya
está en otra ruta, o si no lo harán.

## 1. Qué hace hoy la pantalla

| Momento | Llamada | Qué pasa |
|---|---|---|
| Al abrir | `GET /telemetria/resumen` | Solo toma `telemetriaActiva`, `mesesRetencionUso` y `versionTerminosVigente`. |
| Al abrir | `GET /seguridad/politicas-acceso` | *(Desde la rama `fix/telemetria-y-lint`.)* Si alguna de las dos lecturas falla, la pantalla lo avisa y no deja guardar. Antes se mostraban valores fijos del front (45 min, 90 días, 5 intentos, 8 caracteres). |
| Al guardar (1/3) | `PUT /telemetria/configuracion` | Solo si cambió la telemetría o la versión, y solo con el campo que cambió: `{ telemetriaActiva }` o `{ versionTerminosVigente }`. |
| Al guardar (2/3) | `PUT /seguridad/politicas-acceso` | Solo si cambió alguna política. Todo el formulario (ver sección 2.2). |
| Al guardar (3/3) | `POST /auditoria` | Solo si cambiaron las políticas: el front escribe la línea de auditoría. El cambio de telemetría ya lo registra el backend. |

Si una de las dos lecturas falla, la pantalla lo avisa, deshabilita esa sección y deja guardar la otra.

Son tres llamadas separadas: si falla la segunda, la primera ya quedó aplicada, y la auditoría
depende de que el navegador llegue al tercer paso. Por eso pedimos que **cada endpoint de escritura
registre su propia auditoría** (sección 5).

## 2. Políticas de sesión y contraseña

### 2.1 `GET /seguridad/politicas-acceso` (nuevo)

Devuelve la configuración guardada. Solo ADMIN.

```json
{
  "sessionTimeoutMinutes": 30,
  "passwordExpirationDays": 90,
  "maxFailedLogins": 5,
  "minPasswordLength": 8,
  "version": 3,
  "actualizadoEn": "2026-11-11T15:20:00Z",
  "actualizadoPor": "Ing. Carlos Mendoza"
}
```

### 2.2 `PUT /seguridad/politicas-acceso`

Guarda la configuración. Solo ADMIN. Valores que ofrece la pantalla (validar en el backend y
responder 422 si llega otro):

| Campo | Valores permitidos |
|---|---|
| `sessionTimeoutMinutes` | 15, 30, 45, 60, 120 |
| `passwordExpirationDays` | 30, 60, 90, 180 |
| `maxFailedLogins` | 3, 5, 10 |
| `minPasswordLength` | 8, 10, 12 |
| `version` | La que se leyó en el GET. Si cambió, 409 `version_conflict` (otro admin guardó antes). |

Respuesta: la configuración guardada, con el mismo formato del GET.

Hoy el front también manda `require2FAForPrivileged`, `restrictToMunicipalNetwork` y
`allowSimultaneousSessions`, pero la pantalla no tiene controles para ellos. **Dígannos si los van a
implementar**; si no, los quitamos del envío.

Y si `PUT /seguridad/politicas-acceso` ya recibe `telemetriaActiva`, `mesesRetencionUso` y
`versionTerminosVigente` (el front hoy los manda en el mismo cuerpo), también avísennos: no deberían
guardarse dos veces.

### 2.3 Que las políticas se apliquen de verdad

Guardar los valores no sirve si el login no los usa. Necesitamos que:

| Política | Qué debe hacer el backend | Error que espera el front |
|---|---|---|
| Inactividad | El token vence tras `sessionTimeoutMinutes` sin uso (renovar `sesiones.expira_en` con cada llamada). El login devuelve `expiraEn`. | 401 (el front pide volver a entrar). |
| Intentos fallidos | Bloquear la cuenta al llegar a `maxFailedLogins` (hoy está fijo en 5 → 15 minutos). | 401 con código `account_locked` (ya lo maneja el front). |
| Longitud mínima | Rechazar contraseñas más cortas al crear la cuenta (contraseña temporal) y al cambiarla. | 422 con código `password_too_short` y el mensaje. |
| Renovación | Guardar cuándo se cambió la contraseña; si pasaron más de `passwordExpirationDays`, pedir cambio al entrar. | Código `password_expired`. Requiere un endpoint para cambiar la contraseña, que hoy no existe en el front. |

Si la renovación no entra en el alcance, avísennos y quitamos ese campo de la pantalla.

## 3. Telemetría de la app (kill switch y retención)

### 3.1 `PUT /telemetria/configuracion`

Cuerpo: `{ "telemetriaActiva": false }`. Solo ADMIN. Respuesta: el objeto `onboarding` de
`/telemetria/resumen` ya actualizado.

Lo importante es el efecto: con `telemetriaActiva = false` **el backend de la app móvil debe dejar
de guardar eventos de uso** (y la app debe poder consultarlo). Confirmen con el backend móvil cómo lo
leerán.

### 3.2 Retención

`mesesRetencionUso` se muestra como solo lectura. Que `GET /telemetria/resumen` lo lea de
`configuracion_sistema.RETENCION_USO_MESES` (hoy el front asume 12).

## 4. Versión de los términos de la app

Hoy el botón solo alterna entre dos textos fijos del front (`v1.3 (2026-10)` y `v1.4 (2026-11)`).
La BD ya tiene `documentos_versiones` (tipo `TERMINOS` / `DEVOLUCIONES` / `PRIVACIDAD`, una activa
por tipo). Pedimos:

- `GET /documentos-versiones?tipo=PRIVACIDAD`: lista de versiones (`id`, `version`, `publicadoEn`,
  `activo`). Solo ADMIN.
- `PUT /documentos-versiones/{id}/activar`: deja esa versión como la activa de su tipo (y desactiva
  la anterior) en una transacción. Solo ADMIN.
- Que `versionTerminosVigente` de `/telemetria/resumen` salga de la versión activa.

**Duda:** ¿qué tipo acepta el ciudadano en el onboarding de la app, `PRIVACIDAD` o `TERMINOS`? El
front usará el que nos digan.

Con esto, `versionTerminosVigente` deja de ir en `PUT /telemetria/configuracion`.

## 5. Auditoría

Cada `PUT` de las secciones 2, 3 y 4 debe insertar su fila en `auditoria` **en la misma
transacción**, con `origen = 'WEB'`, el `administrador_id` de la sesión y en `datos` los valores de
antes y después. Acciones sugeridas (ya existen en `types/auditoria.types.ts`):

| Endpoint | `accion` |
|---|---|
| `PUT /seguridad/politicas-acceso` | `ACTUALIZACION_POLITICA` |
| `PUT /telemetria/configuracion` | `ACTUALIZACION_GOBERNANZA_TELEMETRIA` |
| `PUT /documentos-versiones/{id}/activar` | `ACTUALIZACION_POLITICA` (o la que prefieran) |

Cuando esté listo, el front deja de llamar a `POST /auditoria` desde esta pantalla.

## 6. Permisos y errores

- Todos los endpoints de este documento: solo **ADMIN**. Otro rol → 403 `forbidden`.
  `GET /telemetria/resumen` lo usan también CONTROL_TI (lectura).
- Formato de error, el mismo que ya usan: `{"error": {"code", "message", "details"?}}`. En 409 y 422
  el front muestra el `message` tal cual, así que debe estar en español y decir cómo resolverlo.

## 7. Resumen

| # | Endpoint | Para qué | Prioridad | Hoy (11/11) | Respuesta del backend |
|---|---|---|---|---|---|
| 1 | `GET /seguridad/politicas-acceso` | Mostrar las políticas guardadas | Alta | 404 | |
| 2 | `PUT /seguridad/politicas-acceso` | Guardarlas, con validación, `version` y auditoría | Alta | No probado (sin el GET) | |
| 3 | Aplicar las políticas en el login y al crear o cambiar contraseñas | Que la configuración tenga efecto | Alta | El bloqueo por intentos ya existe (`account_locked`, `CUENTA_BLOQUEADA` en auditoría), con valor fijo | |
| 4 | `PUT /telemetria/configuracion` (solo `telemetriaActiva`) + efecto en el backend móvil | Kill switch | Alta | ✅ Publicado (tarde del 11/11): 200 con ADMIN, 403 con otros roles, con auditoría propia. Falta confirmar que el backend deja de guardar eventos con la telemetría en pausa. | |
| 5 | `RETENCION_USO_MESES` en `GET /telemetria/resumen` | Retención real | Media | ✅ Llega `mesesRetencionUso: 12`. Confirmar que sale de `configuracion_sistema`. | |
| 6 | `GET /documentos-versiones` y `PUT /documentos-versiones/{id}/activar` | Versión de los términos | Media | 404 | |
| 7 | Endpoint para cambiar la contraseña + `password_expired` | Renovación periódica | Baja (o se quita) | — | |
| 8 | Respuesta sobre `require2FAForPrivileged`, `restrictToMunicipalNetwork`, `allowSimultaneousSessions` | Saber si se quitan | Baja | — | |

La matriz de permisos por rol de la pantalla es informativa y queda fija en el front; no hace falta
endpoint.

## 8. Cambios en el front

Ya hechos (rama `fix/telemetria-y-lint`):

- Lee las políticas con `GET /seguridad/politicas-acceso` al abrir y envía la `version` al guardar.
- Si no puede leer la configuración, lo avisa y no deja guardar (antes mostraba valores fijos como si
  fueran los guardados).
- Muestra el error del backend con `mensajeErrorApi` (403, 409…) y avisa si la telemetría se guardó pero
  las políticas no.

- *(11/11, tarde)* Guarda por secciones: si no puede leer las políticas, igual deja pausar o reanudar la
  telemetría. Envía solo lo que cambió y ya no llama a `POST /auditoria` por el cambio de telemetría.

Cuando el backend esté listo:

- Quitar `POST /auditoria` también para las políticas (sección 5) y los campos que no se implementen (sección 2.2).
- Lista de versiones de términos desde el backend, en lugar de los dos textos fijos (sección 4).
