# Base de datos Oracle – Backend Móvil

Proyecto San Miguel · Conexión, permisos y diccionario de datos · 24/10/2026

> Convertido de `docs/Conexion_BD_Backend_Movil.docx` (que no se sube al repositorio).
> **La contraseña se quitó a propósito**: se entrega por un canal seguro y se usa solo como
> variable de entorno `DB_PASSWORD`. Se omitieron los ejemplos de Python y Node.js (el portal es Java).

Este documento tiene lo que necesita el backend de la app móvil para conectarse a la base de datos
y consumir la información del contribuyente: deudas, liquidaciones, pagos, recibos, constancias y
reclamos. La app nunca se conecta a Oracle: solo el backend, con la cuenta de abajo.

## 1. Datos de conexión

| Dato | Valor |
|---|---|
| Motor | Oracle Database 19c Standard Edition 2 (AWS RDS) |
| Host | `dboracle.cyokhc3gxdmj.us-east-1.rds.amazonaws.com` |
| Puerto | `1521` |
| SID | `SMORCLDP` (la conexión es por SID, no por service name) |
| Usuario | `SANMI_API_MOVIL` |
| Contraseña | *(no se incluye; se entrega por canal seguro)* |
| Esquema de las tablas | `SANMI_APP` (las tablas NO están en el esquema de tu usuario) |
| Rol Oracle asignado | `SANMI_MOVIL_ROLE` |
| Valor de "origen" en sesiones y auditoría | `MOVIL` |

Guarda la contraseña en variables de entorno o en el gestor de secretos del servidor. No la subas
al repositorio ni la incluyas en el APK.

## 2. Configurar la conexión

1. **Habilitar tu IP:** la base solo acepta conexiones desde IPs autorizadas en AWS. Envía al
   responsable de base de datos la IP pública del servidor (o de tu PC, para desarrollo) desde donde
   se conectará el backend.
2. **Instalar el driver.** Java: `ojdbc11`. (Python: `oracledb` en modo thin; Node.js: `oracledb`.)
3. En cada conexión nueva del pool, ejecutar `ALTER SESSION SET CURRENT_SCHEMA = SANMI_APP` y
   `ALTER SESSION SET TIME_ZONE = 'UTC'`. Así puedes escribir `deudas` en lugar de
   `SANMI_APP.deudas` y todas las fechas se manejan en UTC.
4. **No ejecutar migraciones, `create_all()` ni DDL:** tu cuenta no tiene permisos para crear o
   alterar tablas. La estructura ya existe; mapea tus modelos ORM a las tablas existentes (con el
   esquema `SANMI_APP` o el `CURRENT_SCHEMA` del paso 3).

### Variables de entorno sugeridas

```
DB_HOST=dboracle.cyokhc3gxdmj.us-east-1.rds.amazonaws.com
DB_PORT=1521
DB_SID=SMORCLDP
DB_USER=SANMI_API_MOVIL
DB_PASSWORD=<se entrega por canal seguro>
DB_SCHEMA=SANMI_APP
```

### Java (JDBC)

```
jdbc:oracle:thin:@dboracle.cyokhc3gxdmj.us-east-1.rds.amazonaws.com:1521:SMORCLDP
-- formato SID: dos puntos antes de SMORCLDP
```

## 3. Probar la conexión

Con la conexión configurada, estas consultas deben devolver datos. Las tres últimas deben fallar
con ORA-01031 u ORA-00942: es la prueba de que la cuenta no puede alterar la base.

```sql
ALTER SESSION SET CURRENT_SCHEMA = SANMI_APP;
SELECT USER, SYS_CONTEXT('USERENV','CURRENT_SCHEMA') FROM dual;   -- SANMI_API_MOVIL / SANMI_APP
SELECT codigo, monto_pendiente, deudas_vencidas FROM v_resumen_contribuyente ORDER BY codigo;
-- SM-2026-00001 debe mostrar 515.50
DROP TABLE deudas;              -- debe fallar
DELETE FROM pagos;              -- debe fallar
SELECT * FROM administradores;  -- debe fallar (tu cuenta no tiene acceso)
```

## 4. Permisos de tu cuenta

Oracle rechaza cualquier operación fuera de esta tabla. Ninguna cuenta puede borrar filas: los
registros se desactivan o cambian de estado. Las tablas que no aparecen (`administradores`) no son
accesibles para tu cuenta.

| Tabla | Leer | Insertar | Actualizar |
|---|---|---|---|
| contribuyentes | Sí | No | Solo: correo, telefono, telefono_alterno |
| usuarios | Sí | No | Solo: hash_contrasena, estado, intentos_fallidos, bloqueado_hasta, ultimo_acceso_en |
| predios | Sí | No | No |
| predio_valuos | Sí | No | No |
| valores_uit | Sí | No | No |
| conceptos_tributarios | Sí | No | No |
| deudas | Sí | No | Solo: estado |
| beneficios_deuda | Sí | No | No |
| valores | Sí | No | No |
| valor_deudas | Sí | No | No |
| liquidaciones | Sí | Sí | Solo: estado |
| liquidacion_detalles | Sí | Sí | No |
| tramites | Sí | No | No |
| solicitudes_constancia | Sí | Sí | Solo: estado, motivo_rechazo, atendido_en |
| pagos | Sí | Sí | Solo: estado, confirmado_en, motivo_rechazo, referencia_proveedor |
| recibos | Sí | Sí | No |
| constancias | Sí | Sí | No |
| documentos_versiones | Sí | No | No |
| aceptaciones | Sí | Sí | No |
| sesiones | Sí | Sí | Solo: revocado_en |
| auditoria | **No** | Sí | No |
| tipos_reclamo | Sí | No | No |
| reclamos | Sí | Sí | Solo: estado, descripcion, pedido |
| reclamo_adjuntos | Sí | Sí | No |
| reclamo_seguimientos | Sí | Sí | No |

**Vistas (lectura):** `v_deuda_pago`, `v_deudas`, `v_perfil_contribuyente`,
`v_resumen_contribuyente`, `v_actividad_reciente`, `v_recibos`, `v_reclamos_contribuyente`,
`v_reclamo_seguimiento_publico`.

**Secuencias (NEXTVAL):** `seq_liquidacion`, `seq_operacion`, `seq_recibo`, `seq_solicitud`,
`seq_reclamo`.

## 5. Tipos de datos y convenciones

