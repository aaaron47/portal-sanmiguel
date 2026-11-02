# Cambios de la rama `feature/supervisor-funcionario`

- **Sale de:** `main` en `9ddb046` (paso a Next.js de Braulio).
- **Fecha:** 31/10/2026.
- **Para qué sirve este documento:** revisar el PR. Reúne **todos** los cambios de la rama: qué se cambió, por qué
  y cómo se comprobó. El plan original con su auditoría punto por punto está en `docs/Plan_Supervisor_Funcionario.md`.
- **Lo más importante para Braulio:** la sección 5. Ahí están los cambios en sus pantallas (Admin, Control Municipal,
  Control TI) y en el arranque de la app. Ninguno cambia cómo se ven; corrigen errores y el manejo de fallos del backend.

## Commits

| Commit | Contenido |
|---|---|
| `968459d` | Vistas de Funcionario y Supervisor, arreglo del login, menú sincronizado, CLAUDE.md al día, `.gitignore`. |
| `9c56bb7` | Datos simulados solo sin conexión en reclamos, formulario abierto si la acción falla, pipeline a Node, README. |
| (este commit) | Errores de lint de toda la app, período de Control Municipal, datos simulados solo sin conexión en el resto de controladores, lint en el pipeline y este documento. |

---

## 1. Funcionario y Supervisor (lo planificado)

Detalle y comprobación de cada punto en `docs/Plan_Supervisor_Funcionario.md`.

| Qué | Antes | Ahora |
|---|---|---|
| Reglas por estado | Todos los botones en cualquier estado | `utils/ticket.utils.ts` decide qué acción se permite en cada estado; lo usan el detalle y las tablas |
| Reasignación de carga (Supervisor) | Repetía la tabla de "Panorama" | Tabla de carga por funcionario (activos, ALTA/URGENTE, por aprobar, "Sin asignar") y sus reclamos con botón "Reasignar" |
| Reasignar | Siempre guardaba `USR-FUN-09`; lista escrita a mano | Guarda el funcionario elegido (id y nombre); la lista sale de los usuarios; no ofrece al actual |
| Devolver al funcionario (nuevo) | No existía | En "por aprobar", con motivo obligatorio; vuelve a "en evaluación" (`POST /tickets/{id}/devolver`) |
| Filtros del Supervisor | Búsqueda y área (áreas a mano) | Además estado y prioridad; áreas sacadas de los datos |
| Botones del Funcionario | "Atender" y "Derivar" siempre | Según el estado; "Ver" en la fila si no hay acciones; "Esperando la aprobación del supervisor." |
| Atender | Siempre mandaba a "por aprobar" | "Registrar avance" (sigue en evaluación) o "Enviar al supervisor para aprobación" |
| Colores de las tablas del Supervisor | `--slate-900` fijo, ilegible en modo oscuro | Variables del tema |

## 2. Login

| Antes | Ahora |
|---|---|
| Sin sesión guardada, la app entraba sola como Funcionario | Se muestra el login |
| Cualquier DNI o correo entraba, siempre como Funcionario | Busca el usuario demo por DNI o correo y entra con su rol; si no existe, lo dice |
| Los errores no se veían (el formulario se desmontaba al mostrar "Cargando") | Se ven; el formulario tiene su propio "Iniciando sesión..." |
| La sesión vencida seguía valiendo | Si venció (`expiraEn`), se borra y se pide login |
| **Con backend real, una contraseña incorrecta entraba con el usuario demo de ese DNI** | El modo demo solo se usa **sin conexión**. 401/403: "El DNI, el correo o la contraseña no son correctos..." |

Archivos: `components/auth/LoginForm.tsx`, `context/AuthContext.tsx`, `controllers/auth.controller.ts`.

## 3. Menú lateral y pestañas del Supervisor

Antes, al cambiar de pestaña dentro de la vista del Supervisor, el menú lateral seguía marcando la opción anterior.
Ahora la pestaña la manda el menú (`initialTab`) y la vista avisa con `onTabChange` (nuevo y opcional en
`RoleViewProps`). Archivos: `SupervisorView.tsx`, `types/ui.types.ts`, `app/page.tsx`.

## 4. Errores del backend (toda la app)

