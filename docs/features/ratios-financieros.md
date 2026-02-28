# Ratios Financieros

## Descripción

El módulo de Ratios Financieros calcula métricas clave para evaluar la salud financiera del usuario. Proporciona cuatro indicadores principales basados en estándares de planificación financiera.

## Ratios Calculados

### 1. Ratio Deuda-Ingreso (Debt-to-Income)

**Fórmula:** `(Deuda Total / Ingreso Mensual) × 100`

**Descripción:** Mide qué porcentaje del ingreso mensual representa la deuda total. Es un indicador clave de la capacidad de endeudamiento.

**Niveles:**

| Rango | Nivel | Color | Interpretación |
|-------|-------|-------|----------------|
| < 36% | SALUDABLE | Verde | Nivel óptimo de endeudamiento |
| 36-42% | ACEPTABLE | Amarillo | Nivel manejable, no aumentar más |
| 43-49% | RIESGOSO | Naranja | Nivel alto, considerar reducción |
| ≥ 50% | CRITICO | Rojo | Nivel peligroso, acción urgente |

**Fuente de datos:**
- Deuda total: Suma de `saldoActual` de todos los créditos activos
- Ingreso mensual: Suma de todas las fuentes de ingreso activas (normalizadas a mensual)

**Estándar de la industria:**
- Basado en directrices de préstamos hipotecarios
- Los prestamistas generalmente requieren < 43% para aprobación
- < 36% es considerado saludable por asesores financieros

**Ejemplo:**
```
Deuda total: $10,000
Ingreso mensual: $3,000
Ratio: 333.33%
Nivel: CRITICO
Descripción: "Tu deuda representa 333.33% de tu ingreso mensual. Nivel crítico, prioriza pagar deudas urgentemente."
```

---

### 2. Tasa de Ahorro (Savings Rate)

**Fórmula:** `((Ingreso Mensual - Gasto Mensual) / Ingreso Mensual) × 100`

**Descripción:** Mide qué porcentaje del ingreso se está ahorrando después de gastos. Indica disciplina financiera y capacidad de acumulación.

**Niveles:**

| Rango | Nivel | Color | Interpretación |
|-------|-------|-------|----------------|
| ≥ 20% | EXCELENTE | Verde | Meta óptima alcanzada |
| 10-19% | BUENO | Verde claro | Nivel aceptable, buscar mejorar |
| 5-9% | REGULAR | Amarillo | Nivel bajo, reducir gastos |
| < 5% | BAJO | Rojo | Nivel crítico, acción urgente |

**Fuente de datos:**
- Ingreso mensual: Suma de fuentes activas (normalizadas)
- Gasto mensual: Promedio de gastos de los últimos 3 meses
- Ahorro mensual: Ingreso - Gasto

**Estándar de la industria:**
- La regla 50/30/20 recomienda 20% mínimo para ahorros
- 10-20% es considerado aceptable
- < 5% indica problemas de flujo de efectivo

**Ejemplo:**
```
Ingreso mensual: $5,000
Gasto mensual promedio: $4,000
Ahorro mensual: $1,000
Ratio: 20%
Nivel: EXCELENTE
Descripción: "Ahorras 20.00% de tus ingresos. Nivel excelente, continúa así."
```

---

### 3. Fondo de Emergencia (Emergency Fund)

**Fórmula:** `Ahorro Disponible / Gasto Mensual Promedio`

**Descripción:** Mide cuántos meses de gastos puede cubrir con ahorros actuales. Es crucial para resiliencia financiera ante imprevistos.

**Niveles:**

| Rango | Nivel | Color | Interpretación |
|-------|-------|-------|----------------|
| ≥ 6 meses | ROBUSTO | Verde | Fondo sólido, bien protegido |
| 3-5 meses | ADECUADO | Verde claro | Cumple recomendación mínima |
| 1-2 meses | MINIMO | Amarillo | Insuficiente, aumentar fondo |
| < 1 mes | INSUFICIENTE | Rojo | Peligroso, crear fondo urgente |

**Fuente de datos:**
- Ahorro disponible: Posición neta (Total ingresos manuales - Total gastos)
- Gasto mensual promedio: Promedio últimos 3 meses
- Meses recomendados: 6 (constante)

**Estándar de la industria:**
- Recomendación estándar: 3-6 meses de gastos
- Trabajadores independientes: 6-12 meses
- Empleados estables: mínimo 3 meses

**Ejemplo:**
```
Ahorro disponible: $12,000
Gasto mensual promedio: $3,000
Meses de cobertura: 4
Nivel: ADECUADO
Descripción: "Tu fondo de emergencia cubre 4.0 meses de gastos. Nivel adecuado, cumples la recomendación mínima."
```

---

### 4. Ratio de Liquidez (Liquidity Ratio)

**Fórmula:** `Efectivo Disponible / Gasto Mensual`

**Descripción:** Mide la capacidad inmediata de pago con efectivo disponible del último mes. Indica salud del flujo de caja.

**Niveles:**

| Rango | Nivel | Color | Interpretación |
|-------|-------|-------|----------------|
| ≥ 2.0 | ALTA | Verde | Excelente liquidez |
| 1.0-1.9 | NORMAL | Verde claro | Liquidez saludable |
| 0.5-0.9 | BAJA | Amarillo | Liquidez justa, monitorear |
| < 0.5 | CRITICA | Rojo | Problemas de flujo, acción urgente |

**Fuente de datos:**
- Efectivo disponible: (Ingresos último mes - Gastos último mes)
- Gasto mensual: Total gastos del último mes

**Estándar de la industria:**
- Ideal: cubrir al menos 1 mes de gastos
- 2+ meses indica comodidad financiera
- < 0.5 meses indica problemas de flujo de efectivo

