# Patrimonio/Assets Tracking

Sistema de seguimiento de activos (bienes y propiedades) para calcular el patrimonio neto.

## Conceptos

### Tipos de Activos (TipoActivo)

- **INMUEBLE**: Bienes raíces (casas, apartamentos, terrenos)
- **VEHICULO**: Vehículos (carros, motos, etc.)
- **INVERSION**: Inversiones (acciones, bonos, criptomonedas)
- **AHORRO**: Cuentas de ahorro, CDTs
- **EFECTIVO**: Efectivo en mano
- **OTRO**: Otros activos

### Niveles de Liquidez (Liquidez)

La liquidez indica qué tan rápido se puede convertir un activo en efectivo:

- **ALTA**: Se puede vender/convertir rápidamente (< 1 semana)
  - Ejemplo: Efectivo, acciones, cuentas de ahorro
- **MEDIA**: Toma algo de tiempo (1-3 meses)
  - Ejemplo: Vehículos
- **BAJA**: Difícil de liquidar (3+ meses)
  - Ejemplo: Bienes raíces

## Modelos

### Activo

Representa un bien o propiedad que se posee.

```typescript
{
  id: string                    // ID único
  nombre: string                // Nombre descriptivo
  tipo: TipoActivo              // Tipo de activo
  valorActual: Decimal          // Valor actual del activo
  valorCompra?: Decimal         // Precio original de compra
  fechaAdquisicion?: DateTime   // Fecha de adquisición
  descripcion?: string          // Descripción adicional
  liquidez: Liquidez            // Nivel de liquidez (default: MEDIA)
  activo: boolean               // Si está activo (default: true)
  createdAt: DateTime
  updatedAt: DateTime
  historico: ValoracionActivo[] // Historial de valoraciones
}
```

### ValoracionActivo

Registro histórico de valoraciones del activo a lo largo del tiempo.

```typescript
{
  id: string          // ID único
  activoId: string    // ID del activo
  valor: Decimal      // Valor en esta valoración
  fecha: DateTime     // Fecha de la valoración
  notas?: string      // Notas adicionales
  createdAt: DateTime
}
```

## API Endpoints

### GET /api/activos

Lista todos los activos.

**Query Parameters:**
- `activo` (optional): "true" para filtrar solo activos activos

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "clx123...",
      "nombre": "Casa Principal",
      "tipo": "INMUEBLE",
      "valorActual": "150000.00",
      "valorCompra": "120000.00",
      "fechaAdquisicion": "2020-01-15T00:00:00.000Z",
      "liquidez": "BAJA",
      "activo": true,
      "historico": [
        {
          "id": "clx456...",
          "valor": "150000.00",
          "fecha": "2026-01-15T00:00:00.000Z",
          "notas": "Valuación actual"
        },
        // ... últimas 5 valoraciones
      ]
    }
  ]
}
```

### POST /api/activos

Crea un nuevo activo.

**Body:**
```json
{
  "nombre": "Casa Principal",
  "tipo": "INMUEBLE",
  "valorActual": 150000,
  "valorCompra": 120000,           // Opcional
  "fechaAdquisicion": "2020-01-15", // Opcional
  "descripcion": "Casa familiar",   // Opcional
  "liquidez": "BAJA"                // Opcional (default: MEDIA)
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    // ... activo creado con historico inicial
  }
}
```

**Nota:** Al crear un activo, automáticamente se crea una valoración inicial con el `valorActual` y la `fechaAdquisicion` (o fecha actual).

### GET /api/activos/:id

Obtiene un activo específico con todo su historial de valoraciones.

**Response:**
```json
{
  "ok": true,
  "data": {
    // ... activo con historico completo ordenado por fecha desc
  }
}
```

### PUT /api/activos/:id

Actualiza un activo existente.

**Body (todos los campos opcionales):**
```json
{
  "nombre": "Nuevo nombre",
  "valorActual": 160000,
  "descripcion": "Descripción actualizada",
  "liquidez": "ALTA",
  "activo": false
}
```

**Nota:** Para actualizar el valor y registrar una nueva valoración, usa el endpoint de valoraciones.

### DELETE /api/activos/:id

Elimina (soft delete) un activo.

**Response:**
```json
{
  "ok": true,
  "data": {
    // ... activo con activo=false
  }
}
```

**Nota:** El activo no se borra de la base de datos, solo se marca como inactivo.

### GET /api/activos/:id/valoraciones

Lista todas las valoraciones de un activo.

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "clx789...",
      "activoId": "clx123...",
      "valor": "160000.00",
      "fecha": "2026-02-28T00:00:00.000Z",
      "notas": "Nueva valuación",
      "createdAt": "2026-02-28T..."
    },
    // ... ordenadas por fecha desc
  ]
}
```

