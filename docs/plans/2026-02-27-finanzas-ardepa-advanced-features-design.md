# Finanzas Ardepa - Advanced Features Suite
## Documento de Diseño

**Fecha:** 27 de Febrero, 2026
**Versión:** 1.0
**Estado:** Aprobado
**Timeline:** 8 semanas (production-ready)

---

## 1. Resumen Ejecutivo

### 1.1 Objetivo

Transformar Finanzas Ardepa de una aplicación de registro de gastos básica a un **asistente financiero personal completo** mediante la implementación de 12 funcionalidades avanzadas.

### 1.2 Alcance

- **Production-ready:** Testing robusto (60-70% cobertura), manejo de errores exhaustivo, UI pulida
- **Timeline:** 8 semanas de desarrollo
- **Costo operativo:** ~$20-50/mes (Claude API)

### 1.3 Funcionalidades

1. Categorías y Subcategorías Personalizables
2. Sistema de Presupuestos
3. Alertas Inteligentes y Notificaciones
4. Análisis de Tendencias y Reportes
5. Planificación de Deuda Inteligente
6. Cálculo de Costo Real del Crédito
7. Ratios Financieros Clave
8. Flujo de Caja (Cashflow)
9. Tracking de Activos y Patrimonio Neto
10. Proyección a Largo Plazo
11. Inversiones y Rendimientos
12. IA Smart Insights (Claude API)
13. Gamificación (Logros + Rachas + Niveles)

---

## 2. Arquitectura

### 2.1 Enfoque Arquitectónico: Modular por Feature

**Decisión:** Arquitectura modular donde cada funcionalidad es un módulo independiente.

**Estructura:**

```
src/
├── features/              # Módulos por funcionalidad
│   ├── reportes/
│   ├── alertas/
│   ├── deuda/
│   ├── ratios/
│   ├── cashflow/
│   ├── patrimonio/
│   ├── proyecciones/
│   ├── inversiones/
│   ├── ai-insights/
│   └── gamification/
├── shared/                # Código compartido
│   ├── components/        # UI reutilizable
│   ├── hooks/
│   ├── utils/
│   └── validations/
├── lib/                   # Core services
└── app/                   # Next.js routes
```

**Ventajas:**
- Encapsulación clara
- Fácil de navegar
- Fácil de testear
- Escalable
- Paralelizable (múltiples devs)

### 2.2 Stack Tecnológico

| Capa | Tecnología | Versión | Propósito |
|------|-----------|---------|-----------|
| Framework | Next.js | 16.1.6 | React framework con SSR |
| UI | Tailwind CSS | v4 | Estilos (dark theme) |
| Gráficas | Tremor | latest | Componentes visualización |
| Estado Global | Zustand | latest | UI state |
| Estado Servidor | React Query | latest | Server state + cache |
| Backend | Next.js API Routes | - | REST APIs |
| Database | PostgreSQL | 16 | Base de datos |
| ORM | Prisma | 7.4.1 | Database ORM |
| Validación | Zod | latest | Schemas compartidos |
| IA | Claude API (Anthropic) | latest | Smart Insights |
| Testing | Vitest | latest | Unit tests |
| Testing API | Supertest | latest | Integration tests |
| CI/CD | GitHub Actions | - | Automatización |

---

## 3. Modelos de Datos

### 3.1 Nuevos Modelos Prisma

#### 3.1.1 Categoría Personalizable

```prisma
model Categoria {
  id          String   @id @default(cuid())
  nombre      String
  icono       String   // emoji
  color       String   // hex
  tipo        TipoCategoria
  activa      Boolean  @default(true)
  orden       Int

  // Jerarquía (subcategorías)
  parentId    String?
  parent      Categoria?  @relation("SubCategorias", fields: [parentId], references: [id])
  hijos       Categoria[] @relation("SubCategorias")

  gastos      Gasto[]
  presupuestos Presupuesto[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([nombre, tipo])
  @@index([activa])
}

enum TipoCategoria {
  GASTO
  INGRESO
}
```

**Migración automática:** Script que convierte las 6 categorías enum actuales en registros de BD.

#### 3.1.2 Presupuesto

```prisma
model Presupuesto {
  id           String    @id @default(cuid())
  categoriaId  String
  categoria    Categoria @relation(fields: [categoriaId], references: [id])

  monto        Decimal   @db.Decimal(10, 2)
  periodo      PeriodoPresupuesto

  alertaEn80   Boolean   @default(true)
  alertaEn90   Boolean   @default(true)
  alertaEn100  Boolean   @default(true)

  activo       Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@unique([categoriaId, periodo])
  @@index([activo])
}

enum PeriodoPresupuesto {
  SEMANAL
  QUINCENAL
  MENSUAL
}
```