**Ejemplo:**
```
Ingresos último mes: $5,000
Gastos último mes: $4,500
Efectivo disponible: $500
Gasto mensual: $4,500
Ratio: 0.11
Nivel: CRITICA
Descripción: "Liquidez crítica. Solo tienes 0.11 meses de cobertura, es urgente mejorar tu flujo de efectivo."
```

---

## Normalización de Frecuencias

Para calcular ingresos mensuales correctamente, las diferentes frecuencias se normalizan:

```typescript
MENSUAL: monto × 1
QUINCENAL: monto × 2
SEMANAL: monto × 4.33  // Promedio de semanas por mes
```

---

## API Endpoint

### GET /api/ratios

Calcula y devuelve todos los ratios financieros.

**Request:**
```
GET /api/ratios
```

**Response:**
```json
{
  "deudaIngreso": {
    "ratio": 333.33,
    "nivel": "CRITICO",
    "deudaTotal": 10000,
    "ingresoMensual": 3000,
    "descripcion": "Tu deuda representa 333.33% de tu ingreso mensual. Nivel crítico, prioriza pagar deudas urgentemente."
  },
  "tasaAhorro": {
    "ratio": 16.67,
    "nivel": "BUENO",
    "ahorroMensual": 500,
    "ingresoMensual": 3000,
    "gastoMensual": 2500,
    "descripcion": "Ahorras 16.67% de tus ingresos. Buen nivel, intenta llegar al 20%."
  },
  "fondoEmergencia": {
    "mesesCobertura": 2.0,
    "nivel": "MINIMO",
    "ahorroDisponible": 5000,
    "gastoMensualPromedio": 2500,
    "mesesRecomendados": 6,
    "descripcion": "Tu fondo de emergencia cubre 2.0 meses de gastos. Nivel mínimo, se recomiendan 3-6 meses."
  },
  "liquidez": {
    "ratio": 0.2,
    "nivel": "CRITICA",
    "efectivoDisponible": 500,
    "gastoMensual": 2500,
    "descripcion": "Liquidez crítica. Solo tienes 0.2 meses de cobertura, es urgente mejorar tu flujo de efectivo."
  }
}
```

---

## Casos Especiales

### Sin Ingresos

Si no hay fuentes de ingreso activas:
- Debt-to-Income: ratio = 0, nivel = SALUDABLE
- Savings Rate: ratio = 0, nivel = BAJO

### Sin Deudas

Si no hay créditos activos:
- Debt-to-Income: ratio = 0, nivel = SALUDABLE

### Sin Gastos

Si no hay gastos registrados:
- Emergency Fund: meses = 0, nivel = INSUFICIENTE
- Liquidity: ratio = 0, nivel = CRITICA

### Ahorro Negativo

Si los gastos superan los ingresos:
- Savings Rate: ratio negativo, nivel = BAJO
- Descripción indica urgencia de acción

---

## Recomendaciones por Nivel

### Debt-to-Income CRITICO (≥50%)

1. Congelar nuevas deudas inmediatamente
2. Usar método Avalanche o Snowball para pago acelerado
3. Considerar consolidación de deudas
4. Buscar aumentar ingresos urgentemente

### Savings Rate BAJO (<5%)

1. Revisar presupuesto para recortar gastos no esenciales
2. Aplicar regla 50/30/20 (50% necesidades, 30% deseos, 20% ahorros)
3. Automatizar ahorro al recibir ingreso
4. Buscar fuentes adicionales de ingreso

### Emergency Fund INSUFICIENTE (<1 mes)

1. Priorizar creación de fondo antes que pago extra de deudas
2. Meta inicial: 1 mes de gastos
3. Meta a largo plazo: 3-6 meses
4. Mantener en cuenta de fácil acceso

### Liquidity CRITICA (<0.5)

1. Revisar gastos inmediatos para reducir salidas
2. Acelerar cobros pendientes
3. Considerar fuente de ingreso temporal
4. Evitar gastos discrecionales hasta mejorar flujo

---

## Arquitectura

```
src/features/ratios/
├── types.ts                       # Interfaces TypeScript
├── calculators/
│   ├── helpers.ts                 # Funciones auxiliares
│   └── financial-ratios.ts        # Cálculo principal
└── __tests__/
    ├── helpers.test.ts            # Tests unitarios helpers
    ├── financial-ratios.test.ts   # Tests unitarios ratios
    └── api/ratios.test.ts         # Tests integración API
```

---

## Testing

### Cobertura

- 25 unit tests (helpers + calculators)
- 6 integration tests (API)
- Casos especiales: sin datos, valores extremos, múltiples frecuencias

### Ejecutar Tests

```bash
npm test -- ratios
```

---

## Referencias

- **Debt-to-Income:** [Consumer Financial Protection Bureau](https://www.consumerfinance.gov/ask-cfpb/what-is-a-debt-to-income-ratio-why-is-the-43-debt-to-income-ratio-important-en-1791/)
- **Savings Rate:** [50/30/20 Rule by Elizabeth Warren](https://www.investopedia.com/terms/1/50-30-20-rule.asp)
- **Emergency Fund:** [Fidelity Investments Guidelines](https://www.fidelity.com/viewpoints/personal-finance/emergency-savings-fund)
- **Liquidity Ratio:** [Investopedia - Liquidity Ratios](https://www.investopedia.com/terms/l/liquidityratios.asp)

---

## Changelog

### 2026-02-28 - v1.0.0

- Implementación inicial
- 4 ratios financieros principales
- Normalización de frecuencias
- Sistema de niveles y descripciones
- Cobertura completa de tests
- Documentación detallada