### POST /api/activos/:id/valoraciones

Agrega una nueva valoración al activo.

**Body:**
```json
{
  "valor": 160000,
  "fecha": "2026-02-28",
  "notas": "Nueva valuación"  // Opcional
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    // ... nueva valoración creada
  }
}
```

**Importante:** Al agregar una valoración, el `valorActual` del activo se actualiza automáticamente con el nuevo valor. Esto se hace en una transacción para garantizar consistencia.

## Ejemplos de Uso

### Ejemplo 1: Casa

```json
{
  "nombre": "Casa Principal",
  "tipo": "INMUEBLE",
  "valorActual": 150000,
  "valorCompra": 120000,
  "fechaAdquisicion": "2020-01-15",
  "liquidez": "BAJA",
  "descripcion": "Casa familiar en el barrio X",
  "historico": [
    { "fecha": "2020-01-15", "valor": 120000, "notas": "Compra" },
    { "fecha": "2023-01-15", "valor": 140000, "notas": "Valuación fiscal" },
    { "fecha": "2026-01-15", "valor": 150000, "notas": "Valuación actual" }
  ]
}
```

### Ejemplo 2: Vehículo

```json
{
  "nombre": "Toyota Corolla 2022",
  "tipo": "VEHICULO",
  "valorActual": 18000,
  "valorCompra": 25000,
  "fechaAdquisicion": "2022-03-01",
  "liquidez": "MEDIA",
  "descripcion": "Vehículo familiar, color blanco"
}
```

### Ejemplo 3: Cuenta de Ahorro

```json
{
  "nombre": "Cuenta Ahorro Bancolombia",
  "tipo": "AHORRO",
  "valorActual": 5000,
  "liquidez": "ALTA"
}
```

### Ejemplo 4: Inversiones

```json
{
  "nombre": "Acciones ETF S&P500",
  "tipo": "INVERSION",
  "valorActual": 10000,
  "valorCompra": 8000,
  "fechaAdquisicion": "2024-01-01",
  "liquidez": "ALTA",
  "descripcion": "100 acciones de VOO"
}
```

## Workflow de Valoraciones

1. **Al crear un activo:** Se genera automáticamente una valoración inicial
2. **Actualización regular:** Usar POST /valoraciones para registrar nuevas valoraciones
3. **El valorActual se actualiza automáticamente:** Al agregar una valoración, el valor actual del activo se sincroniza
4. **Historial completo:** Todas las valoraciones se mantienen para análisis histórico

## Validaciones

- `nombre`: Requerido, 1-100 caracteres
- `tipo`: Requerido, debe ser un TipoActivo válido
- `valorActual`: Requerido, debe ser positivo
- `valorCompra`: Opcional, debe ser positivo si se proporciona
- `fechaAdquisicion`: Opcional, formato fecha válido
- `descripcion`: Opcional, máximo 500 caracteres
- `liquidez`: Opcional, debe ser un nivel de Liquidez válido

## Error Handling

- **400 VALIDATION_ERROR**: Datos inválidos (campo requerido, valor negativo, enum inválido)
- **404 NOT_FOUND**: Activo no encontrado
- **500 INTERNAL_ERROR**: Error interno del servidor

## Relación con Net Worth

El patrimonio neto se calcula como:

```
Patrimonio Neto = Total Activos - Total Pasivos (Créditos)
```

Esta feature proporciona el componente de "Activos" para ese cálculo (Task 17).