| Dato | En Oracle | Cómo tratarlo |
|---|---|---|
| Identificadores | `VARCHAR2(36)` con UUID en texto | Genera uuid4 en el backend al insertar; si omites id, Oracle genera uno. |
| Booleanos | `NUMBER(1)`: 0 / 1 | Convertir a true/false en la API. |
| Importes | `NUMBER(12,2)` | Usar Decimal, nunca float. En la API enviar como texto ("320.00"). Moneda PEN. |
| Fechas | `DATE` (sin hora) | ISO YYYY-MM-DD; en pantalla dd/MM/yyyy. |
| Instantes | `TIMESTAMP` en UTC | Guardar UTC; mostrar en hora de Lima (America/Lima). |
| JSON | `CLOB` validado (IS JSON) | `constancias.datos_emitidos` y `auditoria.datos`. |
| creado_en / actualizado_en | Default + trigger | No es necesario enviarlos: Oracle los llena. |
| Estados | Texto con lista cerrada | Ver la sección Valores permitidos. Oracle rechaza otros valores. |

### Numeración visible

Obtén el número con `SELECT seq_x.NEXTVAL FROM dual` y dale formato en el backend. Las secuencias
empiezan en 1001 para no chocar con los datos de prueba.

| Secuencia | Ejemplo de formato |
|---|---|
| seq_liquidacion | LIQ-2026-001001 |
| seq_operacion | OPR-2026-001001 |
| seq_recibo | REC-2026-001001 |
| seq_solicitud | SOL-2026-001001 |
| seq_reclamo | REC-2026-001001 |

## 6. Reglas que debe aplicar tu backend

- **Login:** verificar la contraseña contra el hash Argon2id guardado (parámetros por defecto
  argon2id, m=65536, t=3, p=4). Nunca devolver `hash_contrasena`.
- **Sesión:** generar un token aleatorio de 32 bytes, entregarlo al cliente y guardar solo su
  SHA-256 (hex) en `sesiones.hash_token` con `origen = 'MOVIL'` y `expira_en`. Al cerrar sesión,
  llenar `revocado_en`. Rechazar tokens revocados o vencidos.
- **Bloqueo por intentos (propuesta):** al 5.º intento fallido, `bloqueado_hasta` = ahora + 15
  minutos. En un login correcto, `intentos_fallidos` = 0 y actualizar `ultimo_acceso_en`.
- **Seguridad de datos:** el contribuyente solo ve sus propios registros. Toma `contribuyente_id`
  de la sesión, nunca de un parámetro enviado por el cliente.
- **Liquidación:** en una transacción, verificar que cada deuda sea del contribuyente y esté
  PENDIENTE; crear la cabecera en `liquidaciones` y una fila en `liquidacion_detalles` por deuda,
  copiando concepto, periodo, importes y el descuento vigente (`v_deudas.descuento_vigente`).
  total = subtotal − descuento_total + interes_adicional. Vigencia de prueba: 15 minutos.
- **Antes de pagar:** registrar en `aceptaciones` la versión activa de TERMINOS y de DEVOLUCIONES
  (una fila por documento).
- **Pago (simulado):** el cliente envía `clave_idempotencia` (UUID). Si ya existe para ese
  contribuyente con la misma `huella_solicitud` (SHA-256 de contribuyente, objetivo, importe,
  moneda y método), devolver el mismo resultado; si la huella es distinta, rechazar.
- **Confirmación del pago** en una transacción:
  `SELECT … FROM deudas WHERE id IN (…) ORDER BY id FOR UPDATE` →
  `UPDATE deudas SET estado = 'PAGADA' WHERE id = :id AND estado = 'PENDIENTE'` (si alguna no se
  actualiza, ROLLBACK) → pago APROBADO con `confirmado_en` → liquidación PAGADA → insertar recibo →
  insertar auditoría → COMMIT.
- **Tasa de constancia:** al aprobarse el pago, la solicitud pasa a EN_VERIFICACION. Para emitir:
  bloquear al contribuyente (`SELECT id FROM contribuyentes WHERE id = :id FOR UPDATE`), verificar
  que no tenga deudas PENDIENTES en ningún predio, insertar en `constancias`
  (`codigo_verificacion` = uuid4) y marcar EMITIDA; si tiene deudas, RECHAZADA con `motivo_rechazo`.
- **Reclamos:** `numero` con `seq_reclamo`; `fecha_limite_atencion` = fecha de registro +
  `tipos_reclamo.plazo_atencion_dias` en días hábiles; validar la referencia que exige el tipo
  (predio, deuda o valor del mismo contribuyente). Cada cambio de estado inserta una fila en
  `reclamo_seguimientos`.
- **Reclamo observado:** cuando un reclamo está OBSERVADO, la app permite subsanar actualizando
  `descripcion` y/o `pedido`, subiendo adjuntos y volviendo el estado a EN_REVISION (con su fila en
  `reclamo_seguimientos`).
- **Adjuntos:** PDF, JPG o PNG de hasta 10 MB, guardados en el almacenamiento del backend. La base
  solo guarda `archivo_clave`, tamaño y sha256.
- **Línea de tiempo del reclamo:** mostrar solo `v_reclamo_seguimiento_publico` (excluye notas
  internas de la municipalidad).

## 7. Vistas listas para consumir

Las vistas ya calculan lo que muestran las pantallas (saldos, estado vencido, beneficio vigente,
resumen del home). Úsalas en lugar de recalcular en el backend.

| Vista | Para qué sirve |
|---|---|
| v_deuda_pago | Fecha y monto con que se pagó cada deuda (solo pagos APROBADOS). |
| v_deudas | Vista principal de deudas para app y web: totales, estado para la app (paid/overdue/pending), beneficio vigente y datos de pago. |
| v_perfil_contribuyente | Perfil del contribuyente (UserProfile): nombre, iniciales, documento enmascarado y predio principal. |
| v_resumen_contribuyente | Resumen del home (HomeSummary) por contribuyente. |
| v_actividad_reciente | Actividad reciente (recentActivity): pagos aprobados, constancias emitidas y reclamos registrados. Ordenar por fecha_utc DESC. |
| v_recibos | Recibos con los datos del pago (PaymentResult / Receipt). |
| v_reclamos_contribuyente | Reclamos con nombres de tipo, predio, deuda y valor; sin datos internos del funcionario. |
| v_reclamo_seguimiento_publico | Línea de tiempo visible para el contribuyente (excluye notas internas). |

### v_deuda_pago

| Columna | Significado |
|---|---|
| deuda_id | Deuda pagada |
| pago_id / numero_operacion | Pago aprobado |
| pagado_en_utc | Instante UTC |
| fecha_pago | Fecha de pago en hora de Lima |
| monto_pagado | Importe pagado por esa deuda (con descuento) |

### v_deudas

