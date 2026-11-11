# Solicitud al backend: adjuntos y evidencias de un reclamo (Req 1)

Para el grupo de backend · 11/11/2026 · Es el ítem 5 del pedido del 11/11.

> **Respondido y desplegado (11/11, noche).** Lo que cambió respecto de esta propuesta y cómo lo usa el portal
> *(rama `fix/telemetria-y-lint`)*:
>
> - `origen` puede ser `CIUDADANO`, `EVALUACION` o `RESPUESTA`, y llega `tipoAdjunto` (`SUSTENTO`, `SUBSANACION`,
>   `EVIDENCIA`, `RESPUESTA`).
> - `disponible: false`: el archivo lo guardó el backend anterior de la app (FastAPI) y no está en este servidor
>   (la descarga da `404 attachment_unavailable`). Hoy son 6 archivos en 5 reclamos. El portal muestra **"Archivo no
>   disponible"** en vez de los botones. Se podrán descargar los nuevos cuando la app envíe al backend único.
> - Códigos de error del SAC: `invalid_attachment_type`, `invalid_attachment_content`, `empty_attachment`,
>   `attachment_too_large`, `too_many_attachments` (422) e `invalid_state` (409). El portal muestra el `message`.
> - La evidencia queda unida a la última evaluación registrada (el formulario lo avisa), deja una nota interna en la
>   línea de tiempo y la auditoría `RECLAMO_EVIDENCIA_ADJUNTADA`. El ciudadano no la ve.
> - `ADJUNTAR_EVIDENCIA` llega en `accionesPermitidas`. Control Municipal (REPORTES) puede listar; ADMIN recibe 403.
>
> En el portal: sección **Adjuntos y evidencias** del expediente (Ver y Descargar, pedidos con la sesión) y la acción
> **Adjuntar evidencia** (revisa tipo y tamaño antes de enviar). Probado con el backend simulado; en el real solo se
> listaron los adjuntos (no se subió ninguna evidencia, porque `reclamo_adjuntos` no se puede borrar).

El Req 1 pide dos cosas distintas con archivos, y hoy el portal no tiene ninguna:

1. **"Registrar cada reclamo con… documentos adjuntos"**: los sube el **ciudadano** en la app al registrar
   (o al subsanar) el reclamo. El portal solo necesita **verlos y descargarlos** en el expediente.
2. **"Registrar la evaluación realizada, los antecedentes consultados, hallazgos y evidencias"**: las sube
   el **funcionario** en el portal, mientras evalúa el reclamo.

Las dos caben en la tabla que ya existe, `reclamo_adjuntos` (`nombre_archivo`, `tipo_mime`,
`tamano_bytes`, `archivo_clave`, `sha256`, y **un solo autor**: `subido_por_usuario_id` si lo subió el
ciudadano o `subido_por_admin_id` si lo subió un funcionario). No hace falta una tabla nueva.

Comprobado el 11/11 en el backend real: `GET /tickets/{id}` no trae adjuntos y
`GET /tickets/{id}/adjuntos` responde 404.

## 1. Lo que necesita el portal

Rutas propuestas (con el prefijo `/api/v1/portal`; si prefieren otros nombres, avísennos):

| # | Endpoint | Para qué | Quién |
|---|---|---|---|
| 1 | `GET /tickets/{id}/adjuntos` | Listar los archivos del reclamo: los del ciudadano y las evidencias del personal. | Los mismos roles que hoy ven el reclamo (funcionario asignado, supervisor, Control Municipal). |
| 2 | `GET /tickets/{id}/adjuntos/{adjuntoId}` | Descargar o ver un archivo. | Igual que el 1. |
| 3 | `POST /tickets/{id}/adjuntos` | Subir una evidencia de la evaluación. | Solo quien puede evaluar ese reclamo. |

### 1.1 `GET /tickets/{id}/adjuntos`

```json
[
  { "id": "…", "nombreArchivo": "recibo_predial.pdf", "tipoMime": "application/pdf", "tamanoBytes": 482133,
    "origen": "CIUDADANO", "subidoPor": "Ciudadano", "subidoEn": "2026-11-10 09:14:02" },
  { "id": "…", "nombreArchivo": "inspeccion_predio.jpg", "tipoMime": "image/jpeg", "tamanoBytes": 1830201,
    "origen": "EVALUACION", "subidoPor": "Lic. Mariana Rios", "subidoEn": "2026-11-11 10:02:40" }
]
```

`origen`: `CIUDADANO` (lo subió el ciudadano) o `EVALUACION` (lo subió el personal). `subidoEn` en hora de
Perú, como el resto de fechas del portal. Sin `archivo_clave` ni rutas internas en la respuesta.

Si les resulta más simple, puede ir como `adjuntos: [...]` dentro de `GET /tickets/{id}` en lugar de un
endpoint aparte.

### 1.2 `GET /tickets/{id}/adjuntos/{adjuntoId}`

Devuelve el archivo con su `Content-Type` y `Content-Disposition` (nombre original). **Con la misma
sesión** (`Authorization: Bearer …`): el portal lo pide con `fetch` y lo abre o descarga; no sirve un
enlace público sin token. Otro rol o un reclamo que el usuario no puede ver → 403 o 404.

### 1.3 `POST /tickets/{id}/adjuntos`

`multipart/form-data` con un campo `archivo` (un archivo por llamada). Respuesta: 201 con el objeto del
adjunto (formato de 1.1).

| Regla | Valor propuesto | Error que espera el portal |
|---|---|---|
| Tipos | **PDF, JPG y PNG** (los mismos que ya acepta la app y la columna `tipo_mime`). Validar por contenido, no solo por extensión. | 422 `unsupported_file_type` |
| Tamaño | Hasta **10 MB** por archivo (límite de `tamano_bytes`). | 413 o 422 `file_too_large` |
| Cantidad | Hasta **5 evidencias** por reclamo. | 422 `too_many_files` |
| Cuándo | Solo con el reclamo **en evaluación** y por el funcionario asignado (o el supervisor). Lo ideal: que venga en `accionesPermitidas` como `ADJUNTAR_EVIDENCIA`, como las demás acciones. | 403 `forbidden` / 409 si el estado no lo permite |
| Auditoría | Registrar quién subió qué (`subido_por_admin_id`) y una fila en la línea de tiempo del reclamo, no visible para el ciudadano. | — |

En los errores, `message` en español: el portal lo muestra tal cual.

No pedimos borrar ni reemplazar: `reclamo_adjuntos` es histórica (no se modifica).

## 2. Dudas

1. ¿El ciudadano debe ver las evidencias de la evaluación en la app? Proponemos que **no** (son internas);
   si alguna debe acompañar la respuesta, se define después.
2. ¿Dónde guarda hoy el backend móvil los archivos (`archivo_clave`)? El backend del portal tiene que
   poder leer ese mismo almacenamiento para servir los adjuntos del ciudadano.
3. Si no llegan a hacer la subida (endpoint 3), con el 1 y el 2 ya se cubre "documentos adjuntos" del Req 1
   y solo quedaría pendiente "evidencias".

## 3. Qué hará el portal cuando estén

- En el expediente (`components/modals/ticket-detail/`): una sección **Adjuntos** con nombre, tamaño, quién
  lo subió y un botón para ver o descargar.
- En "Registrar la evaluación del área": un campo para adjuntar evidencias (PDF, JPG o PNG de hasta 10 MB),
  visible solo si `accionesPermitidas` lo permite.
