# Week 8 Design — AI Insights + Gamificación + Polish + Docs
**Date:** 2026-03-01
**Status:** Approved
**Scope:** Tasks 21-27 (finales del plan)

---

## Contexto

El proyecto llega a Week 8 con 20 features completas (Tasks 1-20), 418+ tests pasando, y una arquitectura madura con patrones establecidos (`withErrorHandling` HOF, React Query hooks, Prisma 7 + PostgreSQL).

**Decisiones de diseño:**
- AI Provider: Claude API (`claude-haiku-4-5-20251001`) via `@anthropic-ai/sdk`
- Gamificación: Sistema completo (Logros + Streak + Niveles/XP)
- Polish: UX/Visual (skeletons, empty states, micro-interacciones)
- Task 27: Documentación (README + guías + API docs)
- Enfoque: Secuencial A (Tasks 21→27 en orden)

---

## Task 21 — AI Smart Insights Backend

### Arquitectura

Sin tabla nueva. Insights generados on-demand, cacheados en React Query (30 min).

**Endpoint:** `GET /api/insights`

**Flujo:**
1. Recopila datos de APIs existentes: ratios, cashflow, metas, inversiones, créditos
2. Construye prompt estructurado con contexto financiero del usuario
3. Llama a Claude API (haiku-4-5) con instrucción de responder JSON
4. Parsea y retorna array de insights priorizados

**Estructura de insight:**
```typescript
interface Insight {
  tipo: 'ALERTA' | 'OPORTUNIDAD' | 'LOGRO' | 'SUGERENCIA'
  titulo: string          // Título corto y directo
  descripcion: string     // 2-3 oraciones con contexto
  accion: string          // Acción concreta recomendada
  prioridad: 1 | 2 | 3 | 4 | 5  // 5 = más urgente
  datos: Record<string, number | string>  // Números del análisis
}
```

**Prompt engineering:**
- System prompt: Asesor financiero personal analizando datos reales
- User prompt: ingresos mensuales, gastos promedio, DTI, savings rate, progreso metas, cashflow proyectado
- Instrucción explícita: responder SOLO JSON válido, sin texto libre
- Output: array de 4-6 insights ordenados por prioridad

**Variables de entorno necesarias:**
```
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Task 22 — AI Smart Insights Frontend

**Ubicación:** Nueva sección en dashboard principal, después de Quick Stats.

**Componentes:**
- `InsightsSection` — Contenedor principal con título y botón "Actualizar"
- `InsightCard` — Tarjeta individual con ícono por tipo, badge prioridad, descripción y CTA
- `InsightsSkeleton` — Skeleton mientras Claude procesa (~2-3s)
- `InsightsEmptyState` — Cuando no hay datos suficientes para analizar

**React Query hook:**
```typescript
useInsights() // staleTime: 30 minutos, no refetch on window focus
```

**Iconos por tipo:**
- ALERTA: 🚨
- OPORTUNIDAD: 💡
- LOGRO: 🏆
- SUGERENCIA: 💬

---

## Tasks 23-25 — Gamificación

### Schema Prisma (3 tablas nuevas)

```prisma
model Logro {
  id           String         @id @default(cuid())
  codigo       String         @unique
  nombre       String
  descripcion  String
  icono        String
  categoria    CategoriaLogro
  xp           Int
  desbloqueado Boolean        @default(false)
  fechaLogro   DateTime?
  createdAt    DateTime       @default(now())
}

model Streak {
  id              String     @id @default(cuid())
  tipo            TipoStreak
  rachaActual     Int        @default(0)
  rachaMayor      Int        @default(0)
  ultimaActividad DateTime?
  activo          Boolean    @default(true)
}

model NivelUsuario {
  id          String @id @default(cuid())
  xpTotal     Int    @default(0)
  nivelActual Int    @default(1)
  xpSiguiente Int    @default(100)
}

enum CategoriaLogro {
  DEUDA
  AHORRO
  GASTO
  INVERSION
  RACHA
  META
}