| Columna | Significado |
|---|---|
| deuda_id, contribuyente_id, predio_id, concepto_id | Identificadores (UUID) |
| codigo_contribuyente, codigo_predio, direccion_predio | Datos de presentación |
| concepto_codigo / concepto_nombre | PREDIAL / ARBITRIOS → Debt.taxName |
| ejercicio, periodo_codigo, periodo_etiqueta | Año y periodo → Debt.period |
| vence_el | Vencimiento → Debt.dueDate |
| principal, derecho_emision, interes | Componentes de la cuota |
| insoluto_mas_emision | principal + derecho_emision (base de reportes R1/R5) |
| total_original | principal + derecho_emision + interes → BenefitDebt.original |
| estado | PENDIENTE / PAGADA (almacenado) |
| estado_app | paid / overdue / pending → Debt.status |
| beneficio_id, beneficio_descripcion, beneficio_vigente_hasta, descuento_vigente | Beneficio aplicable hoy (Lima); 0 si no hay |
| monto_final | total_original − descuento_vigente → BenefitDebt.finalAmount |
| insoluto_con_beneficio | Insoluto + emisión tras aplicar el descuento (primero a intereses) |
| pago_id, numero_operacion, fecha_pago, monto_pagado | Datos del pago si está PAGADA |
| dias_atraso | Días entre vencimiento y pago (o hasta hoy si sigue impaga) |

### v_perfil_contribuyente

| Columna | Significado |
|---|---|
| nombre_completo / iniciales | UserProfile.name / initials |
| documento_enmascarado | UserProfile.document (p. ej. 00***001) |
| predio_principal_direccion / predio_principal_distrito | UserProfile.property / district |
| usuario, estado_usuario | Cuenta de acceso |

### v_resumen_contribuyente

| Columna | Significado |
|---|---|
| monto_pendiente | HomeSummary.pendingAmount (sin beneficios aún no liquidados) |
| deudas_vencidas | HomeSummary.overdueCount |
| pagos_aprobados / recibos | paymentsCount / receiptsCount |
| reclamos_abiertos | Reclamos en REGISTRADO, EN_REVISION u OBSERVADO |

### v_actividad_reciente

| Columna | Significado |
|---|---|
| tipo | PAGO / CONSTANCIA / RECLAMO |
| referencia | Número visible |
| importe | Solo para pagos |
| fecha_utc | Instante del evento |

### v_recibos

| Columna | Significado |
|---|---|
| tipo_objetivo | TRIBUTOS / TRAMITE |
| cantidad_conceptos | conceptCount: detalles de la liquidación o 1 para trámite |

## 8. Entidades y campos

Todas las tablas tienen `id` (UUID) y `creado_en`; las que se pueden modificar tienen además
`actualizado_en`. "FK compuesta" significa que la base comprueba que dos registros pertenezcan al
mismo contribuyente (por ejemplo, una deuda y su predio). "Vencida" nunca se guarda: se calcula
con `vence_el` y la fecha de hoy en Lima.

Salvo que se indique otra cosa, cada tabla tiene: **id** (UUID, clave primaria) · **creado_en**
(UTC) · **actualizado_en** (UTC, lo mantiene un trigger). Las marcadas como *histórica* no tienen
`actualizado_en` y no se modifican.

### Identidad y acceso

#### contribuyentes

Titular de obligaciones tributarias (persona natural o jurídica). Es el eje de casi todas las tablas.

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| codigo | VARCHAR2(30) | Sí | Código del contribuyente mostrado en perfil y reportes (CODIGO CONTRIBUYENTE). Generado con SEQ_CONTRIBUYENTE. |
| nombre_completo | VARCHAR2(180) | Sí | Nombre o razón social (RAZON SOCIAL DE CONTRIBUYENTE). |
| tipo_persona | VARCHAR2(10) | Sí | NATURAL / JURIDICA (TIPO PERSONA). |
| tipo_documento | VARCHAR2(10) | Sí | DNI / CE / RUC / PASAPORTE / OTRO. |
| numero_documento | VARCHAR2(20) | Sí | Número de documento como texto (conserva ceros). La API lo devuelve enmascarado al contribuyente. |
| regimen | VARCHAR2(20) | Sí | Régimen de afectación: AFECTO / INAFECTO / EXONERADO / PENSIONISTA / ADULTO_MAYOR (REGIMEN). |
| condicion | VARCHAR2(15) | Sí | Condición del domicilio fiscal: HABIDO / NO_HABIDO (CONDICION). |
| correo | VARCHAR2(254) | No | Correo de contacto (EMAIL). |
| telefono | VARCHAR2(25) | No | Teléfono principal (texto). |
| telefono_alterno | VARCHAR2(25) | No | Teléfono alterno. TELEFONOS = telefono + telefono_alterno. |
| domicilio | VARCHAR2(250) | No | Domicilio fiscal completo en una línea (DOMICILIO FISCAL). |
| domicilio_via | VARCHAR2(120) | No | Vía del domicilio fiscal: Av., Calle, Jr. + nombre (VIA). |
| domicilio_numero | VARCHAR2(10) | No | Número de puerta (N°). |
| domicilio_dpto | VARCHAR2(10) | No | Departamento (DPTO). |
| domicilio_interior | VARCHAR2(10) | No | Interior (INTERIOR). |
| domicilio_mz | VARCHAR2(10) | No | Manzana (MZ). |
| domicilio_lote | VARCHAR2(10) | No | Lote (LOTE). |
| domicilio_distrito | VARCHAR2(100) | No | Distrito del domicilio fiscal (DISTRITO). |
| activo | NUMBER(1) 0/1 | Sí | 1 = activo. Desactivación lógica; no se borra. |

Valores únicos: (codigo); (tipo_documento, numero_documento).

#### usuarios

Cuenta de acceso del contribuyente a la app móvil y al portal (PAGOS EN LINEA – USUARIO). Máximo
una por contribuyente.

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| contribuyente_id | UUID (VARCHAR2 36) | Sí | FK contribuyentes.id. Único: un usuario por contribuyente. |
| usuario | VARCHAR2(60) | Sí | Login. Inicialmente igual al código del contribuyente. |
| hash_contrasena | VARCHAR2(255) | Sí | Hash Argon2id con sal y parámetros incluidos. Nunca se devuelve en la API ni en reportes. |
| estado | VARCHAR2(15) | Sí | ACTIVO / BLOQUEADO / INACTIVO. |
| intentos_fallidos | NUMBER(3) | Sí | Intentos de login fallidos consecutivos. |
| bloqueado_hasta | TIMESTAMP UTC | No | Bloqueo temporal (UTC). |
| ultimo_acceso_en | TIMESTAMP UTC | No | Último ingreso correcto (UTC). |

Relaciones: (contribuyente_id) → contribuyentes (id).
Valores únicos: (contribuyente_id); (usuario); (id, contribuyente_id).

### Predios

#### predios

Inmueble (ANEXO) de un contribuyente. Un contribuyente tiene 1..N predios y como máximo un predio
principal activo.

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| contribuyente_id | UUID (VARCHAR2 36) | Sí | FK contribuyentes.id (titular). |
| codigo | VARCHAR2(40) | Sí | Código del predio / anexo. Generado con SEQ_PREDIO. |
| direccion | VARCHAR2(250) | Sí | Dirección del predio (perfil y constancia). |
| distrito | VARCHAR2(100) | Sí | Distrito del predio. |
| uso | VARCHAR2(25) | Sí | VIVIENDA / COMERCIO / INDUSTRIA / TERRENO_SIN_CONSTRUIR / OTRO. |
| es_principal | NUMBER(1) 0/1 | Sí | 1 = predio principal (se muestra en el perfil). |
| activo | NUMBER(1) 0/1 | Sí | Desactivación lógica. |

