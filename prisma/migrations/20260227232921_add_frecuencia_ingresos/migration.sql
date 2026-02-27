-- CreateEnum
CREATE TYPE "FrecuenciaPago" AS ENUM ('SEMANAL', 'QUINCENAL', 'MENSUAL');

-- AlterTable
ALTER TABLE "Credito" ADD COLUMN     "diaSemana" INTEGER,
ADD COLUMN     "fechaBase" TIMESTAMP(3),
ADD COLUMN     "frecuencia" "FrecuenciaPago" NOT NULL DEFAULT 'MENSUAL';

-- CreateTable
CREATE TABLE "FuenteIngreso" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "frecuencia" "FrecuenciaPago" NOT NULL,
    "diaSemana" INTEGER,
    "diaMes" INTEGER,
    "fechaBase" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FuenteIngreso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngresoManual" (
    "id" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descripcion" TEXT,
    "fuenteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngresoManual_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "IngresoManual" ADD CONSTRAINT "IngresoManual_fuenteId_fkey" FOREIGN KEY ("fuenteId") REFERENCES "FuenteIngreso"("id") ON DELETE SET NULL ON UPDATE CASCADE;
