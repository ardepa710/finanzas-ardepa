-- CreateIndex
CREATE INDEX "FuenteIngreso_activo_idx" ON "FuenteIngreso"("activo");

-- CreateIndex
CREATE INDEX "IngresoManual_fuenteId_idx" ON "IngresoManual"("fuenteId");

-- CreateIndex
CREATE INDEX "IngresoManual_fecha_idx" ON "IngresoManual"("fecha");
