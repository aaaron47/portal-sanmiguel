# Portal de Quejas - Sistema Integrado San Miguel (Frontend Web)

Frontend oficial en **Next.js 14+ (App Router)** y **TypeScript** para el **Sistema Integrado San Miguel**. Centraliza la gestión de quejas ciudadanas, supervisión municipal, reportes de control y telemetría de la app móvil vecinal.

El backend se maneja en un repositorio independiente (Spring Boot / Oracle 19c) y es consumido mediante una arquitectura por capas con controladores tipados.

---

## 1. Arquitectura por Capas

El proyecto está organizado en capas limpias y desacopladas:

```
Portal_quejas/
├── app/                        # Rutas de Next.js (App Router), layout y página principal
│   ├── globals.css             # Sistema de diseño, tokens de color y estilos CSS modernos
│   ├── layout.tsx              # Shell HTML con AuthProvider y metadatos SEO
│   └── page.tsx                # Orquestador dinámico de vistas según el rol activo
├── components/                 # Componentes de presentación (React)
│   ├── auth/                   # LoginForm con validación y accesos rápidos por rol
│   ├── layout/                 # Header, Sidebar adaptativo, RoleBadge, NotificationToast, ConfirmModal
│   ├── modals/                 # TicketDetailModal con historial cronológico y acciones
│   └── views/                  # Vistas especializadas por cada uno de los 5 roles
│       ├── AdminView.tsx
│       ├── FuncionarioView.tsx
│       ├── SupervisorView.tsx
│       ├── ControlMunicipalView.tsx
│       └── ControlTiView.tsx
├── controllers/                # Capa de Controladores (Lógica de negocio y consumo de APIs)
│   ├── auth.controller.ts      # Login, logout, tokens, simulación de usuarios
│   ├── tickets.controller.ts   # Atención, derivación enriquecida y evaluación de constancias
│   ├── telemetria.controller.ts# KPIs de onboarding, privacidad y eventos anónimos de la app
│   ├── auditoria.controller.ts # Auditoría y trazabilidad para el Administrador
│   ├── usuarios.controller.ts  # Alta, baja y administración de personal municipal
│   └── reportes.controller.ts  # Cumplimiento por área y control de constancias
├── services/                   # Capa de Servicios de Infraestructura
│   ├── api-client.service.ts   # Cliente HTTP centralizado (fetch + JWT + manejo de errores)
│   └── storage.service.ts      # Persistencia de sesión segura en navegador
└── types/                      # Modelos de datos y DTOs tipados en TypeScript
    ├── auth.types.ts
    ├── ticket.types.ts
    ├── telemetria.types.ts
    └── auditoria.types.ts
```

---

## 2. Los 5 Roles del Sistema y Matriz de Acceso

El sistema detecta automáticamente el rol del usuario autenticado y ajusta la navegación, menús y acciones disponibles:

| Rol | Alcance y Responsabilidades | Restricciones de Integridad |
|---|---|---|
| **Admin** | Gestiona usuarios del sistema y consulta la auditoría de accesos. | **No atiende quejas** para evitar conflictos de interés. |
| **Funcionario** | Atiende, responde, deriva reclamos a otras áreas y evalúa constancias ciudadanas. | Solo visualiza y gestiona lo asignado a su área municipal. |
| **Supervisor** | Panorama general de todas las áreas, revisión de respuestas, aprobación final y reasignación de carga. | Visto bueno obligatorio antes de la resolución final. |
| **Control Municipal (Lectura)** | Accede a reportes ejecutivos de cumplimiento de plazos y estadísticas de constancias emitidas. | Perfil estrictamente de lectura / auditoría (OCI). |
| **Control App / TI (Lectura)** | Dashboard de telemetría de la app móvil: adopción de onboarding, consentimiento de analítica (Sí/No) y tráfico de pantallas. | Lectura de eventos aislados en `telemetria_eventos` con IDs anónimos. |

---

## 3. Heurísticas de Usabilidad de Nielsen Aplicadas

1. **Visibilidad del estado del sistema**: Toasts flotantes inmediatos (`NotificationToast`), badges de estado en tiempo real (`pendiente de validación`, `en evaluación`, `derivado`, `por aprobar`, `resuelto`, `archivado`) e indicadores de carga.
2. **Correspondencia entre el sistema y el mundo real**: Términos municipales familiares (Folio, Reclamo, Derivación, Constancia, OCI) y fechas legibles.
3. **Control y libertad del usuario**: Posibilidad de cancelar acciones en modales y volver a la bandeja con un solo clic.
4. **Consistencia y estándares**: Paleta de colores institucional cohesiva, iconografía uniforme con Lucide React y formatos estándar.
5. **Prevención de errores**: Modales de confirmación (`ConfirmModal`) antes de derivar o aprobar resoluciones definitivas.
6. **Reconocimiento antes que recuerdo**: Menú lateral adaptativo que solo presenta opciones relevantes al rol activo.
7. **Flexibilidad y eficiencia de uso**: Selector rápido en el encabezado (*Simular Rol*) para alternar entre perfiles durante pruebas y demostraciones.
8. **Diseño estético y minimalista**: Jerarquía visual limpia, espaciado armónico, tipografía legible (Plus Jakarta Sans) y sin sobrecarga cognitiva.
9. **Ayudar a reconocer y recuperarse de errores**: Mensajes claros de validación en formularios de login y derivación.
10. **Ayuda y documentación**: Alertas explicativas en la vista de Admin señalando la política de prevención de conflicto de intereses.

---

## 4. Comandos de Ejecución

```bash
# Instalar dependencias
npm install

# Levantar servidor de desarrollo
npm run dev
# Disponible en: http://localhost:3000

# Verificación de tipos TypeScript
npx tsc --noEmit

# Compilación de producción
npm run build
```

---

## 5. Conexión con el Backend

Por defecto, el cliente API ([api-client.service.ts](file:///home/odiseo/Documentos/Proyectos/Portal_quejas/services/api-client.service.ts)) busca el backend en `http://localhost:8080/api`. Si se requiere modificar la URL:

Crea un archivo `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://tu-servidor-backend:8080/api
```
