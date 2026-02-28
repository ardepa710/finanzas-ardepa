# Proyección Largo Plazo (1-5 años)

## Descripción

La funcionalidad de Proyección Largo Plazo permite visualizar la evolución financiera proyectada entre 1 y 5 años, incluyendo:

- **Ingresos anuales** (con normalización de frecuencias)
- **Gastos anuales** (basados en promedio de últimos 90 días)
- **Pagos de deuda** anuales
- **Ahorros proyectados** año por año
- **Crecimiento del patrimonio neto**
- **Proyección de reducción de deuda**

## Endpoint API

### GET `/api/proyeccion/largo-plazo`

Obtiene la proyección financiera a largo plazo.

#### Parámetros de Query

| Parámetro | Tipo | Requerido | Defecto | Descripción |
|-----------|------|-----------|---------|-------------|
| `años` | number | No | 5 | Número de años a proyectar (1-5) |
| `balanceInicial` | number | No | 0 | Balance inicial (puede ser negativo) |

#### Ejemplo de Request

```bash
# Proyección por defecto (5 años)
GET /api/proyeccion/largo-plazo

# Proyección personalizada (3 años con balance inicial)
GET /api/proyeccion/largo-plazo?años=3&balanceInicial=10000
```

#### Respuesta Exitosa (200)

```json
{
  "ok": true,
  "data": {
    "proyeccion": {
      "añoInicial": 2026,
      "proyecciones": [
        {
          "año": 2026,
          "ingresosAnuales": 60000,
          "gastosAnuales": 24000,
          "pagoDeudaAnual": 7200,
          "ahorroAnual": 28800,
          "balanceAcumulado": 28800,
          "patrimonioNeto": 68800,
          "deudaRestante": 4800
        },
        {
          "año": 2027,
          "ingresosAnuales": 60000,
          "gastosAnuales": 24000,
          "pagoDeudaAnual": 4800,
          "ahorroAnual": 31200,
          "balanceAcumulado": 60000,
          "patrimonioNeto": 100000,
          "deudaRestante": 0
        }
        // ... hasta 5 años
      ],
      "resumen": {
        "patrimonioNetoInicial": 40000,
        "patrimonioNetoFinal": 268000,
        "crecimientoTotal": 228000,
        "crecimientoAnualPromedio": 45600,
        "totalAhorrado": 228000,
        "deudaEliminada": 12000
      }
    }
  }
}
```

#### Respuesta de Error (400)

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Number must be greater than or equal to 1"
  }
}
```

## Metodología de Cálculo

### 1. Patrimonio Neto Inicial

Se calcula sumando:
- Total de activos activos (valorActual)
- Menos total de pasivos activos (saldoActual)
- Más/menos balance inicial proporcionado

```typescript
patrimonioNetoInicial = totalActivos - totalPasivos + balanceInicial
```

### 2. Ingresos Anuales

Se normalizan todos los ingresos activos a frecuencia anual:

- **MENSUAL**: `monto × 12`
- **QUINCENAL**: `monto × 24` (2 por mes)
- **SEMANAL**: `monto × 51.96` (4.33 semanas/mes × 12)

```typescript
ingresosAnuales = sum(
  fuentes.map(f => normalizeToMonthly(f.monto, f.frecuencia) * 12)
)
```

### 3. Gastos Anuales

Se usa el promedio de gastos de los últimos 90 días, extrapolado a 365 días:

```typescript
gastoDiarioPromedio = totalGastos90Dias / 90
gastosAnuales = gastoDiarioPromedio × 365
```

**Nota**: Se usa 90 días en lugar de 30 para mayor estabilidad y representatividad.

### 4. Pago de Deuda Anual

Suma de todos los pagos mensuales de créditos activos, multiplicado por 12:

```typescript
pagoDeudaAnual = sum(creditos.map(c => c.pagoMensual)) × 12
```

**Importante**: Cuando la deuda se paga completamente, el pago de deuda para los años subsiguientes es 0.

### 5. Ahorro Anual

```typescript
ahorroAnual = ingresosAnuales - gastosAnuales - pagoDeudaAnual
```

**Nota**: Puede ser negativo si los gastos exceden los ingresos.

### 6. Balance Acumulado

Es el total acumulado de ahorros año tras año:

```typescript
balanceAcumulado[año] = balanceAcumulado[añoAnterior] + ahorroAnual
```

### 7. Patrimonio Neto Proyectado

```typescript
patrimonioNeto = patrimonioNetoInicial + balanceAcumulado
```

### 8. Deuda Restante

La deuda se reduce año tras año:

```typescript
deudaRestante = max(0, deudaRestanteAñoAnterior - pagoDeudaAnualInicial)
```

**Importante**: Cuando `deudaRestante` llega a 0, los pagos de deuda se liberan y se convierten en ahorros adicionales.

## Casos de Uso

### 1. Planificación de Jubilación

Ver cuánto patrimonio se habrá acumulado en 5 años:

```bash
GET /api/proyeccion/largo-plazo?años=5
```

### 2. Fecha de Libertad Financiera (Deuda Cero)

Determinar en qué año se pagará toda la deuda:

```bash
GET /api/proyeccion/largo-plazo?años=5
# Revisar el campo deudaRestante de cada año
```

### 3. Impacto de Ahorro Inicial

Ver cómo un ahorro/deuda inicial afecta el patrimonio futuro:

```bash
# Con ahorro inicial de $10,000
GET /api/proyeccion/largo-plazo?años=3&balanceInicial=10000

