-- CreateEnum
CREATE TYPE "TipoInsight" AS ENUM ('GASTOS', 'INGRESOS', 'DEUDA', 'AHORRO', 'INVERSION', 'PRESUPUESTO', 'GENERAL');

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "tipo" "TipoInsight" NOT NULL,
    "titulo" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "prioridad" "Prioridad" NOT NULL DEFAULT 'NORMAL',
    "modelo" TEXT NOT NULL DEFAULT 'gpt-4',
    "tokens" INTEGER,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "util" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Insight_tipo_idx" ON "Insight"("tipo");

-- CreateIndex
CREATE INDEX "Insight_leido_idx" ON "Insight"("leido");

-- CreateIndex
CREATE INDEX "Insight_createdAt_idx" ON "Insight"("createdAt");