Relaciones: (contribuyente_id) → contribuyentes (id).
Valores únicos: (codigo); (id, contribuyente_id).
Reglas: índice único condicional: un solo predio principal activo por contribuyente.

#### predio_valuos

Autovalúo anual de cada predio. La suma por contribuyente y año es la BASE IMPONIBLE del impuesto
predial (reporte PRICOS).

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| predio_id | UUID (VARCHAR2 36) | Sí | FK predios.id. |
| ejercicio | NUMBER(4) | Sí | Año del autovalúo. |
| valor_autovaluo | NUMBER(14,2) | Sí | Valor del autovalúo en soles. |

Relaciones: (predio_id) → predios (id).
Valores únicos: (predio_id, ejercicio).

### Catálogos

#### valores_uit

Valor de la UIT por año (referencia para el rango de 10 UIT del reporte PRICOS).

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| ejercicio | NUMBER(4) | Sí | Año. |
| valor | NUMBER(12,2) | Sí | Valor de la UIT en soles. |

Valores únicos: (ejercicio).

#### conceptos_tributarios

Catálogo de tributos: PREDIAL (Impuesto Predial) y ARBITRIOS (Arbitrios Municipales).

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| codigo | VARCHAR2(30) | Sí | Código estable: PREDIAL, ARBITRIOS. |
| nombre | VARCHAR2(120) | Sí | Nombre visible (CONCEPTO / TRIBUTO). |
| activo | NUMBER(1) 0/1 | Sí | Permite retirar un concepto sin borrar historial. |

Valores únicos: (codigo).

### Obligaciones

#### deudas

Una cuota de un tributo: contribuyente + predio + concepto + año + periodo. Es la fuente de saldos,
reportes y liquidaciones.

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| contribuyente_id | UUID (VARCHAR2 36) | Sí | FK contribuyentes.id. |
| predio_id | UUID (VARCHAR2 36) | Sí | FK predios.id; debe pertenecer al mismo contribuyente (FK compuesta). |
| concepto_id | UUID (VARCHAR2 36) | Sí | FK conceptos_tributarios.id. |
| ejercicio | NUMBER(4) | Sí | Año de la obligación (AÑO / AÑO DE ORIGEN). |
| periodo_codigo | VARCHAR2(20) | Sí | Código del periodo en el año: T1..T4 (trimestres), S1/S2 (semestres), M01..M12. |
| periodo_etiqueta | VARCHAR2(80) | Sí | Etiqueta visible, p. ej. "2026 - 1er Trimestre" (PERIODO). |
| vence_el | DATE | Sí | Fecha de vencimiento (FECHA DE VENCIMIENTO). |
| principal | NUMBER(12,2) | Sí | Insoluto de la cuota. > 0. |
| derecho_emision | NUMBER(12,2) | Sí | Derecho de emisión asignado a la cuota (≥ 0). Insoluto + Emisión = principal + derecho_emision. |
| interes | NUMBER(12,2) | Sí | Interés moratorio acumulado (≥ 0). Lo actualiza el backend. |
| estado | VARCHAR2(12) | Sí | PENDIENTE / PAGADA. "Vencida" no se guarda: se deriva de vence_el. |

Relaciones: (contribuyente_id) → contribuyentes (id); (predio_id, contribuyente_id) → predios (id,
contribuyente_id); (concepto_id) → conceptos_tributarios (id).
Valores únicos: (predio_id, concepto_id, ejercicio, periodo_codigo); (id, contribuyente_id).
Reglas: total original = principal + derecho_emision + interes.

#### beneficios_deuda

Descuento de prueba (amnistía, campaña) asignado a una deuda. Máximo uno por deuda.

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| deuda_id | UUID (VARCHAR2 36) | Sí | FK deudas.id. Único. |
| descripcion | VARCHAR2(200) | Sí | Nombre o motivo del beneficio. |
| descuento | NUMBER(12,2) | Sí | Importe fijo ≥ 0 y menor que el total original de la deuda (validado por backend). |
| vigente_desde | DATE | Sí | Inicio de vigencia. |
| vigente_hasta | DATE | Sí | Fin de vigencia (inclusive). |
| activo | NUMBER(1) 0/1 | Sí | Solo aplica si activo = 1, está vigente hoy (Lima) y la deuda sigue PENDIENTE. |

Relaciones: (deuda_id) → deudas (id).
Valores únicos: (deuda_id); (id, deuda_id).
Reglas: vigente_hasta ≥ vigente_desde; el descuento se aplica primero a intereses y el exceso al
insoluto (regla usada en reportes con beneficio).

#### valores

Valores emitidos por la administración (reporte R4): órdenes de pago (OP), resoluciones de
determinación (RD) y de multa (RM).

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| contribuyente_id | UUID (VARCHAR2 36) | Sí | FK contribuyentes.id. |
| tipo_valor | VARCHAR2(5) | Sí | OP = Orden de Pago, RD = Resolución de Determinación, RM = Resolución de Multa (TIPO VALOR). |
| anio_valor | NUMBER(4) | Sí | Año de emisión del valor (AÑO VALOR). |
| correlativo | NUMBER(10) | Sí | Correlativo dentro de tipo + año (CORRELATIVO). Generado con SEQ_VALOR. |
| numero_valor | VARCHAR2(30) | Sí | Número visible: TIPO-AÑO-CORRELATIVO, p. ej. OP-2026-000001 (Nº VALOR). |
| anio_deuda | NUMBER(4) | Sí | Año de la deuda que cubre (AÑO DEUDA). |
| lote_emision | VARCHAR2(20) | No | Lote de emisión masiva al que pertenece (LOTE en R4). |
| fecha_emision | DATE | Sí | Fecha de emisión. |
| fecha_notificacion | DATE | No | Fecha de notificación al contribuyente. |
| estado | VARCHAR2(15) | Sí | EMITIDO / NOTIFICADO / EN_RECLAMO / ANULADO. Si está pagado se deriva de sus deudas. |
| emitido_por | UUID (VARCHAR2 36) | No | FK administradores.id que emitió el valor (NULL = proceso masivo). |

Relaciones: (contribuyente_id) → contribuyentes (id); emitido_por → administradores (uso interno
del panel web; la cuenta móvil no lee esa tabla).
Valores únicos: (numero_valor); (tipo_valor, anio_valor, correlativo); (id, contribuyente_id).

#### valor_deudas *(histórica)*

