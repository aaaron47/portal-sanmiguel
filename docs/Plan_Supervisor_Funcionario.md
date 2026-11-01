# Plan: completar las vistas de Funcionario y Supervisor

- **Rama:** `feature/supervisor-funcionario` (sale de `main` en `9ddb046`, el commit de Next.js de Braulio).
- **Fecha:** 31/10/2026.
- **Alcance:** solo el front Next.js. El backend lo hace otro grupo, así que todo sigue con los datos
  simulados de `controllers/*.controller.ts`. Cada acción nueva se agrega también como llamada a la API
  (`apiClient`) con su respaldo simulado, siguiendo el patrón actual, para que el grupo de backend sepa
  qué endpoint implementar.
- **Fuera de alcance:** Admin, Control Municipal y Control TI (los hizo Braulio), y el backend.

Este documento sirve para auditar el resultado: cada punto tiene cómo debe verse o comportarse
y cómo comprobarlo. Al terminar, se marca cada casilla y se anota lo que no se cumplió.

---

## 0. Reglas por estado (base para los puntos siguientes)

Se crea `utils/ticket.utils.ts` con las reglas de qué acción se puede hacer en cada estado.
Las vistas y el formulario de acciones las usan en vez de mostrar todos los botones siempre.

| Acción | Quién | Estados en los que se permite |
|---|---|---|
| Atender (registrar avance o enviar a aprobación) | Funcionario | pendiente de validación, en evaluación, derivado |
| Derivar a otra área | Funcionario | pendiente de validación, en evaluación, derivado |
| Evaluar constancia | Funcionario | igual que atender, y solo si el reclamo tiene constancia |
| Aprobar resolución | Supervisor | por aprobar |
| Devolver al funcionario (nuevo) | Supervisor | por aprobar |
| Reasignar funcionario | Supervisor | todos menos resuelto y archivado |

En `resuelto` y `archivado` nadie tiene acciones: el detalle lo dice con un texto
("Este reclamo ya está cerrado; no tiene acciones pendientes.").

- [x] Las reglas viven en un solo archivo y las usan el formulario de acciones y las tablas.

## 1. Supervisor: pestaña "Reasignación de carga" con contenido propio

**Hoy:** muestra la misma tabla que "Panorama integral".

**Resultado esperado:**
- Una tabla de **carga por funcionario** con: nombre, área, reclamos activos (no resueltos ni
  archivados), cuántos son ALTA o URGENTE y cuántos están por aprobar. Ordenada de mayor a menor carga.
- Una fila **"Sin asignar"** si hay reclamos activos sin funcionario.
- Los funcionarios salen de `usuariosController.getUsuarios()` (rol FUNCIONARIO y activos), y también
  se incluye a cualquier funcionario que aparezca asignado en un reclamo aunque no esté en la lista.
- Al elegir un funcionario se listan debajo **sus reclamos activos**, con un botón **"Reasignar"**
  que abre el detalle directamente en el formulario de reasignación.

**Cómo comprobarlo:** entrar como Supervisor > Reasignación de carga. Con los datos simulados,
Lic. Mariana Rios tiene 2 activos (REC-2026-0104 y REC-2026-0107), Ing. Fernando Rojas 1
(por aprobar) y Bach. Laura Paredes 1. Sr. Walter Quispe solo tiene un reclamo resuelto, así que tiene 0 activos.

- [x] Tabla de carga con los conteos correctos.
- [x] Seleccionar un funcionario muestra solo sus reclamos activos.
- [x] "Reasignar" abre el detalle con el formulario de reasignación ya abierto.

## 2. Supervisor: corregir la reasignación

**Hoy:** el formulario envía siempre el id `USR-FUN-09` aunque se elija a otra persona, y la lista de
funcionarios está escrita a mano en `AccionesForm.tsx`.

**Resultado esperado:**
- El selector se llena con los funcionarios reales (los mismos del punto 1), muestra el área de cada uno
  y no ofrece al funcionario que ya tiene el reclamo.
- Se envían el id y el nombre del funcionario elegido.
- Tras reasignar, la tabla de carga se actualiza sin recargar.

**Cómo comprobarlo:** reasignar REC-2026-0104 de Mariana Rios a Laura Paredes. El reclamo debe
mostrar a Laura como asignada, la línea de tiempo debe tener "REASIGNADO A Bach. Laura Paredes: ...",
Mariana debe bajar a 1 activo y Laura subir a 2.