**Problema:** cada método de los controladores llamaba a la API y, ante **cualquier** error, usaba los datos
simulados. Con el backend real eso significa, por ejemplo, que un 409 al aprobar un reclamo o un "ya existe"
al crear un usuario se mostraban como si hubieran salido bien.

**Ahora:**
- `services/api-client.service.ts` tiene dos funciones nuevas:
  - `esSinConexion(err)`: indica si no se pudo llegar al backend (`ApiError.status === 0`).
  - `mensajeErrorApi(err, porDefecto, propios?)`: da el texto para el usuario según la respuesta (401, 403, 404 y 409).
- **Todos** los controladores (`tickets`, `auth`, `usuarios`, `auditoria`, `reportes`, `telemetria`) usan los datos
  simulados **solo sin conexión**. Si el backend responde con error, el error llega a la vista.
- Las vistas muestran mensajes claros en lugar de "Error al registrar atención". Los reclamos tienen textos propios
  (`MENSAJES_ERROR_RECLAMO` en `ticket.utils.ts`). Al crear un usuario, un 409 dice "Ya existe un usuario con ese DNI o correo".
- En el detalle de un reclamo, **si la acción falla el formulario queda abierto con lo escrito**. Para eso los handlers
  de Funcionario y Supervisor avisan y relanzan el error, y `AccionesForm` solo se cierra si salió bien.
  En "Crear usuario" ya funcionaba así.

## 5. Pantallas de Braulio y arranque de la app

| Archivo | Problema | Cambio |
|---|---|---|
| `control-municipal/useControlMunicipal.ts`, `controllers/reportes.controller.ts` | **El selector de período no hacía nada**: se volvía a cargar, pero el período no llegaba al backend. Lint: función usada antes de declararse. | La carga va dentro del efecto y envía `?periodo=` a `/reportes/kpis` y `/reportes/areas`. Descarta respuestas de un período anterior si se cambió rápido. **Los datos simulados son los mismos para todos los períodos**: la diferencia se verá con el backend. |
| `control-ti/useControlTi.ts` | Lint: función usada antes de declararse. | La carga va dentro del efecto. "Actualizar Telemetría" la vuelve a pedir con un contador (`recarga`). Mismo comportamiento. |
| `app/page.tsx` | Lint: `setState` dentro de un efecto para la pestaña inicial por rol. `showNotification` se creaba en cada render, y **Usuarios y Auditoría (Admin) volvían a pedir sus datos a la API cada vez que aparecía un aviso**. | La pestaña inicial se calcula del rol (`TAB_INICIAL`) y se recuerda la elegida junto con el rol. `showNotification` con `useCallback`. |
| `context/AuthContext.tsx` | Lint: `setState` dentro de un efecto al leer la sesión. | La sesión se lee al crear el estado. "Cargando" sale de `useSyncExternalStore`: es `true` hasta que la página se hidrata, así el HTML del servidor y el primer render del navegador coinciden. `cerrandoSesion` para el logout. |
| `context/ThemeContext.tsx` | Lint: `setState` dentro de un efecto; `mounted` sin usar. | El tema se lee al crear el estado y el efecto solo pone `data-theme` en el `<html>`. Si el navegador bloquea `localStorage`, ya no falla. |
| `controllers/usuarios.controller.ts` | Lint: `let` que nunca se reasigna. | `const`. |
| `admin/usuarios/useUsuarios.ts`, `admin/auditoria/useAuditoria.ts` | Mensajes técnicos. | `mensajeErrorApi`; 409 al crear usuario = "ya existe". |
| `modals/FaqModal.tsx`, `control-municipal/ControlMunicipalView.tsx` | Íconos importados sin usar. | Se quitaron. |
| `eslint.config.mjs` | El lint revisaba `target/` (el proyecto Java anterior). | `target/**` ignorado. |

**Un cambio de comportamiento menor:** si alguien cierra sesión y vuelve a entrar con el **mismo rol** sin recargar la
página, la app abre la última opción del menú que había elegido; antes volvía siempre a la inicial. Al recargar, o al
cambiar de rol, sigue empezando por la opción inicial.

## 6. Pipeline, documentación y configuración

- `.github/workflows/ci.yml`: ya no usa Maven (no hay `pom.xml`, así que fallaba en todo PR). Ahora usa
  **Node 22** con `npm ci`, `tsc --noEmit`, **`npm run lint`** y `npm run build`.