Deudas que cubre cada valor (N:M). DEUDA_TOTAL, MONTO PAGADO y MONTO PENDIENTE del R4 se calculan
desde aquí.

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| valor_id | UUID (VARCHAR2 36) | Sí | FK valores.id. |
| deuda_id | UUID (VARCHAR2 36) | Sí | FK deudas.id. |
| contribuyente_id | UUID (VARCHAR2 36) | Sí | Titular; garantiza que valor y deuda sean del mismo contribuyente. |

Relaciones: (valor_id, contribuyente_id) → valores (id, contribuyente_id); (deuda_id,
contribuyente_id) → deudas (id, contribuyente_id).
Valores únicos: (valor_id, deuda_id).

### Liquidación y pagos

#### liquidaciones

Cabecera de una liquidación: fotografía de las deudas que el contribuyente va a pagar, con importes
fijados por el servidor.

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| contribuyente_id | UUID (VARCHAR2 36) | Sí | FK contribuyentes.id. |
| numero | VARCHAR2(40) | Sí | Número visible generado por el servidor con SEQ_LIQUIDACION (p. ej. LIQ-2026-001001). |
| estado | VARCHAR2(12) | Sí | PENDIENTE / PAGADA / VENCIDA / ANULADA. |
| calculada_en | TIMESTAMP UTC | Sí | Instante en que se fijaron los importes (UTC). |
| vence_en | TIMESTAMP UTC | Sí | Fin de vigencia de la liquidación (UTC). Demo: 15 minutos. |
| moneda | CHAR(3) | Sí | PEN. |
| subtotal | NUMBER(12,2) | Sí | Σ (principal + derecho_emision + interes) de los detalles. |
| descuento_total | NUMBER(12,2) | Sí | Σ descuento_snapshot. |
| tasa_adicional | NUMBER(7,6) | Sí | Fracción 0..1 (0.015000 = 1.5%). Por defecto 0. |
| interes_adicional | NUMBER(12,2) | Sí | ROUND((subtotal - descuento_total) * tasa_adicional, 2). |
| total | NUMBER(12,2) | Sí | subtotal - descuento_total + interes_adicional. > 0. |

Relaciones: (contribuyente_id) → contribuyentes (id).
Valores únicos: (numero); (id, contribuyente_id).
Reglas: vence_en > calculada_en; total = subtotal − descuento_total + interes_adicional.

#### liquidacion_detalles *(histórica)*

Detalle histórico (inmutable) de cada deuda incluida en una liquidación. No se recalcula.

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| liquidacion_id | UUID (VARCHAR2 36) | Sí | FK liquidaciones.id. |
| contribuyente_id | UUID (VARCHAR2 36) | Sí | Titular; obliga a que liquidación y deuda sean del mismo contribuyente. |
| deuda_id | UUID (VARCHAR2 36) | Sí | FK deudas.id. |
| beneficio_id | UUID (VARCHAR2 36) | No | FK beneficios_deuda.id de la misma deuda (FK compuesta). |
| concepto_snapshot | VARCHAR2(120) | Sí | Nombre del tributo al liquidar. |
| periodo_snapshot | VARCHAR2(80) | Sí | Etiqueta del periodo al liquidar. |
| principal_snapshot | NUMBER(12,2) | Sí | Insoluto fijado. |
| derecho_emision_snapshot | NUMBER(12,2) | Sí | Derecho de emisión fijado. |
| interes_snapshot | NUMBER(12,2) | Sí | Interés fijado. |
| descuento_snapshot | NUMBER(12,2) | Sí | Descuento fijado (0 si no hay beneficio). |

Relaciones: (liquidacion_id, contribuyente_id) → liquidaciones (id, contribuyente_id); (deuda_id,
contribuyente_id) → deudas (id, contribuyente_id); (beneficio_id, deuda_id) → beneficios_deuda (id,
deuda_id).
Valores únicos: (liquidacion_id, deuda_id).
Reglas: descuento > 0 exige beneficio_id; descuento < total de la deuda; una deuda puede aparecer en
varias liquidaciones históricas, pero solo se paga una vez.

#### pagos

Intento de pago simulado. Apunta a una liquidación (tributos) o a una solicitud de constancia
(tasa), nunca a ambas.

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| contribuyente_id | UUID (VARCHAR2 36) | Sí | FK contribuyentes.id; titular del objetivo. |
| liquidacion_id | UUID (VARCHAR2 36) | No | FK liquidaciones.id (pago de tributos). |
| solicitud_constancia_id | UUID (VARCHAR2 36) | No | FK solicitudes_constancia.id (pago de tasa). |
| numero_operacion | VARCHAR2(40) | Sí | Número de operación (SEQ_OPERACION). |
| clave_idempotencia | VARCHAR2(36) | Sí | UUID enviado por el cliente para un mismo intento. Único por contribuyente. |
| huella_solicitud | CHAR(64) | Sí | SHA-256 (hex) de los parámetros canónicos del intento. Sin datos de tarjeta. |
| importe | NUMBER(12,2) | Sí | Igual al total del objetivo; lo fija el backend. |
| moneda | CHAR(3) | Sí | PEN. |
| metodo | VARCHAR2(25) | Sí | CARD / MUNICIPAL_GATEWAY (etiquetas del flujo simulado). |
| estado | VARCHAR2(12) | Sí | PENDIENTE → APROBADO / RECHAZADO / CANCELADO. APROBADO es terminal. |
| motivo_rechazo | VARCHAR2(255) | No | Obligatorio si estado = RECHAZADO. |
| es_simulado | NUMBER(1) 0/1 | Sí | 1 = pago simulado (alcance académico). |
| referencia_proveedor | VARCHAR2(120) | No | Solo para una futura pasarela real; NULL en simulación. |
| confirmado_en | TIMESTAMP UTC | No | Obligatorio si estado = APROBADO (UTC). Es la FECHA DE PAGO. |

Relaciones: (contribuyente_id) → contribuyentes (id); (liquidacion_id, contribuyente_id) →
liquidaciones (id, contribuyente_id); (solicitud_constancia_id, contribuyente_id) →
solicitudes_constancia (id, contribuyente_id).
Valores únicos: (numero_operacion); (contribuyente_id, clave_idempotencia).
Reglas: exactamente uno de liquidacion_id / solicitud_constancia_id; APROBADO exige confirmado_en;
RECHAZADO exige motivo_rechazo; índices únicos condicionales: máximo un pago APROBADO por
liquidación y por solicitud.

#### recibos *(histórica)*

Recibo (no fiscal) de un pago aprobado. Importe, fecha y estado se leen desde pagos.

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| pago_id | UUID (VARCHAR2 36) | Sí | FK pagos.id. Único. |
| numero | VARCHAR2(40) | Sí | Número de recibo (SEQ_RECIBO). |
| emitido_en | TIMESTAMP UTC | Sí | Instante de emisión (UTC). |
| archivo_clave | VARCHAR2(300) | No | Ruta/clave del PDF si se genera. |

