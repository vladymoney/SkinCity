-- CreateTable
CREATE TABLE "ListedItem" (
    "id" TEXT NOT NULL,
    "assetid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "rarity_color" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "ListedItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ListedItem_assetid_key" ON "ListedItem"("assetid");

-- AddForeignKey
ALTER TABLE "ListedItem" ADD CONSTRAINT "ListedItem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