#### 3.1.3 Notificación

```prisma
model Notificacion {
  id          String   @id @default(cuid())
  tipo        TipoNotificacion
  titulo      String
  mensaje     String   @db.Text
  prioridad   Prioridad @default(NORMAL)

  metadata    Json?    // Flexible metadata

  leida       Boolean  @default(false)
  archivar    Boolean  @default(false)

  createdAt   DateTime @default(now())

  @@index([leida, createdAt])
  @@index([tipo])
}

enum TipoNotificacion {
  PRESUPUESTO_80
  PRESUPUESTO_90
  PRESUPUESTO_100
  CREDITO_PROXIMO
  CREDITO_VENCIDO
  AHORRO_BAJO
  AHORRO_META
  GASTO_INUSUAL
  LOGRO_DESBLOQUEADO
  INSIGHT_IA
}

enum Prioridad {
  BAJA
  NORMAL
  ALTA
  URGENTE
}
```

#### 3.1.4 Activo (Patrimonio)

```prisma
model Activo {
  id          String      @id @default(cuid())
  nombre      String
  tipo        TipoActivo

  valorActual Decimal     @db.Decimal(12, 2)
  moneda      String      @default("MXN")

  metadata    Json?

  activo      Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  valuaciones ValuacionActivo[]

  @@index([tipo, activo])
}

enum TipoActivo {
  EFECTIVO
  INVERSION
  BIEN_RAIZ
  VEHICULO
  OTRO
}

model ValuacionActivo {
  id          String   @id @default(cuid())
  activoId    String
  activo      Activo   @relation(fields: [activoId], references: [id], onDelete: Cascade)

  valor       Decimal  @db.Decimal(12, 2)
  fecha       DateTime @default(now())
  notas       String?

  @@index([activoId, fecha])
}
```

#### 3.1.5 Inversión

```prisma
model Inversion {
  id              String   @id @default(cuid())
  nombre          String
  tipo            TipoInversion

  montoInvertido  Decimal  @db.Decimal(12, 2)
  valorActual     Decimal  @db.Decimal(12, 2)

  rendimientoAnual Decimal? @db.Decimal(5, 2)

  fechaInicio     DateTime
  fechaVencimiento DateTime?

  ticker          String?
  metadata        Json?

  activa          Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([tipo, activa])
}

enum TipoInversion {
  CETES
  ACCIONES
  ETF
  FONDO_INVERSION
  CRIPTO
  OTRO
}
```

#### 3.1.6 Gamificación

```prisma
model Logro {
  id          String   @id @default(cuid())
  codigo      String   @unique
  nombre      String
  descripcion String
  icono       String
  categoria   CategoriaLogro

  desbloqueado Boolean  @default(false)
  fechaDesbloqueo DateTime?

  criterios   Json

  createdAt   DateTime @default(now())

  @@index([desbloqueado])
}

enum CategoriaLogro {
  AHORRO
  PRESUPUESTO
  DEUDA
  DISCIPLINA
  HITO
}

model Racha {
  id          String   @id @default(cuid())
  tipo        TipoRacha
  nombre      String

  diasActual  Int      @default(0)
  maxDias     Int      @default(0)

  ultimaFecha DateTime @default(now())
  activa      Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([tipo])
}

enum TipoRacha {
  SIN_GASTOS_HORMIGA
  CUMPLIR_PRESUPUESTO
  AHORRO_CONSISTENTE
  REGISTRO_DIARIO
}

model NivelUsuario {
  id              String   @id @default(cuid())
  nivel           Int      @default(1)
  puntosActuales  Int      @default(0)
  puntosProximoNivel Int   @default(100)

  updatedAt       DateTime @updatedAt

  @@unique([id])
}
```

#### 3.1.7 Meta de Ahorro

```prisma
model MetaAhorro {
  id              String   @id @default(cuid())
  nombre          String
  descripcion     String?

  montoObjetivo   Decimal  @db.Decimal(10, 2)
  montoActual     Decimal  @db.Decimal(10, 2) @default(0)

  fechaInicio     DateTime @default(now())
  fechaLimite     DateTime

  prioridad       Int      @default(1)
  completada      Boolean  @default(false)

  aportes         AporteMeta[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([completada, prioridad])
}

model AporteMeta {
  id          String     @id @default(cuid())
  metaId      String
  meta        MetaAhorro @relation(fields: [metaId], references: [id], onDelete: Cascade)

  monto       Decimal    @db.Decimal(10, 2)
  fecha       DateTime   @default(now())
  notas       String?

  @@index([metaId, fecha])
}
```

