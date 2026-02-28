-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('PRESUPUESTO_80', 'PRESUPUESTO_90', 'PRESUPUESTO_100', 'CREDITO_PROXIMO', 'CREDITO_VENCIDO', 'AHORRO_BAJO', 'AHORRO_META', 'GASTO_INUSUAL', 'LOGRO_DESBLOQUEADO', 'INSIGHT_IA');

-- CreateEnum
CREATE TYPE "Prioridad" AS ENUM ('BAJA', 'NORMAL', 'ALTA', 'URGENTE');

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" TEXT NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "prioridad" "Prioridad" NOT NULL DEFAULT 'NORMAL',
    "metadata" JSONB,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "archivar" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notificacion_leida_createdAt_idx" ON "Notificacion"("leida", "createdAt");

-- CreateIndex
CREATE INDEX "Notificacion_tipo_idx" ON "Notificacion"("tipo");