- `.gitignore`: `/target/` y `docs/*.docx`.
- `CLAUDE.md`: reescrito para el proyecto Next.js (antes describía el de Spring Boot).
- `README.md`: estructura real (`components/roles/`), Next.js 16 y datos que no coincidían con el código.
- `docs/Plan_Supervisor_Funcionario.md`: plan y auditoría. Este documento.

## 7. Para el grupo de backend

Endpoints nuevos o cambiados por esta rama (la tabla completa está en el plan, sección 10):

| Método | Endpoint | Cambio |
|---|---|---|
| POST | `/tickets/{id}/devolver` | **Nuevo.** Cuerpo `{ motivoDevolucion }`. |
| POST | `/tickets/{id}/atender` | `nuevoEstado` puede ser `en evaluación` o `por aprobar`. |
| POST | `/tickets/{id}/reasignar` | Ahora sí envía el funcionario elegido: `{ nuevoFuncionarioId, nuevoFuncionarioNombre, motivoReasignacion }`. |
| GET | `/reportes/kpis?periodo=...`, `/reportes/areas?periodo=...` | **Nuevo parámetro** `periodo`: `2026-10` (mes) o `2026-T3` (trimestre). |

El front espera estos códigos de error: **401** (sesión vencida o credenciales incorrectas en `/auth/login`), **403**
(sin permiso), **404** (no existe), **409** (conflicto: otro lo modificó o ya existe). Cualquier otro código muestra
un mensaje general.

## 8. Cómo se comprobó

- `npx tsc --noEmit`: sin errores. `npm run build`: compila. **`npm run lint`: 0 errores y 0 advertencias**
  (al crear la rama había 10 errores; luego 6 y 9 advertencias).
- `npm ci` en una carpeta limpia (el primer paso del pipeline): funciona.
- Navegador (Playwright + Microsoft Edge contra `npm run dev`; los scripts quedan fuera del repositorio):

| Recorrido | Resultado |
|---|---|
| Plan de Funcionario y Supervisor (puntos 1 a 7, modo oscuro, consola) | 42 / 42 |
| Login (vacío, sin contraseña, DNI inexistente, correo, DNI, recargar, cerrar sesión, sesión vencida, acceso rápido) | 12 / 12 |
| Login con backend simulado que responde 401 y 500 | 6 / 6 |
| Menú lateral y pestañas del Supervisor | 6 / 6 |
| Reclamos con backend que responde 409 y 403, y sin conexión | 11 / 11 |
| Pantallas de Braulio y arranque: período enviado al backend, 500 en reportes, Control TI y "Actualizar", Admin sin recargas por avisos, 403 en usuarios, tema oscuro al recargar, pestaña inicial | 23 / 23 |

En desarrollo React monta los efectos dos veces a propósito (StrictMode), así que al entrar a una pantalla se ven
dos pedidos iguales a la API. En producción es uno.

## 9. Lo que queda (no lo resolvió esta rama)

- **Colores de los estados:** decidirlo con el equipo (punto 8 del plan).
- **Control TI:** las opciones del menú "Dashboard Telemetría App" y "Privacidad y Onboarding" muestran la misma
  pestaña, y "Flujo de Eventos Anónimos" no está en el menú. Hay que definir qué debe mostrar cada una.
- **`ConfirmModal`** existe pero ninguna pantalla lo usa.
- **Datos simulados por período** en Control Municipal: hoy son los mismos para todos los períodos.
- Integrar con el backend y quitar los datos simulados; la tabla `reclamos` de Oracle no tiene área, funcionario,
  aprobación ni constancias (ver plan, sección 10).
- Pruebas automáticas dentro del repositorio.

---

## 10. Auditoría independiente (31/10/2026, tarde)

Se hizo una revisión de código independiente de toda la rama frente a `main` (10 hallazgos). Cada uno se comprobó
leyendo el código y los 10 resultaron ciertos. Al revisarlos aparecieron 2 problemas más (11 y 12).
**Estado: los 12 están corregidos y probados.** Tipos, lint y `npm run build` sin errores. En el navegador siguen
pasando las 100 comprobaciones anteriores. Además pasan 34 comprobaciones de estos arreglos (01/11/2026):
- **24 en desarrollo:**
  - #1: 403 en `/usuarios` para el Supervisor.
  - #2 y #12: 200 vacío y 500 con HTML al aprobar.
  - #7: derivar como Funcionario.
  - #4 y #11: Admin desactiva a Mariana y, con "Simular Rol", ella sale como inactiva en la carga y no aparece para reasignar.
  - #6: período de Control Municipal.
  - #10: hora local.
