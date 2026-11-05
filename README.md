# Portal de Quejas - Sistema Integrado San Miguel (Frontend Web)

Frontend oficial desarrollado en **Next.js 16 (App Router con Turbopack)** y **TypeScript** para el **Sistema Integrado San Miguel**. Centraliza la atención y derivación de quejas ciudadanas, supervisión de resoluciones, reportería tributaria oficial, fiscalización y telemetría de la app móvil vecinal.

El backend se gestiona en un repositorio independiente (Spring Boot / Oracle 19c) y es consumido mediante una arquitectura desacoplada por capas con controladores tipados y soporte para modo de datos simulados (offline / demo).

---

## 1. Arquitectura por Capas

La estructura del proyecto organiza la lógica de presentación, reglas de negocio, tipos y servicios:

```
Portal_quejas/
├── app/                        # Rutas de Next.js (App Router), layout y página principal
│   ├── globals.css             # Sistema de diseño: variables CSS (modo claro y oscuro), paleta municipal y utilidades
│   ├── layout.tsx              # Shell HTML con AuthProvider, ThemeProvider y metadatos SEO
│   └── page.tsx                # Renderizado condicional de vistas según rol activo y navegación del Sidebar
├── components/                 # Componentes de interfaz de usuario (React)
│   ├── auth/                   # LoginForm: validación, búsqueda por DNI/correo y accesos rápidos de prueba
│   ├── layout/                 # Sidebar adaptativo por rol, RoleBadge, NotificationToast, ConfirmModal
│   ├── modals/                 # TicketDetailModal (seguimiento scrolleable), FaqModal (flujo TUPA y capacidades MCP)
│   ├── roles/                  # Vistas, hooks de estado y paneles divididos por rol:
│   │   ├── admin/              # usuarios, auditoria (trazabilidad paginada), acceso (gobernanza y validación escrita)
│   │   ├── funcionario/        # bandeja de reclamos, constancias tributarias evaluadas
│   │   ├── supervisor/         # supervision (reclamos y resoluciones por aprobar), reasignacion (carga por margen)
│   │   ├── control-municipal/  # dashboard ejecutivo, reportes tributarios R1-R11, constancias, asistente MCP e integración Superset
│   │   └── control-ti/         # dashboard de telemetría, eventos anónimos, políticas de retención y kill switch
│   └── shared/ui/              # TabsBar, CardHeader, KpiCard, SearchInput, FormField, TicketLabels
├── context/                    # AuthContext (autenticación y sesión) y ThemeContext (tema claro/oscuro)
├── controllers/                # Lógica de negocio y consumo de APIs (con fallback de contingencia)
│   ├── auth.controller.ts      # Autenticación, cierre de sesión y cuentas demo
│   ├── tickets.controller.ts   # Atención, derivación, constancias, aprobación, devolución y reasignación
│   ├── telemetria.controller.ts# KPIs de onboarding, consentimiento de privacidad y eventos anónimos de la app
│   ├── auditoria.controller.ts # Trazabilidad administrativa y registro de eventos de configuración
│   ├── usuarios.controller.ts  # Gestión de funcionarios y personal municipal
│   └── reportes.controller.ts  # Cumplimiento por gerencia y métricas de constancias
├── services/                   # Servicios de infraestructura
│   ├── api-client.service.ts   # Cliente HTTP (fetch + interceptor JWT + ApiError)
│   └── storage.service.ts      # Gestión de persistencia local segura en navegador
├── types/                      # Definiciones de tipos y contratos de datos TypeScript
│   ├── auth.types.ts           # Credenciales, sesiones y perfiles de usuario
│   ├── ticket.types.ts         # Estructura de reclamos, estados y trazabilidad
│   ├── reportes-tributarios.types.ts # Catálogo oficial de los 11 reportes requeridos (R1 al R11)
│   ├── superset.types.ts       # Esquemas de dashboards analíticos, chat y mensajes MCP
│   ├── auditoria.types.ts      # Eventos de auditoría y configuración de acceso
│   └── telemetria.types.ts     # Telemetría móvil, consentimiento y retención de logs
└── utils/                      # Utilidades: ticket.utils, csv.utils (exportación de plantillas y datos)
```

---

## 2. Los 5 Roles del Sistema y Matriz Funcional

El portal adapta la navegación del menú lateral (*Sidebar*) y las acciones según el rol autenticado:

| Rol | Alcance y Módulos Principales | Políticas de Seguridad y Control |
|---|---|---|
| **Admin** | • Gestión y activación de usuarios municipales.<br>• Auditoría y trazabilidad administrativa con paginación.<br>• Control de acceso: gobernanza de datos y telemetría móvil. | • **Sin acceso a gestión de quejas** (prevención de conflicto de intereses).<br>• Guardado de cambios de gobernanza protegido por confirmación escrita obligatoria (`"realizar cambios"`). |
| **Funcionario** | • Bandeja de reclamos asignados a su área municipal.<br>• Atención, derivación justificada y respuesta ciudadana.<br>• Evaluación y emisión de constancias de no adeudo. | • Visibilidad restringida a los expedientes de su gerencia.<br>• Modal de expediente con historial de seguimiento scrolleable y límite de altura de arrastre. |
| **Supervisor** | • Supervisión global de reclamos y expedientes vecinales.<br>• Revisión y visto bueno obligatorio a resoluciones antes de notificación.<br>• Reasignación de expedientes evaluando carga de trabajo por margen. | • Potestad de aprobar o devolver resoluciones con observaciones fundamentadas.<br>• Tablas de supervisión y aprobación con paginación integrada. |
| **Control Municipal (OCI / Fiscalización)** | • Dashboard General de cumplimiento de plazos por gerencia municipal.<br>• **Reportes Tributarios Oficiales (R1 al R11)**: morosidad con/sin beneficio, PRICOS, ratios de cobranza y buen pagador.<br>• Registro oficial de **Constancias de No Adeudo** con paginación.<br>• **Asistente MCP**: Chat analítico tributario con modelo local.<br>• **Apache Superset**: Catálogo superior con descarga de plantillas CSV y tableros analíticos (D1 a D4). | • Perfil de fiscalización y auditoría (lectura y descarga).<br>• **Modo Privacidad LPDP (Ley N° 29733)** con toggle visual para enmascarar nombres de personas y DNI en presentaciones y auditorías. |
| **Control App / TI** | • Telemetría móvil vecinal (adopción de onboarding y consentimiento de analítica).<br>• Registro de eventos anónimos con IDs disociados.<br>• Política de retención de los registros de uso (12 meses, purga mensual).<br>• **Interruptor de Emergencia (*Kill Switch*)** para telemetría. | • Acceso a métricas técnicas sin exposición de datos de carácter personal.<br>• Aislamiento de eventos en tabla `telemetria_eventos`. |

---

## 3. Catálogo Oficial de Reportes Tributarios (R1 al R11)

El módulo de **Control Municipal** integra la estructura oficial de reportes normados para la Municipalidad de San Miguel:

1. **R1:** Reporte de Morosos con Beneficio vs. sin Beneficio.
2. **R2:** Contribuyentes sin Registros de Pago (2022–2025).
3. **R3:** % de Recaudación vs. Morosidad y Efectividad de Cobranza.
4. **R4:** Estado de Cobranza de Valores Emitidos (Órdenes de Pago y Resoluciones).
5. **R5:** Principales Contribuyentes (PRICOS) con Deuda Tributaria.
6. **R6:** Contribuyentes con Pagos Oportunos en Impuesto Predial y Arbitrios.
7. **R7:** Efectividad de Cobranza por Año Tributario.
8. **R8:** Estratificación de Deuda por Antigüedad.
9. **R9:** Historial de Cumplimiento (Pagos a Tiempo vs. Fuera de Plazo).
10. **R10:** Monto Promedio Recaudado por Contribuyente Puntual.
11. **R11:** Reincidencia en la Mora Tributaria.

Todas las tablas cuentan con **paginación**, filtros temporales/por gerencia, **descarga directa en CSV** y botón conmutable de **Modo Privacidad LPDP** para proteger datos personales.

---

## 4. Asistente MCP e Integración con Apache Superset

* **Asistente MCP:** Proporciona una interfaz minimalista centrada en el medio del viewport, con un resplandor de iluminación circular-ovalado en celeste municipal. Permite interactuar en lenguaje natural con el modelo analítico local para estructurar consultas SQL seguras y métricas de recaudación.
* **Apache Superset:** Incorpora el catálogo superior de los 11 reportes oficiales con descarga de plantillas CSV consolidadas, selector de dashboards predefinidos (D1: Deuda y Morosidad, D2: Eficacia de Valores, D3: Buenos Pagadores, D4: Antigüedad) y botón para **recargar la solicitud** analítica ante latencias de red.

---

## 5. Comandos de Ejecución y Desarrollo

```bash
# 1. Instalar dependencias exactas
npm install

# 2. Levantar servidor de desarrollo (con Turbopack)
npm run dev
# Acceso en el navegador: http://localhost:3000

# 3. Comprobación estricta de tipos de TypeScript
npx tsc --noEmit

# 4. Análisis estático de código y reglas de React
npm run lint

# 5. Generación del bundle de producción
npm run build

# 6. Ejecutar bundle de producción
npm start
```

---

## 6. Variables de Entorno

Configura las variables creando un archivo `.env.local` en la raíz del proyecto:

```env
# URL base de la API backend (Spring Boot)
NEXT_PUBLIC_API_URL=http://localhost:8080/api

# Forzar modo demostración con datos simulados (true / false)
NEXT_PUBLIC_MODO_DEMO=true

# URL de la instancia de Apache Superset
NEXT_PUBLIC_SUPERSET_URL=http://localhost:8088

# Endpoint del servicio analítico local MCP
NEXT_PUBLIC_MCP_API_URL=http://localhost:8000/api/mcp/generate-report
```

---

## 7. Integración Continua (CI / CD)

El repositorio cuenta con un pipeline automatizado de GitHub Actions configurado en [`.github/workflows/ci.yml`](.github/workflows/ci.yml) que valida cada cambio en ramas principales y Pull Requests:

1. **Checkout y Setup:** Node.js 22 con caché optimizado de `npm`.
2. **Instalación determinista:** `npm ci`.
3. **Chequeo de Tipos TypeScript:** `npx tsc --noEmit` (verifica el 100% de tipos sin emitir archivos).
4. **Validación de Linter:** `npm run lint` (reglas de ESLint 9 y Next.js Core Web Vitals).
5. **Compilación de Producción:** `npm run build` (garantiza compatibilidad de Turbopack, SSR y empaquetado estático).
