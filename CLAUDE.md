# CLAUDE.md – Portal de quejas (front web)

Guía del proyecto para retomar el trabajo: contexto, decisiones, cómo está armado el código,
convenciones y lo que falta. Mantenerla al día cuando cambie algo importante.

> **Cambio de rumbo (commit `9ddb046`, de Braulio):** el portal pasó de Spring Boot + Thymeleaf a
> **Next.js**. Este repositorio es **solo el front**; el backend (Spring Boot / Oracle 19c) lo hace
> **otro grupo** en otro repositorio. Lo de la etapa Java (conexión a Oracle, cuenta `SANMI_PORTAL_WEB`,
> tablas reales) queda como referencia en `docs/Conexion_Portal_Oracle.md`, `docs/Conexion_BD.md`
> y `docs/datos_faltantes.md`, y en la historia de git.

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
| **El respaldo simulado solo con fallo de red** en el login | Si el backend responde (p. ej. 401), no se entra en modo demo. `ApiError.status === 0` = sin conexión. |
| **Reglas de acciones por estado en un solo archivo** (`utils/ticket.utils.ts`) | Las usan el formulario de acciones y las tablas; no repetir condiciones en los componentes. |
| **El funcionario no resuelve**: envía a aprobación y el supervisor aprueba o devuelve | Lo exige el README (visto bueno del supervisor). |

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
npm run lint         # lint (hay errores de antes en archivos de otros, ver sección 8)
npm run build        # compilación de producción
```

- La URL del backend sale de `NEXT_PUBLIC_API_URL` (por defecto `http://localhost:8080/api`). Sin backend
  levantado, todo funciona con datos simulados. Las variables van en `.env*` (ignorado por git).
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
├── layout/     Sidebar (menú por rol), NotificationToast, ConfirmModal, RoleBadge
├── modals/     TicketDetailModal + ticket-detail/parts (cabecera, metadatos, línea de tiempo, AccionesForm), FaqModal
├── roles/      una carpeta por rol: <Rol>View.tsx, use<Rol>*.ts (estado y llamadas), y subcarpetas por pestaña con parts/
│   ├── funcionario/   bandeja, constancias
│   └── supervisor/    supervision (panorama y por aprobar), reasignacion (carga por funcionario)
└── shared/ui/  TabsBar, CardHeader, KpiCard, SearchInput, FormField, TicketLabels
context/        AuthContext (sesión), ThemeContext (claro/oscuro)
controllers/    auth, tickets, usuarios, auditoria, reportes, telemetria (API + datos simulados)
services/       api-client.service (fetch + JWT + ApiError), storage.service (sesión en localStorage)
types/          auth, ticket, ui, auditoria, telemetria
utils/          ticket.utils (reglas por estado, carga, áreas), csv.utils
docs/           Plan_Supervisor_Funcionario.md y documentos de la etapa Oracle
```

### Flujo de un reclamo (estados del front)

```
pendiente de validación ─┐
en evaluación ───────────┼─ Funcionario: atender (registrar avance → en evaluación,
derivado ────────────────┘               o enviar a aprobación → por aprobar), derivar, evaluar constancia
por aprobar ── Supervisor: aprobar → resuelto | devolver (motivo) → en evaluación
Supervisor: reasignar en cualquier estado activo. resuelto / archivado: sin acciones.
```

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
- **Acciones nuevas sobre reclamos:** agregar el método al controlador (API + respaldo simulado), el tipo
  en `types/ticket.types.ts` (payload y `tipoAccion` si deja huella en la línea de tiempo), la regla en
  `utils/ticket.utils.ts` y el endpoint en la tabla del plan.
- **React:** cumplir las reglas de lint `react-hooks` (`set-state-in-effect`, `immutability`). Para reiniciar
  un formulario se usa `key` (ver `TicketDetailModal`), no un `useEffect`.
- **Pestañas por rol:** la pestaña activa la manda `app/page.tsx` (`initialTab`); si la vista tiene
  pestañas propias, avisa con `onTabChange` para que el menú lateral quede marcado (ver `SupervisorView`).
- **No tocar** las vistas de Admin, Control Municipal ni Control TI sin acordarlo con Braulio.
- **Credenciales:** nunca en el repositorio.

## 7. Errores conocidos

- **Los handlers de las vistas atrapan los errores** (muestran el aviso y no relanzan), así que
  `AccionesForm` cierra el formulario aunque la acción falle. Con datos simulados casi no pasa; revisarlo
  cuando haya backend.
- **El respaldo simulado de `tickets.controller` se usa ante cualquier error**, no solo sin conexión:
  con backend real, un 409 o un 403 se "aplicaría" en los datos simulados. Corregirlo igual que en el login
  cuando exista el backend.
- **Fin de línea:** git avisa "LF will be replaced by CRLF" en varios archivos; es solo un aviso.

## 8. Bitácora

| Fecha | Avance |
|---|---|
| 23/10–28/10/2026 | Etapa Spring Boot + Thymeleaf y conexión a Oracle (ver historia de git y `docs/Conexion_Portal_Oracle.md`). |
| 31/10/2026 | Braulio pasa el proyecto a Next.js (`9ddb046`): pantallas por rol, modo oscuro, datos simulados. |
| 31/10/2026 | Rama `feature/supervisor-funcionario`: reglas por estado, pestaña de reasignación de carga, reasignación con el funcionario elegido, devolver al funcionario, filtros del supervisor, atender sin enviar a aprobación, arreglo del login (sin entrada automática; sin modo demo si el backend responde) y menú lateral sincronizado con las pestañas del supervisor. Auditoría: `tsc` y `build` OK; 42 + 12 + 6 + 6 comprobaciones en navegador. |

## 9. Pendientes

**Por decidir con el equipo**
- [ ] Colores de los estados (punto 8 del plan): `globals.css` dice "sin colores", pero hay tokens `--status-*` sin usar.
- [ ] Que el grupo de backend revise la tabla de endpoints y resuelva con el responsable de la BD las columnas que faltan en `reclamos`.
- [ ] Qué significa "clicks de los usuarios" (admins en el portal o ciudadanos en la app).

**Técnicos**
- [ ] **El pipeline `.github/workflows/ci.yml` sigue corriendo `mvn -B verify`** y ya no hay `pom.xml`: falla en todo PR a `main`. Pasarlo a Node (`npm ci`, `tsc`, `build`).
- [ ] 6 errores de lint de antes en archivos de otros (`app/page.tsx`, `context/*`, `usuarios.controller.ts`, `control-municipal/*`, `control-ti/*`).
- [ ] Respaldo simulado de `tickets.controller` solo con fallo de red (ver sección 7).
- [ ] Integrar con el backend cuando esté listo y quitar los datos simulados.
- [ ] Pruebas automáticas en el repositorio (hoy solo hay scripts de Playwright fuera del repo).
- [ ] Actualizar `README.md`: la estructura que muestra (`components/views/`) ya no existe; ahora es `components/roles/`.