#### 3.1.8 Insight IA

```prisma
model InsightIA {
  id          String   @id @default(cuid())
  tipo        TipoInsight
  titulo      String
  contenido   String   @db.Text

  periodo     Json
  metricas    Json?

  sugerencias String[]

  visto       Boolean  @default(false)
  util        Boolean?

  createdAt   DateTime @default(now())

  @@index([createdAt, visto])
}

enum TipoInsight {
  PATRON_GASTO
  OPORTUNIDAD_AHORRO
  ALERTA_TENDENCIA
  RECOMENDACION
  HITO
}
```

#### 3.1.9 Pago de Crédito

```prisma
model PagoCredito {
  id          String   @id @default(cuid())
  creditoId   String
  credito     Credito  @relation(fields: [creditoId], references: [id], onDelete: Cascade)

  monto       Decimal  @db.Decimal(10, 2)
  capital     Decimal  @db.Decimal(10, 2)
  interes     Decimal  @db.Decimal(10, 2)

  fecha       DateTime @default(now())
  notas       String?

  @@index([creditoId, fecha])
}
```

### 3.2 Modificaciones a Modelos Existentes

#### Gasto
- ❌ ELIMINAR: `categoria CategoriaGasto` (enum)
- ✅ AGREGAR: `categoriaId String` + relación `categoria Categoria`

#### Credito
- ✅ AGREGAR: `interesesPagados Decimal @default(0)`
- ✅ AGREGAR: `pagos PagoCredito[]` (relación)

---

## 4. Arquitectura de Features

### 4.1 Feature: Reportes

**Path:** `src/features/reportes/`

**Componentes:**
- `ReportSelector.tsx` - Selector tipo reporte
- `ReporteGastos.tsx` - Gráfica líneal + comparativa
- `ReporteIngresos.tsx` - Ingresos vs Gastos
- `ReporteDeuda.tsx` - Evolución deuda
- `ReporteCashflow.tsx` - Waterfall chart
- `DateRangePicker.tsx` - Selector rango fechas
- `ExportButton.tsx` - Export PDF/Excel

**Services:**
- `report-generator.ts` - Genera estructura reporte
- `trend-analyzer.ts` - Detecta tendencias
- `comparator.ts` - Compara períodos
- `exporters/pdf-exporter.ts` - Genera PDF (jsPDF)
- `exporters/excel-exporter.ts` - Genera Excel (xlsx)

**API Routes:**
- `GET /api/reportes/gastos?inicio=...&fin=...`
- `GET /api/reportes/ingresos`
- `GET /api/reportes/deuda`
- `GET /api/reportes/cashflow`
- `POST /api/reportes/export/pdf`
- `POST /api/reportes/export/excel`

### 4.2 Feature: Alertas

**Path:** `src/features/alertas/`

**Componentes:**
- `NotificationBell.tsx` - Icono con badge
- `NotificationPanel.tsx` - Dropdown lista
- `NotificationItem.tsx` - Card individual
- `AlertSettings.tsx` - Configuración

**Engine:**
- `alert-rules.ts` - Reglas maestras
- `presupuesto-alerts.ts` - Lógica presupuesto
- `credito-alerts.ts` - Lógica crédito
- `ahorro-alerts.ts` - Lógica ahorro
- `gasto-alerts.ts` - Detecta inusuales

**API Routes:**
- `GET /api/alertas` - Lista notificaciones
- `PUT /api/alertas/:id` - Marcar leída
- `POST /api/cron/check-alerts` - Job diario

**Cron Job:** Ejecuta cada día a las 8am via Vercel Cron o curl manual.

### 4.3 Feature: Planificación Deuda

**Path:** `src/features/deuda/`

**Componentes:**
- `DebtStrategySelector.tsx` - Snowball vs Avalanche
- `DebtSimulator.tsx` - Comparador
- `PaymentTimeline.tsx` - Timeline pagos
- `InterestCalculator.tsx` - Calculadora CAT

**Calculators:**
- `snowball.ts` - Algoritmo bola de nieve
- `avalanche.ts` - Algoritmo avalancha
- `debt-projector.ts` - Proyección N meses
- `interest-calculator.ts` - CAT, interés total

