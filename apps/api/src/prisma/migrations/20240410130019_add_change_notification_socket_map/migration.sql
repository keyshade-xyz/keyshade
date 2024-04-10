-- CreateTable
CREATE TABLE "ChangeNotificationSocketMap" (
    "id" TEXT NOT NULL,
    "socketId" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL,

    CONSTRAINT "ChangeNotificationSocketMap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChangeNotificationSocketMap_environmentId_socketId_idx" ON "ChangeNotificationSocketMap"("environmentId", "socketId");