- [x] Se guarda el funcionario elegido (id y nombre).
- [x] El selector no incluye al funcionario actual.
- [x] La carga se actualiza.

## 3. Supervisor: devolver al funcionario con observaciones

**Hoy:** el supervisor solo puede aprobar.

**Resultado esperado:**
- En reclamos **por aprobar**, junto a "Aprobar resolución", aparece **"Devolver al funcionario"**.
- Pide un motivo obligatorio. Al confirmar, el reclamo vuelve a **en evaluación**, conserva el funcionario
  asignado y la línea de tiempo registra "DEVOLUCIÓN PARA CORREGIR: <motivo>" con el tipo de acción
  `DEVOLUCION` (nuevo valor en `TicketSeguimiento.tipoAccion`).
- Nueva llamada: `POST /tickets/{id}/devolver` con `{ motivoDevolucion }`, con respaldo simulado.

**Cómo comprobarlo:** devolver REC-2026-0105. Pasa a "en evaluación", desaparece de "Por aprobar"
y el contador de esa pestaña baja en 1.

- [x] Botón visible solo en "por aprobar".
- [x] El motivo es obligatorio.
- [x] Estado, línea de tiempo y contadores correctos.

## 4. Supervisor: botones según el estado

**Resultado esperado:**
- En la tabla, el botón rápido "Aprobar" sigue apareciendo solo en "por aprobar" y ahora abre el detalle
  **directamente en el formulario de aprobación** (hoy abre el detalle sin acción elegida).
- En el detalle, "Aprobar" y "Devolver" solo en "por aprobar"; "Reasignar" en cualquier estado activo.
- En reclamos resueltos o archivados no hay botones de acción.

**Cómo comprobarlo:** abrir REC-2026-0108 (resuelto): sin acciones. Abrir REC-2026-0104 (en evaluación):
solo "Reasignar".

- [x] Se cumple en tabla y en detalle.

## 5. Supervisor: filtros por estado y prioridad

**Hoy:** solo búsqueda y área (con las áreas escritas a mano).

**Resultado esperado:**
- Filtros de **estado** y **prioridad** además del área y la búsqueda.
- La lista de áreas se arma con las áreas de los reclamos y de los funcionarios, no escrita a mano.
- En la pestaña "Por aprobar" el filtro de estado no se muestra (ya está fijo).

- [x] Filtros de estado y prioridad funcionan combinados con área y búsqueda.
- [x] Las áreas no están escritas a mano.

## 6. Funcionario: botones según el estado

**Hoy:** "Atender y responder" y "Derivar caso" aparecen en cualquier estado.

**Resultado esperado:** se aplican las reglas del punto 0. En "por aprobar" el detalle dice
"Esperando la aprobación del supervisor." y no muestra acciones. En la bandeja, el botón de la fila dice
**"Atender"** si hay acciones disponibles y **"Ver"** si no.

**Cómo comprobarlo:** como Funcionario (Mariana Rios), abrir REC-2026-0104 (en evaluación): atender,
derivar y evaluar constancia. Luego atenderlo con "Enviar al supervisor para aprobación": la fila pasa a
mostrar "Ver" y el detalle dice "Esperando la aprobación del supervisor." sin acciones.

- [x] Se cumple en tabla y en detalle.

## 7. Funcionario: atender sin enviar todavía a aprobación

**Hoy:** "Atender" siempre manda el reclamo a "por aprobar".

**Resultado esperado:** el formulario de atención tiene dos opciones:
- **"Registrar avance"**: el reclamo queda (o pasa a) **en evaluación**.
- **"Enviar al supervisor para aprobación"**: pasa a **por aprobar**.

El funcionario **no** puede marcarlo como resuelto directamente (lo exige el README: el supervisor da
el visto bueno). El botón de confirmar dice la acción elegida.

- [x] Ambas opciones guardan el estado correcto y agregan la entrada en la línea de tiempo.

## 8. Formato de los estados: A DECIDIR, no se implementa sin confirmación

`app/globals.css` dice "Badges de Estados de Reclamos (Neutro, sin colores)", así que el estado
sin color parece una **decisión de diseño de Braulio**. Sin embargo, existen los tokens `--status-*`
(claro y oscuro) sin usar. **No se cambia** hasta confirmarlo con el equipo.

- [ ] Decisión tomada con el equipo.