Relaciones: (pago_id) → pagos (id).
Valores únicos: (pago_id); (numero).

### Constancias

#### tramites

Catálogo de trámites con tasa. Demo: T45 Constancia de no adeudo, S/ 10.20.

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| codigo | VARCHAR2(30) | Sí | Código del trámite. |
| nombre | VARCHAR2(150) | Sí | Nombre visible. |
| tasa | NUMBER(12,2) | Sí | Tasa del trámite (> 0). |
| moneda | CHAR(3) | Sí | PEN. |
| activo | NUMBER(1) 0/1 | Sí | Habilita nuevas solicitudes. |

Valores únicos: (codigo).

#### solicitudes_constancia

Solicitud de constancia de no adeudo hecha por el contribuyente para uno de sus predios.

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| contribuyente_id | UUID (VARCHAR2 36) | Sí | FK contribuyentes.id. |
| predio_id | UUID (VARCHAR2 36) | Sí | FK predios.id del mismo contribuyente (FK compuesta). |
| tramite_id | UUID (VARCHAR2 36) | Sí | FK tramites.id. |
| numero | VARCHAR2(40) | Sí | Número de procedimiento (SEQ_SOLICITUD). |
| tasa_snapshot | NUMBER(12,2) | Sí | Tasa fijada al solicitar. |
| moneda | CHAR(3) | Sí | PEN. |
| estado | VARCHAR2(25) | Sí | PENDIENTE_PAGO → EN_VERIFICACION → EMITIDA / RECHAZADA. |
| motivo_rechazo | VARCHAR2(255) | No | Obligatorio si estado = RECHAZADA. |
| atendido_por | UUID (VARCHAR2 36) | No | FK administradores.id si la resolvió un funcionario (NULL = verificación automática). |
| atendido_en | TIMESTAMP UTC | No | Instante de resolución (UTC). |

Relaciones: (contribuyente_id) → contribuyentes (id); (predio_id, contribuyente_id) → predios (id,
contribuyente_id); (tramite_id) → tramites (id); atendido_por → administradores (uso interno del
panel web; la cuenta móvil no lee esa tabla).
Valores únicos: (numero); (id, contribuyente_id).
Reglas: RECHAZADA exige motivo_rechazo.

#### constancias

Constancia de no adeudo emitida para una solicitud. Los datos emitidos son inmutables; solo puede
revocarse.

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| solicitud_id | UUID (VARCHAR2 36) | Sí | FK solicitudes_constancia.id. Único. |
| codigo_verificacion | VARCHAR2(36) | Sí | UUID aleatorio (v4) para la URL/QR de verificación. |
| emitido_en | TIMESTAMP UTC | Sí | Instante de emisión (UTC). |
| vigente_hasta | DATE | Sí | Fin de vigencia. "Expirada" se deriva de esta fecha. |
| verificado_sin_deuda_en | TIMESTAMP UTC | Sí | Instante de la comprobación de no adeudo (UTC). |
| datos_emitidos | CLOB (JSON) | Sí | JSON con nombre_completo, tipo_documento, documento_mostrado, codigo_contribuyente, direccion_predio, distrito. |
| estado | VARCHAR2(12) | Sí | VIGENTE / REVOCADA. |
| archivo_clave | VARCHAR2(300) | No | Ruta/clave del PDF si se genera. |
| revocada_en | TIMESTAMP UTC | No | Instante de revocación (UTC). |
| revocada_por | UUID (VARCHAR2 36) | No | FK administradores.id que revocó. |
| motivo_revocacion | VARCHAR2(255) | No | Motivo de la revocación. |

Relaciones: (solicitud_id) → solicitudes_constancia (id); revocada_por → administradores (uso
interno del panel web; la cuenta móvil no lee esa tabla).
Valores únicos: (solicitud_id); (codigo_verificacion).
Reglas: datos_emitidos IS JSON; REVOCADA exige revocada_en y motivo.

### Reclamos

#### tipos_reclamo

Catálogo de tipos de reclamo con plazo de atención y la referencia que exige.

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| codigo | VARCHAR2(40) | Sí | Código estable. |
| nombre | VARCHAR2(120) | Sí | Nombre visible. |
| descripcion | VARCHAR2(400) | Sí | Ayuda para el contribuyente. |
| plazo_atencion_dias | NUMBER(3) | Sí | Plazo en días hábiles para resolver (valor de prueba). |
| requiere_referencia | VARCHAR2(10) | Sí | NINGUNA / PREDIO / DEUDA / VALOR: qué debe adjuntar el reclamo. |
| activo | NUMBER(1) 0/1 | Sí | Disponible para nuevos reclamos. |

Valores únicos: (codigo).

#### reclamos

Reclamo registrado por el contribuyente (app) o por un funcionario en ventanilla, y atendido desde
el panel web.

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| numero | VARCHAR2(30) | Sí | Número visible (SEQ_RECLAMO), p. ej. REC-2026-001001. |
| contribuyente_id | UUID (VARCHAR2 36) | Sí | FK contribuyentes.id. |
| usuario_id | UUID (VARCHAR2 36) | No | FK usuarios.id si lo registró el contribuyente (mismo titular, FK compuesta). |
| registrado_por_admin_id | UUID (VARCHAR2 36) | No | FK administradores.id si se registró en ventanilla. |
| canal | VARCHAR2(12) | Sí | APP_MOVIL / WEB / PRESENCIAL. |
| tipo_reclamo_id | UUID (VARCHAR2 36) | Sí | FK tipos_reclamo.id. |
| predio_id | UUID (VARCHAR2 36) | No | FK predios.id del mismo contribuyente. |
| deuda_id | UUID (VARCHAR2 36) | No | FK deudas.id del mismo contribuyente. |
| valor_id | UUID (VARCHAR2 36) | No | FK valores.id del mismo contribuyente (impugnación de OP/RD). |
| asunto | VARCHAR2(150) | Sí | Resumen corto. |
| descripcion | VARCHAR2(4000) | Sí | Hechos expuestos por el contribuyente. |
| pedido | VARCHAR2(1000) | Sí | Lo que solicita (petitorio). |
| monto_reclamado | NUMBER(12,2) | No | Importe en controversia, si aplica. |
| estado | VARCHAR2(20) | Sí | REGISTRADO → EN_REVISION ⇄ OBSERVADO → FUNDADO / FUNDADO_EN_PARTE / INFUNDADO / IMPROCEDENTE / ARCHIVADO. |
| prioridad | VARCHAR2(5) | Sí | BAJA / MEDIA / ALTA (la fija el funcionario). |
| fecha_limite_atencion | DATE | Sí | Fecha de registro + plazo del tipo en días hábiles (calculada por el backend). |
| asignado_a | UUID (VARCHAR2 36) | No | FK administradores.id responsable. |
| observacion | VARCHAR2(1000) | No | Qué debe subsanar el contribuyente. Obligatorio si estado = OBSERVADO. |
| plazo_subsanacion_hasta | DATE | No | Fecha límite para subsanar. |
| respuesta | VARCHAR2(4000) | No | Respuesta final. Obligatoria en estados finales. |
| numero_resolucion | VARCHAR2(40) | No | Número de la resolución que resuelve el reclamo. |
| resuelto_por | UUID (VARCHAR2 36) | No | FK administradores.id que resolvió. |
| resuelto_en | TIMESTAMP UTC | No | Instante de resolución (UTC). Obligatorio en estados finales. |