# Con deuda inicial de $5,000
GET /api/proyeccion/largo-plazo?años=3&balanceInicial=-5000
```

### 4. Meta de Patrimonio

Calcular cuántos años se necesitan para llegar a una meta:

```bash
# Probar con diferentes valores de años hasta encontrar el objetivo
GET /api/proyeccion/largo-plazo?años=3
GET /api/proyeccion/largo-plazo?años=4
GET /api/proyeccion/largo-plazo?años=5
```

## Assumptions & Limitaciones

### Assumptions

1. **Ingresos constantes**: Se asume que las fuentes de ingreso se mantienen constantes en monto y frecuencia
2. **Gastos estables**: El promedio de 90 días se usa como predictor de gastos futuros
3. **Pagos de deuda fijos**: Los pagos mensuales de deuda no cambian (no considera cambios en tasas de interés)
4. **Valor de activos constante**: No se proyecta apreciación/depreciación de activos
5. **Sin inflación**: Los cálculos no ajustan por inflación

### Limitaciones

- **No considera eventos extraordinarios**: Bonos, gastos médicos inesperados, etc.
- **No modela retorno de inversión**: Los ahorros no generan intereses
- **Sin cambios en ingresos**: No proyecta aumentos salariales
- **Deuda simplificada**: No considera interés compuesto, solo reduce saldo por pago
- **Sin impuestos**: No considera impacto fiscal

## Mejoras Futuras

### Prioridad Alta

- [ ] **Ajuste por inflación**: Aplicar tasa de inflación anual a gastos e ingresos
- [ ] **Retorno de inversión**: Proyectar rendimiento sobre ahorros (ej. 5% anual)
- [ ] **Interés compuesto en deuda**: Modelar crecimiento real de deuda con interés

### Prioridad Media

- [ ] **Eventos extraordinarios**: Permitir agregar ingresos/gastos únicos en años específicos
- [ ] **Crecimiento de ingresos**: Proyectar aumentos salariales anuales (ej. 3% anual)
- [ ] **Apreciación de activos**: Proyectar cambios en valor de inmuebles, inversiones
- [ ] **Escenarios múltiples**: Optimista, pesimista, realista

### Prioridad Baja

- [ ] **Análisis de sensibilidad**: Mostrar impacto de variaciones en parámetros
- [ ] **Gráficos interactivos**: Visualización de proyecciones
- [ ] **Exportar a PDF/Excel**: Generar reportes descargables
- [ ] **Comparación con metas**: Alertar si no se alcanzarán objetivos financieros

## Ejemplos de Respuesta

### Ejemplo 1: Sin Deuda, Solo Ahorro

```json
{
  "añoInicial": 2026,
  "proyecciones": [
    {
      "año": 2026,
      "ingresosAnuales": 60000,
      "gastosAnuales": 20000,
      "pagoDeudaAnual": 0,
      "ahorroAnual": 40000,
      "balanceAcumulado": 40000,
      "patrimonioNeto": 40000,
      "deudaRestante": 0
    }
  ],
  "resumen": {
    "patrimonioNetoInicial": 0,
    "patrimonioNetoFinal": 200000,
    "crecimientoTotal": 200000,
    "crecimientoAnualPromedio": 40000,
    "totalAhorrado": 200000,
    "deudaEliminada": 0
  }
}
```

### Ejemplo 2: Con Deuda que se Paga en Año 2

```json
{
  "añoInicial": 2026,
  "proyecciones": [
    {
      "año": 2026,
      "ingresosAnuales": 60000,
      "gastosAnuales": 24000,
      "pagoDeudaAnual": 12000,
      "ahorroAnual": 24000,
      "balanceAcumulado": 24000,
      "patrimonioNeto": 14000,
      "deudaRestante": 3000
    },
    {
      "año": 2027,
      "ingresosAnuales": 60000,
      "gastosAnuales": 24000,
      "pagoDeudaAnual": 3000,
      "ahorroAnual": 33000,
      "balanceAcumulado": 57000,
      "patrimonioNeto": 57000,
      "deudaRestante": 0
    },
    {
      "año": 2028,
      "ingresosAnuales": 60000,
      "gastosAnuales": 24000,
      "pagoDeudaAnual": 0,
      "ahorroAnual": 36000,
      "balanceAcumulado": 93000,
      "patrimonioNeto": 93000,
      "deudaRestante": 0
    }
  ],
  "resumen": {
    "patrimonioNetoInicial": -10000,
    "patrimonioNetoFinal": 93000,
    "crecimientoTotal": 103000,
    "crecimientoAnualPromedio": 34333,
    "totalAhorrado": 93000,
    "deudaEliminada": 15000
  }
}
```

## Notas Técnicas

### Normalización de Frecuencias

La función `normalizeToMonthly()` de `/src/features/ratios/calculators/helpers.ts` maneja la conversión:

```typescript
function normalizeToMonthly(monto: number, frecuencia: FrecuenciaPago): number {
  switch (frecuencia) {
    case 'MENSUAL': return monto
    case 'QUINCENAL': return monto * 2
    case 'SEMANAL': return monto * 4.33  // Promedio de semanas por mes
  }
}
```

Para anualizar: `normalizeToMonthly(monto, frecuencia) * 12`

### Promedio de Gastos

Se usa una ventana deslizante de 90 días:

```typescript
const hoy = new Date()
const hace90Dias = new Date(hoy)
hace90Dias.setDate(hoy.getDate() - 90)