## 9. Verificación final

- [x] `npx tsc --noEmit` sin errores.
- [x] `npm run lint`: ningún error nuevo en los archivos tocados (los errores previos se anotan aparte).
- [x] Recorrido en `npm run dev` de los puntos 1 a 7, en modo claro y oscuro (automatizado con Playwright, ver auditoría).
- [x] Ningún cambio en las vistas de Admin, Control Municipal ni Control TI.

## 10. Para el grupo de backend (endpoints que usa el front)

| Método | Endpoint | Cuerpo | Uso |
|---|---|---|---|
| GET | `/tickets` | filtros por query | Bandejas |
| POST | `/tickets/{id}/atender` | `{ comentarioRespuesta, nuevoEstado }` (`en evaluación` o `por aprobar`) | Funcionario |
| POST | `/tickets/{id}/derivar` | `{ areaDestino, motivoDerivacion }` | Funcionario |
| POST | `/tickets/{id}/evaluar-constancia` | `{ estado, observaciones }` | Funcionario |
| POST | `/tickets/{id}/aprobar` | `{ comentarioAprobacion }` | Supervisor |
| POST | `/tickets/{id}/devolver` | `{ motivoDevolucion }` | Supervisor (**nuevo**) |
| POST | `/tickets/{id}/reasignar` | `{ nuevoFuncionarioId, nuevoFuncionarioNombre, motivoReasignacion }` | Supervisor |
| GET | `/usuarios` | — | Lista de funcionarios para reasignar |
| GET | `/reportes/kpis`, `/reportes/areas` | `?periodo=2026-10` o `2026-T3` | Control Municipal (**nuevo parámetro**, ver `docs/Cambios_rama_supervisor_funcionario.md`) |

Ojo: la tabla `reclamos` de la BD Oracle no tiene hoy área, funcionario asignado, aprobación ni
constancias, y sus estados son otros (ver `docs/Conexion_Portal_Oracle.md`). El grupo de backend
tiene que resolverlo con el responsable de la BD.

---

## Resultado de la auditoría (31/10/2026)

**Archivos nuevos:** `utils/ticket.utils.ts` (reglas, carga, áreas),
`components/roles/supervisor/reasignacion/ReasignacionPanel.tsx` y `.../parts/CargaFuncionariosTable.tsx`.

**Archivos modificados:** `types/ticket.types.ts` (`DEVOLUCION`, `DevolucionPayload`, `AccionTicket`,
`EstadoAtencion`), `controllers/tickets.controller.ts` (`devolverTicket`; `let` → `const`),
`components/modals/TicketDetailModal.tsx`, `.../ticket-detail/parts/AccionesForm.tsx` (reescrito),
`components/roles/supervisor/*` (vista, hook, filtros, tabla) y `components/roles/funcionario/*`
(hook, bandeja, tabla). No se tocó Admin, Control Municipal, Control TI, `app/` ni `globals.css`.

**Comprobaciones hechas:**
- `npx tsc --noEmit`: sin errores. `npm run build`: compila.
- `npm run lint`: los archivos tocados quedan sin errores ni advertencias. Quedan 6 errores y 8 advertencias
  en archivos de antes que no se tocaron (`app/page.tsx`, `context/AuthContext.tsx`, `context/ThemeContext.tsx`,
  `controllers/usuarios.controller.ts`, `control-municipal/*`, `control-ti/*`, `FaqModal.tsx`). Antes del
  cambio eran 10 errores.
- Prueba de la lógica con los datos simulados (script fuera del repo que transpila `ticket.utils.ts` y los
  controladores): 19 de 19 comprobaciones pasan. Conteos de carga (Mariana 2, Fernando 1 por aprobar,
  Laura 1, Walter 0), reglas por estado, reasignación con id y nombre elegidos, carga actualizada tras
  reasignar (Mariana 1, Laura 2), devolución (en evaluación, mismo funcionario, línea de tiempo `DEVOLUCION`)
  y las dos opciones de atender.

**Recorrido en el navegador (31/10/2026):** Playwright con Microsoft Edge contra `npm run dev`, entrando
como Supervisor (Dr. Roberto Salas) y Funcionario (Lic. Mariana Rios). **42 de 42 comprobaciones pasan**
(puntos 1 a 7, menú lateral, modo oscuro y sin errores en la consola) y se revisaron las capturas.
El script y las capturas quedaron fuera del repositorio, en la carpeta temporal de la sesión.

