-- CreateEnum
CREATE TYPE "CategoriaMeta" AS ENUM ('FONDO_EMERGENCIA', 'VACACIONES', 'ENGANCHE_CASA', 'ENGANCHE_AUTO', 'EDUCACION', 'RETIRO', 'DEUDA', 'COMPRA_GRANDE', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoMeta" AS ENUM ('EN_PROGRESO', 'COMPLETADA', 'CANCELADA', 'PAUSADA');

-- CreateEnum
CREATE TYPE "PrioridadMeta" AS ENUM ('ALTA', 'MEDIA', 'BAJA');

-- CreateTable
CREATE TABLE "Meta" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria" "CategoriaMeta" NOT NULL,
    "montoObjetivo" DECIMAL(12,2) NOT NULL,
    "montoActual" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "porcentajeProgreso" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaObjetivo" TIMESTAMP(3),
    "fechaCompletada" TIMESTAMP(3),
    "estado" "EstadoMeta" NOT NULL DEFAULT 'EN_PROGRESO',
    "prioridad" "PrioridadMeta" NOT NULL DEFAULT 'MEDIA',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contribucion" (
    "id" TEXT NOT NULL,
    "metaId" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contribucion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Meta_estado_idx" ON "Meta"("estado");

-- CreateIndex
CREATE INDEX "Meta_activo_idx" ON "Meta"("activo");

-- CreateIndex
CREATE INDEX "Meta_categoria_idx" ON "Meta"("categoria");

-- CreateIndex
CREATE INDEX "Contribucion_metaId_idx" ON "Contribucion"("metaId");

-- CreateIndex
CREATE INDEX "Contribucion_fecha_idx" ON "Contribucion"("fecha");

-- AddForeignKey
ALTER TABLE "Contribucion" ADD CONSTRAINT "Contribucion_metaId_fkey" FOREIGN KEY ("metaId") REFERENCES "Meta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
