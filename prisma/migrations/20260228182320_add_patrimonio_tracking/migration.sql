-- CreateEnum
CREATE TYPE "TipoActivo" AS ENUM ('INMUEBLE', 'VEHICULO', 'INVERSION', 'AHORRO', 'EFECTIVO', 'OTRO');

-- CreateEnum
CREATE TYPE "Liquidez" AS ENUM ('ALTA', 'MEDIA', 'BAJA');

-- CreateTable
CREATE TABLE "Activo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoActivo" NOT NULL,
    "valorActual" DECIMAL(12,2) NOT NULL,
    "valorCompra" DECIMAL(12,2),
    "fechaAdquisicion" TIMESTAMP(3),
    "descripcion" TEXT,
    "liquidez" "Liquidez" NOT NULL DEFAULT 'MEDIA',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValoracionActivo" (
    "id" TEXT NOT NULL,
    "activoId" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValoracionActivo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Activo_activo_idx" ON "Activo"("activo");

-- CreateIndex
CREATE INDEX "Activo_tipo_idx" ON "Activo"("tipo");

-- CreateIndex
CREATE INDEX "ValoracionActivo_activoId_fecha_idx" ON "ValoracionActivo"("activoId", "fecha");

-- AddForeignKey
ALTER TABLE "ValoracionActivo" ADD CONSTRAINT "ValoracionActivo_activoId_fkey" FOREIGN KEY ("activoId") REFERENCES "Activo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