**API Routes:**
- `POST /api/deuda/estrategia` - Calcula estrategia
- `POST /api/deuda/simulacion` - Simula escenarios

### 4.4 Feature: Ratios Financieros

**Path:** `src/features/ratios/`

**Componentes:**
- `RatiosCard.tsx` - Card con todos los ratios
- `RatioGauge.tsx` - Gauge individual (Tremor ProgressCircle)

**Calculators:**
- `debt-ratio.ts` - Deuda / Ingreso
- `savings-rate.ts` - Ahorro / Ingreso
- `emergency-fund.ts` - Ahorros / Gastos
- `expense-coverage.ts` - Gastos fijos / Ingreso

**API Routes:**
- `GET /api/ratios` - Todos los ratios

### 4.5 Feature: Cashflow

**Path:** `src/features/cashflow/`

**Componentes:**
- `CashflowChart.tsx` - Waterfall chart (Tremor)
- `CashflowTable.tsx` - Tabla detalle
- `CashflowPeriodSelector.tsx` - Mensual/Trimestral

**Calculators:**
- `cashflow-builder.ts` - Construye datos
- `cashflow-analyzer.ts` - Detecta problemas

**API Routes:**
- `GET /api/cashflow?periodo=mensual`

### 4.6 Feature: Patrimonio

**Path:** `src/features/patrimonio/`

**Componentes:**
- `PatrimonioSummary.tsx` - Resumen activos - pasivos
- `ActivosList.tsx` - CRUD activos
- `ActivoForm.tsx` - Formulario
- `PatrimonioChart.tsx` - Evolución tiempo
- `AssetDistribution.tsx` - Pie chart por tipo

**API Routes:**
- `GET/POST /api/patrimonio/activos`
- `GET/PUT/DELETE /api/patrimonio/activos/:id`
- `POST /api/patrimonio/valuaciones`
- `GET /api/patrimonio/neto`

### 4.7 Feature: Proyecciones

**Path:** `src/features/proyecciones/`

**Componentes:**
- `ProjectionChart.tsx` - Gráfica 12/24/36 meses
- `ProjectionScenarios.tsx` - Optimista/Realista/Pesimista
- `ProjectionInputs.tsx` - Inputs simulación

**Calculators:**
- `long-term-projector.ts` - Proyección N meses
- `scenario-builder.ts` - Construye escenarios
- `inflation-adjuster.ts` - Ajusta inflación

**API Routes:**
- `POST /api/proyecciones` - Genera proyección

### 4.8 Feature: Inversiones

**Path:** `src/features/inversiones/`

**Componentes:**
- `InversionesList.tsx` - CRUD
- `InversionForm.tsx`
- `ROICalculator.tsx`
- `PortfolioChart.tsx`

**Calculators:**
- `roi-calculator.ts` - ROI, IRR
- `portfolio-analyzer.ts` - Diversificación

**API Routes:**
- `GET/POST /api/inversiones`
- `GET/PUT/DELETE /api/inversiones/:id`
- `GET /api/inversiones/metricas`

### 4.9 Feature: AI Insights

**Path:** `src/features/ai-insights/`

**Componentes:**
- `InsightCard.tsx` - Card individual
- `InsightsList.tsx` - Feed
- `InsightGenerator.tsx` - Botón generar
- `InsightFeedback.tsx` - 👍👎

**Services:**
- `claude-client.ts` - Wrapper @anthropic-ai/sdk
- `prompt-builder.ts` - Construye prompts
- `insight-analyzer.ts` - Analiza respuesta
- `insight-cache.ts` - Cache resultados

**Prompts:**
- `gasto-patterns.txt` - Template patrones
- `ahorro-opportunities.txt` - Template oportunidades
- `debt-strategy.txt` - Template estrategia

**API Routes:**
- `POST /api/ai-insights/generate` - Genera insight
- `GET /api/ai-insights` - Lista insights
- `PUT /api/ai-insights/:id/feedback` - Feedback