- **6 en producción sin `NEXT_PUBLIC_MODO_DEMO` (#5 y #11):** no aparecen los accesos rápidos ni "Simular Rol", el
  login dice "No se pudo conectar con el servidor" y la bandeja no muestra datos simulados.
- **4 en producción con `NEXT_PUBLIC_MODO_DEMO=true`:** la demo funciona.

| # | Problema | Arreglo | Archivos |
|---|---|---|---|
| 1 | Supervisor: si `GET /usuarios` fallaba (p. ej. 403, porque es de Admin), **no se mostraba ningún reclamo** (`Promise.all`). | `Promise.allSettled`: los reclamos se muestran igual y un aviso dice que la reasignación solo ofrece los funcionarios que ya tienen reclamos. | `useSupervisorTickets.ts` |
| 2 | Un 2xx con cuerpo vacío o que no era JSON se trataba como "sin conexión", así que la acción se aplicaba también en los datos simulados. | `api-client`: solo un fallo de `fetch` es "sin conexión" (status 0). Una respuesta inválida da `ApiError` con su código. | `api-client.service.ts` |
| 3 | Derivar: después de una derivación, el área de destino quedaba en el área actual del reclamo. | El área se vuelve a calcular cada vez que se abre una acción (`abrirAccion`). | `AccionesForm.tsx` |
| 4 | Los funcionarios **desactivados** volvían a aparecer como destino de una reasignación. | `FuncionarioOpcion.activo`. No se ofrecen para reasignar; si tienen reclamos activos, la tabla de carga los muestra como "(inactivo: reasigna sus reclamos)". | `ticket.utils.ts`, `AccionesForm.tsx`, `CargaFuncionariosTable.tsx` |
| 5 | **En producción, si el backend se caía, se entraba con un DNI sin contraseña** (modo demo) y las acciones "se guardaban" en datos falsos. | `MODO_DEMO`: activo en `npm run dev`; en un build de producción solo con `NEXT_PUBLIC_MODO_DEMO=true`. Los controladores usan `usarDatosDemo(err)`. Sin el modo demo, el login dice "No se pudo conectar con el servidor" y los accesos rápidos no aparecen. | `api-client.service.ts`, todos los `controllers/*`, `LoginForm.tsx` |
| 6 | Control Municipal: al cambiar de período, o si fallaba la carga, seguían los números del período anterior. | Se borran al cambiar de período y al fallar. | `useControlMunicipal.ts` |
| 7 | Funcionario: un reclamo derivado seguía en su bandeja con "Atender" activo. | Sale de la bandeja y se cierra el detalle. | `useFuncionarioTickets.ts` |
| 8 | Quedaban `eslint-disable` y comentarios desactualizados (`onNotify` ya es estable). | Se quitaron y `onNotify` va en las dependencias. | 4 hooks |
| 9 | `SupervisorView` y `SupervisorKpis` repetían `estado === 'por aprobar'`. | Usan `puedeAprobar`. | `SupervisorView.tsx`, `SupervisorKpis.tsx` |
| 10 | Las 6 acciones repetían el bloque de datos simulados, que además guardaba la hora en **UTC** (5 h adelantada respecto de Lima). | Una sola función `aplicarEnDemo` con hora local (`fechaLocal`). | `tickets.controller.ts` |
| 11 | **"Simular Rol" dejaba a cualquier usuario pasar a Supervisor o Admin, incluso en producción.** | Solo aparece y funciona con `MODO_DEMO`. | `Sidebar.tsx`, `AuthContext.tsx` |
| 12 | Un error del backend cuyo cuerpo no era JSON (p. ej. una página HTML de error 500) se leía dos veces; la segunda lectura fallaba y se trataba como "sin conexión", así que se aplicaba en los datos simulados. | El cuerpo se lee una vez como texto. | `api-client.service.ts` |

También se corrigió el README: no todas las acciones piden un motivo obligatorio (en la constancia es opcional),
y se documentó el modo demo.