Relaciones: (contribuyente_id) → contribuyentes (id); (usuario_id, contribuyente_id) → usuarios (id,
contribuyente_id); (tipo_reclamo_id) → tipos_reclamo (id); (predio_id, contribuyente_id) → predios
(id, contribuyente_id); (deuda_id, contribuyente_id) → deudas (id, contribuyente_id); (valor_id,
contribuyente_id) → valores (id, contribuyente_id); registrado_por_admin_id, asignado_a y
resuelto_por → administradores (uso interno del panel web; la cuenta móvil no lee esa tabla).
Valores únicos: (numero).
Reglas: lo registra un usuario o un funcionario; OBSERVADO exige observacion; estados finales exigen
respuesta y resuelto_en.

#### reclamo_adjuntos *(histórica)*

Archivos de sustento o respuesta de un reclamo. La base guarda la referencia, no el archivo.

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| reclamo_id | UUID (VARCHAR2 36) | Sí | FK reclamos.id. |
| nombre_archivo | VARCHAR2(255) | Sí | Nombre original. |
| tipo_mime | VARCHAR2(100) | Sí | application/pdf / image/jpeg / image/png. |
| tamano_bytes | NUMBER(10) | Sí | Tamaño (máx. 10 MB). |
| archivo_clave | VARCHAR2(300) | Sí | Ruta/clave en el almacenamiento de archivos del backend. |
| sha256 | CHAR(64) | Sí | SHA-256 (hex) del archivo. |
| subido_por_usuario_id | UUID (VARCHAR2 36) | No | FK usuarios.id si lo subió el contribuyente. |
| subido_por_admin_id | UUID (VARCHAR2 36) | No | FK administradores.id si lo subió un funcionario. |

Relaciones: (reclamo_id) → reclamos (id); (subido_por_usuario_id) → usuarios (id);
subido_por_admin_id → administradores (uso interno del panel web).
Reglas: exactamente un autor.

#### reclamo_seguimientos *(histórica)*

Línea de tiempo del reclamo: cada cambio de estado o comentario. Solo inserción.

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| reclamo_id | UUID (VARCHAR2 36) | Sí | FK reclamos.id. |
| estado_anterior | VARCHAR2(20) | No | Estado previo (NULL en el registro inicial). |
| estado_nuevo | VARCHAR2(20) | Sí | Estado resultante. |
| comentario | VARCHAR2(2000) | No | Comentario del cambio. |
| visible_contribuyente | NUMBER(1) 0/1 | Sí | 0 = nota interna, la app no la muestra. |
| usuario_id | UUID (VARCHAR2 36) | No | FK usuarios.id si actuó el contribuyente. |
| administrador_id | UUID (VARCHAR2 36) | No | FK administradores.id si actuó un funcionario. |

Relaciones: (reclamo_id) → reclamos (id); (usuario_id) → usuarios (id); administrador_id →
administradores (uso interno del panel web).
Reglas: no ambos actores a la vez.

### Soporte

#### documentos_versiones

Versiones publicadas de Términos, Devoluciones y Privacidad. Máximo una activa por tipo.

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| tipo | VARCHAR2(20) | Sí | TERMINOS / DEVOLUCIONES / PRIVACIDAD. |
| version | VARCHAR2(20) | Sí | Versión, p. ej. 1.0. |
| contenido | CLOB | Sí | Texto completo publicado. |
| sha256 | CHAR(64) | Sí | SHA-256 (hex) del contenido exacto en UTF-8. |
| publicado_en | TIMESTAMP UTC | Sí | Instante de publicación (UTC). |
| activo | NUMBER(1) 0/1 | Sí | 1 = versión vigente. |

Valores únicos: (tipo, version).

#### aceptaciones *(histórica)*

Aceptación de un documento por el contribuyente antes de pagar una liquidación o una solicitud.

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| usuario_id | UUID (VARCHAR2 36) | Sí | FK usuarios.id. |
| documento_version_id | UUID (VARCHAR2 36) | Sí | FK documentos_versiones.id. |
| liquidacion_id | UUID (VARCHAR2 36) | No | FK liquidaciones.id. |
| solicitud_constancia_id | UUID (VARCHAR2 36) | No | FK solicitudes_constancia.id. |
| aceptado_en | TIMESTAMP UTC | Sí | Instante (UTC) registrado por el servidor. |

Relaciones: (usuario_id) → usuarios (id); (documento_version_id) → documentos_versiones (id);
(liquidacion_id) → liquidaciones (id); (solicitud_constancia_id) → solicitudes_constancia (id).
Reglas: exactamente un objetivo; antes de pagar se exigen TERMINOS y DEVOLUCIONES activos.

#### sesiones

Sesiones emitidas por los backends. Se guarda solo el SHA-256 del token, nunca el token.

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| usuario_id | UUID (VARCHAR2 36) | No | FK usuarios.id (sesión de contribuyente). |
| administrador_id | UUID (VARCHAR2 36) | No | FK administradores.id (sesión del panel web). |
| origen | VARCHAR2(10) | Sí | MOVIL / WEB. |
| hash_token | CHAR(64) | Sí | SHA-256 (hex) de un token opaco aleatorio. |
| expira_en | TIMESTAMP UTC | Sí | Expiración (UTC). |
| revocado_en | TIMESTAMP UTC | No | Cierre de sesión / revocación (UTC). |

Relaciones: (usuario_id) → usuarios (id); administrador_id → administradores (uso interno del
panel web).
Valores únicos: (hash_token).
Reglas: exactamente uno de usuario_id / administrador_id; expira_en > creado_en.

#### auditoria *(histórica)*

Bitácora solo-inserción de acciones relevantes (pagos, constancias, reclamos, cambios del admin).

