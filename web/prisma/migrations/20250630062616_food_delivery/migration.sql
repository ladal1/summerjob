-- CreateTable
CREATE TABLE "FoodDelivery" (
    "id" TEXT NOT NULL,
    "courierNum" INTEGER NOT NULL,
    "planId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodDeliveryJobOrder" (
    "id" TEXT NOT NULL,
    "foodDeliveryId" TEXT NOT NULL,
    "activeJobId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "FoodDeliveryJobOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FoodDelivery_courierNum_planId_key" ON "FoodDelivery"("courierNum", "planId");

-- CreateIndex
CREATE UNIQUE INDEX "FoodDeliveryJobOrder_foodDeliveryId_activeJobId_key" ON "FoodDeliveryJobOrder"("foodDeliveryId", "activeJobId");

-- CreateIndex
CREATE UNIQUE INDEX "FoodDeliveryJobOrder_foodDeliveryId_order_key" ON "FoodDeliveryJobOrder"("foodDeliveryId", "order");

-- AddForeignKey
ALTER TABLE "FoodDelivery" ADD CONSTRAINT "FoodDelivery_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodDeliveryJobOrder" ADD CONSTRAINT "FoodDeliveryJobOrder_foodDeliveryId_fkey" FOREIGN KEY ("foodDeliveryId") REFERENCES "FoodDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodDeliveryJobOrder" ADD CONSTRAINT "FoodDeliveryJobOrder_activeJobId_fkey" FOREIGN KEY ("activeJobId") REFERENCES "ActiveJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
