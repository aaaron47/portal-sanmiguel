# CLAUDE.md – Portal de quejas (front web)

Guía del proyecto para retomar el trabajo: contexto, decisiones, cómo está armado el código,
convenciones y lo que falta. Mantenerla al día cuando cambie algo importante.

> **Cambio de rumbo (commit `9ddb046`, de Braulio):** el portal pasó de Spring Boot + Thymeleaf a
> **Next.js**. Este repositorio es **solo el front**; el backend (Spring Boot / Oracle 19c) lo hace
> **otro grupo** en otro repositorio. Lo de la etapa Java (conexión a Oracle, cuenta `SANMI_PORTAL_WEB`,
> tablas reales) queda como referencia en `docs/Conexion_Portal_Oracle.md`, `docs/Conexion_BD.md`
> y `docs/datos_faltantes.md`, y en la historia de git.

## ▶ Para retomar (05/11/2026)

La rama `feature/supervisor-funcionario` ya está en `main` (PR #4, aprobado por Braulio el 02/11).
Encima, Ulises subió `4cbbef9` directo a `main`: paginación en tablas, Modo Privacidad (Ley 29733), pantallas
nuevas de Control Municipal (Superset, reportes tributarios, constancias de no adeudo, asistente MCP) y de
Control TI (Privacidad y Onboarding), README y `ci.yml`. En Supervisor quitó las pestañas internas: ahora la
pestaña sale solo del menú lateral.

Revisado el 05/11 sobre `4cbbef9`: `tsc`, `lint` y `build` sin errores. En el navegador funcionan el menú y la
paginación del supervisor, la aprobación, la reasignación, la bandeja del funcionario y sus constancias.

Pendiente:
1. Rama `fix/barra-carga-funcionarios` (sin subir): `CargaFuncionariosTable` y `ControlAccesoPanel` usaban
   `var(--green-500)`, que no existía; se agregó en `globals.css`. Con 0 a 3 casos activos la barra de carga no
   se veía. Subir la rama, abrir el PR y avisar a Ulises. Se eliminó el tope artificial de 8 casos; la tabla
   ahora muestra la carga real con ordenamiento por columnas (casos activos, prioridad alta, por aprobar y nombre).
2. Avisar a Braulio: sección 5 y sección 10 (#5 y #11) de `docs/Cambios_rama_supervisor_funcionario.md`.
3. `origin/eduardo` (`faf4854`) solo agrega archivos `.idea/`; no conviene unirlo a `main` así.

Notas para las pruebas en el navegador:
- El botón "N" de Next.js en desarrollo queda encima del perfil del menú lateral y no deja hacer clic con
  Playwright; en el script se oculta `nextjs-portal`.
- En Windows, al detener una tarea en segundo plano, `next dev` y `next start` pueden seguir ocupando el puerto
  y hay que cerrarlos a mano.
- Solo un `next dev` a la vez: antes de levantar otro escenario (demo, simulado, real) hay que cerrar el anterior, o las
  pruebas corren contra el servidor equivocado.
- Para probar en local contra el backend real: `BACKEND_URL=http://32.200.209.224 NEXT_PUBLIC_API_URL=/api/v1/portal`.
  En Git Bash, anteponer `MSYS_NO_PATHCONV=1`: si no, convierte `/api/v1/portal` en una ruta de Windows y el login
  dice "No se pudo conectar con el servidor".

## 1. Contexto del negocio

- Portal web de la Municipalidad de San Miguel para atender los **reclamos** de los ciudadanos.
- Los reclamos viven en una **BD Oracle compartida** que también usan la app móvil y otros sistemas.
  El front no se conecta a la BD: todo pasa por la API del backend.
- **5 roles** (ver `README.md`, sección 2): Admin, Funcionario, Supervisor, Control Municipal
  (lectura) y Control App/TI (lectura).
- **Reparto del trabajo en el front:** Braulio hizo Admin, Control Municipal y Control TI; en la rama
  `feature/supervisor-funcionario` se completaron **Funcionario y Supervisor**
  (`docs/Plan_Supervisor_Funcionario.md`, con su auditoría).

## 2. Decisiones

| Decisión | Motivo |
|---|---|
| **Next.js (App Router) + TypeScript, una sola página** (`app/page.tsx`) que muestra la vista del rol | Lo definió el equipo en `9ddb046`. La navegación es por pestañas del menú lateral, no por rutas. |
| **Capas:** `components` → `controllers` → `services/api-client` | Los componentes no llaman a `fetch`; cada acción es un método del controlador. |
| **Datos simulados mientras no exista el backend** | Cada método del controlador llama primero a la API (`apiClient`) y, si no hay conexión, usa los datos simulados del mismo archivo (`MOCK_*`). Así el grupo de backend ve qué endpoint implementar. |
| **Datos simulados solo sin conexión y en modo demo** (`usarDatosDemo(err)` en `api-client.service.ts`; `MODO_DEMO` activo en `npm run dev`, en producción solo con `NEXT_PUBLIC_MODO_DEMO=true`) | Si el backend responde con error (401, 403, 409...), no se aplica nada en los datos simulados: el error llega a la vista, que lo muestra con `mensajeErrorApi`. En el login, una contraseña incorrecta no entra en modo demo. |
| **Los handlers de las vistas avisan y relanzan el error** | `AccionesForm` solo cierra el formulario si la acción salió bien; si falla, queda abierto con lo escrito. |
| **Las acciones permitidas las dice el backend** (`accionesPermitidas`; `puede()` en `utils/ticket.utils.ts`) | Una sola fuente de reglas; el backend las vuelve a comprobar al guardar. |
| **Revisión del supervisor** si la prioridad es ALTA o el tipo de reclamo lo exige | Así lo define la BD (`requiere_revision_supervisor`, trigger `trg_rcl_flujo`). |

## 3. Stack

- Next.js **16.4**, React **19.3**, TypeScript 5, ESLint 9 (`eslint-config-next`).
- Íconos: `lucide-react`. Sin librerías de UI ni de estado: estilos en `app/globals.css` (tokens) y
  estilos en línea con variables CSS.
- **Ojo:** `AGENTS.md` (lo genera `next dev`) avisa que esta versión de Next.js cambió APIs; antes de
  usar algo de Next que no esté ya en el código, leer `node_modules/next/dist/docs/`.

## 4. Comandos

```bash
npm install          # dependencias
npm run dev          # http://localhost:3000
npx tsc --noEmit     # tipos
npm run lint         # lint: debe quedar en 0 errores y 0 advertencias (lo corre el pipeline)
npm run build        # compilación de producción
```

- La URL del backend sale de `NEXT_PUBLIC_API_URL` (por defecto `http://localhost:8080/api`). Sin backend
  levantado, todo funciona con datos simulados. Las variables van en `.env*` (ignorado por git).
- **Despliegue en `https` (Vercel) con backend en `http`:** se define `BACKEND_URL` (solo servidor) y
  `NEXT_PUBLIC_API_URL=/api/v1/portal`; `next.config.ts` reenvía `/api/*` al backend y así el navegador no bloquea
  las llamadas ("mixed content"). Sin `BACKEND_URL` no se reenvía nada.
- **Despliegue temporal (05/11/2026):** https://portalsanmiguel.vercel.app, proyecto `portalsanmiguel` en la cuenta
  Vercel `aaronarana29-9818`, conectado a `aaaron47/portal-sanmiguel` (remoto `origin`; el repo original de WEduardoRAyra ya no existe).
  Cada push a `main` se despliega solo. Variables: `NEXT_PUBLIC_API_URL=/api/v1/portal`, `BACKEND_URL=http://32.200.209.224`
  (backend de Willy en EC2), `NEXT_PUBLIC_MODO_DEMO=false`. `vercel.json` fija el preset de Next.js.
- No hay pruebas automáticas en el repositorio. Las comprobaciones en navegador se hicieron con
  Playwright + Microsoft Edge desde una carpeta temporal fuera del repo.
- `target/` (compilación del proyecto Java anterior) y `docs/*.docx` están en `.gitignore`.

### Usuarios de prueba (modo demo)

En el login se entra con el **DNI o correo** de un usuario demo (`USUARIOS_DEMO` en
`controllers/auth.controller.ts`); la contraseña se pide pero no se valida hasta que exista el backend.
También hay accesos rápidos por rol. Por ejemplo: Supervisor **Dr. Roberto Salas** (DNI `10984523`),
Funcionaria **Lic. Mariana Rios** (DNI `71239845`). La sesión dura 8 horas (`expiraEn`).

## 5. Estructura del código

```
app/            page.tsx (elige la vista según el rol y la pestaña), layout.tsx, globals.css (tokens claro/oscuro)
components/
├── auth/       LoginForm
├── layout/     Sidebar (menú por rol), CambiarContrasenaModal, NotificationToast, ConfirmModal, RoleBadge
├── modals/     TicketDetailModal + ticket-detail/parts (cabecera, metadatos, adjuntos, línea de tiempo, AccionesForm), FaqModal
├── roles/      una carpeta por rol: <Rol>View.tsx, use<Rol>*.ts (estado y llamadas), y subcarpetas por pestaña con parts/
│   ├── funcionario/   bandeja, constancias
│   └── supervisor/    supervision (panorama y por aprobar), reasignacion (carga por funcionario)
└── shared/ui/  TabsBar, CardHeader, KpiCard, SearchInput, FormField, TicketLabels
context/        AuthContext (sesión), ThemeContext (claro/oscuro)
controllers/    auth, tickets, usuarios, auditoria, reportes, telemetria, seguridad, areas, ia-dashboards (API + datos simulados)
services/       api-client.service (fetch + JWT + ApiError), storage.service (sesión en localStorage)
types/          auth, ticket, ui, auditoria, telemetria
utils/          ticket.utils (reglas por estado, carga, áreas), csv.utils, fecha-peru.utils (fechas en hora de Perú),
                telemetria.utils (nombres de los códigos del backend y uso del sistema a partir del resumen)
docs/           Cambios_rama_supervisor_funcionario.md (todo lo de la rama), Plan_Supervisor_Funcionario.md y documentos de la etapa Oracle
```

### Flujo de un reclamo (estados de la BD, desde el 05/11/2026)

```
registrado ─recibir/validar─> pendiente de validación ─validar (categoría)─> pendiente de asignación
pendiente de asignación ─asignar (Supervisor: área, funcionario, prioridad)─> en evaluación
en evaluación: evaluar → elaborar respuesta → (prioridad ALTA o tipo con revisión) por aprobar → Supervisor aprueba u observa
respuesta enviada → respondido ─cerrar─> cerrado
pendiente de validación / en evaluación ─declarar improcedente─> improcedente
```

- **Los botones salen de `accionesPermitidas`** del backend (`puede(t, accion)` en `utils/ticket.utils.ts`); el front no
  decide reglas por estado. Todas las acciones pasan por `ticketsController.ejecutarAccion` y envían la `version`.
- "por aprobar" no es un estado: es `respuestaPorAprobar` (filtro y marca en el estado).
- El Admin no ve reclamos (acuerdo del grupo). Control Municipal solo lee.
- En modo demo (sin backend) los reclamos se ven pero las acciones no se simulan.

### Endpoints que usa el front (para el grupo de backend)

Tabla completa en `docs/Plan_Supervisor_Funcionario.md`, sección 10. Ojo: la tabla `reclamos` de Oracle
no tiene hoy área, funcionario asignado, aprobación ni constancias, y sus estados son otros.

## 6. Convenciones

- **Idioma:** nombres de variables, funciones y textos de la interfaz en español (los componentes de
  Braulio mezclan algo de inglés: `handleSubmit`, `isLoading`; se respetan).
- **Textos:** lenguaje simple; los errores dicen qué pasó y cómo resolverlo; los botones dicen la acción
  exacta ("Devolver al funcionario", "Reasignar").
- **Colores:** solo variables del tema (`var(--text-main)`, `var(--bg-card)`, `var(--border-color)`...),
  nunca `--slate-*` fijos en componentes nuevos: no se leen en modo oscuro.
- **Acciones nuevas sobre reclamos:** la regla vive en el backend (`AtencionReclamos`). En el front: el código en
  `AccionCodigo` (`types/ticket.types.ts`), su ruta en `RUTAS_ACCION` (`tickets.controller.ts`), el botón y el formulario
  en `AccionesForm` y el aviso en `mensajeExitoAccion`.
- **React:** cumplir las reglas de lint `react-hooks` (`set-state-in-effect`, `immutability`). Para reiniciar
  un formulario se usa `key` (ver `TicketDetailModal`), no un `useEffect`.
- **Pestañas por rol:** la pestaña activa la manda `app/page.tsx` (`initialTab`); si la vista tiene
  pestañas propias, avisa con `onTabChange` para que el menú lateral quede marcado (ver `SupervisorView`).
- **Vistas de Admin, Control Municipal y Control TI (de Braulio):** los cambios se le avisan y se documentan
  (los de esta rama están en `docs/Cambios_rama_supervisor_funcionario.md`, sección 5).
- **Credenciales:** nunca en el repositorio.

## 7. Errores conocidos

- **StrictMode en desarrollo:** React monta los efectos dos veces, así que en `npm run dev` cada pantalla pide sus
  datos dos veces a la API. Es normal; en producción es una vez.
- **Playwright + Edge:** cerrar un contexto en el que hubo una descarga (p. ej. "Exportar CSV") da `TargetClosedError`.
  Es del entorno de pruebas, no de la app.
- **Fin de línea:** git avisa "LF will be replaced by CRLF" en varios archivos; es solo un aviso.

## 8. Bitácora

| Fecha | Avance |
|---|---|
| 23/10–28/10/2026 | Etapa Spring Boot + Thymeleaf y conexión a Oracle (ver historia de git y `docs/Conexion_Portal_Oracle.md`). |
| 31/10/2026 | Braulio pasa el proyecto a Next.js (`9ddb046`): pantallas por rol, modo oscuro, datos simulados. |
| 31/10/2026 | Rama `feature/supervisor-funcionario`: reglas por estado, pestaña de reasignación de carga, reasignación con el funcionario elegido, devolver al funcionario, filtros del supervisor, atender sin enviar a aprobación, arreglo del login (sin entrada automática; sin modo demo si el backend responde) y menú lateral sincronizado con las pestañas del supervisor. Auditoría: `tsc` y `build` OK; 42 + 12 + 6 + 6 comprobaciones en navegador. |
| 31/10/2026 | Misma rama: datos simulados solo sin conexión en todos los controladores (`esSinConexion`, `mensajeErrorApi`); el formulario queda abierto si la acción falla; período de Control Municipal enviado al backend; lint en 0 (arranque sin `setState` en efectos: `AuthContext`, `ThemeContext`, `page.tsx`); pipeline a Node 22 con lint; README al día. **Todos los cambios de la rama: `docs/Cambios_rama_supervisor_funcionario.md`.** |
| 01/11/2026 | Misma rama: los 12 arreglos de la auditoría independiente, probados en el navegador (34 comprobaciones: desarrollo, y producción con y sin modo demo). `npm run build` sin errores. |
| 02/11/2026 | PR #4 unido a `main`. Ulises sube `4cbbef9` (paginación, Modo Privacidad, pantallas nuevas de Control Municipal y Control TI). |
| 05/11/2026 | Rama `feature/flujo-reclamos`: los 7 estados de la BD y el flujo completo del personal (recibir, validar, pedir información, asignar, evaluar, responder, aprobar u observar, cerrar, improcedente, nota) según `accionesPermitidas`, con `version`. Probado en el navegador contra el backend en H2 de punta a punta. |
| 05/11/2026 | Revisión de `main` tras `4cbbef9`: `tsc`, `lint` y `build` OK; flujos de Supervisor y Funcionario OK en el navegador. Se agrega `--green-500` en `globals.css` (rama `fix/barra-carga-funcionarios`); comprobado en el navegador. |
| 11/11/2026 | Pedido de Ulises. Pruebas de telemetría (`docs/Pruebas_telemetria.md`): el backend real responde 404 en `/telemetria/*`; 81 comprobaciones en el navegador (demo, backend simulado y backend real) OK. Documentos: `docs/Cumplimiento_requisitos.md` (los 5 requisitos de los JP, del Drive del grupo) y `docs/Solicitud_backend_control_acceso.md`. `main` en `f8543a7`: `tsc` y `build` OK, `lint` con 2 errores. |
| 11/11/2026 | Rama `fix/telemetria-y-lint` (subida, sin PR): lint en 0 (errores de `f8543a7`); dashboard de uso del Req 4 en Control TI (filtros, usuarios únicos, sesiones, actividad por día y hora de Perú, % completadas, última actualización; formato propuesto en `docs/Solicitud_backend_telemetria.md`); tabla de eventos; mensajes claros sin backend; Control de Acceso lee las políticas (`seguridad.controller`), avisa si no puede leer y envía `version`; canal del reclamo en el expediente. Navegador: demo 34/34, simulado 31/31, real 13/13. |
| 11/11/2026 (noche) | El backend publicó lo pedido para Control de Acceso y adjuntos. Portal: políticas del personal reales (`lockoutMinutes` nuevo; fuera los 4 campos que el backend no implementa; envía solo lo que cambió con `version`; sin `POST /auditoria`), versiones del aviso de analítica (activar → 501 hasta el permiso de la BD; fuera el botón "v1.4"), **Cambiar contraseña** en el menú de la cuenta, sección **Adjuntos y evidencias** del expediente (ver y descargar con la sesión; "Archivo no disponible" para los de la app) y acción **Adjuntar evidencia** (`multipart`, campo `archivo`). Navegador: simulado 56/56, real 9/9 (solo lecturas). `tsc`, `lint` y `build` OK. |
| 11/11/2026 (noche, 2) | Respuestas del backend: telemetría sin dudas abiertas (se quitan la tarjeta y la columna de notificaciones y la IP del CSV; nombre para `ACCION`). **Evidencia probada contra el backend real** en `REC-2026-000001` con `supervisor.demo` (autorizado por Adrian): `PRUEBA_portal_evidencia.pdf` subida (201), lista, nota en la línea de tiempo, Ver y Descargar con los mismos bytes; 10/10. Constancias: el backend las tiene listas para el próximo despliegue (contrato en `docs/Constancias_contrato.md` del repo del backend). |
| 11/11/2026 (tarde) | El backend publicó `/telemetria/*` con un formato distinto al propuesto (filtros `fechaDesde`/`fechaHasta`/`canal`, códigos como `DEUDAS` o `ANDROID`, `sesiones` y `consultas` en la raíz). Se adaptó el portal: tipos, controlador, `utils/telemetria.utils.ts`, filtro de canal, tabla de eventos con resultado, Control de Acceso por secciones (guarda la telemetría aunque falten las políticas, envía solo lo que cambió y no duplica la auditoría). Navegador: demo 48/48, simulado 108/108, **backend real 92/92** (incluye pausar y reanudar la telemetría; quedó activa). Detalle en `docs/Pruebas_telemetria.md`, sección 7. Nuevo: `docs/Solicitud_backend_adjuntos.md`. |

## 9. Pendientes

**Por decidir con el equipo**
- [ ] Colores de los estados (punto 8 del plan): `globals.css` dice "sin colores", pero hay tokens `--status-*` sin usar.
- [ ] Que el grupo de backend revise la tabla de endpoints y resuelva con el responsable de la BD las columnas que faltan en `reclamos`.
- [ ] Qué significa "clicks de los usuarios" (admins en el portal o ciudadanos en la app).

**Técnicos**
- [x] Pipeline pasado de Maven a Node 22 (`npm ci`, `tsc --noEmit`, `npm run lint`, `npm run build`).
- [x] Lint en 0 errores y 0 advertencias, y `npm run lint` en el pipeline.
- [x] Respaldo simulado de `tickets.controller` solo sin conexión; el formulario queda abierto si la acción falla.
- [x] `esSinConexion` en todos los controladores.
- [x] Selector de período de Control Municipal: ahora se envía al backend (los datos simulados no cambian por período).
- [x] Control TI: el backend publicó `/telemetria/*` el 11/11 y el portal los usa (rama `fix/telemetria-y-lint`). Quedan dudas para el backend en `docs/Solicitud_backend_telemetria.md`, sección 5 (reglas de conteo, `versionTerminosVigente`, datos reales de la app).
- [x] Control de Acceso con el backend (políticas, telemetría, versiones del aviso) y cambio de contraseña. Falta el permiso `UPDATE (activo)` en `documentos_versiones` para activar otra versión (hoy 501).
- [x] Adjuntos y evidencias del reclamo (Req 1). Los adjuntos que el ciudadano subió desde la app no se pueden descargar hasta que la app use el backend único.
- [x] Subir una evidencia contra el backend real (`REC-2026-000001`, `PRUEBA_portal_evidencia.pdf`; no se puede borrar y quedan 3 cupos).
- [ ] Probar contra el backend real guardar políticas y cambiar contraseña: solo se probaron en el simulado.
- [ ] Constancias (Req 2): el backend ya las hizo (`GET /constancias`, `/constancias/{id}`, `POST .../aprobar` y `.../desaprobar`, `GET /reportes/constancias` y `/reportes/constancias/{id}/pdf`); salen en el próximo despliegue. Falta conectar el portal con el contrato del backend (`docs/Constancias_contrato.md` de su repo).
- [ ] Integrar con el backend cuando esté listo y quitar los datos simulados.
- [ ] Pruebas automáticas en el repositorio (hoy solo hay scripts de Playwright fuera del repo).
- [x] `README.md` actualizado (estructura `components/roles/`, Next.js 16, datos que no coincidían con el código).
- [ ] `ConfirmModal` existe pero no se usa en ninguna pantalla.