enum TipoStreak {
  GASTOS_DIARIOS
  METAS_CONTRIBUCION
}
```

### Sistema de Niveles y XP

| Nivel | Nombre           | XP Requerido |
|-------|------------------|-------------|
| 1     | Principiante     | 0           |
| 2     | Consciente       | 100         |
| 3     | Organizado       | 250         |
| 4     | Planificador     | 500         |
| 5     | Ahorrista        | 900         |
| 6     | Inversor         | 1,400       |
| 7     | Estratega        | 2,000       |
| 8     | Experto          | 2,800       |
| 9     | Maestro          | 3,800       |
| 10    | Élite Financiero | 5,000       |

### Logros Predefinidos (seed)

| Código              | Nombre              | XP  | Trigger                          |
|--------------------|---------------------|-----|----------------------------------|
| PRIMER_GASTO       | Primer Registro     | 10  | 1er gasto registrado             |
| RACHA_7            | Semana Perfecta     | 50  | 7 días seguidos de gastos        |
| RACHA_30           | Mes Disciplinado    | 200 | 30 días seguidos de gastos       |
| META_PRIMERA       | Primer Objetivo     | 30  | 1era meta creada                 |
| META_COMPLETA      | Meta Alcanzada      | 150 | meta al 100% completada          |
| DEUDA_50           | A Mitad del Camino  | 75  | crédito al 50% de pago           |
| DEUDA_PAGADA       | Deuda Libre         | 300 | crédito con saldoActual = 0      |
| AHORRO_10K         | Club de los 10K     | 100 | ahorro acumulado ≥ $10,000 MXN   |
| INVERSION_PRIMERA  | Primer Inversor     | 50  | 1era inversión creada            |
| PRESUPUESTO_OK     | Mes en Verde        | 80  | mes sin superar presupuesto      |
| CREDITO_PRIMERO    | Conoce tu Deuda     | 20  | 1er crédito registrado           |
| GASTO_100          | Centurión           | 60  | 100 gastos registrados           |
| META_3             | Soñador             | 45  | 3 metas activas simultáneas      |
| INVERSION_10K      | Inversor Serio      | 120 | portfolio de inversiones ≥ $10K  |
| SIN_DEUDA          | Libertad Financiera | 500 | todos los créditos en $0         |

### APIs

```
GET  /api/gamificacion/perfil        → { nivel, xpTotal, xpSiguiente, nivelNombre }
GET  /api/gamificacion/logros        → [ { ...logro, desbloqueado, fechaLogro } ]
POST /api/gamificacion/check-logros  → { nuevos: Logro[], xpGanado: number }
GET  /api/gamificacion/streaks       → { gastosDiarios: Streak, metasContribucion: Streak }
POST /api/gamificacion/streaks/check → { actualizado: boolean, nuevaRacha: number }
```

**`check-logros`** evalúa todos los logros no desbloqueados contra datos actuales de DB. Se llama en el dashboard al cargar. Si hay nuevos logros, retorna array para mostrar notificación toast.

**`streaks/check`** se llama automáticamente al crear un `Gasto` (endpoint existente) y al crear una `Contribucion`. Actualiza `rachaActual` y `rachaMayor`.

### Frontend Gamificación

**Nueva página:** `/gamificacion`
**Secciones:**
- Header con avatar nivel, nombre nivel, XP con barra de progreso
- Rachas activas (días consecutivos)
- Grid de logros (desbloqueados en color, bloqueados en gris)
- Toast al desbloquear logro nuevo (badge "nuevo" en localStorage 24h)

---

## Task 26 — Polish UX/Visual

### Loading Skeletons

Componente reutilizable `<Skeleton />` con variantes:
- `card` — para stats cards
- `table-row` — para filas de tablas
- `chart` — para áreas de gráficas
- `text` — para párrafos

Páginas prioritarias: dashboard, /creditos, /metas, /inversiones, /gamificacion

### Empty States

Componente reutilizable `<EmptyState icon message action />`:

| Página | Mensaje | CTA |
|--------|---------|-----|
| /gastos | "Aún no hay gastos registrados" | "Registrar via Telegram" |
| /creditos | "Sin créditos registrados" | "Agregar crédito" |
| /metas | "Sin metas de ahorro" | "Crear primera meta" |
| /inversiones | "Sin inversiones" | "Registrar inversión" |
| /gamificacion | (nunca vacío — se inicializa con seed) | — |
| Insights | "Agrega ingresos y gastos para recibir análisis" | — |

### Micro-interacciones

- Barras de progreso con `transition-width duration-500` (metas + créditos)
- Badge "NUEVO" en logros recién desbloqueados (CSS pulse animation)
- Toast notifications al crear/actualizar/eliminar cualquier entidad
- Hover states consistentes en todas las cards de navegación

---

## Task 27 — Documentación

### Archivos

| Archivo | Descripción |
|---------|-------------|
| `README.md` | Overview, features table (Tasks 1-27), stack, screenshot ASCII, badges |
| `docs/SETUP.md` | Setup completo: DB → .env → seed → ngrok → Telegram webhook |
| `docs/API.md` | Todos los endpoints con método, params, ejemplo curl, response |
| `docs/TELEGRAM.md` | Comandos del bot, ejemplos de uso, setup completo |
| `docs/FEATURES.md` | Index con links a feature docs individuales |

El README incluye una tabla completa de las 27 features implementadas con su status y descripción.

---

## Orden de Implementación

```
Task 21 → Task 22 → Task 23 → Task 24 → Task 25 → Task 26 → Task 27
AI Backend → AI Frontend → Logros → Streak → Niveles → Polish → Docs
```

## Tests Estimados

| Task | Unit | Integration | Total |
|------|------|-------------|-------|
| 21 (AI backend) | 8 | 5 | ~13 |
| 22 (AI frontend) | 10 | 0 | ~10 |
| 23 (Logros) | 15 | 10 | ~25 |
| 24 (Streak) | 10 | 8 | ~18 |
| 25 (Niveles) | 8 | 5 | ~13 |
| 26 (Polish) | 5 | 0 | ~5 |
| 27 (Docs) | 0 | 0 | 0 |
| **Total** | **56** | **28** | **~84** |
