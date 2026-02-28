-- CreateEnum
CREATE TYPE "TipoTransaccion" AS ENUM ('COMPRA', 'VENTA', 'DIVIDENDO', 'INTERES', 'RETIRO', 'APORTE');

-- CreateTable
CREATE TABLE "Inversion" (
    "id" TEXT NOT NULL,
    "activoId" TEXT NOT NULL,
    "montoInvertido" DECIMAL(12,2) NOT NULL,
    "fechaInversion" TIMESTAMP(3) NOT NULL,
    "valorActual" DECIMAL(12,2) NOT NULL,
    "rendimientoTotal" DECIMAL(12,2) NOT NULL,
    "rendimientoPct" DECIMAL(5,2) NOT NULL,
    "dividendos" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "intereses" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransaccionInversion" (
    "id" TEXT NOT NULL,
    "inversionId" TEXT NOT NULL,
    "tipo" "TipoTransaccion" NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransaccionInversion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Inversion_activoId_idx" ON "Inversion"("activoId");

-- CreateIndex
CREATE INDEX "Inversion_activa_idx" ON "Inversion"("activa");

-- CreateIndex
CREATE INDEX "TransaccionInversion_inversionId_idx" ON "TransaccionInversion"("inversionId");

-- CreateIndex
CREATE INDEX "TransaccionInversion_tipo_idx" ON "TransaccionInversion"("tipo");

-- CreateIndex
CREATE INDEX "TransaccionInversion_fecha_idx" ON "TransaccionInversion"("fecha");

-- AddForeignKey
ALTER TABLE "Inversion" ADD CONSTRAINT "Inversion_activoId_fkey" FOREIGN KEY ("activoId") REFERENCES "Activo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransaccionInversion" ADD CONSTRAINT "TransaccionInversion_inversionId_fkey" FOREIGN KEY ("inversionId") REFERENCES "Inversion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
