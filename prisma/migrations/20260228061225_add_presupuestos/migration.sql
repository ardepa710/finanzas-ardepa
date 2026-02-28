-- CreateEnum
CREATE TYPE "PeriodoPresupuesto" AS ENUM ('SEMANAL', 'QUINCENAL', 'MENSUAL');

-- CreateTable
CREATE TABLE "Presupuesto" (
    "id" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "periodo" "PeriodoPresupuesto" NOT NULL,
    "alertaEn80" BOOLEAN NOT NULL DEFAULT true,
    "alertaEn90" BOOLEAN NOT NULL DEFAULT true,
    "alertaEn100" BOOLEAN NOT NULL DEFAULT true,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Presupuesto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Presupuesto_activo_idx" ON "Presupuesto"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "Presupuesto_categoriaId_periodo_key" ON "Presupuesto"("categoriaId", "periodo");

-- AddForeignKey
ALTER TABLE "Presupuesto" ADD CONSTRAINT "Presupuesto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
