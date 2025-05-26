
-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "pastParticipation" BOOLEAN NOT NULL,
    "arrivalDate" TIMESTAMP(3) NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "foodAllergies" TEXT,
    "workAllergies" TEXT,
    "toolsSkills" TEXT NOT NULL,
    "toolsBringing" TEXT NOT NULL,
    "heardAboutUs" TEXT,
    "playsInstrument" BOOLEAN NOT NULL,
    "tShirtSize" TEXT,
    "additionalInfo" TEXT,
    "photo" TEXT NOT NULL,
    "accommodationPrice" INTEGER NOT NULL,
    "ownsCar" BOOLEAN NOT NULL DEFAULT false,
    "canBeMedic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE UNIQUE INDEX "Application_email_key" ON "Application"("email");
