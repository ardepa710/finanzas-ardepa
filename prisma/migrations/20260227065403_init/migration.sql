-- CreateEnum
CREATE TYPE "TipoCredito" AS ENUM ('PRESTAMO', 'TARJETA');

-- CreateEnum
CREATE TYPE "CategoriaGasto" AS ENUM ('ALIMENTACION', 'TRANSPORTE', 'ENTRETENIMIENTO', 'SALUD', 'SERVICIOS', 'OTROS');

-- CreateEnum
CREATE TYPE "FuenteGasto" AS ENUM ('TELEGRAM', 'WEB');

-- CreateTable
CREATE TABLE "Credito" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoCredito" NOT NULL,
    "montoTotal" DECIMAL(10,2) NOT NULL,
    "saldoActual" DECIMAL(10,2) NOT NULL,
    "pagoMensual" DECIMAL(10,2) NOT NULL,
    "pagoMinimo" DECIMAL(10,2),
    "fechaCorte" INTEGER,
    "diaPago" INTEGER NOT NULL,
    "tasaInteres" DECIMAL(5,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gasto" (
    "id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "categoria" "CategoriaGasto" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fuente" "FuenteGasto" NOT NULL DEFAULT 'WEB',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Gasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionSalario" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "monto" DECIMAL(10,2) NOT NULL,
    "fechaBaseProximoPago" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionSalario_pkey" PRIMARY KEY ("id")
);
