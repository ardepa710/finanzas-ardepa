-- DropForeignKey
ALTER TABLE "Gasto" DROP CONSTRAINT "Gasto_categoriaId_fkey";

-- DropForeignKey
ALTER TABLE "GastoFijo" DROP CONSTRAINT "GastoFijo_categoriaId_fkey";

-- AlterTable
ALTER TABLE "Gasto" DROP COLUMN "categoria",
ALTER COLUMN "categoriaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "GastoFijo" DROP COLUMN "categoria",
ALTER COLUMN "categoriaId" SET NOT NULL;

-- DropEnum
DROP TYPE "CategoriaGasto";

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GastoFijo" ADD CONSTRAINT "GastoFijo_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
