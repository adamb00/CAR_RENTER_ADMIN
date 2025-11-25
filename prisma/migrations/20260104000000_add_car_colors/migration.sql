-- Create table for available car colors
CREATE TABLE "Colors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Colors_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Colors_name_key" ON "Colors"("name");

-- Join table between cars and colors (many-to-many)
CREATE TABLE "_CarColors" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CarColors_AB_pkey" PRIMARY KEY ("A","B")
);

CREATE INDEX "_CarColors_B_index" ON "_CarColors"("B");

ALTER TABLE "_CarColors" ADD CONSTRAINT "_CarColors_A_fkey" FOREIGN KEY ("A") REFERENCES "Cars"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_CarColors" ADD CONSTRAINT "_CarColors_B_fkey" FOREIGN KEY ("B") REFERENCES "Colors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
