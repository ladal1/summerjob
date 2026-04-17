-- Add free-text notes column to FoodDelivery (e.g. "kde sehnat klíče od kuchyně")
ALTER TABLE "FoodDelivery" ADD COLUMN "notes" TEXT;

-- CreateTable
CREATE TABLE "_FoodDeliveryRecipients" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_FoodDeliveryRecipients_AB_unique" ON "_FoodDeliveryRecipients"("A", "B");

-- CreateIndex
CREATE INDEX "_FoodDeliveryRecipients_B_index" ON "_FoodDeliveryRecipients"("B");

-- AddForeignKey
ALTER TABLE "_FoodDeliveryRecipients" ADD CONSTRAINT "_FoodDeliveryRecipients_A_fkey" FOREIGN KEY ("A") REFERENCES "FoodDeliveryJobOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FoodDeliveryRecipients" ADD CONSTRAINT "_FoodDeliveryRecipients_B_fkey" FOREIGN KEY ("B") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
