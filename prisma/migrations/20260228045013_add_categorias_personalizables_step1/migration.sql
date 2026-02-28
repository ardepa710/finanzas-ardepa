-- CreateEnum
CREATE TYPE "TipoCategoria" AS ENUM ('GASTO', 'INGRESO');

-- AlterTable
ALTER TABLE "Gasto" ADD COLUMN     "categoriaId" TEXT;

-- AlterTable
ALTER TABLE "GastoFijo" ADD COLUMN     "categoriaId" TEXT;

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "icono" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "tipo" "TipoCategoria" NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Categoria_activa_idx" ON "Categoria"("activa");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nombre_tipo_key" ON "Categoria"("nombre", "tipo");

-- CreateIndex
CREATE INDEX "Gasto_categoriaId_fecha_idx" ON "Gasto"("categoriaId", "fecha");

-- CreateIndex
CREATE INDEX "GastoFijo_categoriaId_idx" ON "GastoFijo"("categoriaId");

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GastoFijo" ADD CONSTRAINT "GastoFijo_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;
