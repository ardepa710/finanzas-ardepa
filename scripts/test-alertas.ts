import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('Creating test notifications...')

  await prisma.notificacion.createMany({
    data: [
      {
        tipo: 'PRESUPUESTO_90',
        titulo: 'Presupuesto al 90%',
        mensaje: 'Tu presupuesto de "Comida" ha alcanzado el 90% del límite mensual.',
        prioridad: 'ALTA',
        leida: false,
      },
      {
        tipo: 'CREDITO_PROXIMO',
        titulo: 'Pago de crédito próximo',
        mensaje: 'Tu pago de tarjeta vence en 3 días. Monto: $500',
        prioridad: 'NORMAL',
        leida: false,
      },
      {
        tipo: 'LOGRO_DESBLOQUEADO',
        titulo: '¡Logro desbloqueado!',
        mensaje: 'Has completado tu primer mes sin exceder presupuestos.',
        prioridad: 'BAJA',
        leida: false,
      },
      {
        tipo: 'PRESUPUESTO_100',
        titulo: '¡Presupuesto excedido!',
        mensaje: 'Has excedido el presupuesto de "Entretenimiento" por $150.',
        prioridad: 'URGENTE',
        leida: false,
      },
      {
        tipo: 'INSIGHT_IA',
        titulo: 'Insight de IA',
        mensaje: 'Estás gastando un 30% más en restaurantes este mes vs el anterior.',
        prioridad: 'NORMAL',
        leida: true, // One already read
      },
    ],
  })

  console.log('✅ Test notifications created successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