**Configuración:**
```typescript
// .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

### 4.10 Feature: Gamificación

**Path:** `src/features/gamification/`

**Componentes:**
- `LogrosPanel.tsx` - Grid logros
- `LogroCard.tsx` - Card individual
- `RachasWidget.tsx` - Widget rachas
- `NivelBar.tsx` - Barra nivel
- `LogroNotification.tsx` - Toast

**Engine:**
- `achievement-checker.ts` - Verifica criterios
- `level-system.ts` - Calcula nivel
- `streak-tracker.ts` - Actualiza rachas
- `points-calculator.ts` - Calcula puntos

**Achievements:**
- `ahorro-achievements.ts` - Definición logros ahorro
- `presupuesto-achievements.ts`
- `deuda-achievements.ts`

**API Routes:**
- `GET /api/gamification/logros`
- `POST /api/gamification/logros/check`
- `GET /api/gamification/rachas`
- `GET /api/gamification/nivel`
- `POST /api/gamification/puntos`

**Sistema de puntos:**
```typescript
REGISTRAR_GASTO: 5
CUMPLIR_PRESUPUESTO_MES: 100
PAGAR_CREDITO_COMPLETO: 200
ALCANZAR_META_AHORRO: 150
RACHA_7_DIAS: 50
RACHA_30_DIAS: 200
```

---

## 5. Flujo de Datos

### 5.1 Estado Global (Zustand)

```typescript
interface Store {
  nivel: NivelUsuario | null
  notificacionesNoLeidas: number
  sidebarOpen: boolean

  setNivel: (nivel: NivelUsuario) => void
  setNotificacionesNoLeidas: (count: number) => void
  toggleSidebar: () => void
}
```

### 5.2 Estado Servidor (React Query)

**Configuración:**
```typescript
{
  staleTime: 5 * 60 * 1000,     // 5 min
  cacheTime: 10 * 60 * 1000,    // 10 min
  refetchOnWindowFocus: false,
  retry: 1,
}
```

**Invalidación estratégica:** Al crear/editar/eliminar, invalidar queries relacionadas.

### 5.3 Flujo: Registro de Gasto

```
1. Usuario registra gasto
2. Frontend: useCreateGasto.mutate()
3. API: POST /api/gastos
4. DB: prisma.gasto.create()
5. Response: { ok: true }
6. Frontend onSuccess:
   - Invalidar cache 'gastos'
   - Invalidar cache 'reportes'
   - Invalidar cache 'ratios'
   - Invalidar cache 'presupuesto-status'