const gastos = await prisma.gasto.findMany({
  where: { fecha: { gte: hace90Dias, lte: hoy } }
})

const promedioDiario = totalGastos / 90
const gastosAnuales = promedioDiario * 365
```

### Pago de Deuda Cero

Cuando `deudaRestante` llega a 0, el `pagoDeudaAnual` de años subsiguientes se vuelve 0, aumentando el `ahorroAnual`:

```typescript
const pagoDeudaAnual = deudaRestante > 0 ? pagoDeudaAnualInicial : 0
```

## Validación

### Validación de Entrada

```typescript
const proyeccionLargoPlazoQuerySchema = z.object({
  años: z.coerce.number().int().min(1).max(5).default(5),
  balanceInicial: z.coerce.number().default(0)
})
```

### Errores de Validación

- **años < 1**: "Number must be greater than or equal to 1"
- **años > 5**: "Number must be less than or equal to 5"
- **balanceInicial no numérico**: "Expected number, received string"

## Referencias

- [Documentación de Cashflow Projection](./cashflow-projection.md) - Proyección a corto plazo (1-12 meses)
- [Documentación de Patrimonio Neto](./patrimonio-neto.md) - Cálculo del net worth actual
- [Código fuente del calculador](/src/features/proyeccion/calculators/long-term-projection.ts)