| Campo | Tipo | Oblig. | Descripción |
|---|---|---|---|
| usuario_id | UUID (VARCHAR2 36) | No | FK usuarios.id si actuó un contribuyente. |
| administrador_id | UUID (VARCHAR2 36) | No | FK administradores.id si actuó un funcionario. |
| origen | VARCHAR2(10) | Sí | MOVIL / WEB / SISTEMA. |
| accion | VARCHAR2(60) | Sí | Ej.: PAGO_APROBADO, CONSTANCIA_EMITIDA, RECLAMO_REGISTRADO. |
| entidad | VARCHAR2(60) | Sí | Tabla afectada. |
| entidad_id | VARCHAR2(36) | Sí | ID del registro afectado. |
| datos | CLOB (JSON) | No | Detalle del cambio. Sin hashes, tokens ni datos de tarjeta. |

Relaciones: (usuario_id) → usuarios (id); administrador_id → administradores (uso interno del
panel web).
Reglas: datos IS JSON; no ambos actores a la vez.

## 9. Valores permitidos

| Campo | Valores |
|---|---|
| contribuyentes.tipo_persona | NATURAL, JURIDICA |
| contribuyentes.tipo_documento | DNI, CE, RUC, PASAPORTE, OTRO |
| contribuyentes.regimen | AFECTO, INAFECTO, EXONERADO, PENSIONISTA, ADULTO_MAYOR |
| contribuyentes.condicion | HABIDO, NO_HABIDO |
| usuarios.estado | ACTIVO, BLOQUEADO, INACTIVO |
| predios.uso | VIVIENDA, COMERCIO, INDUSTRIA, TERRENO_SIN_CONSTRUIR, OTRO |
| deudas.estado | PENDIENTE, PAGADA |
| deudas.periodo_codigo | T1–T4 (trimestres), S1–S2 (semestres), M01–M12 (meses) |
| valores.tipo_valor | OP, RD, RM |
| valores.estado | EMITIDO, NOTIFICADO, EN_RECLAMO, ANULADO |
| liquidaciones.estado | PENDIENTE, PAGADA, VENCIDA, ANULADA |
| pagos.metodo | CARD, MUNICIPAL_GATEWAY |
| pagos.estado | PENDIENTE, APROBADO, RECHAZADO, CANCELADO |
| solicitudes_constancia.estado | PENDIENTE_PAGO, EN_VERIFICACION, EMITIDA, RECHAZADA |
| constancias.estado | VIGENTE, REVOCADA |
| documentos_versiones.tipo | TERMINOS, DEVOLUCIONES, PRIVACIDAD |
| sesiones.origen | MOVIL, WEB |
| auditoria.origen | MOVIL, WEB, SISTEMA |
| tipos_reclamo.requiere_referencia | NINGUNA, PREDIO, DEUDA, VALOR |
| reclamos.canal | APP_MOVIL, WEB, PRESENCIAL |
| reclamos.prioridad | BAJA, MEDIA, ALTA |
| reclamos.estado | REGISTRADO, EN_REVISION, OBSERVADO, FUNDADO, FUNDADO_EN_PARTE, INFUNDADO, IMPROCEDENTE, ARCHIVADO |
| reclamo_adjuntos.tipo_mime | application/pdf, image/jpeg, image/png |
| v_deudas.estado_app (calculado) | paid, overdue, pending |

### Tipos de reclamo

| Código | Nombre | Plazo (días hábiles) | Referencia exigida |
|---|---|---|---|
| IMPUGNACION_VALOR | Impugnación de orden de pago o resolución | 45 | VALOR |
| PAGO_NO_REGISTRADO | Pago realizado no reflejado | 15 | DEUDA |
| COBRO_INDEBIDO | Cobro indebido o duplicado | 30 | DEUDA |
| BENEFICIO_NO_APLICADO | Beneficio o descuento no aplicado | 15 | DEUDA |
| ERROR_DATOS_PREDIO | Datos del predio incorrectos | 30 | PREDIO |
| ERROR_DATOS_CONTRIBUYENTE | Datos personales incorrectos | 10 | NINGUNA |
| CONSTANCIA_NO_ADEUDO | Problema con constancia de no adeudo | 10 | NINGUNA |
| ATENCION_SERVICIO | Queja por atención o servicio | 15 | NINGUNA |

## 10. Cuentas de prueba

Son cuentas de la aplicación móvil, no de Oracle; en la base solo existe su hash. Los datos son
ficticios, con corte al 23/10/2026. Los estados "vencida" y los días de atraso se recalculan con la
fecha actual; los beneficios de prueba vencen el 22/11/2026 y el 30/11/2026.

| Usuario | Contraseña | Titular | Qué permite probar |
|---|---|---|---|
| SM-2026-00001 | DemoOracle2026!01 | Carlos Alberto Mendoza Demo | 2 deudas pendientes (1 vencida), S/ 515.50; beneficio vigente S/ 20.00; solicitud de constancia pendiente de pago; reclamo OBSERVADO para subsanar. |
| SM-2026-00002 | DemoOracle2026!02 | Ana Lucia Torres Demo | Sin deudas; constancia VIGENTE; reclamo REGISTRADO. |
| SM-2026-00003 | DemoOracle2026!03 | Luis Fernando Rojas Demo | 5 pendientes (4 vencidas), S/ 972.63; pago rechazado; constancia rechazada por deuda; reclamo EN_REVISION contra OP-2026-000002. |
| SM-2026-00004 | DemoOracle2026!04 | Maria Elena Salazar Demo | Sin deudas; constancia REVOCADA; reclamo presencial FUNDADO. |
| SM-2026-00005 | DemoOracle2026!05 | Jose Antonio Flores Demo | Moroso: 15 pendientes (13 vencidas), S/ 5,065.80; beneficios vigentes S/ 46.55; 3 valores emitidos; reclamo INFUNDADO. |
| SM-2026-00006 | DemoOracle2026!06 | Inversiones Academicas Demo S.A.C. (RUC) | Persona jurídica y buen pagador; 2 pendientes aún no vencidas, S/ 2,860.00. |

## 11. Errores frecuentes

| Error | Causa | Qué hacer |
|---|---|---|
| ORA-12170 / timeout al conectar | Tu IP no está habilitada en AWS | Pedir al responsable de BD que habilite la IP del servidor. |
| ORA-01017 | Usuario o contraseña incorrectos | Revisar las variables de entorno (la contraseña distingue mayúsculas). |
| ORA-12505 | SID mal escrito o conexión por service name | Usar SID = SMORCLDP en formato SID (ver sección 2). |
| ORA-00942 "table or view does not exist" | Falta CURRENT_SCHEMA o la tabla no está permitida | Ejecutar `ALTER SESSION SET CURRENT_SCHEMA = SANMI_APP` o anteponer `SANMI_APP.`. |
| ORA-01031 | Operación no permitida para tu cuenta | Revisar la sección 4 (permisos). |
| ORA-00001 | Valor duplicado (UNIQUE) | Responder 409 Conflict. |
| ORA-02291 | Referencia inexistente o de otro contribuyente (FK) | Responder 400 Bad Request. |
| ORA-02290 | Valor fuera de las reglas (CHECK) | Responder 400; revisar Valores permitidos. |