7. Background: POST /api/alertas/check-presupuesto
8. Si >80%: crear notificación
9. Background: POST /api/gamification/puntos (+5)
10. React Query revalida automáticamente
```

### 5.4 Jobs Programados

**Opción A: Vercel Cron**
```json
{
  "crons": [
    {
      "path": "/api/cron/check-alerts",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/update-rachas",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Opción B: Crontab manual**
```bash
0 8 * * * curl http://localhost:3000/api/cron/check-alerts \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

---

## 6. Manejo de Errores

### 6.1 Frontend: Sistema Toast

```typescript
useToast().add({
  type: 'success' | 'error' | 'warning' | 'info',
  title: string,
  message: string,
  duration?: number
})
```

### 6.2 Backend: APIError

```typescript
class APIError extends Error {
  code: string
  message: string
  statusCode: number
}

// Wrapper
export function withErrorHandling(handler) {
  return async (req, context) => {
    try {
      return await handler(req, context)
    } catch (error) {
      if (error instanceof APIError) {
        return Response.json({ ok: false, error }, { status: error.statusCode })
      }
      return Response.json({ ok: false, error: 'INTERNAL_ERROR' }, { status: 500 })
    }
  }
}
```

### 6.3 Validación con Zod

Schemas compartidos entre frontend y backend:

```typescript
export const gastoSchema = z.object({
  descripcion: z.string().min(1).max(200),
  monto: z.number().positive(),
  categoriaId: z.string().cuid(),
  fecha: z.string().datetime(),
})
```

---

## 7. Testing

### 7.1 Estrategia

**Objetivo:** 60-70% cobertura total

| Capa | Cobertura | Prioridad |
|------|-----------|-----------|
| Calculadoras financieras | 90%+ | 🔴 Alta |
| Algoritmos | 90%+ | 🔴 Alta |
| Prompt builders | 80%+ | 🔴 Alta |
| API Routes | 70%+ | 🟡 Media |
| Validaciones | 80%+ | 🟡 Media |
| Hooks | 50%+ | 🟢 Baja |
| Componentes UI | 30%+ | 🟢 Baja |

### 7.2 Unit Tests (Vitest)

```typescript
// Ejemplo: ratios/__tests__/debt-ratio.test.ts
describe('calculateDebtRatio', () => {
  it('calcula ratio correctamente', () => {
    expect(calculateDebtRatio(5000, 20000)).toBe(25)
  })

  it('retorna status correcto', () => {
    expect(calculateDebtRatio(2000, 10000).status).toBe('SALUDABLE')
  })
})
```

### 7.3 Integration Tests (Supertest)

```typescript
// Ejemplo: __tests__/api/gastos.test.ts
describe('POST /api/gastos', () => {
  it('crea gasto correctamente', async () => {
    const response = await request(baseURL)
      .post('/api/gastos')
      .send({ descripcion: 'Test', monto: 100, ... })
      .expect(200)

    expect(response.body.ok).toBe(true)
  })
})
```

### 7.4 CI/CD

GitHub Actions ejecuta tests en cada push/PR:

```yaml
- name: Run tests
  run: npm run test:coverage
- name: Upload coverage
  uses: codecov/codecov-action@v3
```

---

## 8. Timeline (8 semanas)

### Fase 1: Fundamentos (Semanas 1-3)

**Semana 1:**
- Setup proyecto
- Migración categorías
- Presupuestos CRUD
- Motor alertas core

**Semana 2:**
- Sistema notificaciones UI
- Reportes básicos
- Export PDF básico

**Semana 3:**
- Planificación deuda
- Cálculo intereses
- Ratios financieros

### Fase 2: Análisis Avanzado (Semanas 4-5)

**Semana 4:**
- Reportes avanzados (tendencias)
- Cashflow waterfall
- Export Excel

**Semana 5:**
- Patrimonio (activos)
- Proyección largo plazo
- Escenarios

### Fase 3: Features Premium (Semanas 6-8)

**Semana 6:**
- Inversiones
- Metas de ahorro

**Semana 7:**
- Claude API integration
- Insight generator

**Semana 8:**
- Gamificación completa
- Polish general
- Testing final

---

## 9. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Claude API rate limits | Media | Alto | Cache agresivo + retry logic |
| Complejidad UI | Baja | Medio | Usar Tremor (pre-built) |
| Performance BD | Baja | Medio | Indexes + query optimization |
| Scope creep | Alta | Alto | Seguir diseño estrictamente |
| Testing toma más tiempo | Media | Medio | Priorizar tests críticos |

---

## 10. Costos Operativos

| Item | Costo | Frecuencia |
|------|-------|------------|
| Claude API | $20-50 | Mensual |
| Tremor | Gratis | - |
| Hosting VPS | Existente | - |
| PostgreSQL | Local | - |
| **Total** | **$20-50** | **Mensual** |

---

## 11. Entregables

Al finalizar las 8 semanas:

✅ 12 funcionalidades production-ready
✅ +10 nuevos modelos de datos
✅ 60-70% cobertura de tests
✅ Sistema de alertas (8 tipos)
✅ Reportes exportables (PDF + Excel)
✅ Integración Claude API
✅ Gamificación completa
✅ UI pulida con Tremor
✅ Documentación técnica
✅ CI/CD configurado

---

## 12. Comparativa: Antes vs Después

| Aspecto | Antes | Después |
|---------|-------|---------|
| Funcionalidad | Registro básico | Asistente completo |
| Categorías | 6 fijas | Ilimitadas personalizables |
| Análisis | Pie chart simple | 4 reportes + tendencias |
| Alertas | 0 | 8 tipos inteligentes |
| Deuda | Tracking básico | Estrategias optimizadas |
| Insights | Manual | IA (Claude) |
| Motivación | Ninguna | Gamificación completa |
| Proyección | 3 cobros | 12-36 meses |
| Patrimonio | Solo deudas | Activos + neto |
| Exportación | 0 | PDF + Excel |

---

## Apéndices

### A. Comandos de Desarrollo

```bash
# Desarrollo
npm run dev

# Testing
npm test
npm run test:watch
npm run test:coverage

# Build
npm run build

# Prisma
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

### B. Variables de Entorno

```env
# Database
DATABASE_URL="postgresql://..."

# Telegram (opcional)
TELEGRAM_BOT_TOKEN="..."
TELEGRAM_ALLOWED_CHAT_ID="..."

# Claude API
ANTHROPIC_API_KEY="sk-ant-..."

# Cron jobs (opcional)
CRON_SECRET="..."
```

### C. Referencias

- Tremor Docs: https://tremor.so
- Claude API: https://docs.anthropic.com
- Prisma 7: https://prisma.io/docs
- React Query: https://tanstack.com/query
- Zod: https://zod.dev

---

**Documento aprobado:** 27 de Febrero, 2026
**Próximo paso:** Plan de implementación detallado
