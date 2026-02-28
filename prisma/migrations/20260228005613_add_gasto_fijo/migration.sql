-- CreateTable
CREATE TABLE "GastoFijo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "categoria" "CategoriaGasto" NOT NULL,
    "frecuencia" "FrecuenciaPago" NOT NULL,
    "diaSemana" INTEGER,
    "diaMes" INTEGER,
    "fechaBase" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "lastApplied" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GastoFijo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GastoFijo_activo_idx" ON "GastoFijo"("activo");
