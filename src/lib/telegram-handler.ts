import { prisma } from '@/lib/prisma'

const CATEGORIAS_MAP: Record<string, string> = {
  comida: 'ALIMENTACION',
  alimentacion: 'ALIMENTACION',
  alimentos: 'ALIMENTACION',
  desayuno: 'ALIMENTACION',
  almuerzo: 'ALIMENTACION',
  cena: 'ALIMENTACION',
  transporte: 'TRANSPORTE',
  gasolina: 'TRANSPORTE',
  uber: 'TRANSPORTE',
  taxi: 'TRANSPORTE',
  camion: 'TRANSPORTE',
  entretenimiento: 'ENTRETENIMIENTO',
  ocio: 'ENTRETENIMIENTO',
  cine: 'ENTRETENIMIENTO',
  salud: 'SALUD',
  farmacia: 'SALUD',
  doctor: 'SALUD',
  medicina: 'SALUD',
  servicios: 'SERVICIOS',
  renta: 'SERVICIOS',
  luz: 'SERVICIOS',
  agua: 'SERVICIOS',
  internet: 'SERVICIOS',
  telefono: 'SERVICIOS',
  otros: 'OTROS',
}

function parseCategoria(texto: string): string {
  return CATEGORIAS_MAP[texto.toLowerCase()] ?? 'OTROS'
}

export async function handleTelegramMessage(text: string): Promise<string> {
  const partes = text.trim().split(/\s+/)
  const comando = partes[0].toLowerCase()

  if (comando === '/gasto') {
    // /gasto [categoria] [monto] [descripcion opcional]
    if (partes.length < 3) {
      return '❌ Formato: /gasto [categoría] [monto] [descripción]\nEjemplo: /gasto Comida 180 McDonald\'s'
    }
    const categoriaTexto = partes[1]
    const monto = parseFloat(partes[2])
    if (isNaN(monto) || monto <= 0) {
      return '❌ El monto debe ser un número positivo.\nEjemplo: /gasto Comida 180'
    }
    const descripcion = partes.slice(3).join(' ') || categoriaTexto
    const categoria = parseCategoria(categoriaTexto)

    await prisma.gasto.create({
      data: {
        descripcion,
        monto,
        categoria: categoria as any,
        fuente: 'TELEGRAM',
      },
    })
    return `✅ Gasto registrado\n📁 ${categoria}\n💰 $${monto.toFixed(2)} MXN\n📝 ${descripcion}`
  }

  if (comando === '/resumen') {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const gastos = await prisma.gasto.findMany({
      where: { fecha: { gte: hoy } },
      orderBy: { fecha: 'desc' },
    })
    if (gastos.length === 0) return '📊 Sin gastos registrados hoy.'
    const total = gastos.reduce((s, g) => s + Number(g.monto), 0)
    const lista = gastos.map(g => `• ${g.descripcion}: $${Number(g.monto).toFixed(2)}`).join('\n')
    return `📊 *Gastos de hoy*\n${lista}\n\n💰 *Total: $${total.toFixed(2)} MXN*`
  }

  if (comando === '/quincena') {
    const inicio = new Date()
    inicio.setDate(1)
    inicio.setHours(0, 0, 0, 0)
    const gastos = await prisma.gasto.findMany({
      where: { fecha: { gte: inicio } },
    })
    const total = gastos.reduce((s, g) => s + Number(g.monto), 0)
    return `📊 *Gastos del mes*\n💰 Total: *$${total.toFixed(2)} MXN*\n📝 ${gastos.length} registros`
  }

  if (comando === '/creditos') {
    const creditos = await prisma.credito.findMany({ where: { activo: true }, orderBy: { diaPago: 'asc' } })
    if (creditos.length === 0) return '💳 Sin créditos activos.'
    const lista = creditos.map(c =>
      `• *${c.nombre}*: $${Number(c.saldoActual).toLocaleString('es-MX')} (pago día ${c.diaPago})`
    ).join('\n')
    return `💳 *Créditos activos*\n${lista}`
  }

  if (comando === '/ahorro') {
    const [fuentes, creditos] = await Promise.all([
      prisma.fuenteIngreso.findMany({ where: { activo: true } }),
      prisma.credito.findMany({ where: { activo: true } }),
    ])
    if (fuentes.length === 0) return '⚙️ Sin fuentes de ingreso configuradas.'
    if (creditos.length === 0) return '💳 Sin créditos activos para calcular ahorro.'

    const { calcularResumenAhorro } = await import('./savings-calculator')
    const resumen = calcularResumenAhorro(
      creditos.map(c => ({
        nombre: c.nombre,
        pagoMensual: Number(c.pagoMensual),
        frecuencia: c.frecuencia as 'SEMANAL' | 'QUINCENAL' | 'MENSUAL',
        diaPago: c.diaPago ?? undefined,
        diaSemana: c.diaSemana ?? undefined,
        fechaBase: c.fechaBase ?? undefined,
      })),
      fuentes.map(f => ({
        nombre: f.nombre,
        monto: Number(f.monto),
        frecuencia: f.frecuencia as 'SEMANAL' | 'QUINCENAL' | 'MENSUAL',
        diaMes: f.diaMes ?? undefined,
        diaSemana: f.diaSemana ?? undefined,
        fechaBase: f.fechaBase,
      })),
      new Date(),
      2
    )

    if (resumen.cobros.length === 0) return '💰 Sin cobros proyectados próximamente.'

    const primero = resumen.cobros[0]
    const fechaStr = primero.fecha.toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long'
    })
    const desglose = primero.desglose
      .map(d => `• ${d.creditoNombre}: $${d.monto.toFixed(2)}`)
      .join('\n')

    return `💰 *Recomendación de ahorro*\n` +
      `Próximo cobro (${primero.fuenteNombre}): *${fechaStr}*\n` +
      `Ingreso: $${primero.montoIngreso.toFixed(2)} MXN\n\n` +
      `${desglose || '(sin créditos próximos)'}\n\n` +
      `*Apartar: $${primero.totalApartar.toFixed(2)}*\n` +
      `Disponible: $${primero.disponible.toFixed(2)}`
  }

  if (comando === '/start' || comando === '/ayuda' || comando === '/help') {
    return `👋 *FINANZAS ARDEPA*\n\nComandos disponibles:\n\n` +
      `/gasto [cat] [monto] [desc] — Registrar gasto\n` +
      `/resumen — Gastos de hoy\n` +
      `/quincena — Gastos del mes\n` +
      `/creditos — Lista de créditos\n` +
      `/ahorro — Recomendación de ahorro\n\n` +
      `Categorías: Comida, Transporte, Entretenimiento, Salud, Servicios, Otros`
  }

  return '❓ Comando no reconocido. Escribe /ayuda para ver los comandos disponibles.'
}