**Observaciones de código anterior (no son de este cambio):**
- ~~La app entra sola como Funcionario si no hay sesión guardada.~~ Corregido, ver "Arreglo del login".
- ~~Las pestañas internas del Supervisor no actualizan la opción marcada en el menú lateral (al revés sí funciona).~~
  Corregido: la pestaña sale del menú (`initialTab`) y al elegir otra se avisa a la página con `onTabChange`
  (nuevo, opcional, en `RoleViewProps`; lo pasa `app/page.tsx`). Comprobado en el navegador: 6 de 6 en ambos
  sentidos, y el recorrido completo sigue en 42 de 42.

**Desvíos respecto del plan:**
- El punto 8 (colores de estado) no se implementó: queda para decidir con el equipo.
- Además de lo planificado: la pestaña del Supervisor ahora sigue al menú lateral (antes se quedaba en la
  primera que se abrió), las tablas del Supervisor usan colores del tema (antes `--slate-900` fijo, ilegible
  en modo oscuro) y la carga de datos de Funcionario y Supervisor se reescribió para cumplir las reglas de lint
  `react-hooks/immutability` y `set-state-in-effect`, que antes fallaban.

### Arreglo del login (31/10/2026, pedido aparte)

**Antes:** sin sesión guardada la app entraba sola como Funcionario; el formulario dejaba entrar con cualquier
DNI o correo y siempre como Funcionario; los errores no se veían porque la página cambiaba al indicador
de carga y el formulario se desmontaba.

**Ahora** (`context/AuthContext.tsx`, `controllers/auth.controller.ts`, `components/auth/LoginForm.tsx`):
- Sin sesión, o con la sesión vencida (`expiraEn`), se muestra el login.
- Mientras no exista el backend, el formulario busca el usuario demo por DNI o correo y entra con su rol.
  Si no existe, muestra "No encontramos un usuario con ese DNI o correo. Revisa que esté bien escrito."
  La contraseña se pide pero no se valida (lo hará el backend con `POST /auth/login`).
- Los accesos rápidos por rol siguen funcionando.

**Comprobado en el navegador:** 12 de 12 (login vacío, sin contraseña, DNI inexistente, entrar por correo y
por DNI, recargar, cerrar sesión, sesión vencida, acceso rápido).

### Auditoría final (31/10/2026)

- **Corregido:** el login entraba en modo demo ante *cualquier* error del backend; con backend real, una
  contraseña incorrecta (401) habría dejado entrar con el usuario demo de ese DNI. Ahora el modo demo solo
  se usa sin conexión (`ApiError.status === 0`); con 401/403 dice "El DNI, el correo o la contraseña no son
  correctos..." y con otros errores "No se pudo iniciar sesión...". Comprobado simulando el backend: 6 de 6.
- **Repetido todo:** `tsc` sin errores, `build` compila, recorrido 42 de 42, login 12 de 12, menú 6 de 6.
  Lint: los archivos tocados solo tienen los 2 errores que ya traían (`app/page.tsx`, `context/AuthContext.tsx`,
  `set-state-in-effect`); el total sigue en 6 errores, todos de antes.
- **Corregido después de la auditoría:**
  - `tickets.controller` usa los datos simulados **solo sin conexión** (`esSinConexion`). Si el backend
    responde con error, la acción no se aplica y la vista muestra un mensaje claro (`mensajeErrorApi`: 401, 403,
    404, 409).
  - Los handlers avisan y relanzan el error, así que el formulario queda abierto con lo escrito.
  - El pipeline `ci.yml` pasó de Maven a Node 22 (`npm ci`, `tsc`, `build`).
  - El README ahora coincide con el código.
  - Comprobado simulando el backend: 409 al aprobar y 403 al atender, más el caso sin conexión, 11 de 11.
    Se repitieron el recorrido (42/42), el login (12/12), el menú (6/6) y el login con backend (6/6).

### Después de la auditoría: resto de la app (31/10/2026)

Se corrigieron los errores de lint de toda la app (también en las pantallas de Braulio), el selector de período de
Control Municipal y el uso de datos simulados ante errores del backend en todos los controladores. El lint quedó en
0 y se agregó al pipeline. **El detalle de todos los cambios de la rama está en `docs/Cambios_rama_supervisor_funcionario.md`.**
