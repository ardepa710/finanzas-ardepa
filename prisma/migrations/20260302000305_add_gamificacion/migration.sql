-- CreateEnum
CREATE TYPE "CategoriaLogro" AS ENUM ('DEUDA', 'AHORRO', 'GASTO', 'INVERSION', 'RACHA', 'META');

-- CreateEnum
CREATE TYPE "TipoStreak" AS ENUM ('GASTOS_DIARIOS', 'METAS_CONTRIBUCION');

-- CreateTable
CREATE TABLE "Logro" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "icono" TEXT NOT NULL,
    "categoria" "CategoriaLogro" NOT NULL,
    "xp" INTEGER NOT NULL,
    "desbloqueado" BOOLEAN NOT NULL DEFAULT false,
    "fechaLogro" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Logro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Streak" (
    "id" TEXT NOT NULL,
    "tipo" "TipoStreak" NOT NULL,
    "rachaActual" INTEGER NOT NULL DEFAULT 0,
    "rachaMayor" INTEGER NOT NULL DEFAULT 0,
    "ultimaActividad" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Streak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NivelUsuario" (
    "id" TEXT NOT NULL,
    "xpTotal" INTEGER NOT NULL DEFAULT 0,
    "nivelActual" INTEGER NOT NULL DEFAULT 1,
    "xpSiguiente" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "NivelUsuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Logro_codigo_key" ON "Logro"("codigo");

-- CreateIndex
CREATE INDEX "Logro_desbloqueado_idx" ON "Logro"("desbloqueado");

-- CreateIndex
CREATE INDEX "Logro_categoria_idx" ON "Logro"("categoria");

-- CreateIndex
CREATE UNIQUE INDEX "Streak_tipo_key" ON "Streak"("tipo");
