# Alertas Feature

Sistema de notificaciones frontend para Finanzas Ardepa.

## Componentes

### NotificationBell
- Icono de campana con badge mostrando cantidad de notificaciones no leídas
- Click abre/cierra el panel de notificaciones
- Badge muestra "9+" cuando hay más de 9 notificaciones

### NotificationPanel
- Panel dropdown con lista de notificaciones
- Header con botón "Marcar todas como leídas"
- Auto-refresh cada 30 segundos
- Estados: loading, error, empty, loaded

### NotificationItem
- Card individual de notificación
- Icono basado en tipo de notificación
- Color-coded por prioridad:
  - URGENTE: rojo
  - ALTA: naranja
  - NORMAL: azul
  - BAJA: gris
- Timestamp relativo (ej: "Hace 5 min")
- Botón "Marcar como leída" (solo si no está leída)

## Hooks

### useAlertas(todas: boolean)
- Fetch notificaciones (no leídas o todas)
- Auto-refresh cada 30s
- Actualiza contador en Zustand store

### useMarkAsRead()
- Mutation para marcar notificación individual como leída
- Invalida queries para refresh

### useMarkAllAsRead()
- Mutation batch para marcar todas como leídas
- Obtiene IDs de no leídas y marca cada una

## Tipos de Notificación

```typescript
enum TipoNotificacion {
  PRESUPUESTO_80    // ⚠️
  PRESUPUESTO_90    // 🔴
  PRESUPUESTO_100   // 🚨
  CREDITO_PROXIMO   // 📅
  CREDITO_VENCIDO   // ⏰
  AHORRO_BAJO       // 📉
  AHORRO_META       // 🎯
  GASTO_INUSUAL     // 👀
  LOGRO_DESBLOQUEADO // 🏆
  INSIGHT_IA        // 💡
}
```

## Prioridades

```typescript
enum Prioridad {
  BAJA     // slate
  NORMAL   // blue
  ALTA     // orange
  URGENTE  // red
}
```

## Testing

Para crear notificaciones de prueba:

```bash
# Via API
curl -X POST http://localhost:3000/api/alertas \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "PRESUPUESTO_90",
    "titulo": "Presupuesto al 90%",
    "mensaje": "Tu presupuesto ha alcanzado el 90%",
    "prioridad": "ALTA"
  }'
```
